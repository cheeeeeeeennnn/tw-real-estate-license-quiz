const MAX_RELATIONS = 3;

function lawName(law) {
  return law?.codeName || law?.lawName || '';
}

function articleNo(law) {
  return law?.article || law?.articleNo || '';
}

function lawLabel(law) {
  const name = lawName(law);
  const article = articleNo(law);
  return name && article ? `${name}第${article}條` : name || article || '未知法條';
}

function pushUnique(list, value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length < 2 || list.includes(normalized)) return;
  list.push(normalized);
}

function extractReasonTerms(law) {
  const reasonText = [law?.matchReason, ...(law?.matchReasons || [])].filter(Boolean).join('；');
  const terms = [];

  [...reasonText.matchAll(/命中題目關鍵字：「([^」]+)」/g)].forEach((match) => pushUnique(terms, match[1]));
  [...reasonText.matchAll(/命中法條關鍵字「([^」]+)」/g)].forEach((match) => pushUnique(terms, match[1]));
  [...reasonText.matchAll(/命中同義詞：「([^」]+)」→「([^」]+)」/g)].forEach((match) => {
    pushUnique(terms, match[1]);
    pushUnique(terms, match[2]);
  });
  [...reasonText.matchAll(/題目關鍵字命中：([^；]+)/g)].forEach((match) => {
    match[1].split('、').forEach((term) => pushUnique(terms, term));
  });
  [...reasonText.matchAll(/命中「([^」]+)」/g)].forEach((match) => pushUnique(terms, match[1]));

  return terms;
}

function lawTerms(law) {
  const terms = [];
  (law?.keywords || []).forEach((keyword) => pushUnique(terms, keyword));
  extractReasonTerms(law).forEach((term) => pushUnique(terms, term));
  return terms;
}

function sharedTerms(firstLaw, secondLaw) {
  const firstTerms = lawTerms(firstLaw);
  const secondTerms = new Set(lawTerms(secondLaw));
  return firstTerms.filter((term) => secondTerms.has(term)).slice(0, 3);
}

function scorePair(firstLaw, secondLaw) {
  let score = 0;
  const reasons = [];
  const sameCode = firstLaw.code && firstLaw.code === secondLaw.code && articleNo(firstLaw) !== articleNo(secondLaw);
  const shared = sharedTerms(firstLaw, secondLaw);

  if (sameCode) {
    score += 18;
    reasons.push(`同屬「${lawName(firstLaw)}」不同條文`);
  }

  if (shared.length) {
    score += shared.length * 12;
    const lawRelation = firstLaw.code !== secondLaw.code ? '不同法規但' : '';
    reasons.push(`${lawRelation}都涉及「${shared.join('、')}」`);
  }

  return { score, reasons };
}

export function buildLawRelationList(relatedLaws = [], options = {}) {
  if (!Array.isArray(relatedLaws) || relatedLaws.length < 2) return [];

  const limit = options.limit || MAX_RELATIONS;
  const relations = [];

  for (let firstIndex = 0; firstIndex < relatedLaws.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < relatedLaws.length; secondIndex += 1) {
      const firstLaw = relatedLaws[firstIndex];
      const secondLaw = relatedLaws[secondIndex];
      const { score, reasons } = scorePair(firstLaw, secondLaw);
      if (!score || !reasons.length) continue;

      relations.push({
        id: `${firstLaw.id || firstIndex}-${secondLaw.id || secondIndex}`,
        firstLabel: lawLabel(firstLaw),
        secondLabel: lawLabel(secondLaw),
        reason: reasons.join('；'),
        relationScore: score,
      });
    }
  }

  return relations
    .sort((a, b) => b.relationScore - a.relationScore)
    .slice(0, limit);
}
