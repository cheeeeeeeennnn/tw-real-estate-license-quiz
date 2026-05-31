#!/usr/bin/env node

/**
 * Future study unit build script skeleton.
 *
 * Purpose:
 * - Convert curated lecture Markdown files into src/data/study/studyUnits.json.
 * - Keep generated study units out of React components.
 * - Let humans review draft output before publishing it in the app.
 *
 * Planned flow:
 * 1. Read Markdown files from a local input folder, for example:
 *    data/study-import/*.md
 * 2. Parse frontmatter-like metadata:
 *    lectureSubject, courseSubject, sourceFolder, sourceFiles, unitNo,
 *    unitTitle, unitGroup, routingTags, draftStatus.
 * 3. Parse Markdown sections:
 *    learningGoals, keyConcepts, importantArticles, examFocus,
 *    commonConfusions, summary, relatedQuestionIds, reviewQuestions,
 *    sourceRefs.
 * 4. Validate each unit with src/utils/validateStudyUnit.js or a Node-safe
 *    copy of the same required-field rules.
 * 5. Write draft output to a sandbox file first, for example:
 *    src/data/study/studyUnits.sandbox.json
 * 6. After manual review, copy approved units into:
 *    src/data/study/studyUnits.json
 *
 * This script intentionally does not:
 * - Connect to Google Drive.
 * - Call external AI APIs.
 * - Execute user-provided code.
 * - Modify production studyUnits.json without an explicit future command.
 */

console.log('buildStudyUnits.js is a skeleton. No files were changed.');
