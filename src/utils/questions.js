import { SUBJECT_BY_SLUG } from '../constants/subjects';

export function getSubjectName(subjectSlug) {
  return SUBJECT_BY_SLUG[subjectSlug]?.name ?? '';
}

export function getQuestionsBySubject(questionList, subjectSlug) {
  const subjectName = getSubjectName(subjectSlug);
  return questionList.filter((question) => question.subject === subjectName);
}

export function getQuestionById(questionList, id) {
  return questionList.find((question) => question.id === id);
}

export function getFilterOptions(questionList) {
  return {
    years: [...new Set(questionList.map((question) => question.year))].sort((a, b) => a - b),
    subjects: [...new Set(questionList.map((question) => question.subject))],
    topics: [...new Set(questionList.map((question) => question.topic))].sort(),
  };
}

export function filterQuestions(questionList, filters) {
  return questionList.filter((question) => {
    const matchYear = filters.year === 'all' || Number(filters.year) === question.year;
    const matchSubject = filters.subject === 'all' || filters.subject === question.subject;
    const matchTopic = filters.topic === 'all' || filters.topic === question.topic;
    return matchYear && matchSubject && matchTopic;
  });
}

export function shuffleQuestions(questionList) {
  return [...questionList].sort(() => Math.random() - 0.5);
}

export function sortByYearAndNumber(questionList) {
  return [...questionList].sort((a, b) => a.year - b.year || a.number - b.number);
}
