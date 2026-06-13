-- Enable pgvector extension (pre-installed on Neon)
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop old table if it exists from a previous manual/partial run
DROP TABLE IF EXISTS "documents";

-- CreateTable (768 dims = text-embedding-004 output, within HNSW's 2000-dim limit)
CREATE TABLE "documents" (
    "id"         SERIAL PRIMARY KEY,
    "content"    TEXT,
    "embedding"  vector(768),
    "sourceFile" TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- HNSW index for fast approximate cosine similarity search
CREATE INDEX documents_embedding_hnsw_idx
    ON "documents" USING hnsw (embedding vector_cosine_ops);
