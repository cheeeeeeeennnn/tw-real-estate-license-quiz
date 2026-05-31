const MIN_RECORDS_FOR_ANALYSIS = 3;
const RECENT_DAYS = 7;

function summarizeGroup(records, key) {
  const grouped = records.reduce((acc, record) => {
    const name = record[key] || '未分類';
    acc[name] ??= { name, total: 0, correct: 0, wrong: 0 };
    acc[name].total += 1;
    if (record.isCorrect) {
      acc[name].correct += 1;
    } else {
      acc[name].wrong += 1;
    }
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      ...item,
      accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.accuracy - b.accuracy || b.wrong - a.wrong);
}

function getRecentRecordCount(records, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);

  return records.filter((record) => {
    const answeredAt = new Date(record.answeredAt);
    return Number.isFinite(answeredAt.getTime()) && answeredAt >= cutoff;
  }).length;
}

function findWeakest(items) {
  return [...items]
    .filter((item) => item.total > 0)
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      if (b.wrong !== a.wrong) return b.wrong - a.wrong;
      return b.total - a.total;
    })[0] || null;
}

function getTopWrongTopics(topicStats) {
  return [...topicStats]
    .filter((item) => item.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, 5);
}

function buildReviewSuggestions(weakestSubject, weakestTopic, topWrongTopics, recent7DaysCount) {
  const suggestions = [];

  if (weakestSubject) {
    suggestions.push(`先補強「${weakestSubject.name}」，目前正確率 ${weakestSubject.accuracy}%。`);
  }

  if (weakestTopic) {
    suggestions.push(`針對「${weakestTopic.name}」重刷錯題與相關法條。`);
  }

  if (topWrongTopics[0]) {
    suggestions.push(`錯題最多的觀念是「${topWrongTopics[0].name}」，建議集中複習同 topic 題目。`);
  }

  if (recent7DaysCount === 0) {
    suggestions.push('最近 7 天尚無作答紀錄，建議每天維持少量刷題。');
  }

  return suggestions.slice(0, 4);
}

export function analyzeLearningWeakness(choiceRecords = [], options = {}) {
  const records = Array.isArray(choiceRecords) ? choiceRecords : [];
  const minRecords = options.minRecords || MIN_RECORDS_FOR_ANALYSIS;

  if (records.length < minRecords) {
    return {
      hasEnoughData: false,
      message: '累積更多答題紀錄後，將產生弱點分析',
      subjectStats: [],
      topicStats: [],
      recent7DaysCount: getRecentRecordCount(records, options.now),
      topWrongTopics: [],
      suggestions: [],
    };
  }

  const subjectStats = summarizeGroup(records, 'subject');
  const topicStats = summarizeGroup(records, 'topic');
  const weakestSubject = findWeakest(subjectStats);
  const weakestTopic = findWeakest(topicStats);
  const topWrongTopics = getTopWrongTopics(topicStats);
  const recent7DaysCount = getRecentRecordCount(records, options.now);

  return {
    hasEnoughData: true,
    subjectStats,
    topicStats,
    recent7DaysCount,
    topWrongTopics,
    weakestSubject,
    weakestTopic,
    mostWrongConcept: topWrongTopics[0] || null,
    suggestions: buildReviewSuggestions(weakestSubject, weakestTopic, topWrongTopics, recent7DaysCount),
  };
}
