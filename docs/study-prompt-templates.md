# Study Prompt Templates

本文件保存非 API 版 Prompt Routing 模板。用途是把 Google Drive 講義文字或 Markdown 整理成 `studyUnits.json` 可用資料。目前不串接外部 AI API。

## lectureSummary

使用時機：把講義段落整理成單元摘要。

輸入資料：

- 講義分類
- 單元標題
- 來源檔案
- 講義文字或 Markdown

輸出格式：

```json
{
  "summary": "",
  "learningGoals": []
}
```

提示詞範例：

```txt
請把以下不動產經紀人考試講義整理成一個講義單元摘要。

限制：
- 不要新增講義中沒有的結論。
- 摘要控制在 1 段。
- learningGoals 請列 2 到 3 點。
- 輸出 JSON，不要加額外說明。

輸入：
lectureSubject: {{lectureSubject}}
courseSubject: {{courseSubject}}
unitTitle: {{unitTitle}}
sourceFile: {{sourceFile}}
講義內容：
{{sourceText}}

輸出格式：
{
  "summary": "",
  "learningGoals": []
}
```

## keyConcepts

使用時機：整理單元中的核心觀念。

輸入資料：

- 單元標題
- 講義文字
- 已整理摘要

輸出格式：

```json
{
  "keyConcepts": []
}
```

提示詞範例：

```txt
請從以下講義單元整理核心觀念。

限制：
- keyConcepts 請列 3 到 5 個短詞。
- 優先使用講義原本用語。
- 不要補充講義沒有提到的制度。
- 輸出 JSON。

輸入：
unitTitle: {{unitTitle}}
summary: {{summary}}
講義內容：
{{sourceText}}

輸出格式：
{
  "keyConcepts": []
}
```

## importantArticles

使用時機：整理單元涉及的重要法條。

輸入資料：

- 講義文字
- 法條候選
- 單元標題

輸出格式：

```json
{
  "importantArticles": [
    {
      "lawName": "",
      "articleNo": "",
      "reason": ""
    }
  ]
}
```

提示詞範例：

```txt
請從以下講義單元整理重要法條。

限制：
- 只整理講義明確提到或高度相關的法條。
- 每筆包含 lawName、articleNo、reason。
- 最多 5 筆。
- 不要編造條號。
- 輸出 JSON。

輸入：
unitTitle: {{unitTitle}}
講義內容：
{{sourceText}}
法條候選：
{{lawCandidates}}

輸出格式：
{
  "importantArticles": [
    {
      "lawName": "",
      "articleNo": "",
      "reason": ""
    }
  ]
}
```

## examFocus

使用時機：整理常考重點。

輸入資料：

- 單元摘要
- 核心觀念
- 相關歷屆試題摘要

輸出格式：

```json
{
  "examFocus": []
}
```

提示詞範例：

```txt
請依不動產經紀人考試方向，整理以下講義單元的常考重點。

限制：
- examFocus 請列 2 到 4 點。
- 用考生複習看得懂的短句。
- 不要加入外部資料。
- 輸出 JSON。

輸入：
unitTitle: {{unitTitle}}
summary: {{summary}}
keyConcepts: {{keyConcepts}}
relatedQuestions: {{relatedQuestions}}

輸出格式：
{
  "examFocus": []
}
```

## commonConfusions

使用時機：整理易混淆觀念。

輸入資料：

- 核心觀念
- 講義文字
- 歷屆題常見錯點

輸出格式：

```json
{
  "commonConfusions": [
    {
      "confusion": "",
      "clarification": ""
    }
  ]
}
```

提示詞範例：

```txt
請整理以下講義單元的易混淆觀念。

限制：
- 每組包含 confusion 與 clarification。
- 最多 3 組。
- clarification 要能幫考生快速分辨。
- 不要使用講義外的資料。
- 輸出 JSON。

輸入：
unitTitle: {{unitTitle}}
keyConcepts: {{keyConcepts}}
講義內容：
{{sourceText}}
常見錯點：
{{wrongPatterns}}

輸出格式：
{
  "commonConfusions": [
    {
      "confusion": "",
      "clarification": ""
    }
  ]
}
```

## reviewQuestions

使用時機：為單元建立簡單複習題。

輸入資料：

- 摘要
- 核心觀念
- 重要法條
- 常考重點

輸出格式：

```json
{
  "reviewQuestions": [
    {
      "question": "",
      "answer": "",
      "explanation": ""
    }
  ]
}
```

提示詞範例：

```txt
請依以下講義單元產生簡單複習題。

限制：
- 產生 2 到 3 題。
- 題型以簡答題為主。
- 答案必須能從提供資料推出。
- 不要編造講義沒有的法條或結論。
- 輸出 JSON。

輸入：
unitTitle: {{unitTitle}}
summary: {{summary}}
keyConcepts: {{keyConcepts}}
importantArticles: {{importantArticles}}
examFocus: {{examFocus}}

輸出格式：
{
  "reviewQuestions": [
    {
      "question": "",
      "answer": "",
      "explanation": ""
    }
  ]
}
```

## relatedQuestionLinking

使用時機：把講義單元與歷屆試題連結。

輸入資料：

- 講義單元標籤
- 核心觀念
- 重要法條
- 候選歷屆試題

輸出格式：

```json
{
  "relatedQuestionIds": [],
  "linkReasons": [
    {
      "questionId": "",
      "reason": ""
    }
  ]
}
```

提示詞範例：

```txt
請把以下講義單元與歷屆試題做關聯。

限制：
- 只從候選題目中選擇。
- 最多 8 題。
- 每題要有簡短 reason。
- 不要新增不存在的 questionId。
- 輸出 JSON。

輸入：
unitTitle: {{unitTitle}}
routingTags: {{routingTags}}
keyConcepts: {{keyConcepts}}
importantArticles: {{importantArticles}}
候選題目：
{{questionCandidates}}

輸出格式：
{
  "relatedQuestionIds": [],
  "linkReasons": [
    {
      "questionId": "",
      "reason": ""
    }
  ]
}
```

## 使用建議

每次整理一個單元，不要一次丟整份大型講義。先生成 `draft`，人工校對後再放入正式 `studyUnits.json`。
