import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "戦国・安土桃山時代の歴史チャット",
  description: "固定文書をもとに戦国・安土桃山時代の歴史を回答するチャットボットです。",
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
