import { Navigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StatGrid from '../components/StatGrid.jsx';
import { STORAGE_KEYS } from '../constants/app';
import { SUBJECT_BY_SLUG } from '../constants/subjects';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { analyzeLearningWeakness } from '../utils/analyzeLearningWeakness';
import { getChoiceSummary, getEssayFamiliarityCounts, getSubjectAccuracy, getWrongTopicCounts } from '../utils/statistics';

export default function StatisticsPage() {
  const { subjectSlug } = useParams();
  const subject = SUBJECT_BY_SLUG[subjectSlug];
  const [records] = useLocalStorage(STORAGE_KEYS.choiceRecords, []);
  const [wrongBook] = useLocalStorage(STORAGE_KEYS.wrongBook, {});
  const [essayAnswers] = useLocalStorage(STORAGE_KEYS.essayAnswers, {});

  if (!subject) return <Navigate to="/" replace />;

  const subjectRecords = records.filter((record) => record.subject === subject.name);
  const subjectWrongBook = Object.fromEntries(Object.entries(wrongBook).filter(([, item]) => item.subject === subject.name));
  const subjectEssayAnswers = Object.fromEntries(Object.entries(essayAnswers).filter(([, item]) => item.subject === subject.name));
  const summary = getChoiceSummary(subjectRecords);
  const subjectAccuracy = getSubjectAccuracy(records);
  const wrongTopicCounts = getWrongTopicCounts(subjectWrongBook);
  const familiarityCounts = getEssayFamiliarityCounts(subjectEssayAnswers);
  const weakness = analyzeLearningWeakness(records);

  return (
    <Layout title="學習統計" subtitle={subject.name} backTo={`/subject/${subjectSlug}`}>
      <StatGrid
        items={[
          { label: '總作答題數', value: summary.total },
          { label: '答對題數', value: summary.correct },
          { label: '答錯題數', value: summary.wrong },
          { label: '總正確率', value: `${summary.accuracy}%` },
        ]}
      />

      <section className="question-card compact-card">
        <h2>各科正確率</h2>
        {!subjectAccuracy.length && <p className="empty-state small">尚無選擇題作答紀錄。</p>}
        {subjectAccuracy.map((item) => (
          <div className="row-stat" key={item.subject}>
            <span>{item.subject}</span>
            <strong>{item.accuracy}%</strong>
          </div>
        ))}
      </section>

      <section className="question-card compact-card">
        <h2>各主題錯題數</h2>
        {!Object.keys(wrongTopicCounts).length && <p className="empty-state small">目前沒有錯題紀錄。</p>}
        {Object.entries(wrongTopicCounts).map(([topic, count]) => (
          <div className="row-stat" key={topic}>
            <span>{topic}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </section>

      <section className="question-card compact-card weakness-card">
        <h2>弱點分析</h2>
        {!weakness.hasEnoughData ? (
          <p className="empty-state small">{weakness.message}</p>
        ) : (
          <>
            <div className="weakness-summary-grid">
              <div className="weakness-summary-item">
                <span>最需加強科目</span>
                <strong>{weakness.weakestSubject?.name || '尚無資料'}</strong>
                {weakness.weakestSubject && <small>{weakness.weakestSubject.accuracy}% 正確率，已作答 {weakness.weakestSubject.total} 題</small>}
              </div>
              <div className="weakness-summary-item">
                <span>最需加強主題</span>
                <strong>{weakness.weakestTopic?.name || '尚無資料'}</strong>
                {weakness.weakestTopic && <small>{weakness.weakestTopic.accuracy}% 正確率，錯 {weakness.weakestTopic.wrong} 題</small>}
              </div>
              <div className="weakness-summary-item">
                <span>最近 7 天答題數</span>
                <strong>{weakness.recent7DaysCount}</strong>
                <small>依作答時間統計</small>
              </div>
            </div>

            <div className="weakness-block">
              <h3>錯題最多的觀念</h3>
              {!weakness.topWrongTopics.length && <p className="empty-state small">目前沒有錯題觀念可分析。</p>}
              {weakness.topWrongTopics.map((topic) => (
                <div className="row-stat" key={topic.name}>
                  <span>{topic.name}</span>
                  <strong>錯 {topic.wrong} 題 / {topic.accuracy}%</strong>
                </div>
              ))}
            </div>

            <div className="weakness-block">
              <h3>建議複習方向</h3>
              <ul className="weakness-suggestions">
                {weakness.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <section className="question-card compact-card">
        <h2>申論題熟悉度</h2>
        {Object.entries(familiarityCounts).map(([label, count]) => (
          <div className="row-stat" key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </section>
    </Layout>
  );
}
