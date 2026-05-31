const REQUIRED_FIELDS = [
  'id',
  'lectureSubject',
  'courseSubject',
  'sourceFolder',
  'unitNo',
  'unitTitle',
  'unitGroup',
  'learningGoals',
  'keyConcepts',
  'importantArticles',
  'examFocus',
  'summary',
  'routingTags',
  'draftStatus',
];

const DRAFT_WARNING_FIELDS = [
  'learningGoals',
  'keyConcepts',
  'importantArticles',
  'examFocus',
];

function isMissingValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function validateStudyUnit(unit) {
  const isDraft = unit?.draftStatus === 'draft';
  const missingFields = [];
  const warningFields = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (!isMissingValue(unit?.[field])) return;

    if (isDraft && DRAFT_WARNING_FIELDS.includes(field)) {
      warningFields.push(field);
      return;
    }

    missingFields.push(field);
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warningFields,
    checkedFields: REQUIRED_FIELDS,
  };
}

export { REQUIRED_FIELDS as STUDY_UNIT_REQUIRED_FIELDS };
