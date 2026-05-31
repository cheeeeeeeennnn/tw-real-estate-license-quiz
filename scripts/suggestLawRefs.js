import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const bankRoot = path.join(projectRoot, 'src/data/question-bank/years');
const lawsPath = path.join(projectRoot, 'src/data/laws.json');
const reportPath = path.join(projectRoot, 'src/data/law-ref-suggestions.json');
const shouldWrite = process.argv.includes('--write');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function listJsonFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listJsonFiles(fullPath);
      return entry.isFile() && entry.name.endsWith('.json') ? [fullPath] : [];
    })
    .sort();
}

function articlePattern(article) {
  const escaped = article.replace('-', '(?:之|-)');
  return new RegExp(`第\\s*${escaped}\\s*條`);
}

function buildLawIndex(laws) {
  return laws.map((law) => ({
    ...law,
    articleRegex: articlePattern(law.article),
  }));
}

function questionText(question) {
  return [
    question.subject,
    question.topic,
    question.question,
    question.explanation,
    question.referenceAnswer,
    ...(question.keywords || []),
    ...Object.values(question.options || {}),
  ]
    .filter(Boolean)
    .join('\n');
}

function findExplicitLawRefs(question, lawIndex) {
  const text = questionText(question);
  return lawIndex
    .filter((law) => {
      const codeMentioned = text.includes(law.codeName);
      const articleMentioned = law.articleRegex.test(text);
      return codeMentioned && articleMentioned;
    })
    .map((law) => law.id);
}

function applySuggestions() {
  const laws = buildLawIndex(readJson(lawsPath));
  const suggestions = [];
  let updatedCount = 0;

  for (const filePath of listJsonFiles(bankRoot)) {
    const questions = readJson(filePath);
    let changed = false;

    for (const question of questions) {
      const existingRefs = new Set(question.lawRefs || []);
      const refs = findExplicitLawRefs(question, laws).filter((id) => !existingRefs.has(id));

      if (refs.length > 0) {
        suggestions.push({
          id: question.id,
          year: question.year,
          subject: question.subject,
          topic: question.topic,
          suggestedLawRefs: refs,
          file: path.relative(projectRoot, filePath),
          confidence: 'high',
          reason: '題目或解析文字同時出現法規名稱與第幾條。',
        });

        if (shouldWrite) {
          question.lawRefs = Array.from(new Set([...(question.lawRefs || []), ...refs]));
          changed = true;
          updatedCount += 1;
        }
      }
    }

    if (shouldWrite && changed) {
      writeJson(filePath, questions);
    }
  }

  writeJson(reportPath, suggestions);

  if (shouldWrite && updatedCount > 0) {
    const result = spawnSync(process.execPath, [path.join(projectRoot, 'scripts/buildQuestionBank.js')], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    if (result.status !== 0) process.exit(result.status || 1);
  }

  console.log(
    `${shouldWrite ? 'Applied' : 'Found'} ${suggestions.length} high-confidence law reference suggestions.`
  );
  console.log(`Report: ${path.relative(projectRoot, reportPath)}`);
}

applySuggestions();
