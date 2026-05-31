# 不動產經紀人證照複習 App

React + Vite 製作的手機優先刷題 App。正式分享版使用 Supabase Auth 登入，並透過 Netlify Functions 驗證登入者與允許名單後才回傳題庫；選擇題作答紀錄、錯題本與申論答案會存在瀏覽器 `localStorage`。

## 專案結構

```text
.
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── netlify/
│   └── functions/
├── scripts/
│   └── validateQuestions.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── styles.css
    ├── components/
    ├── constants/
    ├── data/
    │   ├── README.md
    │   ├── questions.json
    │   ├── laws.json
    │   ├── law-sources.json
    │   ├── drive-law-sources.json
    │   └── question-bank/
    │       ├── manifest.json
    │       └── years/
    ├── hooks/
    ├── pages/
    └── utils/
```

## 安裝與啟動

```bash
npm install
npm run dev
```

開發伺服器啟動後，依終端機顯示的網址開啟 App。

正式登入版需要 Supabase 環境變數；如果未設定，畫面會顯示「尚未設定登入」。若要在本機完整測試 Netlify Functions，請使用 Netlify CLI：

```bash
npm run dev:netlify
```

## 建置

```bash
npm run build
```

建置輸出資料夾是 `dist`。

## 限制存取設定

正式分享版使用「Netlify 靜態部署 + Netlify Functions + Supabase Auth」：

1. 建立 Supabase 專案，啟用 Email 登入，並在 Supabase Auth URL 設定中把 Site URL 設為正式 Netlify 網址。
2. 在 Netlify 建立網站，build command 使用 `npm run build`，publish directory 使用 `dist`。
3. 在 Netlify 環境變數設定：

```text
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role key
ALLOWED_USER_EMAILS=user1@example.com,user2@example.com
```

`SUPABASE_SERVICE_ROLE_KEY` 只放在 Netlify 環境變數，不能寫進前端程式碼或提交到公開 repo。

未登入者無法取得題庫 API；已登入但不在 `ALLOWED_USER_EMAILS` 的帳號會被拒絕。App 外殼仍是公開靜態頁面，但題庫資料會在授權通過後才載入。

## PWA 與 iPhone 安裝

本專案已包含：

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icon.svg`
- `public/icon-192.png`
- `public/icon-512.png`
- iPhone 主畫面需要的 meta 與 apple touch icon

iPhone 安裝方式：

1. 用 Safari 開啟正式 Netlify 網址。
2. 按分享按鈕。
3. 選擇「加入主畫面」。
4. 按「新增」。

離線使用說明：

- 第一次需要登入並載入題庫。
- Service worker 會快取 App 外殼與已成功載入的題庫資料。
- 若之後短暫離線，可開啟已快取內容；不同裝置仍需各自登入與載入一次。

## GitHub push 教學

本專案已可直接初始化 git 並提交。建立 GitHub repository 後，執行：

```bash
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPO.git
git branch -M main
git push -u origin main
```

如果你使用 SSH：

```bash
git remote add origin git@github.com:YOUR_ACCOUNT/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Netlify 部署教學

1. 到 Netlify 新增網站，選擇從 GitHub 匯入。
2. 選擇這個 repository。
3. Build command 設為 `npm run build`。
4. Publish directory 設為 `dist`。
5. 在 Netlify 環境變數加入限制存取設定中的四個變數。
6. Deploy 後，把 Netlify 網址填到 Supabase Auth Site URL。
7. 重新部署一次，確認登入連結會回到正式網址。

## 匯入題庫

把整理好的歷屆試題加入 `src/data/question-bank/years/{年度}/{科目}.json`。每個檔案都是 JSON 陣列，每一題都需要唯一 `id`，並用 `type` 區分：

```text
choice 選擇題
essay  申論題
```

詳細格式請看 `src/data/README.md`。

修改年度科目檔後產生 App 使用的題庫：

```bash
npm run build:questions
```

## 從歷屆 PDF 匯入

目前已建立匯入工具：

```bash
python3 scripts/importPastExams.py
```

匯入工具會掃描 `~/Downloads` 內 103 至 114 年的不動產經紀人歷屆試題 PDF，產生年度科目 JSON，合併成 `src/data/questions.json`，並輸出匯入報告：

```text
src/data/question-bank/raw/import-report.json
```

部分 PDF 的選項符號無法被文字抽取工具完整辨識，匯入器會盡量依題號與文字行切出選項；無法完整切出的題目會建立 `PDF解析待校正` 佔位題。App 首頁的「題庫總覽」會顯示待校正數量。

## 驗證題庫

```bash
node scripts/validateQuestions.js
```

驗證內容包含：

- id 是否重複
- 必填欄位是否缺漏
- 選擇題是否有 A/B/C/D
- 選擇題 answer 是否為 A/B/C/D
- 申論題是否有 referenceAnswer
- year、subject、type 是否存在

## 匯入法條

法條資料來源清單在：

```text
src/data/law-sources.json
```

在有網路的本機環境執行：

```bash
npm run import:laws
```

這會從全國法規資料庫匯入清單內法規的全部條文，重新產生：

```text
src/data/laws.json
```

目前清單已放入民法、土地法、土地登記規則、地籍測量實施規則、平均地權條例、土地稅法、遺產及贈與稅法、房屋稅條例、契稅條例、稅捐稽徵法、不動產估價技術規則、不動產經紀業管理條例與施行細則。

Google Drive 裡已找到的法規 PDF 來源整理在：

```text
src/data/drive-law-sources.json
```

這份清單用來保留講義/PDF 來源，方便之後人工校對 topic、重點與題目對應法條；正式 App 內的法條資料仍以 `laws.json` 為準。

## 題目對應法條

題目要顯示對應法條時，在題目物件加入：

```json
"lawRefs": ["civil-code-92"]
```

如果題目或解析文字本身有明確寫到「民法第 92 條」這類資訊，可以先跑自動建議：

```bash
npm run suggest:lawrefs
```

確認 `src/data/law-ref-suggestions.json` 後，再套用高信心建議：

```bash
npm run apply:lawrefs
```

## 使用 PDF 真題

考選部 PDF 可以作為整理題庫的來源，但 App 本身讀取的是 `questions.json`。建議先把 PDF 內容整理成 README 指定的 JSON 格式，再執行題庫驗證。
