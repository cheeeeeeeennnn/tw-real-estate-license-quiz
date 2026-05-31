# Study Unit Import Workflow

本文件說明如何把 Google Drive 講義整理成 `src/data/study/studyUnits.json` 可用的講義單元資料。目前不串接 Google Drive API，也不串接外部 AI API。

## 建議整理流程

1. 從 Google Drive 下載或複製講義內容。
2. 先整理成文字或 Markdown。
3. 依講義資料夾與講義原本編排切成單元。
4. 使用 `docs/study-prompt-templates.md` 的模板整理摘要、觀念、法條、常考重點與小測驗。
5. 先放入 Sandbox 或暫存 JSON 檢查欄位。
6. 人工確認後，再追加到 `src/data/study/studyUnits.json`。

不要把講義全文硬寫在 React 元件裡。React 頁面只讀取資料檔。

## 講義科目分類方式

分類依 Google Drive 講義資料夾與講義原本編排，不依單一法規名稱硬切。

建議分類：

1. 土地法與土地稅法講義
2. 民法講義及補充資料
3. 不動產估價講義
4. 不動產經紀相關法規：待確認
5. 其他單獨講義：待人工歸類

## 每個講義單元欄位

每個講義單元應整理成下列欄位：

- `id`：單元唯一 ID，例如 `land-tax-unit-05`
- `lectureSubject`：Google Drive 講義資料夾分類
- `courseSubject`：對應考試科目
- `sourceFolder`：Google Drive 來源資料夾名稱
- `sourceFiles`：來源檔名陣列
- `unitNo`：單元順序
- `unitTitle`：單元標題
- `unitGroup`：單元大類
- `learningGoals`：學習目標
- `keyConcepts`：核心觀念
- `importantArticles`：重要法條
- `examFocus`：常考重點
- `commonConfusions`：易混淆觀念
- `summary`：短摘要
- `relatedQuestionIds`：相關歷屆試題 ID
- `reviewQuestions`：單元小測驗
- `sourceRefs`：來源描述，例如檔名、頁碼、段落
- `routingTags`：Prompt Routing 與分類標籤
- `draftStatus`：`sample`、`draft`、`reviewed`、`published`

## Markdown 範例格式

可先把每個講義單元整理成以下 Markdown，再轉成 JSON：

```md
# 土地法總則

- lectureSubject: 土地法與土地稅法講義
- courseSubject: 土地法與土地相關稅法概要
- sourceFolder: 土地法與土地稅法講義
- sourceFiles:
  - 土地法與土地相關稅法概要1.pdf
- unitNo: 1
- unitGroup: 土地法與土地稅法
- routingTags:
  - land-general
  - land-rights
- draftStatus: draft

## sourceRefs

- 土地法與土地相關稅法概要1.pdf，第 1-6 頁

## learningGoals

- 理解土地法的基本架構
- 分辨土地權利與土地使用限制

## keyConcepts

- 土地權利
- 土地利用
- 公共利益

## importantArticles

- lawName: 土地法
  articleNo: 第1條
  reason: 土地法基本定位

## examFocus

- 土地法基本概念
- 土地分類與權利限制

## commonConfusions

- confusion: 土地法總則與平均地權制度混淆
  clarification: 總則偏基本架構，平均地權偏政策工具。

## summary

本單元整理土地法的基本架構，作為地籍、土地使用與土地稅法的前置觀念。

## relatedQuestionIds

- land-tax-108-choice-001

## reviewQuestions

- question: 土地法總則主要建立哪些規範方向？
  answer: 土地權利、土地使用、土地行政與公共利益。
  explanation: 總則是後續章節的概念基礎。
```

## 手動新增到 studyUnits.json

1. 開啟 `src/data/study/studyUnits.json`。
2. 在陣列最後追加一筆同格式物件。
3. 確認 `id` 不重複。
4. 先把 `draftStatus` 設為 `draft`。
5. 校對來源與內容後，再改成 `reviewed` 或 `published`。

## Sandbox 檢查方式

目前 Sandbox 路由：

```txt
/study-sandbox
```

Sandbox 第一版會檢查範例講義單元資料是否缺少必要欄位，並預覽資料呈現方式。後續可擴充為檢查暫存 JSON 或貼上的單元資料。

目前必要欄位檢查工具：

```txt
src/utils/validateStudyUnit.js
```

## 注意事項

- 不要把講義全文放進 React 元件。
- 不要把未校對資料直接標記為 `published`。
- 不要為講義匯入改動 `questions.json`。
- 不要改 Supabase Auth、Netlify Functions 或題庫 API。
- 若來源是單獨 PDF，先放到「其他單獨講義」並標記為待人工歸類。
