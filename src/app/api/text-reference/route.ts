import { NextResponse } from "next/server";
import { answerWithRawContext } from "@/lib/chat";

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

    return NextResponse.json(await answerWithRawContext(question));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "回答の生成に失敗しました。" },
      { status: 500 },
    );
  }
}
