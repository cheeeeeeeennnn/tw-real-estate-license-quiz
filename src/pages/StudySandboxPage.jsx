import Layout from '../components/Layout.jsx';
import { getStudyUnits } from '../utils/studyUnits';
import { validateStudyUnit } from '../utils/validateStudyUnit';

const sampleUnit = getStudyUnits()[0];
const validation = validateStudyUnit(sampleUnit);

export default function StudySandboxPage() {
  return (
    <Layout title="講義內容 Sandbox" subtitle="開發用資料格式檢查與預覽" backTo="/">
      <section className="sandbox-warning-card">
        <strong>開發用隱藏頁面</strong>
        <p>此頁只用來檢查講義單元資料格式與預覽整理成果，不會修改正式資料，也不會呼叫外部 AI API。</p>
      </section>

      <section className="lecture-detail-card">
        <h2>格式檢查結果</h2>
        {validation.isValid && !validation.warningFields.length ? (
          <p className="validation-success">講義單元資料格式檢查通過</p>
        ) : validation.isValid ? (
          <div className="validation-notice">
            <strong>講義單元資料格式檢查通過，但有待補欄位</strong>
            <p>draft placeholder 可保留待補內容；reviewed / published 資料仍會嚴格檢查。</p>
            <ul>
              {validation.warningFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="validation-warning">
            <strong>缺少必要欄位</strong>
            <ul>
              {validation.missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="lecture-detail-card">
        <h2>範例 studyUnit JSON</h2>
        <pre className="json-preview">{JSON.stringify(sampleUnit, null, 2)}</pre>
      </section>

      <section className="lecture-detail-card">
        <h2>講義單元預覽</h2>
        <div className="lecture-unit-header">
          <span>第 {sampleUnit.unitNo} 單元</span>
          <strong>{sampleUnit.unitTitle}</strong>
        </div>
        <div className="lecture-unit-meta">
          <span>{sampleUnit.lectureSubject}</span>
          <span>{sampleUnit.courseSubject}</span>
          <span>{sampleUnit.unitGroup}</span>
          <span>{sampleUnit.draftStatus}</span>
        </div>
        <p className="lecture-summary-text">{sampleUnit.summary}</p>
      </section>

      <section className="lecture-detail-card">
        <h2>講義來源檔案</h2>
        <div className="source-chip-list">
          {sampleUnit.sourceFiles.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>
      </section>

      <section className="lecture-detail-card">
        <h2>Prompt Routing Tags</h2>
        <div className="keyword-list">
          {sampleUnit.routingTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className="lecture-detail-card">
        <h2>資料來源</h2>
        <ul className="lecture-detail-list">
          {sampleUnit.sourceRefs.map((ref) => (
            <li key={ref}>{ref}</li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
