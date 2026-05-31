import Link from "next/link";

const routes = [
  {
    href: "/text-reference-llm",
    label: "全文参照版",
  },
  {
    href: "/rag-langchain",
    label: "RAG検索版",
  },
];

export default function Home() {
  return (
    <main className="home">
      <div className="homeInner">
        <p className="eyebrow">History Explanation Chatbot</p>
        <h1>戦国・安土桃山・江戸幕府成立前後の歴史解説チャット</h1>
        <p className="lead">
          織田信長、豊臣秀吉、徳川家康、関ヶ原の戦い、江戸幕府などの固定文書をもとに、全文参照型とRAG型の回答を比較できます。
        </p>
        <nav aria-label="LLM comparison routes" className="routeGrid">
          {routes.map((route) => (
            <Link className="routeButton" href={route.href} key={route.href}>
              <span>{route.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
