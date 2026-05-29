import { NextResponse } from "next/server";
import { answerQuestion, type ChatMode } from "@/lib/chat";

export const runtime = "nodejs";

function isChatMode(value: unknown): value is ChatMode {
  return value === "raw" || value === "rag";
}

export async function POST(request: Request) {
  try {
    const { mode, question } = await request.json();

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "質問を入力してください。" },
        { status: 400 },
      );
    }

    if (!isChatMode(mode)) {
      return NextResponse.json(
        { error: 'mode は "raw" または "rag" を指定してください。' },
        { status: 400 },
      );
    }

    const result = await answerQuestion(question, mode);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && error.message.includes("store.json")
        ? "vectorstore/store.json が見つかりません。ローカルで `npm run build:vectorstore` を実行してからデプロイしてください。"
        : "回答の生成に失敗しました。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
