import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar.jsx';
import Layout from '../components/Layout.jsx';
import LawReferenceCard from '../components/LawReferenceCard.jsx';
import QuestionMeta from '../components/QuestionMeta.jsx';
import { FAMILIARITY, STORAGE_KEYS } from '../constants/app';
import { SUBJECT_BY_SLUG } from '../constants/subjects';
import { useQuestionData } from '../context/QuestionDataContext.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { filterQuestions, getFilterOptions, getQuestionsBySubject, sortByYearAndNumber } from '../utils/questions';
import { saveEssayAnswer } from '../utils/storageActions';

const initialFilters = { year: 'all', subject: 'all', topic: 'all' };

export default function EssayPracticePage() {
  const { subjectSlug } = useParams();
  const subject = SUBJECT_BY_SLUG[subjectSlug];
  const { questions } = useQuestionData();
  const [filters, setFilters] = useState(initialFilters);
  const [index, setIndex] = useState(0);
  const [showReference, setShowReference] = useState(false);
  const [answers, setAnswers] = useLocalStorage(STORAGE_KEYS.essayAnswers, {});

  const baseQuestions = useMemo(
    () => getQuestionsBySubject(questions, subjectSlug).filter((question) => question.type === 'essay'),
    [questions, subjectSlug],
  );
  const options = useMemo(() => getFilterOptions(baseQuestions), [baseQuestions]);
  const filteredQuestions = useMemo(() => sortByYearAndNumber(filterQuestions(baseQuestions, filters)), [baseQuestions, filters]);
  const current = filteredQuestions[index];
  const saved = current ? answers[current.id] : null;
  const [drafts, setDrafts] = useState({});
  const [familiarityDrafts, setFamiliarityDrafts] = useState({});
  const content = current ? drafts[current.id] ?? saved?.content ?? '' : '';
  const familiarity = current ? familiarityDrafts[current.id] ?? saved?.familiarity ?? '複習中' : '複習中';

  if (!subject) return <Navigate to="/" replace />;

  function updateFilters(nextFilters) {
    setFilters(nextFilters);
    setIndex(0);
    setShowReference(false);
  }

  function saveCurrentAnswer() {
    if (!current) return;
    setAnswers(saveEssayAnswer(answers, current, content, familiarity));
  }

  function goNext() {
    setShowReference(false);
    setIndex((prev) => Math.min(prev + 1, filteredQuestions.length - 1));
  }

  return (
    <Layout title="申論題練習" subtitle={subject.name} backTo={`/subject/${subjectSlug}`}>
      <FilterBar filters={filters} options={options} onChange={updateFilters} showSubject={false} />

      {!current && <p className="empty-state">目前沒有符合篩選條件的申論題。</p>}

      {current && (
        <section className="question-card">
          <QuestionMeta question={current} />
          <h2>{current.question}</h2>
          <LawReferenceCard lawRefs={current.lawRefs} />

          <div className="keyword-list">
            {current.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>

          <label className="essay-label">
            我的答案
            <textarea
              value={content}
              onChange={(event) => setDrafts({ ...drafts, [current.id]: event.target.value })}
              placeholder="在這裡輸入申論作答內容"
            />
          </label>

          <label>
            熟悉度
            <select
              value={familiarity}
              onChange={(event) => setFamiliarityDrafts({ ...familiarityDrafts, [current.id]: event.target.value })}
            >
              {FAMILIARITY.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="control-row">
            <button className="secondary-button" onClick={() => setShowReference((value) => !value)}>
              {showReference ? '隱藏參考答案' : '查看參考答案'}
            </button>
            <button className="primary-button" onClick={saveCurrentAnswer}>
              儲存答案
            </button>
          </div>

          {saved && <p className="saved-note">上次儲存：{new Date(saved.answeredAt).toLocaleString('zh-TW')}</p>}
          {showReference && (
            <div className="reference-box">
              <strong>參考答案</strong>
              <p>{current.referenceAnswer}</p>
            </div>
          )}

          <div className="control-row">
            <button className="secondary-button" onClick={() => setIndex((prev) => Math.max(prev - 1, 0))} disabled={index === 0}>
              上一題
            </button>
            <button className="primary-button" onClick={goNext} disabled={index >= filteredQuestions.length - 1}>
              下一題
            </button>
          </div>
        </section>
      )}
    </Layout>
  );
}
