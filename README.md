# AI Fitness Coach｜智慧健身管理

Phase 1 已完成可執行的基礎系統：Email／密碼註冊登入、伺服器端 Session、個人資料與自訂目標持久儲存、讀取真實資料的 Dashboard、深淺色模式及響應式介面。所有操作介面使用台灣繁體中文。

**目前沒有預設帳號、示範健康資料或 AI 回覆。** 飲食、體重、InBody、訓練的新增／修改／刪除介面屬於 Phase 2；目前導覽會顯示明確的開發狀態。PWA 離線、照片辨識與 AI 服務尚未啟用。

## 需求與環境

- Node.js 22.12+（本次驗證使用 24.22.1）與 pnpm 11.25。
- 正式部署使用 PostgreSQL 16+；本機可選 PGlite 開發模式，免安裝 PostgreSQL／Docker。
- Next.js 16.4.6、React 19、TypeScript、Tailwind CSS 4、shadcn/ui 風格基礎元件、Recharts、Prisma 7.10.1、Better Auth 1.7.22、Zod 4。實際依賴版本由 `pnpm-lock.yaml` 鎖定。

## 本機快速啟動（不需外部憑證）

**這台電腦最簡單的方式：雙擊專案根目錄的 `啟動健身教練.cmd`。** 它會在同一個視窗啟動資料庫與網站，等兩者就緒才顯示網址。看到「啟動完成」後開啟 [http://localhost:3000](http://localhost:3000)，並保持啟動視窗開啟。

啟動檔會優先使用這台電腦已配置的 Node.js，其路徑提示保存在不提交版本控制的 `.local/node-path.txt`；也會嘗試 PATH、標準 Node.js 安裝位置及可存取的隨附 runtime。重複啟動時會檢查既有服務，不會重複開啟同一份資料庫，也不會自動終止其他程式。可在有 Node.js 的終端執行 `node scripts/start-local.mjs` 或 `pnpm dev:local`。

停止使用時在啟動視窗按 `Ctrl + C`；資料會保留。關閉服務後網址就無法連線，下次使用請重新啟動。`/api/health` 僅回報網站與資料庫是否就緒，不回傳帳號、身體數據或連線設定。

以下為手動安裝與分開啟動方式：

在本專案目錄執行：

```powershell
pnpm install --frozen-lockfile
pnpm setup:local
pnpm db:generate
pnpm db:local
```

保留資料庫終端執行；在**另一個終端**執行：

```powershell
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000)，選「免費建立帳號」，接著完成個人設定並儲存。請持續使用 `localhost`，勿混用 `127.0.0.1`，避免登入 Cookie 與可信來源不一致。

`setup:local` 只在沒有 `.env`／`.env.local` 時產生環境設定及 48 位元組隨機登入密鑰，不覆寫既有設定、不輸出密鑰。`.env.local` 和 `data/` 已排除版本控制。本機帳號與健康資料持久儲存在 `data/postgres-v18/`，重啟後仍保留。

`db:local` 僅監聽 `127.0.0.1:5433`，啟動時以交易套用 `prisma/migrations/` 的 SQL 並儲存校驗碼；重啟不重複套用，已套用的 Migration 被修改時會停止。**此模式沒有資料庫密碼驗證，只適合自己的開發電腦。** 連線池設為 `DB_POOL_MAX=1`，避免把單一連線的 PGlite 當成正式多連線 PostgreSQL。PGlite 的 Migration 標記獨立於 Prisma，請勿對此開發資料目錄執行 `db:dev`／`db:migrate`。

如果此環境沒有 `pnpm` 在 PATH，可使用已安裝的 Node.js 套件管理器，或先在自己的終端安裝 pnpm。這次桌面環境使用附帶的 pnpm 執行檔完成安裝。

這份交付目錄已安裝依賴並產生本機環境設定。在目前桌面環境也可直接執行以下指令，省去 pnpm 的 PATH 設定：

```powershell
# 終端一：啟動資料庫
node scripts/local-db.mjs
# 終端二：啟動網站
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1
```

## 使用標準 PostgreSQL

1. 複製 `.env.example` 為 `.env.local`，填入自己的 `DATABASE_URL`。
2. 設定 `BETTER_AUTH_URL=http://localhost:3000`，產生至少 32 字元的高熵密鑰：

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

將結果填到 `.env.local` 的 `BETTER_AUTH_SECRET`，不要提交或分享。正式服務使用 HTTPS 網址及獨立密鑰；勿把秘密變數加上 `NEXT_PUBLIC_` 前綴。

若使用 Docker Desktop，可先設定環境變數並啟動 PostgreSQL：

```powershell
$env:POSTGRES_PASSWORD = '請替換成自己的強密碼'
docker compose up -d
```

Compose 只綁定本機 `5432`，帳號與資料庫皆為 `fitness`。請把對應連線資訊填入 `.env.local`。接著執行：

```powershell
pnpm db:generate
pnpm db:migrate
pnpm dev
```

`db:migrate` = `prisma migrate deploy`，套用已提交的 Migration；`db:dev` 僅供開發者在標準 PostgreSQL 產生新 Migration。不要在已存有其他專案資料的資料庫上執行。

## 測試與正式建置

```powershell
pnpm db:generate
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm start
```

- `pnpm test`：公式、特殊健康情況、輸入驗證、台北時區、有效日平均，以及在隔離 PostgreSQL 引擎中驗證 SQL Migration、外鍵、唯一鍵、資料持久讀寫及刪除關聯。
- `pnpm test:e2e`：需先 build；啟動隔離的記憶體資料庫（5545）與正式 HTTP server（3101），驗證註冊、登入、空狀態、設定儲存、資料隔離、CSRF、登出失效及帳號刪除。測試不使用 `.env.local` 的資料庫或真實帳號。
- 瀏覽器人工驗證涵蓋登入／設定／Dashboard、主選單、深淺色與窄螢幕版面。驗證記錄見 [docs/VALIDATION.md](docs/VALIDATION.md)。

Prisma CLI 與 Next.js 都讀取 `.env.local`；`.env` 作為備援。環境設定不足時顯示設定指南，資料庫離線時顯示重試介面，不回傳資料庫連線字串。

## 功能與階段

| 階段 | 狀態 | 範圍 |
| --- | --- | --- |
| Phase 1 | 已實作 | 登入、個人設定、基礎模型、Dashboard、估算與手動覆寫、資料隔離、帳號刪除 |
| Phase 2 | 尚未實作 | 飲食／體重／InBody／訓練紀錄 CRUD、歷史查詢、常用食物及 CSV |
| Phase 3 | 尚未實作 | 飲食與訓練計畫、週／月統計、目標比較、計畫版本管理 |
| Phase 4 | 尚未實作 | OpenAI 伺服器整合、規則判斷、AI 報告、建議接受／拒絕與版本生效 |
| Phase 5 | 尚未實作 | 照片／PDF 辨識、食譜、通知、CSV 匯入、PWA 離線 |

需求情境 A–D 目前僅有底層讀取模型與計算邏輯，**尚無可輸入紀錄的操作流程**；E–G 的 AI 報告與調整流程也尚未實作。勿將本版本視為所有階段均已完成。

## 數據與計算原則

- BMR 使用需求指定的 Mifflin-St Jeor，UI 明確標示估算。必要資料不足不猜測；未成年及特殊健康情況停用一般成人估算。
- 初始活動係數為 1.2／1.375／1.55／1.725／1.9。減脂 −250、增肌 +150 kcal，其他目標維持 TDEE；保護下限為估算 BMR 與系統輸入下限。此為可修改的產品起始設定，不是經個人醫療評估的處方，也不代表低於此值就必然不安全或高於此值就必然安全。
- 蛋白質初始 1.6 g/kg、脂肪約總熱量 30%，剩餘熱量分配給碳水。採 4／4／9 kcal/g；碳水取 1 位小數，誤差小於 1 kcal。衝突目標會提示且不顯示負碳水。
- 手動熱量／蛋白質優先，清空欄位可回到初始估算。每日體重不會自動改寫個人檔案與目標；後續趨勢校正屬 Phase 4。
- 沒有餐點時總攝取為 `null`，不等於零。完整日獨立儲存於 `nutrition_days`。目前不宣稱缺漏日的飲食達成率。
- 同日多次體重先取平均，再計算 7 個日曆日內有效日平均；圖表同時呈現有效日數，缺漏日不補零。
- 時區固定 Asia/Taipei，週一為一週起點，量測時間以 PostgreSQL `timestamptz` 保存。

公式參考：[Mifflin 等人原始研究](https://pubmed.ncbi.nlm.nih.gov/2305711/)。蛋白質起始參數參考 [ISSN 運動與蛋白質立場聲明](https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/) 中一般運動族群的範圍。活動係數、熱量差額及脂肪比例為本版可修改的產品假設，尚未依個人長期資料校正。

## 安全與資料處理

- Better Auth 管理密碼雜湊與持久化工作階段；HttpOnly／SameSite Cookie，HTTPS 部署自動使用 Secure Cookie。關閉 Cookie Session 快取，刪除／登出後立即重新驗證資料庫 Session。
- 登入／註冊啟用資料庫限流；健康資料 API 在每次查詢／更新由 Session 取得 `userId`，不接受客戶端指定擁有者。
- Zod 嚴格驗證、32 KiB 寫入串流限制、同源檢查與一般安全標頭。未設定廣泛的跨來源許可。
- 不在應用程式日誌列印個人身體數據或環境秘密；資料庫查詢詳細日誌停用。
- 設定頁可輸入目前密碼、勾選不可復原確認後刪除帳號。資料庫外鍵級聯刪除所有目前實作的健康與帳號資料。資料庫備份的保留與清除需由正式營運者另行設計。
- 目前沒有 OpenAI 呼叫，不會把健康資料傳送給 AI。`OPENAI_API_KEY` 僅預留伺服器變數；Phase 4 需要明確同意與資料最小化後才啟用。
- Email 寄送、信箱驗證、密碼重設、MFA、備份還原、正式監控與正式多節點負載驗證尚未配置。公開上線前應補齊相應營運流程；本次沒有部署至雲端或建立對外服務。

架構、完整資料模型規劃與後續工作見 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。
