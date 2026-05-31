import { useState } from 'react';
import { buildLawRelationList } from '../utils/buildLawRelationList';
import { explainLawPlainly } from '../utils/explainLawPlainly';
import { getLawsByRefs } from '../utils/laws';

const CONTENT_LIMIT = 120;

function LawText({ law }) {
  const [expanded, setExpanded] = useState(false);
  const fullText = (law.text || []).join('\n');
  const shouldCollapse = fullText.length > CONTENT_LIMIT;
  const visibleText = shouldCollapse && !expanded ? `${fullText.slice(0, CONTENT_LIMIT)}...` : fullText;

  return (
    <div className="law-content">
      <p>{visibleText}</p>
      {shouldCollapse && (
        <button className="text-button law-toggle" type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? '收合' : '展開全文'}
        </button>
      )}
    </div>
  );
}

export default function LawReferenceCard({
  lawRefs = [],
  laws,
  compact = false,
  title = '相關法條',
  emptyMessage = '這題尚未標記對應法條。',
}) {
  const relatedLaws = laws || getLawsByRefs(lawRefs);
  const lawRelations = buildLawRelationList(relatedLaws);

  if (!relatedLaws.length) {
    return compact ? null : (
      <section className="law-card muted-law-card">
        <h3>{title}</h3>
        <p>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="law-card">
      <h3>{title}</h3>
      <div className="law-list">
        {relatedLaws.map((law) => (
          <article className="law-item" key={law.id}>
            <div className="law-heading">
              <strong>
                {law.codeName} 第 {law.article} 條
              </strong>
              <span>{law.title}</span>
            </div>
            {law.matchReason && <p className="law-match-reason">匹配原因：{law.matchReason}</p>}
            <LawText law={law} />
            <div className="law-plain-explanation">
              <strong>白話解釋</strong>
              <p>{explainLawPlainly(law)}</p>
            </div>
            {law.note && <p className="law-note">{law.note}</p>}
            {law.sourceUrl && (
              <a className="law-link" href={law.sourceUrl} target="_blank" rel="noreferrer">
                查看法規來源
              </a>
            )}
          </article>
        ))}
      </div>
      {!!lawRelations.length && (
        <div className="law-relation-card">
          <h4>相關法條關聯</h4>
          <div className="law-relation-list">
            {lawRelations.map((relation) => (
              <article className="law-relation-item" key={relation.id}>
                <strong>
                  {relation.firstLabel} ↔ {relation.secondLabel}
                </strong>
                <p>關聯原因：{relation.reason}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
