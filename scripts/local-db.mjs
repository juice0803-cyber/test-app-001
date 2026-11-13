import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
await mkdir("./data", { recursive: true });
const db = await PGlite.create("./data/postgres-v18");
// 開發用 PGlite 直接套用同一份 SQL；正式 PostgreSQL 使用 Prisma migrate deploy。
await db.exec('CREATE TABLE IF NOT EXISTS _fitness_local_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
for (const name of (await readdir("./prisma/migrations")).filter(n => /^\d/.test(n)).sort()) {
  const sql = await readFile(`./prisma/migrations/${name}/migration.sql`, "utf8");
  const normalized = sql.replace(/\r\n/g, "\n");
  const checksum = createHash("sha256").update(normalized).digest("hex");
  const windowsChecksum = createHash("sha256").update(normalized.replace(/\n/g, "\r\n")).digest("hex");
  const existing = await db.query("SELECT checksum FROM _fitness_local_migrations WHERE name = $1", [name]);
  if (existing.rows.length && ![checksum, windowsChecksum].includes(existing.rows[0].checksum)) throw new Error("已套用的 Migration 內容遭修改，請建立新的 Migration。");
  if (existing.rows.length) {
    await db.query("UPDATE _fitness_local_migrations SET checksum = $1 WHERE name = $2", [checksum, name]);
    continue;
  }
  await db.transaction(async tx => {
    await tx.exec(sql);
    await tx.query("INSERT INTO _fitness_local_migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
  });
  console.log(`已套用本機資料庫 Migration：${name}`);
}
const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 5433 });
await server.start();
process.send?.({ type: "ready" });
console.log("本機開發資料庫已啟動：127.0.0.1:5433；資料儲存在 data/postgres-v18。僅供開發，無密碼驗證，請勿暴露至網路。");
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("message", message => {
  if (message?.type === "shutdown") void stop();
});
