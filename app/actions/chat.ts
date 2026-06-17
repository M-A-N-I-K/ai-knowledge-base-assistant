"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { GoogleGenAI, ApiError } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
    model: "gemini-2.5-flash-lite",
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

export async function getChatSessions(sessionIds?: string[]): Promise<ChatSessionSummary[]> {
  const userId = await getAuthUserId();
  if (userId) {
    return prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, createdAt: true },
    });
  } else if (sessionIds && sessionIds.length > 0) {
    return prisma.chatSession.findMany({
      where: { id: { in: sessionIds } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, createdAt: true },
    });
  }
  return [];
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

export async function getChatSessionDetails(id: string) {
  return prisma.chatSession.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function deleteChatSession(id: string) {
  return prisma.chatSession.delete({
    where: { id },
  });
}

// RAG: embed query → cosine search → Gemini answer → persist messages
export async function askKnowledgeBase(
  question: string,
  sessionId: string | null,
): Promise<{ content: string; sources: MessageSource[] }> {
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

  const vecStr = `[${vec.join(",")}]`;
  const hits = await prisma.$queryRaw<
    { content: string; sourceFile: string | null }[]
  >`
    SELECT content, "sourceFile"
    FROM "documents"
    WHERE embedding <=> ${vecStr}::vector(768) < 0.4
    ORDER BY embedding <=> ${vecStr}::vector(768)
    LIMIT 3
  `;

  const MAX_CONTEXT = 2000;
  const rawContext = hits
    .map((h) => h.content)
    .join("\n\n---\n\n")
    .replace(/\s+/g, " ")
    .trim();
  const context =
    rawContext.length > MAX_CONTEXT
      ? rawContext.slice(0, MAX_CONTEXT) + "…"
      : rawContext;

  const uniqueFiles = [
    ...new Set(hits.map((h) => h.sourceFile).filter(Boolean)),
  ] as string[];
  const sources: MessageSource[] = uniqueFiles.map((name) => ({
    name,
    location: "",
  }));

  let answerRes;

  try {
    answerRes = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a concise AI assistant for a knowledge base.

      Answer in 3-5 sentences using ONLY the provided context.
      If the answer is not in the context, say so.

      Context:
      ${context || "No relevant documents found."}

      Question:
      ${question}`,
    });
  } catch (err) {
    console.error("Gemini Error:", err);

    if (err instanceof ApiError && err.status === 429) {
      return {
        content:
          "Rate limit exceeded. Please wait a few seconds and try again.",
        sources,
      };
    }

    return {
      content: "AI service temporarily unavailable.",
      sources,
    };
  }

  const content = answerRes.text ?? "Unable to generate a response.";

  if (sessionId) {
    await prisma.chatMessage.createMany({
      data: [
        { sessionId, role: "user", content: question },
        { sessionId, role: "assistant", content, sources: sources as Prisma.InputJsonValue },
      ],
    });

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { title: true },
    });

    const updateData: { updatedAt: Date; title?: string } = { updatedAt: new Date() };
    if (session && (session.title === "New Chat" || session.title === "")) {
      updateData.title = question.slice(0, 40) + (question.length > 40 ? "..." : "");
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  }

  return { content, sources };
}
