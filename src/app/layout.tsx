import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "戦国・安土桃山・江戸幕府成立前後の歴史解説チャット",
  description: "戦国・安土桃山・江戸幕府成立前後の固定文書をもとに回答するチャットボットです。",
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
