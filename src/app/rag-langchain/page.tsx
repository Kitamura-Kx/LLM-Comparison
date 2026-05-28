import AskPanel from "@/components/AskPanel";

export default function RagLangchainPage() {
  return (
    <AskPanel
      apiPath="/api/rag-langchain"
      description="LangChainでdata内のテキストを分割・埋め込みし、質問に近い資料だけを検索してGeminiへ渡します。"
      placeholder="例: 信長と秀吉の統治政策の違いを比較して"
      title="RAG(LangChain)"
    />
  );
}
