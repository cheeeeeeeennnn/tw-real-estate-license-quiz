export const SUBJECTS = [
  { slug: 'civil', name: '民法概要', shortName: '民法' },
  { slug: 'land-tax', name: '土地法與土地相關稅法概要', shortName: '土地法與稅法' },
  { slug: 'valuation', name: '不動產估價概要', shortName: '估價' },
  { slug: 'broker-law', name: '不動產經紀相關法規概要', shortName: '經紀法規' },
];

export const SUBJECT_BY_SLUG = Object.fromEntries(SUBJECTS.map((subject) => [subject.slug, subject]));
export const SUBJECT_BY_NAME = Object.fromEntries(SUBJECTS.map((subject) => [subject.name, subject]));
