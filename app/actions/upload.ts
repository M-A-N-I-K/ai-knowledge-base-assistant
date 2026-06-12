"use server";

import fs from "node:fs/promises";
import path from "node:path";

export async function uploadFile(formData: FormData) {
  // TODO : Add Auth Protection here for File Uploads
  const file = formData.get("file") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // TODO : ADD Chunking of file
  // TODO : ADD Vectorisation of file

  const uploadDir = "./public/uploads";
  await fs.mkdir(uploadDir, { recursive: true });

  await fs.writeFile(path.join(uploadDir, file.name), buffer);
}
