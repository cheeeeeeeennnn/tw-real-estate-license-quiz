export default function FilterBar({ filters, options, onChange, showSubject = true }) {
  return (
    <section className="filter-bar" aria-label="篩選題目">
      <label>
        年度
        <select value={filters.year} onChange={(event) => onChange({ ...filters, year: event.target.value })}>
          <option value="all">全部</option>
          {options.years.map((year) => (
            <option key={year} value={year}>
              {year} 年
            </option>
          ))}
        </select>
      </label>

      {showSubject && (
        <label>
          科目
          <select value={filters.subject} onChange={(event) => onChange({ ...filters, subject: event.target.value })}>
            <option value="all">全部</option>
            {options.subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        主題
        <select value={filters.topic} onChange={(event) => onChange({ ...filters, topic: event.target.value })}>
          <option value="all">全部</option>
          {options.topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
