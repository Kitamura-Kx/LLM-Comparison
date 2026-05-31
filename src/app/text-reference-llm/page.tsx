import AskPanel from "@/components/AskPanel";

export default function TextReferenceLlmPage() {
  return (
    <AskPanel
      apiPath="/api/chat"
      description="人物、合戦、時代背景、江戸幕府などを含む固定文書全文をそのまま参照して回答します。"
      initialMessage="こんにちは。戦国・安土桃山・江戸幕府成立前後の歴史について、固定文書全体をもとに答えます。人物、合戦、時代背景などについて気軽に聞いてください。"
      mode="raw"
      placeholder="例: 関ヶ原の戦いで西軍が負けた理由を説明して"
      title="戦国・安土桃山・江戸幕府成立前後の歴史解説チャット 全文参照版"
    />
  );
}
