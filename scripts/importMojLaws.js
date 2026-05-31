import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const lawSourcesPath = path.join(projectRoot, 'src/data/law-sources.json');
const lawsOutputPath = path.join(projectRoot, 'src/data/laws.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function decodeBuffer(buffer) {
  const candidates = ['utf-8', 'big5'].map((encoding) => {
    const text = new TextDecoder(encoding).decode(buffer);
    const replacementCount = (text.match(/\uFFFD/g) || []).length;
    return { text, replacementCount };
  });
  candidates.sort((a, b) => a.replacementCount - b.replacementCount);
  return candidates[0].text;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 law-importer for exam review app',
      accept: 'text/html,application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }

  return decodeBuffer(await response.arrayBuffer());
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

function htmlToText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<(br|p|div|tr|li|h[1-6])\b[^>]*>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeText(text) {
  return text
    .replace(/不/g, '不')
    .replace(/年/g, '年')
    .replace(/類/g, '類')
    .replace(/列/g, '列')
    .replace(/論/g, '論')
    .replace(/行/g, '行')
    .replace(/理/g, '理')
    .replace(/說/g, '說')
    .replace(/量/g, '量')
    .replace(/率/g, '率')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugArticle(articleNo) {
  return String(articleNo)
    .replace(/^第\s*/, '')
    .replace(/\s*條.*$/, '')
    .replace(/[之－—]/g, '-')
    .replace(/[^\dA-Za-z-]/g, '');
}

function displayArticle(articleNo) {
  return slugArticle(articleNo).replace(/-/g, '-');
}

function articleSortValue(article) {
  return String(article.article)
    .split('-')
    .reduce((total, part, index) => total + Number(part || 0) / 1000 ** index, 0);
}

function extractRevisionDate(text) {
  const match = text.match(/修正日期[：:]\s*([^\n]+)/);
  return match?.[1]?.trim() || '';
}

function extractLawName(text, fallback) {
  const match = text.match(/法規名稱[：:]\s*([^\n]+)/);
  return match?.[1]?.trim() || fallback;
}

function cleanArticleLines(content) {
  return normalizeText(content)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^第\s*[一二三四五六七八九十]+\s*[編章節款目]/.test(line))
    .filter((line) => !/^法規名稱[：:]/.test(line))
    .filter((line) => !/^修正日期[：:]/.test(line));
}

function parseLawText(text, source) {
  const normalized = normalizeText(text);
  const codeName = extractLawName(normalized, source.codeName);
  const revisionDate = extractRevisionDate(normalized);
  const articles = [];
  const articlePattern = /第\s*(\d+(?:\s*(?:之|-)\s*\d+)?)\s*條(?:\s*[-－—]\s*([^\n]+))?\s*\n?([\s\S]*?)(?=\n?\s*第\s*\d+(?:\s*(?:之|-)\s*\d+)?\s*條(?:\s*[-－—]|\s|\n)|$)/g;

  for (const match of normalized.matchAll(articlePattern)) {
    const article = displayArticle(match[1]);
    const titleSuffix = match[2]?.trim();
    const textLines = cleanArticleLines(match[3]);

    if (!article || textLines.length === 0) continue;

    articles.push({
      id: `${source.code}-${article}`,
      code: source.code,
      codeName,
      article,
      title: titleSuffix ? `${codeName} 第 ${article} 條：${titleSuffix}` : `${codeName} 第 ${article} 條`,
      subjectSlugs: source.subjectSlugs,
      topics: source.defaultTopics,
      keywords: [codeName, `第${article.replace('-', '之')}條`, ...source.defaultTopics],
      text: textLines,
      sourceName: '全國法規資料庫',
      sourceUrl: source.pcode
        ? `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=${source.pcode}&flno=${article}`
        : 'https://law.moj.gov.tw/',
      note: revisionDate
        ? `法條資料由全國法規資料庫匯入，修正日期：${revisionDate}。請以官方最新公告為準。`
        : '法條資料由全國法規資料庫匯入，請以官方最新公告為準。',
    });
  }

  return articles;
}

async function importFromLawAll(source) {
  const url = `https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=${source.pcode}`;
  const html = await fetchText(url);
  const text = html.includes('<') ? htmlToText(html) : html;
  return parseLawText(text, source);
}

async function importSource(source) {
  if (!source.pcode) {
    throw new Error(`${source.codeName} 缺少 pcode`);
  }

  const articles = await importFromLawAll(source);
  if (!articles.length) {
    throw new Error(`${source.codeName} 沒有解析到條文，請檢查全國法規資料庫頁面格式。`);
  }
  return articles;
}

async function main() {
  const sources = readJson(lawSourcesPath);
  const laws = [];
  const failures = [];

  for (const source of sources) {
    try {
      console.log(`Importing ${source.codeName}`);
      laws.push(...(await importSource(source)));
    } catch (error) {
      failures.push(`${source.codeName}: ${error.message}`);
    }
  }

  const uniqueLaws = Array.from(new Map(laws.map((law) => [law.id, law])).values()).sort((a, b) => {
    const codeCompare = a.codeName.localeCompare(b.codeName, 'zh-Hant');
    if (codeCompare !== 0) return codeCompare;
    return articleSortValue(a) - articleSortValue(b);
  });

  if (uniqueLaws.length > 0) {
    writeJson(lawsOutputPath, uniqueLaws);
  }

  if (failures.length > 0) {
    console.warn('\n以下法規未匯入成功：');
    failures.forEach((failure) => console.warn(`- ${failure}`));
  }

  if (!uniqueLaws.length) {
    throw new Error('沒有匯入任何法條；請確認網路可連到 law.moj.gov.tw。');
  }

  console.log(`\nImported ${uniqueLaws.length} law articles to ${path.relative(projectRoot, lawsOutputPath)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
