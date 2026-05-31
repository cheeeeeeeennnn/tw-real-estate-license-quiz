import { Navigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getStudyUnitById, LECTURE_SUBJECT_BY_SLUG } from '../utils/studyUnits';
import {
  formatFamiliarity,
  formatReviewedAt,
  getStudyUnitRecord,
  STUDY_UNIT_RECORDS_KEY,
  updateStudyUnitRecord,
} from '../utils/studyUnitRecords';

function EmptyText({ children = '待補充' }) {
  return <p className="empty-state small">{children}</p>;
}

function ListSection({ title, items, renderItem }) {
  return (
    <section className="lecture-detail-card">
      <h2>{title}</h2>
      {items?.length ? (
        <ul className="lecture-detail-list">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{renderItem ? renderItem(item, index) : item}</li>
          ))}
        </ul>
      ) : (
        <EmptyText />
      )}
    </section>
  );
}

function TextSection({ title, children }) {
  return (
    <section className="lecture-detail-card">
      <h2>{title}</h2>
      {children || <EmptyText />}
    </section>
  );
}

export default function LectureUnitPage() {
  const { lectureSubjectSlug, unitId } = useParams();
  const lectureSubject = LECTURE_SUBJECT_BY_SLUG[lectureSubjectSlug];
  const unit = getStudyUnitById(unitId);
  const [records, setRecords] = useLocalStorage(STUDY_UNIT_RECORDS_KEY, {});

  if (!lectureSubject) return <Navigate to="/lecture-review" replace />;
  if (!unit) return <Navigate to={`/lecture-review/${lectureSubjectSlug}`} replace />;

  const record = getStudyUnitRecord(records, unit);

  function updateRecord(changes, options) {
    setRecords(updateStudyUnitRecord(records, unit, changes, options));
  }

  return (
    <Layout title={unit.unitTitle} subtitle={lectureSubject.name} backTo={`/lecture-review/${lectureSubjectSlug}`}>
      <section className="lecture-detail-card lecture-overview-card">
        <div className="lecture-unit-header">
          <span>第 {unit.unitNo} 單元</span>
          <strong>{unit.unitTitle}</strong>
        </div>

        <div className="lecture-unit-meta">
          <span>{unit.lectureSubject}</span>
          <span>{unit.courseSubject}</span>
          <span>{unit.unitGroup}</span>
          <span>{unit.draftStatus}</span>
        </div>

        {!!unit.routingTags?.length && (
          <div className="keyword-list">
            {unit.routingTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </section>

      <section className="lecture-detail-card review-status-card">
        <h2>複習紀錄</h2>
        <div className="review-status-grid">
          <span>閱讀狀態：{record.isRead ? '已讀' : '尚未閱讀'}</span>
          <span>收藏狀態：{record.isBookmarked ? '已收藏' : '未收藏'}</span>
          <span>熟悉度：{formatFamiliarity(record.familiarityLevel)}</span>
          <span>最近複習：{formatReviewedAt(record.lastReviewedAt)}</span>
          <span>複習次數：{record.reviewCount || 0}</span>
        </div>
        <div className="review-action-grid">
          <button
            className={record.isRead ? 'secondary-button' : 'primary-button'}
            type="button"
            onClick={() => updateRecord({ isRead: !record.isRead }, { touch: true })}
          >
            {record.isRead ? '取消已讀' : '標記已讀'}
          </button>
          <button
            className={record.isBookmarked ? 'secondary-button' : 'primary-button'}
            type="button"
            onClick={() => updateRecord({ isBookmarked: !record.isBookmarked }, { touch: true })}
          >
            {record.isBookmarked ? '取消收藏' : '收藏'}
          </button>
        </div>
        <label className="familiarity-control">
          熟悉度自評
          <select
            value={record.familiarityLevel}
            onChange={(event) => updateRecord({ familiarityLevel: Number(event.target.value) }, { touch: true })}
          >
            <option value={0}>尚未評分</option>
            <option value={1}>1 - 很不熟</option>
            <option value={2}>2 - 需要複習</option>
            <option value={3}>3 - 普通</option>
            <option value={4}>4 - 熟悉</option>
            <option value={5}>5 - 已掌握</option>
          </select>
        </label>
      </section>

      <TextSection title="講義來源檔案">
        {unit.sourceFiles?.length ? (
          <div className="source-chip-list">
            {unit.sourceFiles.map((file) => (
              <span key={file}>{file}</span>
            ))}
          </div>
        ) : null}
      </TextSection>

      <ListSection title="本單元學習目標" items={unit.learningGoals} />
      <ListSection title="核心觀念" items={unit.keyConcepts} />

      <section className="lecture-detail-card">
        <h2>重要法條</h2>
        {unit.importantArticles?.length ? (
          <div className="lecture-article-list">
            {unit.importantArticles.map((article, index) => (
              <article className="lecture-article-card" key={`${article.lawName}-${article.articleNo}-${index}`}>
                <strong>
                  {article.lawName} {article.articleNo}
                </strong>
                <p>{article.summary || article.content || article.reason || '本法條重點待補充。'}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyText />
        )}
      </section>

      <ListSection title="常考重點" items={unit.examFocus} />

      <section className="lecture-detail-card">
        <h2>易混淆觀念</h2>
        {unit.commonConfusions?.length ? (
          <div className="confusion-list">
            {unit.commonConfusions.map((item, index) => (
              <article className="confusion-card" key={`${item.confusion}-${index}`}>
                <div>
                  <span>容易混淆</span>
                  <strong>{item.confusion}</strong>
                </div>
                <div>
                  <span>辨別方式</span>
                  <p>{item.clarification || '待補充'}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyText />
        )}
      </section>

      <TextSection title="單元摘要">
        {unit.summary ? <p className="lecture-summary-text">{unit.summary}</p> : null}
      </TextSection>

      <section className="lecture-detail-card">
        <h2>單元小測驗</h2>
        {unit.reviewQuestions?.length ? (
          <div className="review-question-list">
            {unit.reviewQuestions.map((question, index) => (
              <details className="review-question-card" key={`${question.question}-${index}`}>
                <summary>
                  {index + 1}. {question.question}
                </summary>
                <div>
                  <strong>答案</strong>
                  <p>{question.answer || '待補充'}</p>
                  {question.explanation && (
                    <>
                      <strong>解析</strong>
                      <p>{question.explanation}</p>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <EmptyText />
        )}
      </section>

      <ListSection title="資料來源" items={unit.sourceRefs} />
    </Layout>
  );
}
