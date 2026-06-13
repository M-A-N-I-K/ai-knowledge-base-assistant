"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { parseOffice } from "officeparser";

import { GoogleGenAI } from "@google/genai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const embeddings = new GoogleGenAI({});

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

export async function processFile(formData: FormData) {
  const file = formData.get("file") as File;
  const arrayBuffer = await file.arrayBuffer();
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
    chunkSize: 500,
    chunkOverlap: 10,
  });
  const chunks = await splitter.splitText(text);

  // Create vector embeddings of those chunks with 768 dimensions
  const responses = await Promise.all(
    chunks.map((chunk) =>
      embeddings.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: chunk,
        config: { outputDimensionality: 768 },
      }),
    ),
  );

  const documentEmbeddings = responses.map(
    (r) => r.embeddings?.[0]?.values ?? [],
  );

  // Insert into pgvector
  await bulkInsertDocuments(chunks, documentEmbeddings, file.name);

  const uploadDir = "./public/uploads";
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, file.name), fileBuffer);

  return { success: true, fileName: file.name, chunksCount: chunks.length };
}
