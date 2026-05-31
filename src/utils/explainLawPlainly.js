const FALLBACK_EXPLANATION = '本條法規重點請以條文原文為準';

const ACTION_PATTERNS = [
  { pattern: /不得/g, meaning: '重點是禁止事項' },
  { pattern: /應/g, meaning: '重點是應遵守的義務或程序' },
  { pattern: /得/g, meaning: '重點是法律允許採取的作法' },
  { pattern: /準用/g, meaning: '重點是引用其他規定一起適用' },
  { pattern: /處/g, meaning: '重點是違反規定時的處罰或法律效果' },
  { pattern: /免徵|不課徵/g, meaning: '重點是免稅或不課稅條件' },
  { pattern: /登記/g, meaning: '重點是登記程序或登記效果' },
  { pattern: /申報/g, meaning: '重點是申報義務與期限' },
  { pattern: /契約/g, meaning: '重點是契約內容、效力或當事人責任' },
];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getLawText(law) {
  if (Array.isArray(law?.text)) return normalizeText(law.text.join(' '));
  if (Array.isArray(law?.content)) return normalizeText(law.content.join(' '));
  return normalizeText(law?.content || law?.text || '');
}

function getLawName(law) {
  return law?.lawName || law?.codeName || '';
}

function getArticleNo(law) {
  return law?.articleNo || law?.article || '';
}

function getLawLabel(law) {
  const name = getLawName(law);
  const article = getArticleNo(law);
  if (!name || !article) return '';
  return `${name}第${article}條`;
}

function extractReasonTerms(law) {
  const reasonText = [law?.matchReason, ...(law?.matchReasons || [])].filter(Boolean).join('；');
  const terms = [];

  [...reasonText.matchAll(/命中題目關鍵字：「([^」]+)」/g)].forEach((match) => terms.push(match[1]));
  [...reasonText.matchAll(/命中法條關鍵字「([^」]+)」/g)].forEach((match) => terms.push(match[1]));
  [...reasonText.matchAll(/命中同義詞：「([^」]+)」→「([^」]+)」/g)].forEach((match) => terms.push(match[2]));

  return [...new Set(terms)].slice(0, 3);
}

function extractLawKeywords(law, lawText) {
  return (law?.keywords || [])
    .filter((keyword) => String(keyword).length >= 2 && lawText.includes(keyword))
    .slice(0, 3);
}

function detectAction(lawText) {
  return ACTION_PATTERNS.find(({ pattern }) => pattern.test(lawText))?.meaning || '';
}

function truncateText(text, limit = 64) {
  const normalized = normalizeText(text);
  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
}

export function explainLawPlainly(law) {
  const lawText = getLawText(law);
  const lawLabel = getLawLabel(law);
  if (!lawText || !lawLabel) return FALLBACK_EXPLANATION;

  const reasonTerms = extractReasonTerms(law);
  const lawKeywords = extractLawKeywords(law, lawText);
  const terms = [...new Set([...reasonTerms, ...lawKeywords])].slice(0, 3);
  const action = detectAction(lawText);

  if (!terms.length && !action) return FALLBACK_EXPLANATION;

  const sentences = [];
  if (terms.length) {
    sentences.push(`${lawLabel}可以先抓「${terms.join('、')}」這幾個關鍵字來讀。`);
  }

  if (action) {
    sentences.push(`${action}，作答時要回到條文原文確認要件。`);
  } else {
    sentences.push(`條文重點可從「${truncateText(lawText)}」這段原文判斷。`);
  }

  return sentences.slice(0, 2).join('');
}

export { FALLBACK_EXPLANATION };
