# Study Mode Context

本文件是「講義章節複習」功能的低 token 開發上下文。後續開發此功能時，優先閱讀本文件，不需要掃描完整 repo，也不要讀取完整 `questions.json` 或完整法規資料庫。

## Current App Context

- App：不動產經紀人證照複習 App
- Stack：React + Vite、Netlify、Supabase Auth、Netlify Functions、email allowlist、localStorage
- 登入閘門：`src/components/AuthGate.jsx`
- 路由入口：`src/App.jsx`
- Router：`src/main.jsx`
- 登入後首頁：`src/pages/HomePage.jsx`
- 科目練習主頁：`src/pages/SubjectPage.jsx`
- 題庫資料：正式版由 Netlify Functions 驗證登入後回傳
- 學習資料：存在瀏覽器 localStorage

## Existing Features

- 歷屆試題練習
- 選擇題練習
- 申論題練習
- 錯題本
- 我的申論答案
- 學習統計
- 題庫總覽
- 答題後相關法條
- 本題考點整理
- 白話解釋法條
- 類題推薦
- 錯誤觀念分析
- 弱點分析 Dashboard
- 法條關聯

## New Feature Goal

登入後新增「學習模式選擇頁」，讓使用者先選：

- 歷屆試題練習
- 講義章節複習

「歷屆試題練習」維持目前既有流程；「講義章節複習」是第二個主要入口，應避免改壞既有刷題流程。

## Lecture Classification Rules

講義章節複習不要用單一法規名稱硬切分類，例如不要只用：

- 土地法
- 平均地權條例
- 不動產經紀業管理條例
- 消費者保護法

應依 Google Drive 講義資料夾與講義原本編排分類：

1. 土地法與土地稅法講義
2. 民法講義及補充資料
3. 不動產估價講義
4. 不動產經紀相關法規：先標記為待確認講義來源
5. 其他單獨講義：先標記為待人工歸類

分類以「講義來源與章節編排」為主，法規名稱只是單元內的 metadata 或關聯資料。

## Planned Pages

建議新增頁面：

- 學習模式選擇頁：登入後選擇「歷屆試題練習」或「講義章節複習」
- 講義章節複習首頁：列出講義分類
- 講義科目單元列表頁：顯示某一講義分類底下的章節與單元
- 講義單元內容頁：顯示摘要、重點、重要法條、常考重點、易混淆觀念、小測驗、相關歷屆試題
- Sandbox 頁面或工具：預覽匯入或整理後的講義單元資料，不直接污染正式資料

可能路由方向：

- `/study-mode`
- `/past-exams`
- `/lecture-review`
- `/lecture-review/:lectureGroupSlug`
- `/lecture-review/:lectureGroupSlug/:unitId`
- `/sandbox/study-units`

實際命名可依既有路由風格調整。

## Planned Data Format

建議新增講義單元資料，例如 `src/data/study-units.json` 或日後拆成多檔。

資料格式草案：

```json
{
  "id": "land-tax-lecture-001",
  "groupSlug": "land-tax-lecture",
  "groupName": "土地法與土地稅法講義",
  "sourceFolder": "Google Drive 講義資料夾名稱",
  "sourceFile": "原始講義檔名",
  "unitTitle": "單元標題",
  "chapterTitle": "章節標題",
  "order": 1,
  "status": "draft",
  "summary": "講義單元摘要",
  "keyConcepts": ["核心觀念"],
  "importantArticles": [
    {
      "lawName": "法規名稱",
      "articleNo": "條號",
      "reason": "為什麼此單元重要"
    }
  ],
  "examFocus": ["常考重點"],
  "commonConfusions": ["易混淆觀念"],
  "reviewQuestions": [
    {
      "question": "單元小測驗題目",
      "answer": "答案",
      "explanation": "解析"
    }
  ],
  "relatedQuestionIds": ["civil-108-choice-001"],
  "tags": ["土地移轉", "登記"],
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

狀態建議：

- `draft`：Sandbox 或待校對
- `reviewed`：已人工確認
- `published`：可在正式講義章節複習顯示

## Planned localStorage Keys

既有 key 不要改：

- `brokerExam.choiceRecords`
- `brokerExam.wrongBook`
- `brokerExam.essayAnswers`
- `reb-auth-session`

講義章節複習使用單一 key：

- `studyUnitRecords`：各單元閱讀狀態、收藏狀態、熟悉度、最後複習時間與複習次數

格式草案：

```json
{
  "land-tax-unit-01": {
    "unitId": "land-tax-unit-01",
    "lectureSubject": "土地法與土地稅法講義",
    "isRead": true,
    "isBookmarked": false,
    "familiarityLevel": 3,
    "lastReviewedAt": "2026-05-11T00:00:00.000Z",
    "reviewCount": 1
  }
}
```

## Files Most Likely To Change

新增講義章節複習時，優先修改或新增：

- `src/pages/HomePage.jsx`
- `src/App.jsx`
- `src/pages/StudyModePage.jsx`
- `src/pages/LectureReviewHomePage.jsx`
- `src/pages/LectureUnitListPage.jsx`
- `src/pages/LectureUnitPage.jsx`
- `src/pages/StudyUnitSandboxPage.jsx`
- `src/utils/studyUnits.js`
- `src/constants/app.js`
- `src/styles.css`
- `src/data/study-units.json`

可參考但避免大改：

- `src/pages/LawLibraryPage.jsx`
- `src/utils/laws.js`
- `src/pages/QuestionBankPage.jsx`
- `src/pages/SubjectPage.jsx`

## Do Not Break

新增此功能時不可破壞：

- Supabase Auth：`src/context/AuthContext.jsx`、`src/lib/supabaseClient.js`
- 登入閘門：`src/components/AuthGate.jsx`
- Netlify Functions 題庫 API：`netlify/functions/questions.js`
- Netlify Functions 權限檢查：`netlify/functions/_shared/auth.js`
- 題庫資料載入：`src/context/QuestionDataContext.jsx`
- localStorage 作答紀錄：`brokerExam.choiceRecords`
- 錯題本：`brokerExam.wrongBook`
- 申論答案：`brokerExam.essayAnswers`
- 學習統計與弱點分析
- 現有題庫格式
- 現有法規資料格式
- 相關法條、考點整理、白話解釋、類題推薦、錯誤觀念分析、法條關聯

## Development Notes

- 本階段先做資料結構與頁面骨架，再做 Google Drive 講義匯入。
- 講義內容應先進 Sandbox 預覽與檢查，再人工確認是否寫入正式 `studyUnits`。
- Prompt Routing 本階段只管理提示詞模板，不串接外部 AI API。
- 不要為此功能重構整個 App。
