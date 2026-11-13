# Phase 1 驗證紀錄

日期：2026-11-13（Asia/Taipei）。環境：Windows、Node.js 24.22.1、Next.js 16.4.6、Prisma 7.10.1、PGlite 0.5.16。

## 自動檢查

| 檢查 | 結果 | 實際範圍 |
| --- | --- | --- |
| Prisma Schema validate | 通過 | 模型、關聯、索引與產生設定 |
| TypeScript | 通過 | 嚴格型別與 Next.js 頁面／API 型別 |
| 正式 production build | 通過 | 全部 9 個路由，動態健康資料頁沒有靜態快取 |
| 單元與資料庫整合測試 | 35 項通過 | 營養、時區、缺漏、驗證、實際 SQL 與資料關聯 |
| HTTP E2E | 11 項通過 | 隔離記憶體資料庫與 production server 的完整請求流程 |
| `pnpm audit --prod` | 未發現已知漏洞 | 本次鎖定依賴的套件庫公告檢查，不代表完整安全稽核 |

HTTP E2E 驗證內容：

1. 未登入拒絕健康資料 API，受保護頁面導向登入。
2. 註冊取得 HttpOnly 工作階段 Cookie。
3. 新帳號是空資料，不顯示捏造的攝取量或目標。
4. 儲存個人資料與 2,200 kcal／150 g 手動目標，Dashboard 立即讀回。
5. 不合法數值、擁有者注入、跨來源寫入被拒絕。
6. 第二位使用者即使指定他人 ID，也讀不到他人資料。
7. 在隔離測試資料庫放入 650 kcal／42 g 蛋白質餐點、78.5 kg 體重、22% 體脂、32 kg 骨骼肌、45 分鐘訓練後，Dashboard 正確彙整；其他帳號仍為空。
8. 受保護頁面與明確標示尚未開發的模組可渲染。
9. 登出使原 Session 失效，重新登入後個人設定仍保存。
10. 錯誤密碼不能刪除帳號。
11. 正確密碼刪除帳號後，Session、個人檔案及健康紀錄均被刪除。

第 7 項以測試用 SQL 寫入隔離資料庫，驗證的是 Phase 1 Dashboard 讀取能力，**不代表 Phase 2 的紀錄輸入介面或 API 已完成**。所有自動測試帳號與健康紀錄僅存在隔離測試記憶體，不會填入開發資料庫。

## 實際瀏覽器操作

使用本機介面驗證帳號 `visual-qa@example.test`。資料是明確的測試輸入，不屬於使用者的真實健康資訊；驗證結束已清除帳號與個人設定。

- 註冊 → 個人設定 → 儲存成功訊息 → Dashboard 讀回體重與手動目標 → 登出。
- 桌面 1440 × 1050 與手機 390 × 844。
- 手機無橫向溢位，底部導覽可見。
- 手機主選單可開啟，Escape 可關閉；收合側欄從可存取樹移除。
- 淺色與深色可正常切換；最終恢復淺色。
- 沒有餐點、體重歷史與 InBody 時，呈現空狀態與紀錄不足提示。
- 本機 PGlite 啟動會自動套用 SQL Migration，沒有寫入預設健康資料。
- 最終重啟再次確認：`users = 0`、`user_profiles = 0`、本機 Migration 筆數 `1`，沒有重複套用或殘留介面測試資料。

畫面紀錄：

- [桌面總覽](screenshots/dashboard-desktop.jpg)
- [手機總覽](screenshots/dashboard-mobile.jpg)
- [深色總覽](screenshots/dashboard-dark.jpg)
- [桌面登入](screenshots/login-desktop.jpg)

## 驗證限制

### 本機連線與啟動修正

後續發現先前結束驗證時關閉了網站與資料庫，因此 `localhost:3000` 會拒絕連線。已加入根目錄 `啟動健身教練.cmd` 與 `scripts/start-local.mjs`，整合 Node.js 尋找、啟動互斥、資料庫／網站啟動與就緒檢查。Windows 啟動檔使用 CRLF 換行並由 `.gitattributes` 保留。

本次確認：

- 直接執行 Windows 一鍵啟動檔可同時啟動資料庫與網站。
- 重複啟動會重用已就緒服務，不新增另一個網站或資料庫程序。
- `http://localhost:3000/api/health` 回報 `ready`；登入頁 HTTP 200。
- 在實際瀏覽器開啟登入頁成功；舊的連線錯誤分頁另保留，已開啟正常的登入分頁。
- 啟動程式語法與 TypeScript 檢查通過；本次保持本機服務執行，供使用者直接操作。

修復畫面：[已恢復的登入頁](screenshots/localhost-restored.jpg)。

### 既有範圍限制

- 本次執行 SQL Migration 與資料庫測試使用 PostgreSQL WASM 引擎 PGlite；沒有可連線的標準 PostgreSQL 或 Docker 服務，因此尚未在標準 PostgreSQL 上實際執行 `prisma migrate deploy`。正式連線啟動步驟與 Compose 已提供。
- Windows 瀏覽器驗證不能取代實機 Android／iPhone Safari 的最終相容性檢查。
- 未進行正式壓力測試、資安滲透測試、Email 送信測試、備份還原或雲端部署。
- Phase 2–5 尚未實作，不宣稱飲食／訓練 CRUD、AI 分析、建議審核或離線功能已驗收。
