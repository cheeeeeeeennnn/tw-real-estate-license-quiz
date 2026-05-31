import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

const MODES = [
  {
    to: '/past-exams',
    title: '歷屆試題練習',
    description: '依科目、年度與主題練習選擇題、申論題，並查看錯題與學習統計。',
    action: '進入歷屆試題',
  },
  {
    to: '/lecture-review',
    title: '講義章節複習',
    description: '依講義原本章節編排複習重點、觀念與常考內容。',
    action: '進入章節複習',
  },
];

export default function StudyModePage() {
  return (
    <Layout title="不動產經紀人證照複習" subtitle="選擇今天的學習方式">
      <section className="study-mode-list">
        {MODES.map((mode) => (
          <article className="study-mode-card" key={mode.to}>
            <div>
              <h2>{mode.title}</h2>
              <p>{mode.description}</p>
            </div>
            <Link className="primary-button link-button" to={mode.to}>
              {mode.action}
            </Link>
          </article>
        ))}
      </section>
    </Layout>
  );
}
