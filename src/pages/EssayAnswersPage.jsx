import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import LawReferenceCard from '../components/LawReferenceCard.jsx';
import Layout from '../components/Layout.jsx';
import QuestionMeta from '../components/QuestionMeta.jsx';
import { FAMILIARITY, STORAGE_KEYS } from '../constants/app';
import { SUBJECT_BY_SLUG } from '../constants/subjects';
import { useQuestionData } from '../context/QuestionDataContext.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getQuestionById } from '../utils/questions';

export default function EssayAnswersPage() {
  const { subjectSlug } = useParams();
  const subject = SUBJECT_BY_SLUG[subjectSlug];
  const { questions } = useQuestionData();
  const [familiarity, setFamiliarity] = useState('all');
  const [answers] = useLocalStorage(STORAGE_KEYS.essayAnswers, {});

  const items = useMemo(() => {
    return Object.values(answers)
      .map((answer) => ({ answer, question: getQuestionById(questions, answer.questionId) }))
      .filter((item) => item.question?.subject === subject?.name)
      .filter((item) => familiarity === 'all' || item.answer.familiarity === familiarity)
      .sort((a, b) => a.question.year - b.question.year || a.question.number - b.question.number);
  }, [answers, familiarity, questions, subject]);

  if (!subject) return <Navigate to="/" replace />;

  return (
    <Layout title="我的申論答案" subtitle={subject.name} backTo={`/subject/${subjectSlug}`}>
      <section className="filter-bar">
        <label>
          熟悉度
          <select value={familiarity} onChange={(event) => setFamiliarity(event.target.value)}>
            <option value="all">全部</option>
            {FAMILIARITY.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!items.length && <p className="empty-state">目前沒有符合條件的申論答案。</p>}

      <section className="stack">
        {items.map(({ answer, question }) => (
          <article className="question-card compact-card" key={answer.questionId}>
            <QuestionMeta question={question} />
            <h2>{question.question}</h2>
            <p className="pill-line">熟悉度：{answer.familiarity}</p>
            <strong>我的答案</strong>
            <p className="answer-text">{answer.content}</p>
            <strong>參考答案</strong>
            <p>{question.referenceAnswer}</p>
            <LawReferenceCard lawRefs={question.lawRefs} compact />
            <div className="keyword-list">
              {question.keywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
            <Link className="primary-button link-button" to={`/subject/${subjectSlug}/essay`}>
              重新作答或修改
            </Link>
          </article>
        ))}
      </section>
    </Layout>
  );
}
