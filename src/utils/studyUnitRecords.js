export const STUDY_UNIT_RECORDS_KEY = 'studyUnitRecords';

export function createEmptyStudyUnitRecord(unit) {
  return {
    unitId: unit.id,
    lectureSubject: unit.lectureSubject,
    isRead: false,
    isBookmarked: false,
    familiarityLevel: 0,
    lastReviewedAt: '',
    reviewCount: 0,
  };
}

export function getStudyUnitRecord(records, unit) {
  return records[unit.id] || createEmptyStudyUnitRecord(unit);
}

function touchReview(record) {
  return {
    ...record,
    lastReviewedAt: new Date().toISOString(),
    reviewCount: (record.reviewCount || 0) + 1,
  };
}

export function updateStudyUnitRecord(records, unit, changes, options = {}) {
  const current = getStudyUnitRecord(records, unit);
  const next = {
    ...current,
    ...changes,
    unitId: unit.id,
    lectureSubject: unit.lectureSubject,
  };

  return {
    ...records,
    [unit.id]: options.touch ? touchReview(next) : next,
  };
}

export function formatReviewedAt(value) {
  if (!value) return '尚無紀錄';

  try {
    return new Intl.DateTimeFormat('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '尚無紀錄';
  }
}

export function formatFamiliarity(level) {
  return level ? `${level} / 5` : '未評分';
}
