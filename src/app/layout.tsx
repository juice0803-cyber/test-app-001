import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = { title: { default: "總覽 · AI Fitness Coach", template: "%s · AI Fitness Coach" }, description: "你的個人化飲食、訓練與身體數據管理空間。", applicationName: "AI Fitness Coach" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#204e3b" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant-TW" suppressHydrationWarning><body><a href="#main-content" className="skip-link">跳至主要內容</a><Providers>{children}</Providers></body></html>;
}
