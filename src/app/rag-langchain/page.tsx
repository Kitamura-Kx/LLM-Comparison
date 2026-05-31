import AskPanel from "@/components/AskPanel";

export default function RagLangchainPage() {
  return (
    <AskPanel
      apiPath="/api/chat"
      description="戦国・安土桃山時代の固定文書から、質問に近い人物・事件・時代背景だけを検索して回答します。"
      initialMessage="こんにちは。戦国・安土桃山時代の歴史について、関連する文書を探しながら答えます。信長、秀吉、関ヶ原、大坂の陣などを質問できます。"
      mode="rag"
      placeholder="例: 信長と秀吉の統治政策の違いを比較して"
      title="戦国・安土桃山史チャット RAG検索版"
    />
  );
}
