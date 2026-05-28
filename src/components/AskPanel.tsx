"use client";

import { FormEvent, useState } from "react";

type Source = {
  id: string;
  title: string;
  score?: number;
};

type AskPanelProps = {
  apiPath: string;
  description: string;
  placeholder: string;
  title: string;
};

export default function AskPanel({
  apiPath,
  description,
  placeholder,
  title,
}: AskPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "回答の生成に失敗しました。");
      }

      setAnswer(data.answer ?? "");
      setSources(data.sources ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "回答の生成に失敗しました。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="toolPage">
      <section className="toolHeader">
        <a className="backLink" href="/">
          ← 戻る
        </a>
        <p className="eyebrow">LLM Comparison</p>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
      </section>

      <form className="askForm" onSubmit={handleSubmit}>
        <label className="fieldLabel" htmlFor="question">
          質問
        </label>
        <textarea
          className="questionInput"
          id="question"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={placeholder}
          rows={5}
          value={question}
        />
        <button className="submitButton" disabled={isLoading} type="submit">
          {isLoading ? "生成中..." : "質問する"}
        </button>
      </form>

      {error ? <p className="errorMessage">{error}</p> : null}

      {answer ? (
        <section className="answerPanel" aria-live="polite">
          <h2>回答</h2>
          <p>{answer}</p>
        </section>
      ) : null}

      {sources.length > 0 ? (
        <section className="sourceList">
          <h2>参照資料</h2>
          <ul>
            {sources.map((source) => (
              <li key={source.id}>
                <span>{source.title}</span>
                <small>{source.id}</small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
