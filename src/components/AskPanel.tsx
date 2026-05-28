"use client";

import { FormEvent, useState } from "react";

type Source = {
  id: string;
  title: string;
  score?: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmedQuestion,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "回答の生成に失敗しました。");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.answer ?? "",
          sources: data.sources ?? [],
        },
      ]);
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
    <main className="chatPage">
      <header className="chatHeader">
        <a className="backLink" href="/">
          ← 戻る
        </a>
        <div>
          <p className="chatKicker">LLM Comparison</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      {error ? <p className="errorMessage">{error}</p> : null}

      <section className="chatWindow" aria-live="polite">
        {messages.length === 0 ? (
          <div className="emptyChat">
            <p>{placeholder}</p>
          </div>
        ) : null}

        {messages.map((message) => (
          <article
            className={`chatRow ${message.role === "user" ? "isUser" : "isAssistant"}`}
            key={message.id}
          >
            <div className="avatar" aria-hidden="true">
              {message.role === "user" ? "U" : "AI"}
            </div>
            <div className="bubbleGroup">
              <p className="chatBubble">{message.text}</p>
              {message.sources && message.sources.length > 0 ? (
                <details className="chatSources">
                  <summary>参照資料</summary>
                  <ul>
                    {message.sources.map((source) => (
                      <li key={source.id}>
                        <span>{source.title}</span>
                        <small>{source.id}</small>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </article>
        ))}

        {isLoading ? (
          <article className="chatRow isAssistant">
            <div className="avatar" aria-hidden="true">
              AI
            </div>
            <div className="bubbleGroup">
              <p className="chatBubble typing">生成中...</p>
            </div>
          </article>
        ) : null}
      </section>

      <form className="chatComposer" onSubmit={handleSubmit}>
        <textarea
          aria-label="質問"
          className="chatInput"
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          value={question}
        />
        <button className="sendButton" disabled={isLoading} type="submit">
          送信
        </button>
      </form>
    </main>
  );
}
