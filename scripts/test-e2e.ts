// 在獨立記憶體 PostgreSQL 與 production HTTP server 驗證完整請求流程。
// 不讀寫使用者的開發或正式資料庫；需先 pnpm build。
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { emptyProfile } from "../src/lib/profile-schema";
const origin = "http://127.0.0.1:3101";
const db = await PGlite.create();
await db.exec(await readFile("prisma/migrations/202611130001_phase1/migration.sql", "utf8"));
const socket = new PGLiteSocketServer({ db, port: 5545, host: "127.0.0.1" });
await socket.start();
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3101"], {
  env: { ...process.env, NODE_ENV: "production", DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5545/fitness", DB_POOL_MAX: "1", BETTER_AUTH_URL: origin, BETTER_AUTH_SECRET: randomBytes(48).toString("base64url") },
  stdio: ["ignore", "ignore", "pipe"], windowsHide: true,
});
// 只保留至記憶體供失敗排查；不列印登入或健康資料。
let serviceError = "";
app.stderr?.on("data", data => { serviceError += data.toString(); });
let checks = 0;
let socketStopped = false;
async function stopSocket() {
  if (!socketStopped) { await socket.stop(); socketStopped = true; }
}
async function stopApp() {
  if (app.exitCode !== null || app.signalCode !== null) return;
  const ended = new Promise<void>(resolve => app.once("exit", () => resolve()));
  app.kill();
  await ended;
}
function pass(message: string) { checks++; console.log(`✓ ${message}`); }
async function request(path: string, options: { cookie?: string; method?: string; body?: unknown; foreignOrigin?: boolean } = {}) {
  return fetch(`${origin}${path}`, { method: options.method ?? "GET", headers: { Origin: options.foreignOrigin ? "https://invalid.example" : origin, ...(options.cookie ? { Cookie: options.cookie } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}) }, ...(options.body ? { body: JSON.stringify(options.body) } : {}), redirect: "manual", signal: AbortSignal.timeout(20000) });
}
function cookies(response: Response) { return response.headers.getSetCookie().map(c => c.split(";")[0]).join("; "); }
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (app.exitCode !== null) throw new Error("測試服務無法啟動。");
    try { ready = (await request("/login")).status === 200; } catch {}
    if (ready) break;
    await setTimeout(400);
  }
  assert(ready, "測試服務未就緒");
  assert.equal((await request("/api/profile")).status, 401);
  assert.equal((await request("/api/dashboard")).status, 401);
  assert.equal((await request("/")).status, 307); pass("未登入時拒絕 API 並導向登入頁");
  const password = randomBytes(24).toString("hex");
  const email = "phase1-e2e@example.test";
  const registered = await request("/api/auth/sign-up/email", { method: "POST", body: { email, password, name: "驗收帳號" } });
  assert.equal(registered.status, 200, "註冊失敗");
  let cookie = cookies(registered);
  assert(cookie.includes("session_token")); pass("註冊後取得 HttpOnly 登入工作階段");
  assert(registered.headers.getSetCookie().some(c => c.includes("HttpOnly")));
  const user = (await registered.json()).user;
  const initial = await (await request("/api/dashboard", { cookie })).json();
  assert.equal(initial.profile, null); assert.equal(initial.intake, null); assert.equal(initial.targets.calories, null); pass("新帳號呈現空狀態，不捏造健康資料");
  const profile = { ...emptyProfile("驗收使用者"), age: 30, sex: "MALE", heightCm: 175, startingWeightKg: 78.5, targetWeightKg: 72, calorieOverride: 2200, proteinOverride: 150 };
  assert.equal((await request("/api/profile", { method: "PUT", cookie, body: profile })).status, 200);
  const dashboard = await (await request("/api/dashboard", { cookie })).json();
  assert.equal(dashboard.profile.startingWeightKg, 78.5); assert.equal(dashboard.targets.calories, 2200); assert.equal(dashboard.targets.protein, 150); pass("個人設定儲存後即時反映到 Dashboard");
  assert.equal((await request("/api/profile", { method: "PUT", cookie, body: { ...profile, age: -1 } })).status, 400);
  assert.equal((await request("/api/profile", { method: "PUT", cookie, body: { ...profile, userId: "other" } })).status, 400);
  assert.equal((await request("/api/profile", { method: "PUT", cookie, body: profile, foreignOrigin: true })).status, 403); pass("拒絕錯誤數值、使用者身分注入與跨站寫入");
  const second = await request("/api/auth/sign-up/email", { method: "POST", body: { email: "second-e2e@example.test", password, name: "另一位使用者" } });
  assert.equal(second.status, 200);
  const secondCookie = cookies(second);
  const secondProfile = await (await request("/api/profile?userId=" + user.id, { cookie: secondCookie })).json();
  assert.equal(secondProfile.profile, null); pass("第二位使用者無法查詢第一位的個人檔案");
  const now = new Date();
  await db.query('INSERT INTO food_entries (id,"userId","eatenAt",meal,name,calories,protein,carbs,fat,"updatedAt") VALUES ($1,$2,$3::timestamptz,$4,$5,650,42,70,22,$3::timestamptz)', ["test-meal", user.id, now, "午餐", "僅測試用餐點"]);
  await db.query('INSERT INTO body_weight_records (id,"userId","measuredAt","weightKg","updatedAt") VALUES ($1,$2,$3::timestamptz,78.5,$3::timestamptz)', ["test-weight", user.id, now]);
  await db.query('INSERT INTO inbody_records (id,"userId","measuredAt","weightKg","bodyFat","muscleKg","updatedAt") VALUES ($1,$2,$3::timestamptz,78.5,22,32,$3::timestamptz)', ["test-inbody", user.id, now]);
  await db.query('INSERT INTO workout_sessions (id,"userId","startedAt",name,minutes,completed,"updatedAt") VALUES ($1,$2,$3::timestamptz,$4,45,true,$3::timestamptz)', ["test-workout", user.id, now, "僅測試用訓練"]);
  const populated = await (await request("/api/dashboard", { cookie })).json();
  assert.equal(populated.intake.calories, 650); assert.equal(populated.intake.protein, 42);
  assert.equal(populated.latestWeight, 78.5); assert.equal(populated.trend.at(-1).average, 78.5);
  assert.equal(populated.inbody.bodyFat, 22); assert.equal(populated.inbody.muscleKg, 32);
  assert.equal(populated.workouts, 1); assert.equal(populated.workoutMinutes, 45);
  const otherDashboard = await (await request("/api/dashboard", { cookie: secondCookie })).json();
  assert.equal(otherDashboard.intake, null); assert.equal(otherDashboard.latestWeight, null); assert.equal(otherDashboard.workouts, 0);
  pass("真實紀錄正確彙整至 Dashboard，且不流入其他帳號");
  const html = await (await request("/", { cookie })).text();
  assert(html.includes("驗收使用者")); assert(html.includes("今日營養")); assert(!html.includes("you@example.com"));
  assert.equal((await request("/settings", { cookie })).status, 200);
  assert.equal((await request("/modules/food", { cookie })).status, 200); pass("保護頁面正確渲染使用者資料與模組開發狀態");
  const oldCookie = cookie;
  assert.equal((await request("/api/auth/sign-out", { method: "POST", cookie, body: {} })).status, 200);
  assert.equal((await request("/api/profile", { cookie: oldCookie })).status, 401);
  const signedIn = await request("/api/auth/sign-in/email", { method: "POST", body: { email, password } });
  assert.equal(signedIn.status, 200); cookie = cookies(signedIn);
  const persisted = await (await request("/api/profile", { cookie })).json();
  assert.equal(persisted.profile.nickname, "驗收使用者"); pass("登出使舊 Session 失效，重新登入仍能讀回設定");
  const rejectedDelete = await request("/api/auth/delete-user", { method: "POST", cookie, body: { password: "incorrect-password" } });
  assert(rejectedDelete.status >= 400); pass("刪除帳號需要正確密碼");
  const removed = await request("/api/auth/delete-user", { method: "POST", cookie, body: { password } });
  assert.equal(removed.status, 200);
  assert.equal((await request("/api/profile", { cookie })).status, 401);
  // 先讓仍可寫入的資料庫 socket 正常關閉，再停止 HTTP server。
  await stopSocket();
  await stopApp();
  const remaining = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM user_profiles");
  assert.equal(remaining.rows[0].count, 0); pass("永久刪除帳號會清除個人設定與登入工作階段");
  for (const table of ["food_entries", "body_weight_records", "inbody_records", "workout_sessions"]) {
    const result = await db.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ${table}`);
    assert.equal(result.rows[0].count, 0);
  }
  console.log(`\n${checks} 項 HTTP 端對端驗證通過。測試資料僅存在記憶體中。`);
} catch (error) {
  console.error("HTTP 端對端驗證失敗：", error instanceof Error ? error.message : "未知錯誤");
  if (serviceError) console.error("測試服務有錯誤輸出；為避免洩漏資料，未直接列印。");
  process.exitCode = 1;
} finally {
  await stopSocket();
  await stopApp();
  await db.close();
  // HTTP keepalive 可能保留閒置 handle；測試服務、socket 與資料庫都已明確關閉。
  process.exit(process.exitCode ?? 0);
}
