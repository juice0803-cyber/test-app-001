"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    try {
      const result = register ? await authClient.signUp.email({ email, password, name: String(data.get("name")).trim() }) : await authClient.signIn.email({ email, password });
      if (result.error) {
        const code = result.error.code;
        setError(code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ? "此電子郵件已註冊，請直接登入。" : result.error.status === 429 ? "嘗試次數過多，請稍等一分鐘。" : register ? "無法建立帳號，請檢查輸入內容或稍後再試。" : "登入失敗，請確認電子郵件與密碼，或稍後再試。");
        return;
      }
      router.push(register ? "/settings?welcome=1" : "/"); router.refresh();
    } catch { setError("目前無法連線，請確認網路與服務狀態後重試。"); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="auth-form">
    {register && <label className="field">暱稱<input name="name" required maxLength={40} autoComplete="nickname" placeholder="我們該怎麼稱呼你？" /></label>}
    <label className="field">電子郵件<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" /></label>
    <label className="field">密碼<div className="password-input"><input name="password" type={visible ? "text" : "password"} minLength={register ? 12 : 1} maxLength={128} required autoComplete={register ? "new-password" : "current-password"} placeholder={register ? "至少 12 個字元" : "輸入你的密碼"} /><button type="button" className="icon-button" aria-label={visible ? "隱藏密碼" : "顯示密碼"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
    {register && <label className="check-field"><input type="checkbox" required /><span>我了解本服務提供一般健身資訊，不能取代醫療建議。我的健康資料會儲存在應用程式資料庫；目前尚未啟用 AI 資料傳送。</span></label>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <Button className="auth-submit" disabled={pending}>{pending ? <LoaderCircle size={18} className="spin" /> : <>{register ? "建立我的健康空間" : "登入我的空間"}<ArrowRight size={17} /></>}</Button>
    <p className="auth-switch">{register ? "已經有帳號？" : "第一次來到這裡？"} <Link href={register ? "/login" : "/register"}>{register ? "登入帳號" : "免費建立帳號"}</Link></p>
    <div className="auth-privacy"><LockKeyhole size={14} />你的資料僅供本人存取，可隨時刪除。</div>
  </form>;
}
