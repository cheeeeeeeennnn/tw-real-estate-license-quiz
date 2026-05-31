import { KEYWORD_GROUPS } from './lawKeywords.js';

const FALLBACK_POINT = '本題考點尚待補充';
const MAX_POINTS = 3;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, '');
}

function compactQuestionText(question) {
  return normalizeText([
    question?.subject,
    question?.topic,
    question?.question,
    question?.options?.[question?.answer],
    question?.explanation,
    ...Object.values(question?.options || {}),
  ].join(' '));
}

function truncateText(text, limit = 70) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
}

function pushUnique(list, value) {
  if (!value || list.includes(value)) return;
  list.push(value);
}

function lawLabel(law) {
  if (!law) return '';
  return `${law.codeName}第${law.article}條`;
}

function collectReasonTerms(relatedLaws) {
  const keywords = [];
  const synonyms = [];

  relatedLaws.forEach((law) => {
    const reasons = law.matchReasons?.length ? law.matchReasons : [law.matchReason || ''];
    reasons.forEach((reason) => {
      [...reason.matchAll(/命中題目關鍵字：「([^」]+)」/g)].forEach((match) => pushUnique(keywords, match[1]));
      [...reason.matchAll(/命中法條關鍵字「([^」]+)」/g)].forEach((match) => pushUnique(keywords, match[1]));
      [...reason.matchAll(/命中同義詞：「([^」]+)」→「([^」]+)」/g)].forEach((match) => {
        pushUnique(synonyms, `${match[1]}→${match[2]}`);
        pushUnique(keywords, match[2]);
      });
    });
  });

  return { keywords, synonyms };
}

function collectKeywordGroupTerms(question, relatedLaws) {
  const text = compactQuestionText(question);
  const relatedCodes = new Set(relatedLaws.map((law) => law.code));
  const keywords = [];
  const synonyms = [];

  KEYWORD_GROUPS.forEach((group) => {
    const groupRelated = group.lawHints?.some((code) => relatedCodes.has(code));
    const subjectRelated = group.subjectHints?.includes(question?.subject);
    const topicRelated = group.topicHints?.some((topic) => normalizeText(question?.topic).includes(normalizeText(topic)));
    if (!groupRelated && !subjectRelated && !topicRelated) return;

    group.keywords.forEach((keyword) => {
      if (text.includes(normalizeText(keyword))) pushUnique(keywords, keyword);
    });

    Object.entries(group.synonyms || {}).forEach(([keyword, synonymList]) => {
      synonymList.forEach((synonym) => {
        if (!text.includes(normalizeText(synonym))) return;
        pushUnique(synonyms, `${synonym}→${keyword}`);
        pushUnique(keywords, keyword);
      });
    });
  });

  return { keywords, synonyms };
}

function collectLawKeywords(question, relatedLaws) {
  const text = compactQuestionText(question);
  const keywords = [];

  relatedLaws.forEach((law) => {
    (law.keywords || []).forEach((keyword) => {
      if (normalizeText(keyword).length >= 2 && text.includes(normalizeText(keyword))) {
        pushUnique(keywords, keyword);
      }
    });
  });

  return keywords;
}

function uniqueLawNames(relatedLaws) {
  return [...new Set(relatedLaws.map((law) => law.codeName).filter(Boolean))];
}

export function generateQuestionInsight(question, relatedLaws = []) {
  if (!question) {
    return { title: '本題考點', points: [FALLBACK_POINT] };
  }

  const points = [];
  const reasonTerms = collectReasonTerms(relatedLaws);
  const groupTerms = collectKeywordGroupTerms(question, relatedLaws);
  const lawKeywords = collectLawKeywords(question, relatedLaws);
  const keywords = [...new Set([...reasonTerms.keywords, ...groupTerms.keywords, ...lawKeywords])].slice(0, 4);
  const synonyms = [...new Set([...reasonTerms.synonyms, ...groupTerms.synonyms])];
  const primaryLaw = relatedLaws[0];
  const correctOption = question.options?.[question.answer];
  const laws = uniqueLawNames(relatedLaws);

  if (keywords.length && primaryLaw) {
    points.push(`核心概念是「${keywords.slice(0, 3).join('、')}」，可先對照「${lawLabel(primaryLaw)}」。`);
  } else if (keywords.length) {
    points.push(`核心概念是「${keywords.slice(0, 3).join('、')}」。`);
  } else if (primaryLaw) {
    points.push(`本題可先對照「${lawLabel(primaryLaw)}」判斷。`);
  }

  if (correctOption && question.explanation) {
    points.push(`正確選項「${question.answer}：${truncateText(correctOption, 28)}」的判斷重點：${truncateText(question.explanation)}`);
  } else if (question.explanation) {
    points.push(`判斷重點：${truncateText(question.explanation)}`);
  }

  if (synonyms.length) {
    const [synonym, keyword] = synonyms[0].split('→');
    points.push(`看到「${synonym}」時，要回推到「${keyword}」這個考點。`);
  } else if (relatedLaws[1]) {
    points.push(`可一併比較「${lawLabel(relatedLaws[1])}」，確認主要法規與相近規範的差異。`);
  }

  const insight = {
    title: '本題考點',
    points: points.length ? points.slice(0, MAX_POINTS) : [FALLBACK_POINT],
  };

  if (synonyms.length) {
    const [synonym, keyword] = synonyms[0].split('→');
    insight.warning = `常見混淆提醒：題目可能用「${synonym}」包裝「${keyword}」，不要只看字面。`;
  } else if (laws.length >= 2) {
    insight.warning = `常見混淆提醒：本題可能同時牽涉「${laws.slice(0, 2).join('」與「')}」，作答時先判斷主要法規。`;
  }

  return insight;
}
