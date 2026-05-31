import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const bankRoot = path.join(projectRoot, 'src/data/question-bank');
const yearsRoot = path.join(bankRoot, 'years');
const outputPath = path.join(projectRoot, 'src/data/questions.json');

const subjectOrder = ['民法概要', '土地法與土地相關稅法概要', '不動產估價概要', '不動產經紀相關法規概要'];
const typeOrder = ['essay', 'choice'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(dirPath, entry.name));
}

function getYearDirs() {
  if (!fs.existsSync(yearsRoot)) return [];
  return fs
    .readdirSync(yearsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{3}$/.test(entry.name))
    .map((entry) => path.join(yearsRoot, entry.name));
}

const questions = getYearDirs().flatMap((yearDir) => {
  return getJsonFiles(yearDir).flatMap((filePath) => {
    const data = readJson(filePath);
    if (!Array.isArray(data)) {
      throw new Error(`${path.relative(projectRoot, filePath)} must contain a JSON array.`);
    }
    return data;
  });
});

questions.sort((a, b) => {
  return (
    a.year - b.year ||
    subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject) ||
    typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) ||
    a.number - b.number ||
    a.id.localeCompare(b.id)
  );
});

fs.writeFileSync(outputPath, `${JSON.stringify(questions, null, 2)}\n`);
console.log(`Built ${path.relative(projectRoot, outputPath)} from ${questions.length} questions.`);
