import { NextResponse } from "next/server";
import { askWithLangChainRag } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "質問を入力してください。" },
        { status: 400 },
      );
    }

    const result = await askWithLangChainRag(question);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && error.message.includes("PINECONE_API_KEY")
        ? "PINECONE_API_KEY が未設定です。.env にPineconeのAPIキーを入れてください。"
        : "回答の生成に失敗しました。";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
