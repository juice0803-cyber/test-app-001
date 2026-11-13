"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Utensils, CalendarDays, Scale, ScanLine, Dumbbell, ClipboardList, Sparkles, ChartNoAxesCombined, Settings2, Leaf, LogOut, Menu, X, ArrowUpRight, ChevronRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
const navigation = [
  { href: "/", label: "總覽", icon: LayoutDashboard },
  { href: "/modules/food", label: "飲食紀錄", icon: Utensils },
  { href: "/modules/nutrition-plan", label: "飲食計畫", icon: CalendarDays },
  { href: "/modules/weight", label: "體重管理", icon: Scale },
  { href: "/modules/inbody", label: "InBody 分析", icon: ScanLine },
  { href: "/modules/workouts", label: "訓練紀錄", icon: Dumbbell },
  { href: "/modules/workout-plan", label: "訓練計畫", icon: ClipboardList },
  { href: "/modules/coach", label: "AI 教練", icon: Sparkles },
  { href: "/modules/reports", label: "週報／月報", icon: ChartNoAxesCombined },
];
export function Brand() { return <Link href="/" className="brand" aria-label="AI Fitness Coach 首頁"><span className="brand-icon"><Leaf size={23} strokeWidth={1.8} /></span><span>AI FITNESS<span className="brand-sub">你的個人健康教練</span></span></Link>; }
export function AppShell({ children, name, email }: { children: React.ReactNode; name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    if (!open) return;
    function close(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  const current = [...navigation, { href: "/settings", label: "個人設定" }].find(n => n.href === pathname)?.label ?? "總覽";
  async function signOut() {
    setSigningOut(true); setError("");
    try { const result = await authClient.signOut(); if (result.error) throw new Error(); router.push("/login"); router.refresh(); }
    catch { setError("登出失敗，請稍後再試。"); setSigningOut(false); }
  }
  return <div className="app-shell">
    {open && <button className="sidebar-backdrop" aria-label="關閉選單" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand /><button className="mobile-close icon-button" aria-label="關閉選單" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <div className="nav-label">我的健康空間</div>
      <nav aria-label="主選單">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-item ${pathname === href ? "nav-active" : ""}`}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{href.includes("coach") && <span className="tiny-tag">AI</span>}{pathname === href && <span className="active-dot" />}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="journey-card"><span className="journey-icon"><Leaf size={20} /></span><strong>把健康，練成日常。</strong><p>從了解自己開始，<br />一步步靠近理想的你。</p><Link href="/settings" onClick={() => setOpen(false)}>設定我的目標 <ArrowUpRight size={15} /></Link></div><Link href="/settings" className={`nav-item ${pathname === "/settings" ? "nav-active" : ""}`} onClick={() => setOpen(false)}><Settings2 size={19} />個人設定</Link><button className="nav-item logout" onClick={signOut} disabled={signingOut}><LogOut size={18} />{signingOut ? "登出中…" : "登出帳號"}</button>{error && <p className="field-error" role="alert">{error}</p>}<div className="sidebar-footnote">AI Fitness Coach <span>v0.1</span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="開啟主選單" onClick={() => setOpen(true)}><Menu size={22} /></button><span className="breadcrumb-root">我的空間</span><ChevronRight size={14} /><strong>{current}</strong></div><div className="topbar-actions"><span className="private-label"><span />私人的健康旅程</span><ThemeToggle /><span className="topbar-divider" /><Link href="/settings" className="user-chip" title={email}><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span>{name}</span></Link></div></header><main id="main-content" className="main-content">{children}</main><footer className="page-footer"><span>用數據了解自己，用行動照顧自己。</span><span>Asia/Taipei · 公制單位</span></footer></div>
    <nav className="mobile-bottom-nav" aria-label="行動版快速選單"><Link href="/" aria-current={pathname === "/" ? "page" : undefined}><LayoutDashboard size={20} />總覽</Link><Link href="/modules/food"><Utensils size={20} />飲食</Link><Link href="/modules/workouts"><Dumbbell size={20} />訓練</Link><Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined}><Settings2 size={20} />設定</Link></nav>
  </div>;
}
