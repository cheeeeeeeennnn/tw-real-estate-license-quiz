import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { SUBJECT_BY_SLUG } from '../constants/subjects';
import { filterLaws, getAllLaws, getLawFilterOptions } from '../utils/laws';

const initialFilters = { code: 'all', topic: 'all', keyword: '' };

export default function LawLibraryPage() {
  const { subjectSlug } = useParams();
  const subject = SUBJECT_BY_SLUG[subjectSlug];
  const [filters, setFilters] = useState(initialFilters);

  if (!subject) return <Navigate to="/" replace />;

  const subjectLaws = useMemo(
    () => getAllLaws().filter((law) => law.subjectSlugs?.includes(subjectSlug)),
    [subjectSlug],
  );
  const options = useMemo(() => getLawFilterOptions(subjectLaws), [subjectLaws]);
  const filteredLaws = useMemo(() => filterLaws(subjectLaws, filters), [subjectLaws, filters]);

  return (
    <Layout title="法條庫" subtitle={subject.name} backTo={`/subject/${subjectSlug}`}>
      <section className="filter-bar">
        <label>
          法規
          <select value={filters.code} onChange={(event) => setFilters({ ...filters, code: event.target.value })}>
            <option value="all">全部</option>
            {options.codes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label>
          主題
          <select value={filters.topic} onChange={(event) => setFilters({ ...filters, topic: event.target.value })}>
            <option value="all">全部</option>
            {options.topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>
        <label>
          關鍵字
          <input
            value={filters.keyword}
            onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
            placeholder="搜尋法規、條號或關鍵字"
          />
        </label>
      </section>

      {!filteredLaws.length && <p className="empty-state">目前沒有符合條件的法條。</p>}

      <section className="stack">
        {filteredLaws.map((law) => (
          <article className="law-card" key={law.id}>
            <div className="law-heading">
              <strong>
                {law.codeName} 第 {law.article} 條
              </strong>
              <span>{law.title}</span>
            </div>
            <div className="keyword-list">
              {law.topics.map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>
            <ol>
              {law.text.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
            <p className="law-note">{law.note}</p>
            <a className="law-link" href={law.sourceUrl} target="_blank" rel="noreferrer">
              查看法規來源
            </a>
          </article>
        ))}
      </section>
    </Layout>
  );
}
