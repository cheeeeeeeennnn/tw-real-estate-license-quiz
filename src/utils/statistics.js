import { FAMILIARITY } from '../constants/app';

export function getChoiceSummary(records) {
  const total = records.length;
  const correct = records.filter((record) => record.isCorrect).length;
  return {
    total,
    correct,
    wrong: total - correct,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
  };
}

export function getSubjectAccuracy(records) {
  const grouped = records.reduce((acc, record) => {
    acc[record.subject] ??= { total: 0, correct: 0 };
    acc[record.subject].total += 1;
    if (record.isCorrect) acc[record.subject].correct += 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([subject, value]) => ({
    subject,
    total: value.total,
    correct: value.correct,
    accuracy: Math.round((value.correct / value.total) * 100),
  }));
}

export function getWrongTopicCounts(wrongBook) {
  return Object.values(wrongBook).reduce((acc, item) => {
    acc[item.topic] = (acc[item.topic] ?? 0) + item.wrongCount;
    return acc;
  }, {});
}

export function getEssayFamiliarityCounts(answers) {
  const counts = Object.fromEntries(FAMILIARITY.map((item) => [item.value, 0]));
  Object.values(answers).forEach((answer) => {
    counts[answer.familiarity] = (counts[answer.familiarity] ?? 0) + 1;
  });
  return counts;
}
