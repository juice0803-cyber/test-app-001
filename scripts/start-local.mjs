import { existsSync } from "node:fs";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// 使用啟動器自己的 Node 執行所有子程序，不依賴 npm／pnpm 的 PATH。
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const url = "http://localhost:3000";
const children = [];
let stopping = false;
let ownsLock = false;
let childFailed = false;
const lockPath = new URL("../.local/start.lock", import.meta.url);
const alive = child => child.exitCode === null && child.signalCode === null;

async function health() {
  try {
    const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    return response.ok && data.service === "ai-fitness-coach" && data.status === "ready";
  } catch { return false; }
}
function listening(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const done = result => { socket.destroy(); resolve(result); };
    socket.setTimeout(1000);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}
async function acquireLock() {
  await mkdir(".local", { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const file = await open(lockPath, "wx");
      ownsLock = true;
      await file.writeFile(String(process.pid));
      await file.close();
      return true;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const pid = Number((await readFile(lockPath, "utf8")).trim());
      if (!Number.isInteger(pid) || pid <= 0) throw new Error("啟動鎖定檔格式不正確，請檢查 .local/start.lock。");
      try { process.kill(pid, 0); return false; }
      catch (probeError) {
        if (probeError.code !== "ESRCH") throw new Error("無法確認另一個啟動程序的狀態，請勿重複啟動。");
        await unlink(lockPath);
      }
    }
  }
  throw new Error("另一個程序正在啟動應用程式，請稍候。");
}
function launch(name, args, ipc = false) {
  const child = spawn(process.execPath, args, { cwd: root, windowsHide: true, stdio: ipc ? ["ignore", "inherit", "inherit", "ipc"] : ["ignore", "inherit", "inherit"] });
  children.push({ child, name, ipc });
  child.on("error", () => { childFailed = true; if (!stopping) void stop(1, `${name}無法啟動。`); });
  child.on("exit", () => { if (!stopping) { childFailed = true; void stop(1, `${name}已停止，相關本機服務會一併關閉。`); } });
  return child;
}
async function waitForDb(child) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("資料庫啟動逾時，請查看上方錯誤訊息。")), 30000);
    const ready = message => { if (message?.type === "ready") { clearTimeout(timer); child.off("message", ready); resolve(); } };
    child.on("message", ready);
    child.once("exit", () => { clearTimeout(timer); reject(new Error("資料庫未成功啟動。")); });
    child.once("error", () => { clearTimeout(timer); reject(new Error("資料庫程序無法執行。")); });
  });
}
async function closeChild({ child, ipc }) {
  if (!alive(child)) return;
  const exited = new Promise(resolve => child.once("exit", resolve));
  if (ipc && child.connected) child.send({ type: "shutdown" });
  else if (process.platform === "win32") {
    // 僅終止此啟動器建立的網站子程序及其 worker，不碰其他 Node 程序。
    const kill = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    kill.on("error", () => child.kill());
  } else child.kill("SIGTERM");
  const timeout = setTimeout(() => { if (alive(child)) child.kill(); }, 10000);
  try { await exited; } finally { clearTimeout(timeout); }
}
async function stop(code = 0, message) {
  if (stopping) return;
  stopping = true;
  if (message) console.error(message);
  for (const entry of [...children].reverse()) await closeChild(entry);
  if (ownsLock) await unlink(lockPath).catch(() => {});
  console.log("本機服務已停止，已儲存的資料仍保留。");
  process.exit(code);
}
process.on("SIGINT", () => { void stop(); });
process.on("SIGTERM", () => { void stop(); });
// 供自動化驗證進行正常收尾；一般雙擊啟動不會建立此 IPC 通道。
process.on("message", message => { if (message?.type === "shutdown") void stop(); });

async function main() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error("請使用 Node.js 22.12 以上版本。");
  if (!existsSync("node_modules/next/dist/bin/next")) throw new Error("尚未安裝套件，請依 README 執行 pnpm install。");
  if (!existsSync("src/generated/prisma/client.ts")) throw new Error("尚未產生資料庫用戶端，請執行 pnpm db:generate。");
  if (await health()) { console.log(`應用程式已在執行，請開啟 ${url}`); return; }
  if (!(await acquireLock())) {
    console.log("另一個視窗正在啟動，等待服務就緒…");
    for (let i = 0; i < 60; i++) { if (await health()) { console.log(`請開啟 ${url}`); return; } await delay(500); }
    throw new Error("另一個啟動視窗尚未就緒，請查看該視窗的錯誤訊息。");
  }
  if (await listening(3000)) throw new Error("3000 連接埠已被其他服務占用。請先關閉占用它的程式，再重新啟動；本啟動器不會自動終止其他程式。");
  if (!existsSync(".env.local") && !existsSync(".env")) await import("./setup-local.mjs");
  const { config } = await import("dotenv");
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
  const database = new URL(process.env.DATABASE_URL ?? "");
  if (!["127.0.0.1", "localhost"].includes(database.hostname) || database.port !== "5433") throw new Error("此一鍵啟動器使用本機 5433 資料庫。你已設定其他資料庫，請依 README 使用 pnpm dev。");
  if (process.env.BETTER_AUTH_URL !== url) throw new Error(`請將 .env.local 的 BETTER_AUTH_URL 設為 ${url}。`);
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) throw new Error("登入密鑰尚未設定，請依 README 完成環境設定。");
  process.env.DB_POOL_MAX = "1";
  if (await listening(5433)) {
    const { Client } = await import("pg");
    const probe = new Client({ connectionString: database.toString(), connectionTimeoutMillis: 3000 });
    try {
      await probe.connect();
      await probe.query("SELECT name FROM _fitness_local_migrations LIMIT 1");
      console.log("使用已在執行的本機開發資料庫。");
    } catch { throw new Error("5433 連接埠不是可用的專案資料庫，請檢查原本的資料庫視窗。"); }
    finally { await probe.end(); }
  } else {
    console.log("正在啟動本機資料庫…");
    await waitForDb(launch("資料庫", ["scripts/local-db.mjs"], true));
  }
  console.log("正在啟動網站，首次載入可能需要數秒…");
  launch("網站", ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3000"]);
  for (let i = 0; i < 90; i++) {
    if (childFailed) throw new Error("服務啟動失敗，請查看上方訊息。");
    if (await health()) {
      console.log(`\n啟動完成！請在瀏覽器開啟 ${url}\n請保持本視窗開啟；按 Ctrl + C 可停止服務。\n`);
      return;
    }
    await delay(500);
  }
  throw new Error("網站尚未就緒，請查看上方錯誤訊息。");
}
main().catch(error => { void stop(1, `啟動失敗：${error.message}`); });
