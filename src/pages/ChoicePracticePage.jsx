import { useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar.jsx';
import Layout from '../components/Layout.jsx';
import LawReferenceCard from '../components/LawReferenceCard.jsx';
import QuestionMeta from '../components/QuestionMeta.jsx';
import StatGrid from '../components/StatGrid.jsx';
import { OPTION_KEYS, STORAGE_KEYS } from '../constants/app';
import { SUBJECT_BY_SLUG } from '../constants/subjects';
import { useQuestionData } from '../context/QuestionDataContext.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { analyzeWrongConcept, extractMatchedKeywordsFromLaws } from '../utils/analyzeWrongConcept';
import { findRelatedLaws } from '../utils/findRelatedLaws';
import { findSimilarQuestions } from '../utils/findSimilarQuestions';
import { generateQuestionInsight } from '../utils/generateQuestionInsight';
import { getAllLaws } from '../utils/laws';
import { addChoiceRecord, addWrongAnswer } from '../utils/storageActions';
import { filterQuestions, getFilterOptions, getQuestionsBySubject, shuffleQuestions, sortByYearAndNumber } from '../utils/questions';

const initialFilters = { year: 'all', subject: 'all', topic: 'all' };

export default function ChoicePracticePage() {
  const { subjectSlug } = useParams();
  const [searchParams] = useSearchParams();
  const subject = SUBJECT_BY_SLUG[subjectSlug];
  const { questions } = useQuestionData();
  const practiceMode = searchParams.get('mode');
  const [filters, setFilters] = useState(initialFilters);
  const [order, setOrder] = useState('number');
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0, wrong: 0 });
  const [records, setRecords] = useLocalStorage(STORAGE_KEYS.choiceRecords, []);
  const [wrongBook, setWrongBook] = useLocalStorage(STORAGE_KEYS.wrongBook, {});

  const baseQuestions = useMemo(() => {
    const subjectQuestions = getQuestionsBySubject(questions, subjectSlug).filter((question) => question.type === 'choice');
    if (practiceMode === 'wrong') {
      return subjectQuestions.filter((question) => Boolean(wrongBook[question.id]));
    }
    return subjectQuestions;
  }, [practiceMode, questions, subjectSlug, wrongBook]);
  const options = useMemo(() => getFilterOptions(baseQuestions), [baseQuestions]);
  const filteredQuestions = useMemo(() => filterQuestions(baseQuestions, filters), [baseQuestions, filters]);
  const current = sessionQuestions[index];
  const isLastQuestion = index >= sessionQuestions.length - 1;
  const accuracy = sessionStats.answered ? Math.round((sessionStats.correct / sessionStats.answered) * 100) : 0;
  const relatedLaws = useMemo(() => {
    if (!selected || !current) return [];
    return findRelatedLaws(current, getAllLaws(), { limit: 5 });
  }, [current, selected]);
  const questionInsight = useMemo(() => {
    if (!selected || !current) return null;
    return generateQuestionInsight(current, relatedLaws);
  }, [current, relatedLaws, selected]);
  const similarQuestions = useMemo(() => {
    if (!selected || !current) return [];
    return findSimilarQuestions(current, questions, relatedLaws, { limit: 3 });
  }, [current, questions, relatedLaws, selected]);
  const wrongConcept = useMemo(() => {
    if (!selected || !current || selected === current.answer) return null;
    return analyzeWrongConcept(current, selected, relatedLaws, extractMatchedKeywordsFromLaws(relatedLaws));
  }, [current, relatedLaws, selected]);

  if (!subject) return <Navigate to="/" replace />;

  function startPractice() {
    const picked = order === 'random' ? shuffleQuestions(filteredQuestions) : sortByYearAndNumber(filteredQuestions);
    setSessionQuestions(picked);
    setIndex(0);
    setSelected('');
    setSessionStats({ answered: 0, correct: 0, wrong: 0 });
  }

  function updateFilters(nextFilters) {
    setFilters(nextFilters);
    setSessionQuestions([]);
    setIndex(0);
    setSelected('');
    setSessionStats({ answered: 0, correct: 0, wrong: 0 });
  }

  function answerQuestion(answer) {
    if (selected || !current) return;
    const isCorrect = answer === current.answer;
    setSelected(answer);
    setSessionStats((prev) => ({
      answered: prev.answered + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));
    setRecords(addChoiceRecord(records, current, answer, isCorrect));
    if (!isCorrect) setWrongBook(addWrongAnswer(wrongBook, current));
  }

  function nextQuestion() {
    setSelected('');
    setIndex((prev) => Math.min(prev + 1, sessionQuestions.length - 1));
  }

  return (
    <Layout title={practiceMode === 'wrong' ? '錯題重新練習' : '選擇題練習'} subtitle={subject.name} backTo={`/subject/${subjectSlug}`}>
      <FilterBar filters={filters} options={options} onChange={updateFilters} showSubject={false} />

      <section className="control-row">
        <label>
          出題方式
          <select value={order} onChange={(event) => setOrder(event.target.value)}>
            <option value="number">依題號順序</option>
            <option value="random">隨機出題</option>
          </select>
        </label>
        <button className="primary-button" onClick={startPractice} disabled={!filteredQuestions.length}>
          開始練習
        </button>
      </section>

      <StatGrid
        items={[
          { label: '已作答', value: sessionStats.answered },
          { label: '答對', value: sessionStats.correct },
          { label: '答錯', value: sessionStats.wrong },
          { label: '正確率', value: `${accuracy}%` },
        ]}
      />

      {!filteredQuestions.length && <p className="empty-state">目前沒有符合篩選條件的選擇題。</p>}
      {filteredQuestions.length > 0 && !current && <p className="empty-state">設定篩選後按開始練習。</p>}

      {current && (
        <section className="question-card">
          <QuestionMeta question={current} />
          <h2>{current.question}</h2>
          <div className="option-list">
            {OPTION_KEYS.map((key) => {
              const isAnswer = key === current.answer;
              const isSelected = key === selected;
              const className = selected
                ? isAnswer
                  ? 'option-button correct'
                  : isSelected
                    ? 'option-button wrong'
                    : 'option-button'
                : 'option-button';
              return (
                <button className={className} key={key} onClick={() => answerQuestion(key)}>
                  <b>{key}</b>
                  <span>{current.options[key]}</span>
                </button>
              );
            })}
          </div>

          {selected && (
            <>
              <div className={selected === current.answer ? 'result-box correct-box' : 'result-box wrong-box'}>
                <strong>{selected === current.answer ? '答對' : '答錯'}</strong>
                <p>正確答案：{current.answer}</p>
                <p>{current.explanation}</p>
              </div>
              {wrongConcept && (
                <section className="wrong-concept-card">
                  <h3>{wrongConcept.title}</h3>
                  <p>{wrongConcept.possibleConfusion}</p>
                  <ul>
                    {wrongConcept.reviewFocus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}
              <LawReferenceCard
                laws={relatedLaws}
                title="本題相關法條"
                emptyMessage="尚未找到明確相關法條"
              />
              {questionInsight && (
                <section className="insight-card">
                  <h3>{questionInsight.title}</h3>
                  <ul>
                    {questionInsight.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  {questionInsight.warning && <p className="insight-warning">{questionInsight.warning}</p>}
                </section>
              )}
              <section className="similar-card">
                <h3>類題推薦</h3>
                {similarQuestions.length ? (
                  <div className="similar-list">
                    {similarQuestions.map((question) => (
                      <article className="similar-item" key={question.id}>
                        <div className="similar-meta">
                          <span>{question.year} 年</span>
                          <span>{question.subject}</span>
                          <span>第 {question.number} 題</span>
                        </div>
                        <p>{question.questionPreview}</p>
                        <strong>{question.similarReason}</strong>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state compact-empty-state">暫無明確類題</p>
                )}
              </section>
            </>
          )}

          <button className="primary-button" onClick={nextQuestion} disabled={!selected || isLastQuestion}>
            {isLastQuestion && selected ? '本次已完成' : '下一題'}
          </button>
        </section>
      )}
    </Layout>
  );
}
