import Link from "next/link";
import { ArrowUpRight, ArrowRight, Flame, Dumbbell, Scale, CalendarDays, Sparkles, Utensils, ChevronRight, ScanLine, Check, Settings2, CircleHelp, Target } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import { number } from "@/lib/utils";
import { dayKey } from "@/lib/dates";
import { Button } from "./ui/button";
import { WeightChart } from "./weight-chart";
const goals = { FAT_LOSS: "穩定減脂", MUSCLE_GAIN: "循序增肌", MAINTAIN: "維持體態", RECOMPOSITION: "體態重組" };
function Nutrient({ title, value, target, unit = "g", color }: { title: string; value?: number | null; target: number | null; unit?: string; color: string }) {
  const ratio = value == null || !target ? 0 : Math.min(100, value / target * 100);
  return <div className="nutrient"><div className="nutrient-title"><span className="legend-dot" style={{ background: color }} />{title}<span><strong>{number(value, 1)}</strong><small> / {number(target)} {unit}</small></span></div><div className="progress-track"><span style={{ width: `${ratio}%`, background: color }} /></div></div>;
}
export function DashboardView({ data, name }: { data: DashboardData; name: string }) {
  const { profile, targets, intake, today } = data;
  const date = new Date(`${today}T12:00:00+08:00`);
  const dateLabel = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "long", day: "numeric", weekday: "long" }).format(date);
  const ratio = intake && targets.calories ? Math.min(1, intake.calories / targets.calories) : 0;
  const remaining = intake && targets.calories ? targets.calories - intake.calories : null;
  const current = data.latestWeight ?? profile?.startingWeightKg;
  const average = data.trend.at(-1);
  return <>
    <section className="page-heading"><div><div className="eyebrow text-green">你的每日健康總覽</div><h1>{name}，每一步，都算數<span className="heading-dot">。</span></h1><p>好好吃、好好練，讓今天比昨天更靠近目標。</p></div><div className="heading-actions"><span className="date-chip"><CalendarDays size={16} />{dateLabel}</span><Button asChild variant="outline" size="sm"><Link href="/settings"><Settings2 size={15} />個人設定</Link></Button></div></section>
    {!profile && <div className="onboarding-banner"><span className="banner-icon"><Sparkles size={22} /></span><div><strong>先認識你，才能陪你走得更遠。</strong><p>完成個人資料，建立專屬的熱量與營養素目標。</p></div><Link href="/settings">開始設定 <ArrowRight size={17} /></Link></div>}
    <div className="dashboard-grid primary-grid">
      <section className="card nutrition-card"><div className="card-heading"><div className="section-title"><span className="section-icon peach"><Flame size={18} /></span><h2>今日營養</h2></div><span className="badge badge-muted">{intake ? "已記錄" : "尚未記錄"}</span></div><div className="nutrition-content"><div className="calorie-ring"><svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="76" className="ring-track" />{ratio > 0 && <circle cx="90" cy="90" r="76" className="ring-fill" strokeDasharray={`${ratio * 477.5} 477.5`} />}</svg><div className="ring-label"><span>已攝取熱量</span><strong>{number(intake?.calories)}</strong><small>/ {number(targets.calories)} kcal</small></div></div><div className="nutrients"><Nutrient title="蛋白質" value={intake?.protein} target={targets.protein} color="var(--green)" /><Nutrient title="碳水化合物" value={intake?.carbs} target={targets.carbs} color="#c3a574" /><Nutrient title="脂肪" value={intake?.fat} target={targets.fat} color="#a2acc1" /><div className="remaining"><span>今日剩餘熱量</span><strong>{number(remaining)} <small>kcal</small></strong></div></div></div><div className="card-bottom"><span><span className="small-status-dot" />{intake ? "依今日已儲存紀錄計算" : "沒有紀錄的日子，不會視為零攝取"}</span><Link href="/modules/food">飲食紀錄 <ArrowUpRight size={15} /></Link></div></section>
      <section className="card weight-summary"><div className="card-heading"><div className="section-title"><span className="section-icon mint"><Scale size={18} /></span><h2>我的體態目標</h2></div><Target size={17} className="muted" /></div><span className="weight-context">{data.latestWeight !== null ? "最近量測體重" : profile?.startingWeightKg ? "個人檔案體重" : "目前體重"}</span><div className="big-weight">{number(current, 1)}<span>kg</span></div><div className="weight-target"><span>目標體重</span><strong>{number(profile?.targetWeightKg, 1)} <small>kg</small></strong></div><div className="goal-divider" /><div className="weight-goal-footer"><span className="goal-badge"><span />{profile ? goals[profile.goal] : "尚未設定目標"}</span><Link href="/settings" aria-label="編輯體態目標"><ArrowUpRight size={19} /></Link></div><div className="weight-watermark" aria-hidden="true"><Scale size={100} strokeWidth={.6} /></div></section>
    </div>
    <div className="stats-grid">
      <div className="card stat-card"><span className="stat-icon mint"><Dumbbell size={20} /></span><div><span className="stat-label">本週完成訓練</span><strong>{data.workouts}<small> / {profile ? profile.trainingDays : "—"} 次</small></strong></div><span className="stat-note">{data.workoutMinutes} 分鐘</span></div>
      <div className="card stat-card"><span className="stat-icon sand"><Utensils size={20} /></span><div><span className="stat-label">本週完整飲食紀錄</span><strong>{data.completedDays}<small> 天</small></strong></div><span className="stat-note">週一至今</span></div>
      <div className="card stat-card"><span className="stat-icon lilac"><ScanLine size={20} /></span><div><span className="stat-label">最新體脂率</span><strong>{number(data.inbody?.bodyFat, 1)}<small> %</small></strong></div><span className="stat-note">{data.inbody ? dayKey(data.inbody.measuredAt).slice(5).replace("-", "/") : "尚未量測"}</span></div>
    </div>
    <div className="dashboard-grid secondary-grid">
      <section className="card trend-card"><div className="card-heading"><div><h2>一點一滴，看見改變</h2><p className="card-subtitle">體重趨勢 · 最近 7 天</p></div><span className="period-chip">7 天</span></div><div className="chart-summary"><strong>{number(average?.average, 1)}<small>kg</small></strong><span>7 日移動平均<span className="muted"> · {average?.samples ?? 0} 個有效日</span></span></div><WeightChart points={data.trend} /><div className="chart-legend"><span><i className="legend-dot green-bg" />當日平均體重</span><span><i className="legend-line" />7 日移動平均</span><span className="chart-note">觀察趨勢，給身體一點時間。</span></div></section>
      <section className="coach-card"><div className="coach-heading"><span className="coach-icon"><Sparkles size={20} /></span><span>給你的健康筆記</span><span className="badge badge-green">準備中</span></div><div className="coach-orbit" aria-hidden="true"><Sparkles size={34} strokeWidth={1.2} /></div><h2>先累積日常，<br />再讓數據說話。</h2><p>累積至少 2 週具代表性的紀錄後，才能更有依據地了解飲食與訓練的變化。</p><div className="coach-checks"><span><Check size={15} />優先觀察長期趨勢</span><span><Check size={15} />資料不足，維持原計畫</span><span><Check size={15} />任何調整，都由你決定</span></div><Link href="/modules/coach">了解 AI 教練規劃 <ArrowUpRight size={17} /></Link><span className="coach-note">AI 分析功能尚未開放</span></section>
    </div>
    <div className="dashboard-grid bottom-grid">
      <section className="card food-card"><div className="card-heading"><div className="section-title"><Utensils size={18} className="muted" /><h2>今天吃了什麼</h2></div><Link className="text-link" href="/modules/food">飲食紀錄<ChevronRight size={15} /></Link></div>{data.food.length ? <div className="food-list">{data.food.map(entry => <div key={entry.id}><span><strong>{entry.name}</strong><small>{entry.meal} · {entry.source === "USER_INPUT" ? "使用者輸入" : entry.source}</small></span><strong>{number(entry.calories)} <small>kcal</small></strong></div>)}</div> : <div className="horizontal-empty"><span className="empty-icon"><Utensils size={24} strokeWidth={1.5} /></span><div><strong>每一餐，都是照顧自己的機會。</strong><p>尚無今日飲食紀錄，紀錄功能將於下一階段開放。</p></div></div>}</section>
      <section className="card body-card"><div className="card-heading"><div className="section-title"><ScanLine size={18} className="muted" /><h2>身體組成快照</h2></div><Link href="/modules/inbody" aria-label="查看 InBody 模組"><ArrowUpRight size={17} className="muted" /></Link></div><div className="body-numbers"><div><span>骨骼肌量</span><strong>{number(data.inbody?.muscleKg, 1)} <small>kg</small></strong></div><div><span>體脂肪量</span><strong>{number(data.inbody?.fatKg, 1)} <small>kg</small></strong></div></div><p className="body-note"><CircleHelp size={13} />單次量測可能受水分與儀器影響，請以趨勢評估。</p></section>
    </div>
    {targets.warning && <p className="dashboard-notice"><CircleHelp size={15} />{targets.warning}</p>}
  </>;
}
