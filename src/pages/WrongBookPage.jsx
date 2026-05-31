import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar.jsx';
import Layout from '../components/Layout.jsx';
import LawReferenceCard from '../components/LawReferenceCard.jsx';
import QuestionMeta from '../components/QuestionMeta.jsx';
import { STORAGE_KEYS } from '../constants/app';
import { SUBJECT_BY_SLUG } from '../constants/subjects';
import { useQuestionData } from '../context/QuestionDataContext.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { filterQuestions, getFilterOptions, getQuestionById, getQuestionsBySubject } from '../utils/questions';
import { removeWrongAnswer } from '../utils/storageActions';

const initialFilters = { year: 'all', subject: 'all', topic: 'all' };

export default function WrongBookPage() {
  const { subjectSlug } = useParams();
  const subject = SUBJECT_BY_SLUG[subjectSlug];
  const { questions } = useQuestionData();
  const [filters, setFilters] = useState(initialFilters);
  const [wrongBook, setWrongBook] = useLocalStorage(STORAGE_KEYS.wrongBook, {});

  const subjectChoices = useMemo(
    () => getQuestionsBySubject(questions, subjectSlug).filter((question) => question.type === 'choice'),
    [questions, subjectSlug],
  );
  const wrongQuestions = useMemo(
    () => subjectChoices.filter((question) => Boolean(wrongBook[question.id])),
    [subjectChoices, wrongBook],
  );
  const options = useMemo(() => getFilterOptions(wrongQuestions), [wrongQuestions]);
  const filtered = useMemo(() => filterQuestions(wrongQuestions, filters), [wrongQuestions, filters]);

  if (!subject) return <Navigate to="/" replace />;

  function clearAll() {
    const next = { ...wrongBook };
    wrongQuestions.forEach((question) => delete next[question.id]);
    setWrongBook(next);
  }

  return (
    <Layout title="錯題本" subtitle={subject.name} backTo={`/subject/${subjectSlug}`}>
      <FilterBar filters={filters} options={options} onChange={setFilters} showSubject={false} />
      <div className="control-row">
        <Link className="secondary-button link-button" to={`/subject/${subjectSlug}/choice?mode=wrong`}>
          重新練習錯題
        </Link>
        <button className="danger-button" onClick={clearAll} disabled={!wrongQuestions.length}>
          清空錯題本
        </button>
      </div>

      {!filtered.length && <p className="empty-state">目前沒有符合條件的錯題。</p>}

      <section className="stack">
        {filtered.map((question) => {
          const wrong = wrongBook[question.id];
          const resolvedQuestion = getQuestionById(questions, question.id);
          return (
            <article className="question-card compact-card" key={question.id}>
              <QuestionMeta question={resolvedQuestion} />
              <h2>{question.question}</h2>
              <p className="wrong-count">答錯次數：{wrong.wrongCount}</p>
              <p>正確答案：{question.answer}</p>
              <p>{question.explanation}</p>
              <LawReferenceCard lawRefs={question.lawRefs} compact />
              <button className="danger-button" onClick={() => setWrongBook(removeWrongAnswer(wrongBook, question.id))}>
                刪除這題
              </button>
            </article>
          );
        })}
      </section>
    </Layout>
  );
}
