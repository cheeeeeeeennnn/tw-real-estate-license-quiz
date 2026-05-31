import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { getLectureSubjectUnitCount, LECTURE_SUBJECTS } from '../utils/studyUnits';

export default function LectureReviewPage() {
  return (
    <Layout title="講義章節複習" subtitle="依講義章節建立複習路線" backTo="/">
      <section className="lecture-subject-list">
        {LECTURE_SUBJECTS.map((subject) => (
          <article className="lecture-subject-card" key={subject.slug}>
            <div>
              <h2>{subject.name}</h2>
              <p>{subject.description}</p>
              <span>{getLectureSubjectUnitCount(subject.name)} 個單元</span>
            </div>
            <Link className="primary-button link-button" to={`/lecture-review/${subject.slug}`}>
              查看單元
            </Link>
          </article>
        ))}
      </section>
    </Layout>
  );
}
