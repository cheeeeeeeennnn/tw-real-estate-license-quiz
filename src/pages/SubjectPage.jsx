import { Link, Navigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { SUBJECT_BY_SLUG } from '../constants/subjects';

const ACTIONS = [
  { to: 'choice', label: '選擇題練習', description: '依年度、主題刷選擇題' },
  { to: 'essay', label: '申論題練習', description: '練習作答並保存答案' },
  { to: 'wrong-book', label: '錯題本', description: '複習答錯過的題目' },
  { to: 'essay-answers', label: '我的申論答案', description: '查看與修改已儲存答案' },
  { to: 'statistics', label: '學習統計', description: '查看正確率與熟悉度' },
  { to: 'laws', label: '法條庫', description: '查詢本科常用法條' },
];

export default function SubjectPage() {
  const { subjectSlug } = useParams();
  const subject = SUBJECT_BY_SLUG[subjectSlug];

  if (!subject) return <Navigate to="/" replace />;

  return (
    <Layout title={subject.name} subtitle="選擇複習方式">
      <section className="action-list">
        {ACTIONS.map((action) => (
          <Link className="action-card" key={action.to} to={`/subject/${subjectSlug}/${action.to}`}>
            <strong>{action.label}</strong>
            <span>{action.description}</span>
          </Link>
        ))}
      </section>
    </Layout>
  );
}
