import { TaskType } from "@google/generative-ai";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "./gemini";
import { loadReferenceDocuments, splitDocuments } from "./referenceData";

type EmbeddedChunk = {
  id: string;
  title: string;
  content: string;
  embedding: number[];
};

let embeddedChunksPromise: Promise<EmbeddedChunk[]> | null = null;

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbeddedChunks() {
  if (!embeddedChunksPromise) {
    embeddedChunksPromise = (async () => {
      const apiKey = getGeminiApiKey();
      const documents = await loadReferenceDocuments();
      const chunks = splitDocuments(documents);
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey,
        modelName: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
      });
      const vectors = await embeddings.embedDocuments(
        chunks.map((chunk) => chunk.content),
      );

      return chunks.map((chunk, index) => ({
        ...chunk,
        embedding: vectors[index],
      }));
    })();
  }

  return embeddedChunksPromise;
}

export async function askWithLangChainRag(question: string) {
  const apiKey = getGeminiApiKey();
  const chunks = await getEmbeddedChunks();
  const queryEmbeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  const queryVector = await queryEmbeddings.embedQuery(question);
  const sources = chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const context = sources
    .map((source) => `### ${source.title} (${source.id})\n${source.content}`)
    .join("\n\n---\n\n");
  const llm = new ChatGoogleGenerativeAI({
    apiKey,
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    temperature: 0.2,
    maxOutputTokens: 1200,
  });
  const response = await llm.invoke([
    new HumanMessage(`あなたは日本史の説明に強いアシスタントです。
次の検索済みコンテキストだけを根拠に、質問へ日本語で回答してください。
コンテキストにないことは推測せず、「資料内では確認できません」と書いてください。
回答の最後に、参照した資料名を「参照: ...」の形で短く列挙してください。

質問:
${question}

検索済みコンテキスト:
${context}`),
  ]);

  return {
    answer: String(response.content),
    sources: sources.map((source) => ({
      id: source.id,
      title: source.title,
      score: source.score,
    })),
  };
}
