import studyUnits from '../data/study/studyUnits.json';

export const LECTURE_SUBJECTS = [
  {
    slug: 'land-tax',
    name: '土地法與土地稅法講義',
    description: '依土地法與土地相關稅法講義、合併複習版、三段式複習版整理。',
  },
  {
    slug: 'civil',
    name: '民法講義及補充資料',
    description: '依民法總則、債編、物權、親屬繼承、重點法條與合併複習版整理。',
  },
  {
    slug: 'valuation',
    name: '不動產估價講義',
    description: '依估價概要、估價技術規則、課堂案例與合併複習版整理。',
  },
  {
    slug: 'broker-law',
    name: '不動產經紀相關法規',
    description: '目前講義來源待確認，可先保留入口。',
  },
  {
    slug: 'misc',
    name: '其他單獨講義',
    description: '放置尚未歸類的單獨 PDF 或補充資料。',
  },
];

export const LECTURE_SUBJECT_BY_SLUG = Object.fromEntries(LECTURE_SUBJECTS.map((subject) => [subject.slug, subject]));

export function getStudyUnits() {
  return studyUnits;
}

export function getStudyUnitsByLectureSubject(lectureSubject) {
  return studyUnits
    .filter((unit) => unit.lectureSubject === lectureSubject)
    .sort((a, b) => a.unitNo - b.unitNo || a.unitTitle.localeCompare(b.unitTitle, 'zh-Hant'));
}

export function getStudyUnitById(unitId) {
  return studyUnits.find((unit) => unit.id === unitId);
}

export function getLectureSubjectUnitCount(lectureSubject) {
  return studyUnits.filter((unit) => unit.lectureSubject === lectureSubject).length;
}

export function truncateText(text = '', maxLength = 80) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
