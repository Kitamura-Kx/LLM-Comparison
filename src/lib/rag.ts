import { TaskType } from "@google/generative-ai";
import {
  Pinecone,
  type PineconeRecord,
  type RecordMetadata,
} from "@pinecone-database/pinecone";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { getGeminiApiKey } from "./gemini";
import { loadReferenceDocuments, splitDocuments } from "./referenceData";

type HistoryChunkMetadata = RecordMetadata & {
  content: string;
  title: string;
};

const pineconeIndexName = process.env.PINECONE_INDEX ?? "llm-comparison";
const pineconeNamespace = process.env.PINECONE_NAMESPACE ?? "history";
let pineconeReadyPromise: Promise<void> | null = null;

function getPineconeApiKey() {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set.");
  }

  return apiKey;
}

function getPineconeClient() {
  return new Pinecone({
    apiKey: getPineconeApiKey(),
  });
}

function getEmbeddingModel(taskType: TaskType) {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: getGeminiApiKey(),
    modelName: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
    taskType,
  });
}

async function ensurePineconeIndex(client: Pinecone) {
  await client.createIndex({
    name: pineconeIndexName,
    dimension: Number(process.env.PINECONE_DIMENSION ?? 3072),
    metric: "cosine",
    spec: {
      serverless: {
        cloud: process.env.PINECONE_CLOUD ?? "aws",
        region: process.env.PINECONE_REGION ?? "us-east-1",
      },
    },
    suppressConflicts: true,
    waitUntilReady: true,
  });
}

async function upsertDocumentsIfNeeded(client: Pinecone) {
  const index = client.index<HistoryChunkMetadata>(pineconeIndexName);
  const documents = await loadReferenceDocuments();
  const chunks = splitDocuments(documents);
  const stats = await index.describeIndexStats();
  const currentCount = stats.namespaces?.[pineconeNamespace]?.recordCount ?? 0;

  if (currentCount === chunks.length) {
    return;
  }

  if (currentCount > 0) {
    await index.deleteAll({ namespace: pineconeNamespace });
  }

  const embeddings = getEmbeddingModel(TaskType.RETRIEVAL_DOCUMENT);
  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.content),
  );
  const records: PineconeRecord<HistoryChunkMetadata>[] = chunks.map(
    (chunk, index) => ({
      id: chunk.id,
      values: vectors[index],
      metadata: {
        content: chunk.content,
        title: chunk.title,
      },
    }),
  );

  for (let index = 0; index < records.length; index += 100) {
    await client.index<HistoryChunkMetadata>(pineconeIndexName).upsert({
      namespace: pineconeNamespace,
      records: records.slice(index, index + 100),
    });
  }
}

async function ensurePineconeReady() {
  if (!pineconeReadyPromise) {
    pineconeReadyPromise = (async () => {
      const client = getPineconeClient();

      await ensurePineconeIndex(client);
      await upsertDocumentsIfNeeded(client);
    })();
  }

  await pineconeReadyPromise;
}

export async function askWithLangChainRag(question: string) {
  const apiKey = getGeminiApiKey();

  await ensurePineconeReady();

  const client = getPineconeClient();
  const index = client.index<HistoryChunkMetadata>(pineconeIndexName);
  const queryEmbeddings = getEmbeddingModel(TaskType.RETRIEVAL_QUERY);
  const queryVector = await queryEmbeddings.embedQuery(question);
  const queryResult = await index.query({
    namespace: pineconeNamespace,
    vector: queryVector,
    topK: 5,
    includeMetadata: true,
  });
  const sources = queryResult.matches.map((match) => ({
    id: match.id,
    title: match.metadata?.title ?? match.id,
    content: match.metadata?.content ?? "",
    score: match.score,
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
      score: source.score,
    })),
  };
}
