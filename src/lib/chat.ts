import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { askGemini, getGeminiApiKey } from "./gemini";
import { loadSourceText } from "./referenceData";
import { cosineSimilarity, loadLocalVectorstore } from "./vectorstore";

export type ChatMode = "raw" | "rag";

export type ChatSource = {
  id: string;
  score?: number;
  title: string;
};

const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

export async function answerWithRawContext(question: string) {
  const sourceText = await loadSourceText();
  const answer = await askGemini(`あなたは日本語で自然に会話するアシスタントです。
質問が固定文書内の人物・事件・時代背景・制度に関係する場合は、以下の固定文書を優先的な根拠として日本語で回答してください。
質問が固定文書の内容に関係ない雑談・挨拶・一般質問の場合は、固定文書に縛られず普通に返信してください。
回答には、固定文書・資料・コンテキストを参照した旨や出典名を書かないでください。
質問への答えとなる本文だけを自然な日本語で書いてください。

質問:
${question}

固定文書:
${sourceText}`);

  return {
    answer,
    sources: [
      {
        id: "data/source.txt",
        title: "source.txt",
      },
    ] satisfies ChatSource[],
  };
}

export async function answerWithRagContext(question: string) {
  const vectorstore = await loadLocalVectorstore();
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: getGeminiApiKey(),
    modelName: embeddingModel,
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  const queryVector = await embeddings.embedQuery(question);
  const sources = vectorstore.chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const context = sources
    .map((source) => `### ${source.title} (${source.id})\n${source.content}`)
    .join("\n\n---\n\n");
  const answer = await askGemini(`あなたは日本語で自然に会話するアシスタントです。
質問が固定文書内の人物・事件・時代背景・制度に関係する場合は、次の検索済みコンテキストを優先的な根拠として日本語で回答してください。
質問が固定文書の内容に関係ない雑談・挨拶・一般質問の場合は、コンテキストに縛られず普通に返信してください。
回答には、固定文書・資料・コンテキストを参照した旨や出典名を書かないでください。
質問への答えとなる本文だけを自然な日本語で書いてください。

質問:
${question}

検索済みコンテキスト:
${context}`);

  return {
    answer,
    sources: sources.map((source) => ({
      id: source.id,
      score: source.score,
      title: source.title,
    })) satisfies ChatSource[],
  };
}

export async function answerQuestion(question: string, mode: ChatMode) {
  if (mode === "raw") {
    return answerWithRawContext(question);
  }

  return answerWithRagContext(question);
}
