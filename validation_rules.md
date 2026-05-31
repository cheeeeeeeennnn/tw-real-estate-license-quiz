# Validation Rules

本文件整理題庫修改後應遵守的驗證規則。實際自動驗證以 `scripts/validateQuestions.js` 與 `package.json` scripts 為準。

## 必要驗證

- JSON 格式必須合法。
- `src/data/questions.json` 必須是單一陣列。
- 每題 `id` 不可重複。
- 每題必須有 `year`、`exam`、`subject`、`type`、`number`、`topic`、`question`、`source`。
- `type` 必須是 `choice` 或 `essay`。
- 選擇題必須有 `options`、`answer`、`explanation`。
- 選擇題 `options` 必須包含 `A`、`B`、`C`、`D`。
- 選擇題 `answer` 必須是 `A`、`B`、`C` 或 `D`，且應存在於 `options` 中。
- 申論題必須有 `referenceAnswer`、`keywords`。
- `keywords` 應為陣列。
- 題目 `question` 不可為空。
- 選項內容不可為空。
- `lawRefs` 若存在，必須是法條 id 字串陣列。
- `lawRefs` 參照的法條 id 必須存在於 `src/data/laws.json`。

## 年度、科目與題號

- `year` 使用民國年度數字，例如 `110`。
- `year` 必須落在目前支援範圍，或明確新增支援年度。
- 目前題庫範圍約為民國 `103` 至 `114` 年。
- `subject` 必須符合既有科目分類：
  - `民法概要`
  - `土地法與土地相關稅法概要`
  - `不動產估價概要`
  - `不動產經紀相關法規概要`
- 同一年、同科目、同題型的 `number` 不應重複衝突。
- 若發現題號衝突，先標記待確認，不可直接猜測改號。

## 修改後必跑指令

目前 `package.json` 的實際驗證指令是：

```bash
npm run validate:questions
```

若修改年度科目拆檔，應執行：

```bash
npm run build:questions
```

建置正式 App：

```bash
npm run build
```

也可以直接執行驗證腳本：

```bash
node scripts/validateQuestions.js
```

目前 `package.json` 沒有 `npm run validate`。若文件或指令提到 `npm run validate`，應改用 `npm run validate:questions`，除非未來新增該 script。

## 驗證失敗處理

- 驗證失敗不可部署。
- 不可用刪題或猜測資料的方式掩蓋錯誤。
- 若題庫數量變動，需確認首頁與題庫總覽顯示是否正確。
- 若題庫與 App 顯示題數不一致，應先標記為待修正，不可直接部署。

## 新增年度、科目或題型時

新增年度、科目或題型需同步確認：

- 題庫 JSON
- `scripts/buildQuestionBank.js`
- `scripts/validateQuestions.js`
- App 顯示邏輯
- 首頁統計數字
- 題庫總覽
- 篩選功能
- 練習流程

若新增新題型，不可只改資料，必須同步更新 App 讀取、顯示、驗證與統計邏輯。

## Netlify 與正式部署前檢查

部署前至少確認：

```bash
npm run build
npm run validate:questions
```

正式版仍需確認 Netlify Functions 能正確讀取題庫，並透過 Supabase token 與 `ALLOWED_USER_EMAILS` 保護 API。

## 與現有 validation script 的差異

`scripts/validateQuestions.js` 目前已檢查：

- `questions.json` 是陣列
- id 重複
- `year`、`subject`、`type` 是否存在
- `type` 是否為 `choice` 或 `essay`
- choice / essay 必填欄位
- 選擇題 `options.A/B/C/D`
- 選擇題 `answer` 是否為 A/B/C/D
- 申論題 `referenceAnswer`
- `lawRefs` 格式與法條 id 是否存在

本文件另列的 year 範圍、subject 分類、題號衝突與 keywords 型別，是建議補強或人工檢查項目；若要自動化，需同步更新 `scripts/validateQuestions.js`。
