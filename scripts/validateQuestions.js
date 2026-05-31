import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questionsPath = path.resolve(__dirname, '../src/data/questions.json');
const lawsPath = path.resolve(__dirname, '../src/data/laws.json');

const optionKeys = ['A', 'B', 'C', 'D'];
const baseRequired = ['id', 'year', 'exam', 'subject', 'type', 'number', 'topic', 'question', 'source'];
const choiceRequired = [...baseRequired, 'options', 'answer', 'explanation'];
const essayRequired = [...baseRequired, 'referenceAnswer', 'keywords'];

function readQuestions() {
  const raw = fs.readFileSync(questionsPath, 'utf8');
  return JSON.parse(raw);
}

function readLaws() {
  const raw = fs.readFileSync(lawsPath, 'utf8');
  return JSON.parse(raw);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function validate() {
  const errors = [];
  const questions = readQuestions();
  const laws = readLaws();
  const lawIds = new Set(laws.map((law) => law.id));

  if (!Array.isArray(questions)) {
    throw new Error('questions.json 必須是陣列。');
  }

  const seenIds = new Set();

  questions.forEach((question, index) => {
    const label = question.id || `第 ${index + 1} 筆`;

    if (seenIds.has(question.id)) {
      errors.push(`${label}: id 重複。`);
    }
    if (question.id) seenIds.add(question.id);

    if (!hasValue(question.year)) errors.push(`${label}: year 缺漏。`);
    if (!hasValue(question.subject)) errors.push(`${label}: subject 缺漏。`);
    if (!hasValue(question.type)) errors.push(`${label}: type 缺漏。`);

    if (!['choice', 'essay'].includes(question.type)) {
      errors.push(`${label}: type 必須是 choice 或 essay。`);
      return;
    }

    const required = question.type === 'choice' ? choiceRequired : essayRequired;
    required.forEach((field) => {
      if (!hasValue(question[field])) errors.push(`${label}: 必填欄位 ${field} 缺漏。`);
    });

    if (question.type === 'choice') {
      optionKeys.forEach((key) => {
        if (!hasValue(question.options?.[key])) errors.push(`${label}: 選擇題 options.${key} 缺漏。`);
      });
      if (!optionKeys.includes(question.answer)) {
        errors.push(`${label}: 選擇題 answer 必須是 A/B/C/D。`);
      }
    }

    if (question.type === 'essay' && !hasValue(question.referenceAnswer)) {
      errors.push(`${label}: 申論題 referenceAnswer 缺漏。`);
    }

    if (question.lawRefs !== undefined) {
      if (!Array.isArray(question.lawRefs)) {
        errors.push(`${label}: lawRefs 必須是法條 id 字串陣列。`);
      } else {
        question.lawRefs.forEach((lawId) => {
          if (typeof lawId !== 'string') {
            errors.push(`${label}: lawRefs 只能放法條 id 字串。`);
          } else if (!lawIds.has(lawId)) {
            errors.push(`${label}: lawRefs 參照不存在的法條 ${lawId}。`);
          }
        });
      }
    }
  });

  return errors;
}

const errors = validate();

if (errors.length > 0) {
  console.error('題庫驗證失敗：');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`題庫驗證成功：${readQuestions().length} 題。`);
