const MAX_RESULTS = 3;
const MIN_SCORE = 18;
const COMMON_TERMS = new Set([
  '下列',
  '何者',
  '有關',
  '關於',
  '民法',
  '土地',
  '不動產',
  '經紀',
  '概要',
  '正確',
  '錯誤',
  '規定',
  '答案',
  '解析',
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, '')
    .trim();
}

function addTerm(termSet, term) {
  const normalized = normalizeText(term);
  if (normalized.length < 2) return;
  if (/^\d+$/.test(normalized)) return;
  if (COMMON_TERMS.has(normalized)) return;
  termSet.add(normalized);
}

function extractTerms(text) {
  const compact = normalizeText(text);
  const terms = new Set();
  if (!compact) return terms;

  if (compact.length <= 10) addTerm(terms, compact);
  const maxSize = Math.min(6, compact.length);
  for (let size = 2; size <= maxSize; size += 1) {
    for (let index = 0; index <= compact.length - size; index += 1) {
      addTerm(terms, compact.slice(index, index + size));
    }
  }

  return terms;
}

function countOverlap(sourceTerms, targetTerms) {
  let count = 0;
  sourceTerms.forEach((term) => {
    if (targetTerms.has(term)) count += 1;
  });
  return count;
}

function lawKeysFromRelatedLaws(relatedLaws) {
  return new Set(
    relatedLaws
      .flatMap((law) => [
        law.id,
        law.codeName && law.article ? `${law.codeName}-${law.article}` : '',
        law.lawName && law.articleNo ? `${law.lawName}-${law.articleNo}` : '',
      ])
      .filter(Boolean),
  );
}

function lawKeysFromQuestion(question) {
  return new Set((question?.lawRefs || []).filter(Boolean));
}

function truncateQuestion(question) {
  const text = String(question?.question || '').replace(/\s+/g, ' ').trim();
  return text.length > 60 ? `${text.slice(0, 60)}...` : text;
}

function pushReason(reasons, label, score) {
  if (!label || score <= 0) return;
  reasons.push({ label, score });
}

function summarizeReasons(reasons) {
  return reasons
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((reason) => reason.label)
    .join('；');
}

function scoreQuestion(currentQuestion, targetQuestion, relatedLawKeys, currentQuestionTerms, currentExplanationTerms) {
  let score = 0;
  const reasons = [];

  if (targetQuestion.subject === currentQuestion.subject) {
    score += 16;
    pushReason(reasons, `同科目「${targetQuestion.subject}」`, 16);
  }

  if (targetQuestion.topic && targetQuestion.topic === currentQuestion.topic) {
    score += 24;
    pushReason(reasons, `同 topic「${targetQuestion.topic}」`, 24);
  }

  const targetQuestionTerms = extractTerms(targetQuestion.question);
  const questionOverlap = countOverlap(currentQuestionTerms, targetQuestionTerms);
  if (questionOverlap) {
    const overlapScore = Math.min(questionOverlap * 2.2, 28);
    score += overlapScore;
    pushReason(reasons, `題幹關鍵字重疊 ${questionOverlap} 個`, overlapScore);
  }

  const targetExplanationTerms = extractTerms(targetQuestion.explanation);
  const explanationOverlap = countOverlap(currentExplanationTerms, targetExplanationTerms);
  if (explanationOverlap) {
    const overlapScore = Math.min(explanationOverlap * 1.8, 22);
    score += overlapScore;
    pushReason(reasons, `解析關鍵字重疊 ${explanationOverlap} 個`, overlapScore);
  }

  const targetLawKeys = lawKeysFromQuestion(targetQuestion);
  const sharedLawRefs = [...targetLawKeys].filter((key) => relatedLawKeys.has(key));
  if (sharedLawRefs.length) {
    const lawScore = Math.min(sharedLawRefs.length * 30, 60);
    score += lawScore;
    pushReason(reasons, '相關法條相同', lawScore);
  }

  return { score, reasons };
}

export function findSimilarQuestions(currentQuestion, allQuestions = [], relatedLaws = [], options = {}) {
  if (!currentQuestion || !Array.isArray(allQuestions)) return [];

  const limit = options.limit || MAX_RESULTS;
  const minScore = options.minScore || MIN_SCORE;
  const relatedLawKeys = lawKeysFromRelatedLaws(relatedLaws);
  const currentQuestionTerms = extractTerms(currentQuestion.question);
  const currentExplanationTerms = extractTerms(currentQuestion.explanation);

  return allQuestions
    .filter((question) => question?.id && question.id !== currentQuestion.id)
    .filter((question) => question.type === currentQuestion.type)
    .map((question) => {
      const { score, reasons } = scoreQuestion(
        currentQuestion,
        question,
        relatedLawKeys,
        currentQuestionTerms,
        currentExplanationTerms,
      );

      return {
        id: question.id,
        year: question.year,
        subject: question.subject,
        number: question.number,
        questionPreview: truncateQuestion(question),
        similarScore: Number(score.toFixed(2)),
        similarReason: summarizeReasons(reasons),
      };
    })
    .filter((question) => question.similarScore >= minScore)
    .sort((a, b) => b.similarScore - a.similarScore || b.year - a.year || a.number - b.number)
    .slice(0, limit);
}
