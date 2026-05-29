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
  const answer = await askGemini(`あなたは日本史の説明に強いアシスタントです。
以下の固定文書だけを根拠に、質問へ日本語で回答してください。
固定文書にないことは推測せず、「資料内では確認できません」と書いてください。

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
  const answer = await askGemini(`あなたは日本史の説明に強いアシスタントです。
次の検索済みコンテキストだけを根拠に、質問へ日本語で回答してください。
コンテキストにないことは推測せず、「資料内では確認できません」と書いてください。
回答の最後に、参照した資料名を「参照: ...」の形で短く列挙してください。

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
