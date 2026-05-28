import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";
import {
  formatDocumentsForPrompt,
  loadReferenceDocuments,
} from "@/lib/referenceData";

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

    const documents = await loadReferenceDocuments();
    const context = formatDocumentsForPrompt(documents);
    const answer = await askGemini(`あなたは日本史の説明に強いアシスタントです。
以下の資料全文だけを根拠に、質問へ日本語で回答してください。
資料にないことは推測せず、「資料内では確認できません」と書いてください。

質問:
${question}

資料全文:
${context}`);

    return NextResponse.json({
      answer,
      sources: documents.map((document) => ({
        id: document.id,
        title: document.title,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "回答の生成に失敗しました。" },
      { status: 500 },
    );
  }
}
