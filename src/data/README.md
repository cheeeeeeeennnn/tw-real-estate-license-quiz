# 題庫資料說明

題庫資料庫放在 `src/data/question-bank/years/`，依年度與科目拆成多個 JSON 檔。App 實際讀取的是自動產生的 `src/data/questions.json`。

更新流程：

```bash
npm run build:questions
```

這個指令會把 `question-bank/years/` 底下的題目合併成 `questions.json`，並執行格式驗證。

## 新增選擇題

到對應年度與科目檔加入題目物件，例如：

```text
src/data/question-bank/years/114/civil.json
src/data/question-bank/years/114/land-tax.json
src/data/question-bank/years/114/valuation.json
src/data/question-bank/years/114/broker-law.json
```

每個檔案都是 JSON 陣列。選擇題格式如下：

```json
{
  "id": "valuation-110-choice-001",
  "year": 110,
  "exam": "不動產經紀人普考",
  "subject": "不動產估價概要",
  "type": "choice",
  "number": 1,
  "topic": "價格影響因素",
  "question": "題目文字",
  "options": {
    "A": "選項 A",
    "B": "選項 B",
    "C": "選項 C",
    "D": "選項 D"
  },
  "answer": "B",
  "explanation": "解析文字",
  "lawRefs": ["civil-code-3"],
  "source": "考選部民國110年不動產經紀人普考不動產估價概要"
}
```

選擇題一定要有 `A`、`B`、`C`、`D` 四個選項，`answer` 只能填 `A`、`B`、`C` 或 `D`。

`lawRefs` 是選填欄位，用來指定這題對應的法條。陣列內請填 `src/data/laws.json` 裡的法條 `id`。

## 新增申論題

```json
{
  "id": "valuation-110-essay-001",
  "year": 110,
  "exam": "不動產經紀人普考",
  "subject": "不動產估價概要",
  "type": "essay",
  "number": 1,
  "topic": "不動產估價方法",
  "question": "題目文字",
  "referenceAnswer": "參考答案文字",
  "keywords": ["比較法", "收益法", "成本法"],
  "lawRefs": ["valuation-rules-2"],
  "source": "考選部民國110年不動產經紀人普考不動產估價概要"
}
```

申論題一定要有 `referenceAnswer`，`keywords` 請使用字串陣列。

## 新增法條

法條資料放在：

```text
src/data/laws.json
```

每筆法條格式：

```json
{
  "id": "civil-code-3",
  "code": "civil-code",
  "codeName": "民法",
  "article": "3",
  "title": "文字、簽名與代簽名",
  "subjectSlugs": ["civil"],
  "topics": ["法律行為", "意思表示"],
  "keywords": ["文字", "簽名"],
  "text": ["法條或考試重點摘錄"],
  "sourceName": "全國法規資料庫",
  "sourceUrl": "https://law.moj.gov.tw/",
  "note": "考試複習用，請以全國法規資料庫最新公告為準。"
}
```

題目要顯示對應法條時，在題目物件加入：

```json
"lawRefs": ["civil-code-3"]
```

## 從全國法規資料庫匯入完整法條

法條來源清單放在：

```text
src/data/law-sources.json
```

更新來源清單後，在有網路的本機環境執行：

```bash
npm run import:laws
```

這個指令會嘗試從全國法規資料庫 Open API 匯入來源清單內各法規的全部條文，並輸出到：

```text
src/data/laws.json
```

匯入後再執行：

```bash
npm run build:questions
npm run build
```

注意：若全國法規資料庫 Open API 回傳格式調整，請先檢查 `scripts/importMojLaws.js` 的解析欄位。

## Google Drive 法規 PDF 來源

目前已把雲端「不動產經紀人證照檔案」裡找到的法規 PDF 來源整理在：

```text
src/data/drive-law-sources.json
```

這個檔案只記錄來源與用途，不會被 App 直接讀取。正式畫面顯示的法條仍來自：

```text
src/data/laws.json
```

建議流程是：

```bash
npm run import:laws
npm run suggest:lawrefs
npm run build:questions
npm run build
```

如果 `suggest:lawrefs` 產生 `src/data/law-ref-suggestions.json`，請先檢查建議內容；確認後才執行：

```bash
npm run apply:lawrefs
```

## id 命名規則

格式：

```text
{subjectSlug}-{year}-{type}-{三位題號}
```

範例：

```text
valuation-110-choice-001
valuation-110-essay-001
```

建議 subjectSlug：

```text
civil      民法概要
land-tax   土地法與土地相關稅法概要
valuation  不動產估價概要
broker-law 不動產經紀相關法規概要
```

## topic 分類建議

`topic` 用於篩選與統計。建議不要太細，讓同類題目可以歸在一起。例如：

```text
民法概要：意思表示、代理、物權、債編、繼承
土地法與土地相關稅法概要：土地登記、地價稅、土地增值稅、平均地權
不動產估價概要：價格影響因素、比較法、收益法、成本法
不動產經紀相關法規概要：不動產說明書、經紀業管理、廣告銷售、消費爭議
```

## 確認 JSON 格式正確

新增或修改題目後執行：

```bash
npm run build:questions
```

如果格式正確，會看到題庫驗證成功。若有錯誤，終端機會列出缺漏欄位、重複 id 或選項答案問題。

如果只想驗證目前已產生的 `questions.json`：

```bash
node scripts/validateQuestions.js
```

## PDF 匯入與待校正題

可使用 `scripts/importPastExams.py` 從本機 `~/Downloads` 的歷屆試題 PDF 建立題庫：

```bash
python3 scripts/importPastExams.py
```

匯入後若某題 PDF 文字無法完整解析，會建立 topic 為 `PDF解析待校正` 的佔位題。請依原始 PDF 補入：

- `question`
- `options.A`
- `options.B`
- `options.C`
- `options.D`

答案會先依考選部答案 PDF 寫入 `answer`。
