"use client";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserRound, Target, Dumbbell, Utensils, ShieldCheck, Save, LoaderCircle, Check, Info, Trash2, ArrowRight } from "lucide-react";
import { profileSchema, type ProfileInput } from "@/lib/profile-schema";
import { nutritionTargets } from "@/lib/nutrition";
import { number } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
function Field({ label, hint, children, error }: { label: string; hint?: string; children: ReactNode; error?: string[] }) { return <label className="field">{label}{children}{hint && <span className="field-hint">{hint}</span>}{error?.map(e => <span key={e} className="field-error">{e}</span>)}</label>; }
export function ProfileForm({ initial, email, welcome }: { initial: ProfileInput; email: string; welcome: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const targets = useMemo(() => nutritionTargets(form), [form]);
  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) { setForm(f => ({ ...f, [key]: value })); setSaved(false); }
  function numeric(key: keyof ProfileInput, value: string) { update(key, value === "" ? null : Number(value)); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSaved(false); setErrors({});
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) { setErrors(parsed.error.flatten().fieldErrors); setError("請檢查標示的欄位。"); return; }
    setPending(true);
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json();
      if (!response.ok) { setError(result.error); setErrors(result.fields ?? {}); if (response.status === 401) router.push("/login"); return; }
      setSaved(true); router.refresh();
    } catch { setError("無法儲存，請確認網路連線後再試。你的輸入仍保留在此頁。"); }
    finally { setPending(false); }
  }
  async function deleteAccount(event: FormEvent) {
    event.preventDefault(); setDeleting(true); setError("");
    try {
      const result = await authClient.deleteUser({ password });
      if (result.error) { setError("刪除失敗，請確認密碼或稍後重試。"); return; }
      router.replace("/login"); router.refresh();
    } catch { setError("目前無法刪除帳號，請稍後重試。"); }
    finally { setDeleting(false); setPassword(""); }
  }
  return <>
    {welcome && <div className="onboarding-banner"><span className="banner-icon"><Check size={22} /></span><div><strong>你的健康空間已準備好。</strong><p>先設定基本資料。非必要欄位可以留空，之後隨時補充。</p></div></div>}
    <div className="settings-layout"><form id="profile-form" onSubmit={submit} className="settings-form">
      <section className="card form-section" id="basic"><div className="form-section-heading"><span className="section-icon mint"><UserRound size={18} /></span><div><h2>認識現在的你</h2><p>用於個人化估算。尚未提供的資料不會被猜測。</p></div></div><div className="form-grid">
        <Field label="暱稱 *" error={errors.nickname}><input name="nickname" required maxLength={40} value={form.nickname} onChange={e => update("nickname", e.target.value)} /></Field>
        <Field label="電子郵件" hint="帳號識別資訊，無法在此修改。"><input value={email} disabled type="email" /></Field>
        <Field label="年齡" error={errors.age}><input name="age" type="number" min={13} max={100} placeholder="例如 30" value={form.age ?? ""} onChange={e => numeric("age", e.target.value)} /></Field>
        <Field label="生理性別" hint="僅供估算公式使用，可選擇不提供。"><select name="sex" value={form.sex} onChange={e => update("sex", e.target.value as ProfileInput["sex"])}><option value="UNSPECIFIED">暫不提供</option><option value="MALE">男性</option><option value="FEMALE">女性</option></select></Field>
        <Field label="身高（cm）" error={errors.heightCm}><input name="heightCm" type="number" step="0.1" min={100} max={250} placeholder="例如 175" value={form.heightCm ?? ""} onChange={e => numeric("heightCm", e.target.value)} /></Field>
        <Field label="目前體重（kg）" hint="個人檔案基準值；每日量測紀錄功能尚未開放。" error={errors.startingWeightKg}><input name="startingWeightKg" type="number" step="0.1" min={25} max={350} placeholder="例如 78.5" value={form.startingWeightKg ?? ""} onChange={e => numeric("startingWeightKg", e.target.value)} /></Field>
        <div className="full-width"><Field label="健康適用情況" hint="特殊情況與未成年人不使用一般成人自動目標。"><select name="riskContext" value={form.riskContext} onChange={e => update("riskContext", e.target.value as ProfileInput["riskContext"])}><option value="GENERAL">一般成人，無上述特殊需求</option><option value="PREGNANCY">孕期或哺乳期</option><option value="CLINICAL">重大疾病或特殊醫療需求</option><option value="EATING_CONCERN">對飲食失調或過度限制有疑慮</option></select></Field></div>
      </div></section>
      <section className="card form-section" id="goals"><div className="form-section-heading"><span className="section-icon sand"><Target size={18} /></span><div><h2>想前往的方向</h2><p>目標可以改變，重點是找到適合自己的步調。</p></div></div><div className="goal-options">{([ ["FAT_LOSS", "減脂"], ["MUSCLE_GAIN", "增肌"], ["MAINTAIN", "維持"], ["RECOMPOSITION", "體態重組"] ] as const).map(([value, label]) => <label key={value} className={`goal-option ${form.goal === value ? "selected" : ""}`}><input type="radio" name="goal" value={value} checked={form.goal === value} onChange={() => update("goal", value)} /><span>{label}</span></label>)}</div><div className="form-grid"><Field label="目標體重（kg）" error={errors.targetWeightKg}><input name="targetWeightKg" type="number" step="0.1" min={25} max={350} value={form.targetWeightKg ?? ""} onChange={e => numeric("targetWeightKg", e.target.value)} placeholder="選填" /></Field><Field label="目標體脂率（%）" error={errors.targetBodyFat}><input name="targetBodyFat" type="number" step="0.1" min={3} max={65} value={form.targetBodyFat ?? ""} onChange={e => numeric("targetBodyFat", e.target.value)} placeholder="選填" /></Field><Field label="目標骨骼肌量（kg）" error={errors.targetMuscleKg}><input name="targetMuscleKg" type="number" step="0.1" min={10} max={100} value={form.targetMuscleKg ?? ""} onChange={e => numeric("targetMuscleKg", e.target.value)} placeholder="選填" /></Field><Field label="日常活動程度"><select name="activity" value={form.activity} onChange={e => update("activity", e.target.value as ProfileInput["activity"])}><option value="SEDENTARY">久坐 · 大多數時間坐著（1.2）</option><option value="LIGHT">輕度活動 · 每週 1–3 天（1.375）</option><option value="MODERATE">中度活動 · 每週 3–5 天（1.55）</option><option value="HIGH">高度活動 · 每週 6–7 天（1.725）</option><option value="VERY_HIGH">非常活躍 · 體力勞動或密集訓練（1.9）</option></select></Field></div></section>
      <section className="card form-section" id="training"><div className="form-section-heading"><span className="section-icon lilac"><Dumbbell size={18} /></span><div><h2>你的訓練節奏</h2><p>先了解可投入的時間，訓練計畫功能尚未開放。</p></div></div><div className="form-grid"><Field label="每週可訓練天數" error={errors.trainingDays}><input name="trainingDays" type="number" min={0} max={7} value={form.trainingDays} onChange={e => update("trainingDays", Number(e.target.value))} /></Field><Field label="每次訓練時間（分鐘）" error={errors.trainingMinutes}><input name="trainingMinutes" type="number" min={10} max={180} value={form.trainingMinutes} onChange={e => update("trainingMinutes", Number(e.target.value))} /></Field><Field label="訓練經驗"><select name="experience" value={form.experience} onChange={e => update("experience", e.target.value as ProfileInput["experience"])}><option value="BEGINNER">初學 · 正在建立習慣</option><option value="INTERMEDIATE">中階 · 有規律訓練經驗</option><option value="ADVANCED">進階 · 長期且有系統訓練</option></select></Field></div></section>
      <section className="card form-section" id="nutrition"><div className="form-section-heading"><span className="section-icon peach"><Utensils size={18} /></span><div><h2>吃得適合自己</h2><p>自訂目標優先於估算。留空即可恢復系統初始估算。</p></div></div><div className="form-grid"><Field label="自訂每日熱量（kcal）" error={errors.calorieOverride} hint="系統輸入範圍為 1,200–6,000，並非個人安全攝取建議。"><input name="calorieOverride" type="number" min={1200} max={6000} value={form.calorieOverride ?? ""} onChange={e => numeric("calorieOverride", e.target.value)} placeholder="使用初始估算" /></Field><Field label="自訂每日蛋白質（g）" error={errors.proteinOverride}><input name="proteinOverride" type="number" min={20} max={350} value={form.proteinOverride ?? ""} onChange={e => numeric("proteinOverride", e.target.value)} placeholder="使用初始估算" /></Field><Field label="飲食偏好" error={errors.dietaryPreferences}><textarea name="dietaryPreferences" maxLength={500} rows={3} placeholder="例如：蛋奶素、偏好台式家常菜" value={form.dietaryPreferences} onChange={e => update("dietaryPreferences", e.target.value)} /></Field><Field label="過敏及飲食限制" error={errors.restrictions}><textarea name="restrictions" maxLength={500} rows={3} placeholder="例如：花生過敏、乳糖不耐症" value={form.restrictions} onChange={e => update("restrictions", e.target.value)} /></Field></div></section>
      <div className="save-bar"><div aria-live="polite">{saved ? <span className="save-success"><Check size={17} />設定已儲存</span> : <span className="muted">修改後請儲存，目標才會更新。</span>}</div><Button type="submit" disabled={pending}>{pending ? <LoaderCircle size={17} className="spin" /> : <Save size={17} />}{pending ? "儲存中…" : "儲存設定"}</Button></div>
    </form><aside className="settings-aside"><div className="card estimates-card"><span className="eyebrow text-green">適合你的健康起點</span><h2>你的每日目標預覽</h2><p>儲存前即可查看估算，隨時調整。</p><div className="estimate-calories"><strong>{number(targets.calories)}</strong><span>kcal／天</span></div><div className="estimate-grid"><div><span>蛋白質</span><strong>{number(targets.protein)} <small>g</small></strong></div><div><span>碳水</span><strong>{number(targets.carbs, 1)} <small>g</small></strong></div><div><span>脂肪</span><strong>{number(targets.fat)} <small>g</small></strong></div></div><div className="estimate-detail"><span>估算 BMR <strong>{number(targets.bmr)} kcal</strong></span><span>估算 TDEE <strong>{number(targets.tdee)} kcal</strong></span></div>{targets.warning && <div className="estimate-warning"><Info size={16} /><span>{targets.warning}</span></div>}<details className="formula-details"><summary>這些數字如何計算？</summary><p>BMR 採 Mifflin-St Jeor：10 × 體重 + 6.25 × 身高 − 5 × 年齡，男性 +5、女性 −161。TDEE = BMR × 活動係數。</p><p>初始目標：減脂 TDEE −250、增肌 +150、其餘維持 TDEE；不低於估算 BMR 與 1,200 kcal。這是一般成人的可修改起點，並非個人化醫療處方。</p><p>蛋白質初估 1.6 g/kg、脂肪約總熱量 30%，其餘分配至碳水。熱量按蛋白質／碳水 4 kcal/g、脂肪 9 kcal/g 計算，四捨五入差異約 1 kcal 內。</p><p>必要資料缺漏時不計算 BMR／TDEE。未成年人與特殊情況停用估算；資料不足不進行趨勢調整。</p></details></div><div className="privacy-card"><ShieldCheck size={21} /><h3>你的資料，由你掌握</h3><p>目前資料僅儲存在應用程式資料庫，尚未傳送至 AI 服務。未來啟用 AI 前，會先告知處理方式並徵求同意。</p></div></aside></div>
    {error && <div className="form-error settings-error" role="alert">{error}</div>}
    <details className="danger-zone"><summary><Trash2 size={16} />刪除帳號與所有資料</summary><p>此操作會永久刪除帳號、個人檔案及所有健康紀錄，無法復原。請輸入目前密碼並確認後刪除。</p><form onSubmit={deleteAccount}><label className="field">目前密碼<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><label className="check-field"><input type="checkbox" required /><span>我了解此操作無法復原，並確認刪除所有資料。</span></label><Button variant="destructive" disabled={deleting}>{deleting ? "刪除中…" : "永久刪除帳號與資料"}</Button></form></details>
    {saved && <a href="/" className="settings-back">回到總覽，查看我的目標 <ArrowRight size={16} /></a>}
  </>;
}
