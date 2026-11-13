import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env.local") || existsSync(".env")) {
  console.log("已存在環境設定，保留原有內容。請參考 README。 ");
} else {
  writeFileSync(".env.local", `# 僅供本機開發；此檔不應提交\nDATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/fitness"\nDB_POOL_MAX="1"\nBETTER_AUTH_URL="http://localhost:3000"\nBETTER_AUTH_SECRET="${randomBytes(48).toString("base64url")}"\n`);
  console.log("已產生本機環境設定與隨機密鑰。請先執行 pnpm db:local，再於另一個終端執行 pnpm db:generate 與 pnpm dev。本機資料庫會自動套用 SQL Migration。");
}
