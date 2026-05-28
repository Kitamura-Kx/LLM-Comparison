import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  return apiKey;
}

export async function askGemini(prompt: string) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  });
  const result = await model.generateContent(prompt);

  return result.response.text();
}
