import Link from "next/link";

const routes = [
  {
    href: "/text-reference-llm",
    label: "テキスト参照LLM",
  },
  {
    href: "/rag-langchain",
    label: "RAG(Langchain)",
  },
];

export default function Home() {
  return (
    <main className="home">
      <div className="homeInner">
        <p className="eyebrow">LLM Comparison</p>
        <h1>比較するLLM手法を選択</h1>
        <p className="lead">
          テキスト参照型とRAG型のチャットボットを切り替えて比較できます。
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
