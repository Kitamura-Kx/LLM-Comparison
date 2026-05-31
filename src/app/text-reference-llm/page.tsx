import AskPanel from "@/components/AskPanel";

export default function TextReferenceLlmPage() {
  return (
    <AskPanel
      apiPath="/api/chat"
      description="織田信長、豊臣秀吉、徳川家康、本能寺の変、関ヶ原の戦いなどの固定文書全文を参照して回答します。"
      initialMessage="こんにちは。戦国・安土桃山時代の歴史について、固定文書全体をもとに答えます。人物、合戦、時代背景などを気軽に聞いてください。"
      mode="raw"
      placeholder="例: 関ヶ原の戦いで西軍が負けた理由を説明して"
      title="戦国・安土桃山史チャット 全文参照版"
    />
  );
}
