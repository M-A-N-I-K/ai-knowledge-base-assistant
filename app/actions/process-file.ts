"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { parseOffice } from "officeparser";

import { GoogleGenAI, ApiError } from "@google/genai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const embeddings = new GoogleGenAI({});

// Free tier: 100 req/min. Stay under with batch size of 80, wait 62 s between batches.
const EMBED_BATCH_SIZE = 80;
const EMBED_BATCH_DELAY_MS = 62_000;

async function embedChunk(chunk: string): Promise<number[]> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await embeddings.models.embedContent({
        model: "gemini-embedding-2",
        contents: chunk,
        config: { outputDimensionality: 768 },
      });
      return res.embeddings?.[0]?.values ?? [];
    } catch (err) {
      if (err instanceof ApiError && err.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 15_000));
        continue;
      }
      throw err;
    }
  }
  return [];
}

async function embedChunks(chunks: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(embedChunk));
    results.push(...batchResults);
    if (i + EMBED_BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, EMBED_BATCH_DELAY_MS));
    }
  }
  return results;
}

async function bulkInsertDocuments(
  chunks: string[],
  vectors?: number[][],
  sourceFile?: string,
) {
  if (chunks.length === 0) return;
  if (!vectors || vectors.length === 0) return;

  const valueRows = chunks.map(
    (chunk, i) =>
      Prisma.sql`(${chunk}, ${`[${vectors[i].join(",")}]`}::vector(768), ${sourceFile})`,
  );

  await prisma.$executeRaw`
    INSERT INTO "documents" (content, embedding, "sourceFile")
    VALUES ${Prisma.join(valueRows, ", ")}
  `;
}

const checkFileEmbedded = async (fileName: string) => {
  try {
    const embedding = await prisma.documents.findFirst({
      where: { sourceFile: fileName },
    });
    if (embedding) {
      const chunkCount = await prisma.documents.count({
        where: { sourceFile: fileName },
      });
      return { success: true, chunks: chunkCount };
    }
    return { success: false, chunks: 0 };
  } catch (err) {
    console.log("ERR CHECK FILE", err);
    return { success: false, chunks: 0 };
  }
};

export async function processFile(
  formData: FormData,
  chunkSize: number,
  chunkOverlap: number,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const file = formData.get("file") as File;
  const fileEmbedded = await checkFileEmbedded(file.name);

  if (fileEmbedded?.success) {
    return {
      success: true,
      fileName: file.name,
      chunksCount: fileEmbedded.chunks,
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer.slice(0));
  const buffer = new Uint8Array(arrayBuffer);

  let text = "";
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    text = (await parser.getText()).text;
  } else {
    const ast = await parseOffice(buffer);
    text = (await ast.to("md")).value;
  }

  // Split file into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize,
    chunkOverlap: chunkOverlap,
  });
  const chunks = await splitter.splitText(text);

  const documentEmbeddings = await embedChunks(chunks);

  await bulkInsertDocuments(chunks, documentEmbeddings, file.name);

  // TODO : Upload to object storage instead of storing locally
  const uploadDir = "./public/uploads";
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, file.name), fileBuffer);

  return { success: true, fileName: file.name, chunksCount: chunks.length };
}
