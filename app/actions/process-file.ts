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

export async function processFile(formData: FormData) {
  // TODO : Add Only authenticated users to upload
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

  await bulkInsertDocuments(chunks, documentEmbeddings, file.name);

  // TODO : Upload to object storage instead of storing locally
  const uploadDir = "./public/uploads";
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, file.name), fileBuffer);

  return { success: true, fileName: file.name, chunksCount: chunks.length };
}
