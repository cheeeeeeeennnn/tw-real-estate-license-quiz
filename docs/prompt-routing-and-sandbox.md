# Prompt Routing And Sandbox

本文件規劃「講義章節複習」的非 API 版 Prompt Routing 與內容 Sandbox。此階段只做架構規劃，不串接外部 AI API。

## Prompt Routing Purpose

Prompt Routing 的用途是管理「不同講義整理任務應使用哪一種提示詞模板」。

目前階段：

- 不呼叫外部 AI API
- 不在 App 內自動生成內容
- 不執行使用者輸入的程式碼
- 只定義任務類型、輸入格式、輸出格式與模板用途
- 可供人工整理、日後匯入工具或未來 API 版本沿用

## Planned Task Types

### lectureSummary

用途：整理講義單元摘要。

Input：

```json
{
  "unitTitle": "單元標題",
  "chapterTitle": "章節標題",
  "sourceText": "講義原文或節錄",
  "sourceFile": "原始檔名",
  "groupName": "講義分類"
}
```

Output：

```json
{
  "summary": "單元摘要",
  "mainIdeas": ["主要觀念一", "主要觀念二"]
}
```

### keyConcepts

用途：整理核心觀念。

Input：

```json
{
  "unitTitle": "單元標題",
  "sourceText": "講義原文或節錄",
  "existingTags": ["可選既有標籤"]
}
```

Output：

```json
{
  "keyConcepts": [
    {
      "name": "核心觀念",
      "description": "簡短說明",
      "keywords": ["關鍵字"]
    }
  ]
}
```

### importantArticles

用途：整理講義單元涉及的重要法條。

Input：

```json
{
  "unitTitle": "單元標題",
  "sourceText": "講義原文或節錄",
  "lawCandidates": [
    {
      "lawName": "法規名稱",
      "articleNo": "條號",
      "content": "條文內容"
    }
  ]
}
```

Output：

```json
{
  "importantArticles": [
    {
      "lawName": "法規名稱",
      "articleNo": "條號",
      "reason": "此條與本單元的關聯"
    }
  ]
}
```

### examFocus

用途：整理常考重點。

Input：

```json
{
  "unitTitle": "單元標題",
  "sourceText": "講義原文或節錄",
  "relatedQuestions": [
    {
      "id": "題目 ID",
      "year": 110,
      "question": "題目文字",
      "topic": "主題"
    }
  ]
}
```

Output：

```json
{
  "examFocus": ["常考重點一", "常考重點二"],
  "questionPatterns": ["常見出題方式"]
}
```

### commonConfusions

用途：整理易混淆觀念。

Input：

```json
{
  "unitTitle": "單元標題",
  "sourceText": "講義原文或節錄",
  "keyConcepts": ["核心觀念"],
  "relatedWrongTopics": ["錯題常見 topic"]
}
```

Output：

```json
{
  "commonConfusions": [
    {
      "confusion": "易混淆點",
      "clarification": "辨別方式",
      "reviewHint": "複習提醒"
    }
  ]
}
```

### reviewQuestions

用途：建立講義單元小測驗。

Input：

```json
{
  "unitTitle": "單元標題",
  "summary": "單元摘要",
  "keyConcepts": ["核心觀念"],
  "importantArticles": [
    {
      "lawName": "法規名稱",
      "articleNo": "條號"
    }
  ]
}
```

Output：

```json
{
  "reviewQuestions": [
    {
      "type": "shortAnswer",
      "question": "小測驗題目",
      "answer": "參考答案",
      "explanation": "解析"
    }
  ]
}
```

### relatedQuestionLinking

用途：建立講義單元與歷屆試題的連結。

Input：

```json
{
  "unitTitle": "單元標題",
  "tags": ["講義標籤"],
  "importantArticles": [
    {
      "lawName": "法規名稱",
      "articleNo": "條號"
    }
  ],
  "questionCandidates": [
    {
      "id": "題目 ID",
      "subject": "科目",
      "topic": "主題",
      "question": "題目文字",
      "explanation": "解析"
    }
  ]
}
```

Output：

```json
{
  "relatedQuestionIds": ["civil-108-choice-001"],
  "linkReasons": [
    {
      "questionId": "civil-108-choice-001",
      "reason": "關聯原因"
    }
  ]
}
```

## Prompt Route Shape

未來可建立純設定檔，例如：

```js
export const PROMPT_ROUTES = {
  lectureSummary: {
    label: '講義單元摘要',
    inputSchema: 'lectureSummaryInput',
    outputSchema: 'lectureSummaryOutput',
    templateId: 'lecture-summary-v1',
  },
};
```

本階段這只是模板路由，不接 API，不自動送出資料。

## Sandbox Purpose

Sandbox 用來在正式寫入 `studyUnits` 前檢查講義整理結果。

用途：

- 測試 Google Drive 講義整理結果
- 預覽講義單元資料
- 檢查缺漏欄位
- 檢查分類是否符合講義資料夾與原本編排
- 檢查 JSON 格式是否可被 App 讀取
- 避免直接污染正式 `studyUnits` 資料

## Sandbox Data Shape

Sandbox 可使用暫存資料，例如 `src/data/study-units-sandbox.json`，或日後由匯入工具輸出到暫存檔。

建議每筆資料包含：

```json
{
  "id": "sandbox-land-tax-lecture-001",
  "groupName": "土地法與土地稅法講義",
  "sourceFolder": "Google Drive 資料夾",
  "sourceFile": "原始講義檔名",
  "unitTitle": "單元標題",
  "status": "draft",
  "summary": "",
  "keyConcepts": [],
  "importantArticles": [],
  "examFocus": [],
  "commonConfusions": [],
  "reviewQuestions": [],
  "relatedQuestionIds": [],
  "missingFields": []
}
```

## Sandbox Should Not Do

Sandbox 不應做：

- 不呼叫外部 AI API
- 不執行使用者輸入的程式碼
- 不修改正式資料，除非使用者明確確認
- 不覆蓋 `src/data/questions.json`
- 不改現有法規資料格式
- 不改 Supabase、Netlify Functions 或登入流程
- 不自動把未校對內容發布到正式講義章節複習

## Future API Extension

如果未來要接 API，建議擴充位置：

- `src/utils/promptRoutes.js`：管理任務類型與模板
- `src/utils/studyUnitSandbox.js`：檢查與整理 Sandbox 資料
- `netlify/functions/lecture-task.js`：若需要 serverless 代理 AI API，可放在 Netlify Functions
- `scripts/`：若只做本機批次整理，可建立匯入與驗證腳本

本次不要實作 API，也不要新增外部 AI SDK。

## Suggested Development Order

1. 先建立 `studyUnits` 資料格式與 Sandbox 驗證規則。
2. 再建立學習模式選擇頁與講義章節複習頁面骨架。
3. 接著建立講義單元列表與單元內容頁。
4. 最後再做 Google Drive 講義匯入與人工校對流程。
