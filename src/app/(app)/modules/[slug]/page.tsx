import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Construction, Check } from "lucide-react";
const modules: Record<string, { title: string; phase: number; description: string; features: string[] }> = {
  food: { title: "飲食紀錄", phase: 2, description: "讓每一餐的營養，都有清楚的紀錄。", features: ["新增、修改與刪除餐點", "依來源標示營養數據", "單餐及每日營養素統計"] },
  weight: { title: "體重管理", phase: 2, description: "看見長期趨勢，陪自己穩穩前進。", features: ["每日體重、腰圍與恢復紀錄", "7 日移動平均與週／月比較", "以有效日數呈現紀錄完整度"] },
  inbody: { title: "InBody 分析", phase: 2, description: "把每次測量，連成有意義的身體變化。", features: ["完整身體組成與儀器紀錄", "30／90／180 天歷史比較", "量測條件及誤差提示"] },
  workouts: { title: "訓練紀錄", phase: 2, description: "記住每一次訓練的努力。", features: ["重量、次數與每組表現", "有氧與恢復狀態紀錄", "訓練量與個人最佳紀錄"] },
  "nutrition-plan": { title: "飲食計畫", phase: 3, description: "把目標化為可持續的每日選擇。", features: ["訓練日與休息日配置", "計畫與實際攝取比較", "保留每次調整的計畫版本"] },
  "workout-plan": { title: "訓練計畫", phase: 3, description: "建立適合你的時間、經驗與目標的安排。", features: ["全身、上下身與推拉腿分化", "可自行修改的訓練安排", "計畫與實際完成率比較"] },
  coach: { title: "AI 教練", phase: 4, description: "用可驗證的數據，支持每一次調整。", features: ["規則引擎先計算，AI 再解釋", "至少 2 週有效資料才評估調整", "接受或拒絕建議，保留原計畫"] },
  reports: { title: "週報／月報", phase: 3, description: "回頭看，才能知道接下來往哪走。", features: ["飲食、體重與訓練統計", "完整度與有效日數透明呈現", "後續加入 AI 解讀與行動建議"] },
};
export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = modules[slug];
  if (!module) notFound();
  return <><div className="page-heading"><div><span className="eyebrow text-green">陪你一步步前進</span><h1>{module.title}</h1><p>{module.description}</p></div></div><div className="module-card card"><span className="large-icon"><Construction size={30} strokeWidth={1.5} /></span><span className="badge badge-green">第 {module.phase} 階段 · 尚未實作</span><h2>下一段旅程，正在規劃中。</h2><p>目前已開放帳號、個人設定與總覽。此模組尚未開放輸入、儲存或分析，以下為後續規劃功能。</p><div className="module-features">{module.features.map(f => <span key={f}><Check size={16} />{f}</span>)}</div><div className="module-actions"><Link href="/" className="button button-outline"><ArrowLeft size={16} />回到總覽</Link><Link href="/settings" className="button button-primary">先設定個人目標<ArrowUpRight size={16} /></Link></div></div></>;
}
