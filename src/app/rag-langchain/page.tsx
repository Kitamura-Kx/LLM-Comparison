import AskPanel from "@/components/AskPanel";

export default function RagLangchainPage() {
  return (
    <AskPanel
      apiPath="/api/chat"
      description="事前生成済みのvectorstoreを読み込み、質問に近い資料だけを検索してGeminiへ渡します。"
      mode="rag"
      placeholder="例: 信長と秀吉の統治政策の違いを比較して"
      title="RAG(LangChain)"
    />
  );
}
