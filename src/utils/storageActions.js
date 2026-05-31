export function addChoiceRecord(records, question, selectedAnswer, isCorrect) {
  return [
    ...records,
    {
      questionId: question.id,
      subject: question.subject,
      year: question.year,
      topic: question.topic,
      selectedAnswer,
      isCorrect,
      answeredAt: new Date().toISOString(),
    },
  ];
}

export function addWrongAnswer(wrongBook, question) {
  const existing = wrongBook[question.id];
  return {
    ...wrongBook,
    [question.id]: {
      questionId: question.id,
      subject: question.subject,
      year: question.year,
      topic: question.topic,
      wrongCount: existing ? existing.wrongCount + 1 : 1,
      lastWrongAt: new Date().toISOString(),
    },
  };
}

export function removeWrongAnswer(wrongBook, questionId) {
  const next = { ...wrongBook };
  delete next[questionId];
  return next;
}

export function saveEssayAnswer(answers, question, content, familiarity) {
  return {
    ...answers,
    [question.id]: {
      questionId: question.id,
      subject: question.subject,
      year: question.year,
      topic: question.topic,
      content,
      familiarity,
      answeredAt: new Date().toISOString(),
    },
  };
}
