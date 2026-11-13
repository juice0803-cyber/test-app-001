import Link from "next/link";
export default function NotFound() { return <main className="standalone"><div className="setup-card"><span className="eyebrow">404</span><h1>這一頁還沒在旅程中</h1><p>請確認網址，或回到你的健康總覽。</p><Link href="/" className="button button-primary">回到總覽</Link></div></main>; }
