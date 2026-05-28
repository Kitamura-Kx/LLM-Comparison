import AskPanel from "@/components/AskPanel";

export default function TextReferenceLlmPage() {
  return (
    <AskPanel
      apiPath="/api/text-reference"
      description="data内のテキスト全文をそのままGeminiへ渡して回答します。検索や分割は行わない、素朴な比較用ページです。"
      placeholder="例: 関ヶ原の戦いで西軍が負けた理由を説明して"
      title="テキスト参照LLM"
    />
  );
}
