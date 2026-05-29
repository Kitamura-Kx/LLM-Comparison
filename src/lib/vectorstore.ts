import { promises as fs } from "fs";
import path from "path";

export type VectorstoreChunk = {
  content: string;
  embedding: number[];
  id: string;
  source: string;
  title: string;
};

export type LocalVectorstore = {
  chunks: VectorstoreChunk[];
  createdAt: string;
  embeddingModel: string;
  sourcePath: string;
};

const vectorstorePath = path.join(process.cwd(), "vectorstore", "store.json");

export async function loadLocalVectorstore() {
  const raw = await fs.readFile(vectorstorePath, "utf8");

  return JSON.parse(raw) as LocalVectorstore;
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
