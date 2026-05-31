# Related Law Matcher Context

Purpose: low-token context for future work on the "本題相關法條" feature. Keep this file concise and update it when matcher flow changes.

## Law Database

Main file:

```text
src/data/laws.json
```

Format: single JSON array. Each law article is one object.

Sample shape:

```json
{
  "id": "land-act-1",
  "code": "land-act",
  "codeName": "土地法",
  "article": "1",
  "title": "土地法 第 1 條",
  "subjectSlugs": ["land-tax"],
  "topics": ["土地法"],
  "keywords": ["土地法", "第1條"],
  "text": ["本法所稱土地，謂水陸及天然富源。"],
  "sourceName": "全國法規資料庫",
  "sourceUrl": "https://law.moj.gov.tw/...",
  "note": "..."
}
```

Helper:

```text
src/utils/laws.js
```

Key functions: `getAllLaws()`, `getLawById(id)`, `getLawsByRefs(lawRefs)`.

Source list for re-import:

```text
src/data/law-sources.json
```

Run after source changes:

```bash
npm run import:laws
```

## Question Fields Used By Matcher

Question database remains unchanged. Matcher reads these existing fields:

```json
{
  "id": "civil-108-choice-003",
  "subject": "民法概要",
  "topic": "意思表示",
  "question": "題目文字",
  "options": {
    "A": "選項 A",
    "B": "選項 B",
    "C": "選項 C",
    "D": "選項 D"
  },
  "answer": "B",
  "explanation": "解析文字",
  "lawRefs": ["civil-code-92"]
}
```

`lawRefs` is optional. If present and valid, it receives very high priority. Do not change the question JSON schema for matcher work unless explicitly requested.

## Matcher Files

Main matcher:

```text
src/utils/findRelatedLaws.js
```

Keyword and weighting config:

```text
src/utils/lawKeywords.js
```

Current exported API:

```js
findRelatedLaws(question, lawDatabase, { limit: 5 })
```

Returns up to 5 law objects, each enriched with:

```js
{
  matchScore: 123.45,
  matchReason: "符合科目...；題目關鍵字命中...",
  matchReasons: ["...", "..."]
}
```

If scores are below threshold, returns `[]`.

## Display Flow

Choice practice page:

```text
src/pages/ChoicePracticePage.jsx
```

After user answers a choice question:

```js
findRelatedLaws(current, getAllLaws(), { limit: 5 })
```

Then passes results to:

```text
src/components/LawReferenceCard.jsx
```

Display component supports:

```jsx
<LawReferenceCard
  laws={relatedLaws}
  title="本題相關法條"
  emptyMessage="尚未找到明確相關法條"
/>
```

`LawReferenceCard` also supports older `lawRefs` mode for pages that already pass explicit refs.

Styles for law cards and match reason:

```text
src/styles.css
```

## Version 2 Completed

Current related law matcher v2 includes:

- Question keyword extraction from topic, question, options, correct answer text, and explanation.
- Stop-word filtering.
- N-gram keyword extraction.
- Real estate exam synonym/related-term expansion in `lawKeywords.js`.
- Subject-based law code weighting.
- Topic-based law code weighting.
- Higher weight for correct answer and explanation matches.
- Manual `lawRefs` high-priority boost.
- Score sorting.
- Low-score filtering.
- `matchReason` / `matchReasons` returned per result.
- UI displays match reason under each law item.
- Guard against showing wrong law code when question explicitly names another law.

Known data note: `law-sources.json` includes `land-expropriation-act`; run `npm run import:laws` so `laws.json` includes 土地徵收條例.

## Do Not Break

When changing this feature, do not break:

- Supabase Auth.
- Netlify Functions question API.
- `localStorage` choice records, wrong book, and essay answers.
- Wrong book behavior.
- Learning statistics.
- Existing question JSON format.
- Existing `lawRefs` support.
- `npm run build:questions`, `npm run build`, and `node scripts/validateQuestions.js`.

Recommended validation after matcher changes:

```bash
npm run build:questions
npm run build
node scripts/validateQuestions.js
```
