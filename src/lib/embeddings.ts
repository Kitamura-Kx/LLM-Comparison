import { getGeminiApiKey } from "./gemini";

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[];
  };
};

export async function embedText(text: string, taskType: EmbeddingTaskType) {
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${getGeminiApiKey()}`,
    {
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
        taskType,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Gemini embedding request failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as GeminiEmbeddingResponse;
  const values = data.embedding?.values ?? [];

  if (values.length === 0) {
    throw new Error("Gemini embedding response did not include vector values.");
  }

  return values;
}
