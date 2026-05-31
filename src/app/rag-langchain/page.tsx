import AskPanel from "@/components/AskPanel";

export default function RagLangchainPage() {
  return (
    <AskPanel
      apiPath="/api/chat"
      description="固定文書全体から、質問に近い人物・事件・時代背景などのチャンクを検索して回答します。"
      initialMessage="こんにちは。戦国・安土桃山・江戸幕府成立前後の歴史について、関連する情報を探しながら答えます。信長、秀吉、関ヶ原、大坂の陣、江戸幕府などを質問できます。"
      mode="rag"
      placeholder="例: 信長と秀吉の統治政策の違いを比較して"
      title="戦国・安土桃山・江戸幕府成立前後の歴史解説チャット RAG検索版"
    />
  );
}
