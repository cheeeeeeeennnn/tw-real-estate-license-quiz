export default function QuestionMeta({ question }) {
  return (
    <div className="question-meta">
      <span>{question.year} 年</span>
      <span>{question.subject}</span>
      <span>第 {question.number} 題</span>
      <span>{question.topic}</span>
    </div>
  );
}
