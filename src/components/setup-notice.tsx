import Link from "next/link";
import { Settings2, ArrowUpRight } from "lucide-react";
export function SetupNotice() {
  return <main className="standalone"><div className="setup-card"><span className="large-icon"><Settings2 size={28} /></span><span className="eyebrow">AI FITNESS COACH</span><h1>準備好你的健康空間</h1><p>應用程式尚未完成環境設定。請依專案 README 設定 PostgreSQL 連線與登入密鑰，完成資料庫 Migration 後重新啟動。</p><div className="setup-steps"><span>01　安裝套件：<code>pnpm install</code></span><span>02　產生本機設定：<code>pnpm setup:local</code></span><span>03　啟動開發資料庫：<code>pnpm db:local</code></span><span>04　於另一個終端執行：<code>pnpm db:generate</code></span><span>05　啟動應用程式：<code>pnpm dev</code></span></div><Link href="/login" className="button button-primary">重新檢查設定<ArrowUpRight size={16} /></Link></div></main>;
}
