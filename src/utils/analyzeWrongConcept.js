import { KEYWORD_GROUPS } from './lawKeywords.js';

const FALLBACK_CONFUSION = '建議回到相關法條與解析確認本題觀念';
const MAX_REVIEW_FOCUS = 3;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, '');
}

function optionLabel(question, key) {
  const optionText = question?.options?.[key];
  return optionText ? `${key}：${optionText}` : key || '';
}

function lawLabel(law) {
  if (!law) return '';
  const name = law.codeName || law.lawName;
  const article = law.article || law.articleNo;
  return name && article ? `${name}第${article}條` : name || '';
}

function pushUnique(list, value) {
  if (!value || list.includes(value)) return;
  list.push(value);
}

export function extractMatchedKeywordsFromLaws(relatedLaws = []) {
  const keywords = [];

  relatedLaws.forEach((law) => {
    const reasonText = [law.matchReason, ...(law.matchReasons || [])].filter(Boolean).join('；');
    [...reasonText.matchAll(/命中題目關鍵字：「([^」]+)」/g)].forEach((match) => pushUnique(keywords, match[1]));
    [...reasonText.matchAll(/命中法條關鍵字「([^」]+)」/g)].forEach((match) => pushUnique(keywords, match[1]));
    [...reasonText.matchAll(/命中同義詞：「([^」]+)」→「([^」]+)」/g)].forEach((match) => {
      pushUnique(keywords, match[1]);
      pushUnique(keywords, match[2]);
    });
  });

  return keywords.slice(0, 6);
}

function collectGroupHits(text) {
  const compact = normalizeText(text);
  const hits = [];

  KEYWORD_GROUPS.forEach((group) => {
    const matchedTerms = [];

    group.keywords.forEach((keyword) => {
      if (compact.includes(normalizeText(keyword))) pushUnique(matchedTerms, keyword);
    });

    Object.entries(group.synonyms || {}).forEach(([keyword, synonyms]) => {
      synonyms.forEach((synonym) => {
        if (!compact.includes(normalizeText(synonym))) return;
        pushUnique(matchedTerms, `${synonym}→${keyword}`);
      });
    });

    if (matchedTerms.length) hits.push({ groupName: group.groupName, matchedTerms });
  });

  return hits;
}

function firstGroupLabel(hits) {
  const first = hits[0];
  if (!first) return '';
  return `${first.groupName}（${first.matchedTerms.slice(0, 2).join('、')}）`;
}

export function analyzeWrongConcept(currentQuestion, selectedAnswer, relatedLaws = [], matchedKeywords = []) {
  if (!currentQuestion || !selectedAnswer || selectedAnswer === currentQuestion.answer) return null;

  const correctOption = optionLabel(currentQuestion, currentQuestion.answer);
  const selectedOption = optionLabel(currentQuestion, selectedAnswer);
  const keywords = matchedKeywords.length ? matchedKeywords : extractMatchedKeywordsFromLaws(relatedLaws);
  const selectedHits = collectGroupHits(currentQuestion.options?.[selectedAnswer]);
  const correctHits = collectGroupHits([
    currentQuestion.topic,
    currentQuestion.options?.[currentQuestion.answer],
    currentQuestion.explanation,
    keywords.join(' '),
  ].join(' '));
  const primaryLaw = relatedLaws[0];
  const reviewFocus = [];

  if (!selectedOption || !correctOption) {
    return {
      title: '錯誤觀念提醒',
      possibleConfusion: FALLBACK_CONFUSION,
      reviewFocus: [FALLBACK_CONFUSION],
    };
  }

  let possibleConfusion = '';
  const selectedLabel = firstGroupLabel(selectedHits);
  const correctLabel = firstGroupLabel(correctHits);

  if (selectedLabel && correctLabel && selectedLabel !== correctLabel) {
    possibleConfusion = `你選了「${selectedOption}」，可能把「${selectedLabel}」和本題正確考點「${correctLabel}」混在一起。`;
  } else if (selectedLabel) {
    possibleConfusion = `你選了「${selectedOption}」，可能只看到「${selectedLabel}」的表面關鍵字，沒有回到題目問法判斷。`;
  } else if (keywords.length) {
    possibleConfusion = `你選了「${selectedOption}」，本題應回到「${keywords.slice(0, 2).join('、')}」判斷，而不是只看選項字面。`;
  } else {
    possibleConfusion = FALLBACK_CONFUSION;
  }

  pushUnique(reviewFocus, `比較你選的「${selectedOption}」與正確答案「${correctOption}」差在哪裡。`);
  if (currentQuestion.topic) pushUnique(reviewFocus, `回到 topic「${currentQuestion.topic}」確認題目真正要考的概念。`);
  if (primaryLaw) pushUnique(reviewFocus, `優先重讀「${lawLabel(primaryLaw)}」與本題解析。`);
  if (keywords.length) pushUnique(reviewFocus, `特別注意關鍵字：「${keywords.slice(0, 3).join('、')}」。`);

  return {
    title: '錯誤觀念提醒',
    possibleConfusion,
    reviewFocus: reviewFocus.length ? reviewFocus.slice(0, MAX_REVIEW_FOCUS) : [FALLBACK_CONFUSION],
  };
}

export { FALLBACK_CONFUSION };
