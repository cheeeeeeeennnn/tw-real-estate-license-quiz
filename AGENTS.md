# AGENTS.md

## 專案規則

- 本專案目標是建立「不動產經紀人證照複習 App」。
- 本專案主要路徑是 `<PROJECT_ROOT>`。
- 所有 App 程式碼、題庫資料、驗證腳本、部署設定與專案規則，優先從上述路徑讀取。
- 這是 React + Vite 手機優先 PWA，正式部署目標是 Netlify。
- 前端不直接 import `src/data/questions.json`；正式版題庫由 Netlify Functions 驗證登入後回傳。
- 作答紀錄、錯題本、申論答案與統計資料保存在瀏覽器 `localStorage`。
- 不要提交 `.env`、Supabase service role key 或任何私人金鑰。
- UI 以刷題 App 流程為主，保持按鈕大、題目卡清楚、手機易操作。
- 修改任何 App 相關文件或資料時，不要在上層資料夾建立重複規則文件。

## 技術架構

- React
- Vite
- Netlify
- Supabase Auth Magic Link / Email OTP 登入流程
- Netlify Functions
- email allowlist
- PWA
- localStorage
- JSON question bank

## 重要資料夾與檔案

- `scripts/validateQuestions.js`
- `scripts/buildQuestionBank.js`
- `scripts/importPastExams.py`
- `src/data/questions.json`
- `src/data/question-bank/years/{year}/{subjectSlug}.json`
- `README.md`
- `AGENTS.md`
- `src/data/README.md`
- `.env.example`
- `question_bank_schema.md`
- `validation_rules.md`

## JSON 格式規則

- `src/data/questions.json` 必須是單一 JSON 陣列。
- 修改題庫前必須先閱讀 `question_bank_schema.md`、`validation_rules.md` 與 `src/data/README.md`。
- 題庫資料不可隨意改格式；若必須更改格式，需同步更新 validation script 與 App 讀取邏輯。
- 題型用 `type` 區分：`choice` 或 `essay`。
- 選擇題必填：`id`、`year`、`exam`、`subject`、`type`、`number`、`topic`、`question`、`options`、`answer`、`explanation`、`source`。
- 申論題必填：`id`、`year`、`exam`、`subject`、`type`、`number`、`topic`、`question`、`referenceAnswer`、`keywords`、`source`。
- 選擇題 `options` 必須包含 `A`、`B`、`C`、`D`，`answer` 只能是其中之一。
- 題目可選填 `lawRefs`，格式為法條 id 字串陣列，例如 `["civil-code-3"]`。
- `lawRefs` 必須參照 `src/data/laws.json` 內存在的法條 id。

## 題庫命名規則

- 選擇題：`{subjectSlug}-{year}-choice-{三位題號}`
- 申論題：`{subjectSlug}-{year}-essay-{三位題號}`
- subjectSlug：
  - `civil`：民法概要
  - `land-tax`：土地法與土地相關稅法概要
  - `valuation`：不動產估價概要
  - `broker-law`：不動產經紀相關法規概要
- 範例：`valuation-110-choice-001`、`civil-103-essay-001`

## topic 分類規則

- topic 要使用短詞，方便篩選與統計，例如「意思表示」、「所有權」、「土地稅」、「比較法」。
- 同一概念使用同一名稱，不要混用近似詞。
- 自動匯入但尚未校正的題目可暫用 `PDF解析待校正`。

## 法條資料規則

- 法條資料放在 `src/data/laws.json`。
- 考試相關法規來源清單放在 `src/data/law-sources.json`。
- Google Drive 講義/PDF 來源清單放在 `src/data/drive-law-sources.json`，僅供校對與追溯來源，不是 App 直接載入資料。
- 法條 `id` 命名建議：`{lawSlug}-{article}`，例如 `civil-code-92`、`broker-law-24-1`。
- 法條文字與重點僅供考試複習，內容需保留 `sourceUrl`，並以全國法規資料庫最新公告為準。
- 新增題目對應法條時，只在題目加入 `lawRefs`，不要直接把法條全文塞進題目。

## Low-token development rules

- 除非使用者明確要求，不要掃描整個 repo。
- 除非必要，不要讀取完整 `src/data/questions.json` 或完整 `src/data/laws.json`。
- 修改相關法條功能時，優先閱讀：
  - `docs/law-matcher-context.md`
  - `src/utils/findRelatedLaws.js`
  - `src/utils/lawKeywords.js`
  - 答題結果顯示元件，例如 `src/components/LawReferenceCard.jsx` 與相關頁面。
- 每次修改前先列出預計修改檔案。
- 每次只做使用者指定的範圍。
- 不要破壞 Supabase Auth、Netlify Functions、`localStorage`、錯題本、學習統計、現有題庫格式。
- 不要重構整個專案。
- 不要改 `package.json`，除非使用者明確要求。
- 不要新增外部 AI API。
- 若 Codex 需要修改檔案，應優先在本專案路徑內搜尋既有實作，不要憑空建立重複架構。
- 若遇到題庫數量、年度範圍、科目分類不一致，應先回報並標記待確認，不可自行猜測。

## Auth, deployment, and security rules

- 不可硬編碼 Supabase key、service role key 或任何 private secret。
- 不可把 `.env` 內容提交到 GitHub。
- Netlify Functions 是保護題庫 API 的重要層，不可繞過。
- `SUPABASE_SERVICE_ROLE_KEY` 只應存在於 Netlify 環境變數或本機安全環境，不可放進前端程式碼。
- `ALLOWED_USER_EMAILS` 是正式分享版存取控制的一部分。
- PWA 設定需避免破壞現有 Netlify 部署、登入流程與快取行為。
- 手機版與桌面版都要測試，尤其是登入、題庫載入、作答流程與 PWA 安裝體驗。
- localStorage 用於使用者學習紀錄；不要破壞既有 key 與資料結構。
- 任何大改前應先檢查 `README.md`、`src/data/README.md` 與 `scripts/` 內既有工具。

## build/test 指令

```bash
npm install
npm run build
npm run validate:questions
```

題庫更新後：

```bash
npm run build:questions
```

若只要直接執行驗證腳本：

```bash
node scripts/validateQuestions.js
```

法條匯入：

```bash
npm run import:laws
```

法條對應建議：

```bash
npm run suggest:lawrefs
npm run apply:lawrefs
```
