import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { SUBJECTS } from '../constants/subjects';
import { useQuestionData } from '../context/QuestionDataContext.jsx';
import { getQuestionBankSummary } from '../utils/questionBankStats';

export default function HomePage() {
  const { questions } = useQuestionData();
  const summary = getQuestionBankSummary(questions);

  return (
    <Layout title="不動產經紀人證照複習" subtitle="選擇科目開始練習">
      <section className="question-card compact-card home-summary">
        <h2>歷屆題庫</h2>
        <p>
          已收錄 {summary.years[0]} 至 {summary.years[summary.years.length - 1]} 年，共 {summary.total} 題。
        </p>
        <Link className="secondary-button link-button" to="/question-bank">
          查看題庫總覽
        </Link>
      </section>

      <section className="subject-grid">
        {SUBJECTS.map((subject) => (
          <Link className="subject-card" key={subject.slug} to={`/subject/${subject.slug}`}>
            <span>{subject.shortName}</span>
            <strong>{subject.name}</strong>
          </Link>
        ))}
      </section>
    </Layout>
  );
}
