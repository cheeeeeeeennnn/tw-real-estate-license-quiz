import {
  GENERIC_TERMS,
  KEYWORD_GROUPS,
  KNOWN_LAW_NAMES,
  RELATED_TERMS,
  SUBJECT_LAW_WEIGHTS,
  TOPIC_LAW_WEIGHTS,
} from './lawKeywords.js';

const DEFAULT_LIMIT = 5;
const MIN_SCORE = 34;
const EXPECTED_CODE_NAMES = {
  'broker-law': '不動產經紀業管理條例',
  'broker-law-enforcement-rules': '不動產經紀業管理條例施行細則',
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[^\p{Script=Han}a-z0-9之第條-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value) {
  return normalizeText(value).replace(/\s/g, '');
}

function addWeightedTerm(termMap, term, weight, source, options = {}) {
  const normalized = compactText(term);
  if (normalized.length < 2) return;
  if (!options.allowGeneric && GENERIC_TERMS.has(normalized)) return;
  if (/^\d+$/.test(normalized)) return;

  const existing = termMap.get(normalized) || { weight: 0, sources: new Set() };
  existing.weight += weight;
  existing.sources.add(source);
  termMap.set(normalized, existing);
}

function addNgrams(termMap, text, weight, source) {
  const compact = compactText(text);
  const chunks = compact.match(/[\p{Script=Han}a-z0-9]{2,24}/gu) || [];

  chunks.forEach((chunk) => {
    if (GENERIC_TERMS.has(chunk)) return;
    if (chunk.length <= 10) addWeightedTerm(termMap, chunk, weight + Math.min(chunk.length, 6) / 2, source);

    const maxGram = Math.min(6, chunk.length);
    for (let size = 2; size <= maxGram; size += 1) {
      for (let index = 0; index <= chunk.length - size; index += 1) {
        addWeightedTerm(termMap, chunk.slice(index, index + size), weight + size / 3, source);
      }
    }
  });
}

function addRelatedTerms(termMap, text) {
  const compact = compactText(text);
  Object.entries(RELATED_TERMS).forEach(([baseTerm, relatedTerms]) => {
    if (!compact.includes(compactText(baseTerm))) return;
    addWeightedTerm(termMap, baseTerm, 8, '同義詞');
    relatedTerms.forEach((term) => addWeightedTerm(termMap, term, 5, `關聯詞：${baseTerm}`));
  });
}

function collectKeywordGroupMatches(text, question = {}) {
  const compact = compactText(text);
  const subject = question.subject || '';
  const topic = question.topic || '';
  const matches = [];

  KEYWORD_GROUPS.forEach((group) => {
    const matchedItems = [];

    group.keywords.forEach((keyword) => {
      if (compact.includes(compactText(keyword))) {
        matchedItems.push({ keyword, matchedTerm: keyword, type: 'keyword' });
      }
    });

    Object.entries(group.synonyms || {}).forEach(([keyword, synonyms]) => {
      synonyms.forEach((synonym) => {
        if (compact.includes(compactText(synonym))) {
          matchedItems.push({ keyword, matchedTerm: synonym, type: 'synonym' });
        }
      });
    });

    const subjectMatched = group.subjectHints?.includes(subject);
    const topicMatched = group.topicHints?.some((hint) => compactText(topic).includes(compactText(hint)) || compact.includes(compactText(hint)));

    if (matchedItems.length || subjectMatched || topicMatched) {
      matches.push({ ...group, matchedItems, subjectMatched, topicMatched });
    }
  });

  return matches;
}

function addKeywordGroupTerms(termMap, groupMatches) {
  groupMatches.forEach((group) => {
    group.matchedItems.forEach((item) => {
      addWeightedTerm(termMap, item.keyword, item.type === 'synonym' ? 7 : 8, `關鍵字群組：${group.groupName}`, { allowGeneric: true });
      if (item.type === 'synonym') {
        addWeightedTerm(termMap, item.matchedTerm, 5, `同義詞：${item.keyword}`, { allowGeneric: true });
      }
    });
  });
}

function makeTermVariants(term) {
  const compact = compactText(term);
  const variants = new Set([compact]);
  if (compact.includes('的')) variants.add(compact.replace(/的/g, '之'));
  if (compact.includes('之')) variants.add(compact.replace(/之/g, '的'));
  variants.add(compact.replace(/[的之]/g, ''));

  const possessiveMatch = compact.match(/^(.{1,8})[的之](.{2,12})$/);
  if (possessiveMatch) {
    variants.add(`${possessiveMatch[1]}及其${possessiveMatch[2]}`);
  }

  return [...variants].filter((variant) => variant.length >= 2);
}

function extractDefinitionTerms(text) {
  const source = String(text || '');
  const terms = [];
  const patterns = [
    /所稱(?:之)?[「『]?([^」』？?，,、；;]{2,16})[」』]?/g,
    /所謂[「『]?([^」』？?，,、；;]{2,16})[」』]?/g,
    /何謂[「『]?([^」』？?，,、；;]{2,16})[」』]?/g,
  ];

  patterns.forEach((pattern) => {
    [...source.matchAll(pattern)].forEach((match) => {
      terms.push(match[1]);
    });
  });

  return [...new Set(terms.flatMap(makeTermVariants))].slice(0, 8);
}

function getQuestionParts(question) {
  const correctOption = question.options?.[question.answer];
  const optionText = Object.entries(question.options || {})
    .map(([key, value]) => `${key} ${value}`)
    .join(' ');

  return {
    fullText: normalizeText([question.subject, question.topic, question.question, optionText, question.answer, correctOption, question.explanation].join(' ')),
    importantText: normalizeText([question.topic, question.question, correctOption, question.explanation].join(' ')),
    lawMentionText: normalizeText([question.topic, question.question, optionText, correctOption, question.explanation].join(' ')),
    correctOption,
    definitionTerms: extractDefinitionTerms([question.question, correctOption, question.explanation].join(' ')),
    mentionedLawNames: KNOWN_LAW_NAMES.filter((name) => compactText([question.question, correctOption, question.explanation].join(' ')).includes(compactText(name))),
    keywordGroups: collectKeywordGroupMatches([question.subject, question.topic, question.question, correctOption, question.explanation].join(' '), question),
  };
}

function extractQuestionTerms(question) {
  const termMap = new Map();
  const { correctOption, fullText } = getQuestionParts(question);

  addNgrams(termMap, question.topic, 3.5, 'topic');
  addNgrams(termMap, question.question, 2, '題幹');
  addNgrams(termMap, correctOption, 4, '正確答案');
  addNgrams(termMap, question.explanation, 3.2, '解析');
  Object.values(question.options || {}).forEach((option) => addNgrams(termMap, option, 0.6, '選項'));
  addRelatedTerms(termMap, fullText);
  addKeywordGroupTerms(termMap, getQuestionParts(question).keywordGroups);

  return [...termMap.entries()]
    .map(([term, value]) => ({ term, weight: value.weight, sources: [...value.sources] }))
    .sort((a, b) => b.weight - a.weight || b.term.length - a.term.length)
    .slice(0, 150);
}

function scoreKeywordGroups(law, question, questionParts, reasons) {
  let score = 0;
  const target = lawSearchText(law);

  questionParts.keywordGroups.forEach((group) => {
    if (!group.lawHints?.includes(law.code)) return;

    const lawMatchedItems = group.matchedItems.filter(
      (item) => target.includes(compactText(item.keyword)) || target.includes(compactText(item.matchedTerm)),
    );
    const keywordMatches = lawMatchedItems.filter((item) => item.type === 'keyword');
    const synonymMatches = lawMatchedItems.filter((item) => item.type === 'synonym');
    if (!keywordMatches.length && !synonymMatches.length) return;

    const keywordScore = keywordMatches.length * 24;
    const synonymScore = synonymMatches.length * 18;
    const subjectScore = group.subjectMatched ? 18 : 0;
    const topicScore = group.topicMatched ? 16 : 0;
    const groupScore = keywordScore + synonymScore + subjectScore + topicScore;

    if (groupScore <= 0) return;
    score += groupScore;

    keywordMatches.slice(0, 2).forEach((item) => {
      pushReason(reasons, `命中題目關鍵字：「${item.keyword}」`, 24);
    });
    synonymMatches.slice(0, 2).forEach((item) => {
      pushReason(reasons, `命中同義詞：「${item.matchedTerm}」→「${item.keyword}」`, 18);
    });
    if (group.subjectMatched) pushReason(reasons, `與科目「${question.subject}」相關`, subjectScore);
    pushReason(reasons, `與法規「${group.groupName}」相關`, Math.max(groupScore, 20));
  });

  return score;
}

function lawSearchText(law) {
  return compactText([
    law.codeName,
    law.article,
    law.title,
    ...(law.keywords || []),
    ...(law.topics || []),
    ...(law.text || []),
  ].join(' '));
}

function makeArticleRegex(article) {
  const normalized = String(article || '').replace(/-/g, '(?:之|-)');
  return new RegExp(`第\\s*${normalized}\\s*條`);
}

function getSubjectWeight(question, law) {
  return SUBJECT_LAW_WEIGHTS[question.subject]?.[law.code] || 1;
}

function getTopicWeight(question, law) {
  const haystack = compactText([question.topic, question.question, question.explanation].join(' '));
  return TOPIC_LAW_WEIGHTS.reduce((weight, rule) => {
    const topicMatched = rule.terms.some((term) => haystack.includes(compactText(term)));
    const lawMatched = rule.codes.includes(law.code);
    return topicMatched && lawMatched ? Math.max(weight, rule.weight) : weight;
  }, 1);
}

function pushReason(reasons, label, score) {
  if (!label || score <= 0) return;
  const existing = reasons.find((reason) => reason.label === label);
  if (existing) {
    existing.score += score;
  } else {
    reasons.push({ label, score });
  }
}

function reasonPriority(label) {
  if (label.startsWith('題庫已人工標記')) return 0;
  if (label.startsWith('題目提到第') || label.startsWith('題目提到「')) return 1;
  if (label.startsWith('題目是定義型問法')) return 2;
  if (label.startsWith('命中題目關鍵字')) return 3;
  if (label.startsWith('命中同義詞')) return 4;
  if (label.startsWith('命中法條關鍵字')) return 5;
  if (label.startsWith('符合科目')) return 6;
  if (label.startsWith('符合 topic')) return 7;
  if (label.startsWith('與法規')) return 8;
  if (label.startsWith('與科目')) return 9;
  return 9;
}

function selectReasons(reasons) {
  const sortedReasons = reasons.sort((a, b) => reasonPriority(a.label) - reasonPriority(b.label) || b.score - a.score);
  const selectedReasons = sortedReasons.slice(0, 5);
  const weightReason = sortedReasons.find(
    (reason) => reason.label.startsWith('符合科目') || reason.label.startsWith('符合 topic'),
  );

  if (weightReason && !selectedReasons.some((reason) => reason.label === weightReason.label)) {
    selectedReasons.splice(Math.max(selectedReasons.length - 1, 0), 1, weightReason);
  }

  return selectedReasons.map((reason) => reason.label);
}

function scoreKeywordMatches(law, terms, questionParts, reasons) {
  const target = lawSearchText(law);
  let score = 0;
  const topMatchedTerms = [];

  (law.keywords || []).forEach((keyword) => {
    const normalizedKeyword = compactText(keyword);
    if (normalizedKeyword === compactText(law.codeName)) return;
    if (/^第\d+(?:之|-)?\d*條$/.test(normalizedKeyword)) return;
    if (GENERIC_TERMS.has(normalizedKeyword)) return;
    if (normalizedKeyword.length >= 2 && compactText(questionParts.importantText).includes(normalizedKeyword)) {
      const keywordScore = 16 + Math.min(normalizedKeyword.length, 8);
      score += keywordScore;
      pushReason(reasons, `命中法條關鍵字「${keyword}」`, keywordScore);
    }
  });

  terms.forEach(({ term, weight, sources }) => {
    if (!target.includes(term)) return;
    const sourceBoost = sources.includes('解析') || sources.includes('正確答案') ? 1.4 : 1;
    const termScore = weight * sourceBoost;
    score += termScore;
    if (topMatchedTerms.length < 5 && term.length >= 2) {
      topMatchedTerms.push(term);
    }
  });

  if (topMatchedTerms.length) {
    pushReason(reasons, `題目關鍵字命中：${[...new Set(topMatchedTerms)].slice(0, 4).join('、')}`, Math.min(score, 60));
  }

  return score;
}

function scoreDefinitionMatches(law, questionParts, reasons) {
  if (!questionParts.definitionTerms.length) return 0;

  const target = lawSearchText(law);
  const matchedTerm = questionParts.definitionTerms.find((term) => target.includes(term));
  if (!matchedTerm) return 0;

  const hasDefinitionWording = /稱.{0,18}者|謂.{0,18}|本法所稱|所稱/.test((law.text || []).join(' '));
  const definitionScore = hasDefinitionWording ? 180 : 90;
  pushReason(reasons, `題目是定義型問法，命中「${matchedTerm}」`, definitionScore);
  return definitionScore;
}

function scoreLaw(question, law, terms, questionParts) {
  let score = 0;
  const reasons = [];
  const fullText = questionParts.fullText;
  const explicitlyMentionsOtherLaw =
    questionParts.mentionedLawNames.length > 0 && !questionParts.mentionedLawNames.includes(law.codeName);
  const isManuallyTagged = question.lawRefs?.includes(law.id);

  if (explicitlyMentionsOtherLaw && !isManuallyTagged) {
    return { score: 0, reasons: [] };
  }

  if (isManuallyTagged) {
    score += 10000;
    pushReason(reasons, '題庫已人工標記此法條', 10000);
  }

  if (questionParts.lawMentionText.includes(normalizeText(law.codeName))) {
    score += 12;
    pushReason(reasons, `題目提到「${law.codeName}」`, 12);
  }

  if (makeArticleRegex(law.article).test(questionParts.lawMentionText)) {
    if (explicitlyMentionsOtherLaw) {
      return { score: 0, reasons: [] };
    }
    const articleScore = fullText.includes(normalizeText(law.codeName)) ? 900 : 80;
    score += articleScore;
    pushReason(reasons, `題目提到第 ${law.article} 條`, articleScore);
  }

  score += scoreKeywordMatches(law, terms, questionParts, reasons);
  score += scoreKeywordGroups(law, question, questionParts, reasons);
  score += scoreDefinitionMatches(law, questionParts, reasons);

  if (score <= 0) {
    return { score: 0, reasons: [] };
  }

  const subjectWeight = getSubjectWeight(question, law);
  const topicWeight = getTopicWeight(question, law);
  const weightedScore = score * subjectWeight * topicWeight;

  if (subjectWeight > 1) pushReason(reasons, `符合科目「${question.subject}」常用法規`, weightedScore - score);
  if (topicWeight > 1) pushReason(reasons, `符合 topic「${question.topic}」關聯法規`, weightedScore - score * subjectWeight);

  return {
    score: weightedScore,
    reasons: selectReasons(reasons),
  };
}

function isLawRecordConsistent(law) {
  const expectedName = EXPECTED_CODE_NAMES[law.code];
  return !expectedName || law.codeName === expectedName;
}

export function findRelatedLaws(question, lawDatabase, options = {}) {
  if (!question || !Array.isArray(lawDatabase) || lawDatabase.length === 0) return [];

  const limit = options.limit || DEFAULT_LIMIT;
  const minScore = options.minScore || MIN_SCORE;
  const questionParts = getQuestionParts(question);
  const terms = extractQuestionTerms(question);

  const scoredLaws = lawDatabase
    .filter(isLawRecordConsistent)
    .map((law) => {
      const { score, reasons } = scoreLaw(question, law, terms, questionParts);
      return {
        ...law,
        matchScore: Number(score.toFixed(2)),
        matchReason: reasons.join('；'),
        matchReasons: reasons,
      };
    });
  const definitionLaws = questionParts.definitionTerms.length
    ? scoredLaws.filter((law) => law.matchReasons.some((reason) => reason.startsWith('題目是定義型問法')))
    : [];
  const candidates = definitionLaws.length ? definitionLaws : scoredLaws;

  return candidates
    .filter((law) => law.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore || a.codeName.localeCompare(b.codeName, 'zh-Hant'))
    .slice(0, limit);
}
