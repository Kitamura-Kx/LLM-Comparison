import Link from "next/link";

const routes = [
  {
    href: "/text-reference-llm",
    label: "戦国・安土桃山史チャット 全文参照版",
  },
  {
    href: "/rag-langchain",
    label: "戦国・安土桃山史チャット RAG検索版",
  },
];

export default function Home() {
  return (
    <main className="home">
      <div className="homeInner">
        <p className="eyebrow">Sengoku History Chatbot</p>
        <h1>戦国・安土桃山時代の歴史チャット</h1>
        <p className="lead">
          織田信長、豊臣秀吉、関ヶ原の戦いなどの固定文書をもとに、全文参照型とRAG型の回答を比較できます。
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
