import laws from '../data/laws.json';

export function getAllLaws() {
  return laws;
}

export function getLawById(id) {
  return laws.find((law) => law.id === id);
}

export function getLawsByRefs(lawRefs = []) {
  return lawRefs.map((ref) => getLawById(typeof ref === 'string' ? ref : ref.id)).filter(Boolean);
}

export function getLawFilterOptions(lawList) {
  return {
    codes: [...new Set(lawList.map((law) => law.codeName))].sort(),
    topics: [...new Set(lawList.flatMap((law) => law.topics || []))].sort(),
  };
}

export function filterLaws(lawList, filters) {
  const keyword = filters.keyword.trim().toLowerCase();
  return lawList.filter((law) => {
    const matchCode = filters.code === 'all' || law.codeName === filters.code;
    const matchTopic = filters.topic === 'all' || law.topics?.includes(filters.topic);
    const haystack = [
      law.codeName,
      law.article,
      law.title,
      ...(law.keywords || []),
      ...(law.text || []),
    ].join(' ').toLowerCase();
    const matchKeyword = !keyword || haystack.includes(keyword);
    return matchCode && matchTopic && matchKeyword;
  });
}
