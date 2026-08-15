import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "小包子学数学｜零基础初中数学课程";
const description = "为零基础长辈准备的初中数学完整课程：通俗讲解、分步例题、练习与答案，从小学基础慢慢学起。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const basePath = process.env.GITHUB_PAGES === "true" ? "/tainai-junior-math" : "";
  const imageUrl = `${protocol}://${host}${basePath}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_CN",
      images: [{ url: imageUrl, width: 1731, height: 909, alt: "小包子学数学课程封面" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
