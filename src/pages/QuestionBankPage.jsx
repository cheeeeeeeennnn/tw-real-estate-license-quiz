import Layout from '../components/Layout.jsx';
import StatGrid from '../components/StatGrid.jsx';
import { useQuestionData } from '../context/QuestionDataContext.jsx';
import { getImportReportRows, getQuestionBankSummary } from '../utils/questionBankStats';

export default function QuestionBankPage() {
  const { importReport, questions } = useQuestionData();
  const summary = getQuestionBankSummary(questions);
  const rows = getImportReportRows(importReport);
  const reviewRows = rows.filter((row) => row.needsReview);

  return (
    <Layout title="題庫總覽" subtitle="103 至 114 年歷屆試題匯入狀態">
      <StatGrid
        items={[
          { label: '總題數', value: summary.total },
          { label: '選擇題', value: summary.choiceCount },
          { label: '申論題', value: summary.essayCount },
          { label: '待校正', value: summary.placeholderCount },
        ]}
      />

      <section className="question-card compact-card">
        <h2>收錄年度</h2>
        <div className="keyword-list">
          {summary.years.map((year) => (
            <span key={year}>{year} 年</span>
          ))}
        </div>
      </section>

      <section className="question-card compact-card">
        <h2>待校正項目</h2>
        {!reviewRows.length && <p className="empty-state small">目前沒有待校正項目。</p>}
        {reviewRows.map((row) => (
          <div className="row-stat" key={`${row.year}-${row.subject}`}>
            <span>
              {row.year} 年 {row.subject}
            </span>
            <strong>{row.placeholderChoiceCount || 0} 題</strong>
          </div>
        ))}
      </section>

      <section className="question-card compact-card">
        <h2>年度科目明細</h2>
        {rows.map((row) => (
          <div className="row-stat" key={`${row.year}-${row.subject}-all`}>
            <span>
              {row.year} 年 {row.subject}
            </span>
            <strong>
              選擇 {row.answerCount} / 申論 {row.essayCount}
            </strong>
          </div>
        ))}
      </section>
    </Layout>
  );
}
