"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({});

export type Source = { name: string; chunks: number };
export type Suggestion = { title: string; desc: string; prompt: string };
export type ChatSessionSummary = { id: string; title: string; createdAt: Date };
export type MessageSource = { name: string; location: string };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

// Distinct source files that have been embedded into the documents table
export async function getEmbeddedSources(): Promise<Source[]> {
  const rows = await prisma.$queryRaw<{ sourceFile: string; chunks: bigint }[]>`
    SELECT "sourceFile", COUNT(*) AS chunks
    FROM "documents"
    WHERE "sourceFile" IS NOT NULL
    GROUP BY "sourceFile"
    ORDER BY MAX("createdAt") DESC
    LIMIT 20
  `;
  return rows.map((r) => ({ name: r.sourceFile, chunks: Number(r.chunks) }));
}

export async function generateSuggestions(
  sourceNames: string[],
): Promise<Suggestion[]> {
  if (sourceNames.length === 0) {
    return [
      {
        title: "Upload a document",
        desc: "No files indexed yet",
        prompt: "What kinds of documents can I upload to this knowledge base?",
      },
    ];
  }

  const res = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Generate exactly 3 helpful question suggestions for a knowledge base containing these files: ${sourceNames.join(", ")}.
Return ONLY a valid JSON array with no markdown fences:
[{"title":"Max 5 words","desc":"One line under 10 words","prompt":"Full question to send"}]`,
  });

  const text = res.text ?? "";
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]) as Suggestion[];
  } catch {
    return [];
  }
}

export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, title: true, createdAt: true },
  });
}

export async function createChatSession(
  title: string,
): Promise<{ id: string }> {
  const userId = await getAuthUserId();
  return prisma.chatSession.create({
    data: { title: title.slice(0, 80), userId },
    select: { id: true },
  });
}

// RAG: embed query → cosine search → Gemini answer → persist messages
export async function askKnowledgeBase(
  question: string,
  sessionId: string | null,
): Promise<{ content: string; sources: MessageSource[] }> {
  // 1. Embed query
  const embedRes = await genai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: question,
    config: { outputDimensionality: 768 },
  });
  const vec = embedRes.embeddings?.[0]?.values ?? [];

  if (vec.length === 0) {
    return {
      content: "Could not embed your question. Please try again.",
      sources: [],
    };
  }

  // 2. Vector similarity search (top 5 chunks)
  const vecStr = `[${vec.join(",")}]`;
  const hits = await prisma.$queryRaw<
    { content: string; sourceFile: string | null }[]
  >`
    SELECT content, "sourceFile"
    FROM "documents"
    ORDER BY embedding <=> ${vecStr}::vector(768)
    LIMIT 5
  `;

  const context = hits.map((h) => h.content).join("\n\n---\n\n");
  const uniqueFiles = [
    ...new Set(hits.map((h) => h.sourceFile).filter(Boolean)),
  ] as string[];
  const sources: MessageSource[] = uniqueFiles.map((name) => ({
    name,
    location: "",
  }));

  // 3. Generate grounded answer
  const answerRes = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are a helpful AI assistant for a knowledge base. Answer using only the context provided.
If the context does not contain a clear answer, say so honestly.

Context:
${context || "No relevant documents found."}

Question: ${question}`,
  });

  const content = answerRes.text ?? "Unable to generate a response.";

  // 4. Persist to DB if a session is open
  if (sessionId) {
    await prisma.chatMessage.createMany({
      data: [
        { sessionId, role: "user", content: question },
        { sessionId, role: "assistant", content, sources },
      ],
    });
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  }

  return { content, sources };
}
