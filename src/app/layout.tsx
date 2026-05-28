import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Comparison",
  description: "Compare text reference LLM and RAG approaches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
