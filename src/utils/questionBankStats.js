export function getQuestionBankSummary(questions) {
  const years = [...new Set(questions.map((question) => question.year))].sort((a, b) => a - b);
  const choiceCount = questions.filter((question) => question.type === 'choice').length;
  const essayCount = questions.filter((question) => question.type === 'essay').length;
  const placeholderCount = questions.filter((question) => question.topic === 'PDF解析待校正').length;
  return {
    years,
    total: questions.length,
    choiceCount,
    essayCount,
    placeholderCount,
  };
}

export function getImportReportRows(importReport) {
  return importReport.map((row) => ({
    ...row,
    needsReview: row.status !== 'ok',
  }));
}
