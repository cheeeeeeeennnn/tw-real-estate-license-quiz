# Question Bank Schema

本文件整理「不動產經紀人證照複習 App」題庫資料格式。實際規則以現有題庫、`src/data/README.md` 與 `scripts/validateQuestions.js` 為準；不可為了符合文件而任意改動既有題庫格式，除非同步更新 validation script 與 App 讀取邏輯。

## 資料來源與位置

年度科目拆檔：

```text
src/data/question-bank/years/{year}/{subjectSlug}.json
```

App 彙整題庫：

```text
src/data/questions.json
```

`src/data/questions.json` 是由年度科目檔彙整產生的單一 JSON 陣列。正式版題庫由 Netlify Functions 驗證登入與 allowlist 後回傳。

## 共同欄位

| 欄位 | 必填 | 用途 |
| --- | --- | --- |
| `id` | 是 | 題目唯一識別碼，不可重複。 |
| `year` | 是 | 民國年度，使用數字，例如 `110`。 |
| `exam` | 是 | 考試名稱，例如 `不動產經紀人普考`。 |
| `subject` | 是 | 考試科目名稱。 |
| `type` | 是 | 題型，僅可為 `choice` 或 `essay`。 |
| `number` | 是 | 題號，使用數字。 |
| `topic` | 是 | 主題分類，用於篩選與統計。 |
| `question` | 是 | 題目文字。 |
| `source` | 是 | 題目來源，例如考選部年度與科目。 |
| `lawRefs` | 選填 | 對應法條 id 字串陣列，需存在於 `src/data/laws.json`。 |

## 選擇題欄位

選擇題 `type` 為 `choice`，額外必填：

| 欄位 | 必填 | 用途 |
| --- | --- | --- |
| `options` | 是 | 選項物件，必須包含 `A`、`B`、`C`、`D`。 |
| `answer` | 是 | 正確答案，必須是 `A`、`B`、`C` 或 `D`。 |
| `explanation` | 是 | 解析文字。若尚未有解析，仍應寫明依考選部答案或待補原因。 |

選項格式：

```json
"options": {
  "A": "選項 A",
  "B": "選項 B",
  "C": "選項 C",
  "D": "選項 D"
}
```

`answer` 必須存在於 `options` 中。目前 validation script 嚴格限制為 `A/B/C/D`。

## 申論題欄位

申論題 `type` 為 `essay`，額外必填：

| 欄位 | 必填 | 用途 |
| --- | --- | --- |
| `referenceAnswer` | 是 | 參考答案或作答方向。 |
| `keywords` | 是 | 關鍵字陣列，用於複習提示與整理。 |

`keywords` 應為字串陣列，例如：

```json
"keywords": ["比較法", "收益法", "成本法"]
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

## subjectSlug 與 subject 對應

| subjectSlug | subject |
| --- | --- |
| `civil` | `民法概要` |
| `land-tax` | `土地法與土地相關稅法概要` |
| `valuation` | `不動產估價概要` |
| `broker-law` | `不動產經紀相關法規概要` |

## choice / essay 差異

- `choice`：一題四選一，作答後會立即顯示正確 / 錯誤、正確答案、解析與相關學習輔助。
- `essay`：提供題目、參考答案、關鍵字，使用者可在 localStorage 儲存自己的答案與熟悉度。

## explanation 撰寫原則

- 應說明為何答案正確。
- 若與法條、估價方法、土地稅制度相關，應盡量指出核心依據。
- 若由 PDF 自動匯入且尚未校正，可先使用明確待補文字，但不得留空。

## referenceAnswer 與 keywords 用途

- `referenceAnswer` 用於申論練習時顯示參考答案。
- `keywords` 用於快速提示、複習與未來講義或考點整理。

## 年度題庫拆檔規則

年度題庫依年度與科目拆檔：

```text
src/data/question-bank/years/103/civil.json
src/data/question-bank/years/103/land-tax.json
src/data/question-bank/years/103/valuation.json
src/data/question-bank/years/103/broker-law.json
```

每個檔案必須是 JSON 陣列。修改拆檔後，需重新產生彙整題庫。

## build 與 validate

題庫新增或修改後執行：

```bash
npm run build:questions
npm run build
```

只驗證目前 `src/data/questions.json`：

```bash
npm run validate:questions
```

或直接執行：

```bash
node scripts/validateQuestions.js
```

目前 `package.json` 沒有 `npm run validate`，實際驗證 script 是 `validate:questions`。

## 已知差異與注意事項

- `validation_rules.md` 與 `scripts/validateQuestions.js` 是實際驗證依據。
- 目前 validation script 會驗證 `lawRefs` 是否為字串陣列，且每個 id 必須存在於 `src/data/laws.json`。
- 題庫範圍目前約為民國 103 至 114 年，約 1539 題；若新增年度或題數變動，需同步確認首頁統計與題庫總覽。
