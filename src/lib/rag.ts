import { TaskType } from "@google/generative-ai";
import { ChromaClient, type Metadata } from "chromadb";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "./gemini";
import { loadReferenceDocuments, splitDocuments } from "./referenceData";

const collectionName = process.env.CHROMA_COLLECTION ?? "llm_comparison_history";
let collectionReadyPromise: Promise<void> | null = null;

function getChromaClient() {
  return new ChromaClient({
    host: process.env.CHROMA_HOST ?? "localhost",
    port: Number(process.env.CHROMA_PORT ?? 8000),
    ssl: process.env.CHROMA_SSL === "true",
  });
}

function getEmbeddingModel(taskType: TaskType) {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: getGeminiApiKey(),
    modelName: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
    taskType,
  });
}

async function ensureChromaCollection() {
  const client = getChromaClient();
  const documents = await loadReferenceDocuments();
  const chunks = splitDocuments(documents);
  let collection = await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: null,
    metadata: {
      description: "LLM comparison local history documents",
    },
  });
  const currentCount = await collection.count();

  if (currentCount === chunks.length) {
    return collection;
  }

  if (currentCount > 0) {
    await client.deleteCollection({ name: collectionName });
    collection = await client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: null,
      metadata: {
        description: "LLM comparison local history documents",
      },
    });
  }

  const embeddings = getEmbeddingModel(TaskType.RETRIEVAL_DOCUMENT);
  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.content),
  );

  await collection.add({
    ids: chunks.map((chunk) => chunk.id),
    embeddings: vectors,
    documents: chunks.map((chunk) => chunk.content),
    metadatas: chunks.map(
      (chunk) =>
        ({
          title: chunk.title,
        }) satisfies Metadata,
    ),
  });

  return collection;
}

async function getReadyCollection() {
  if (!collectionReadyPromise) {
    collectionReadyPromise = ensureChromaCollection().then(() => undefined);
  }

  await collectionReadyPromise;

  return getChromaClient().getCollection({
    name: collectionName,
    embeddingFunction: undefined,
  });
}

export async function askWithLangChainRag(question: string) {
  const apiKey = getGeminiApiKey();
  const collection = await getReadyCollection();
  const queryEmbeddings = getEmbeddingModel(TaskType.RETRIEVAL_QUERY);
  const queryVector = await queryEmbeddings.embedQuery(question);
  const queryResult = await collection.query<{ title: string }>({
    queryEmbeddings: [queryVector],
    nResults: 5,
    include: ["documents", "metadatas", "distances"],
  });
  const sources = queryResult.ids[0].map((id, index) => ({
    id,
    title: queryResult.metadatas[0][index]?.title ?? id,
    content: queryResult.documents[0][index] ?? "",
    distance: queryResult.distances[0][index] ?? undefined,
  }));

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
      score: source.distance,
    })),
  };
}
