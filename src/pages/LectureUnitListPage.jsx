import { Link, Navigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatFamiliarity, getStudyUnitRecord, STUDY_UNIT_RECORDS_KEY } from '../utils/studyUnitRecords';
import {
  getStudyUnitsByLectureSubject,
  LECTURE_SUBJECT_BY_SLUG,
  truncateText,
} from '../utils/studyUnits';

export default function LectureUnitListPage() {
  const { lectureSubjectSlug } = useParams();
  const lectureSubject = LECTURE_SUBJECT_BY_SLUG[lectureSubjectSlug];
  const [records] = useLocalStorage(STUDY_UNIT_RECORDS_KEY, {});

  if (!lectureSubject) return <Navigate to="/lecture-review" replace />;

  const units = getStudyUnitsByLectureSubject(lectureSubject.name);

  return (
    <Layout title={lectureSubject.name} subtitle="依講義原本編排複習" backTo="/lecture-review">
      {!units.length && <p className="empty-state">目前尚未建立此講義分類的單元。</p>}

      <section className="lecture-unit-list">
        {units.map((unit) => {
          const record = getStudyUnitRecord(records, unit);

          return (
            <article className="lecture-unit-card" key={unit.id}>
              <div className="lecture-unit-header">
                <span>第 {unit.unitNo} 單元</span>
                <strong>{unit.unitTitle}</strong>
              </div>

              <div className="lecture-unit-meta">
                <span>{unit.courseSubject}</span>
                <span>{unit.unitGroup}</span>
                <span>{unit.draftStatus}</span>
                <span>{record.isRead ? '已讀' : '尚未閱讀'}</span>
                {record.isBookmarked && <span>已收藏</span>}
                <span>熟悉度：{formatFamiliarity(record.familiarityLevel)}</span>
              </div>

              <p>{truncateText(unit.summary || '此單元內容待補充。')}</p>

              {!!unit.routingTags?.length && (
                <div className="keyword-list">
                  {unit.routingTags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              <Link className="primary-button link-button" to={`/lecture-review/${lectureSubjectSlug}/${unit.id}`}>
                進入單元
              </Link>
            </article>
          );
        })}
      </section>
    </Layout>
  );
}
