"use client";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="standalone"><div className="setup-card"><span className="large-icon"><TriangleAlert size={28} /></span><h1>目前無法載入資料</h1><p>請確認資料庫服務已啟動，並已執行 Migration。你的既有資料不會因重試而被更動。</p><Button onClick={reset}>重新載入</Button></div></div>;
}
