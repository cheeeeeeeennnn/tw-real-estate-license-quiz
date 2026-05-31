#!/usr/bin/env python3
import argparse
import json
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as exc:
    raise SystemExit("pypdf is required. Use the Codex bundled Python runtime or install pypdf.") from exc

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BANK_ROOT = PROJECT_ROOT / "src/data/question-bank/years"
RAW_ROOT = PROJECT_ROOT / "src/data/question-bank/raw"
DEFAULT_DOWNLOADS = Path.home() / "Downloads"

SUBJECTS = {
    "民法概要": {"slug": "civil", "topic": "民法綜合題"},
    "土地法與土地相關稅法概要": {"slug": "land-tax", "topic": "土地法與稅法綜合題"},
    "不動產估價概要": {"slug": "valuation", "topic": "估價綜合題"},
    "不動產經紀相關法規概要": {"slug": "broker-law", "topic": "經紀法規綜合題"},
}

SUBJECT_ALIASES = [
    ("土地法與土地相關稅法", "土地法與土地相關稅法概要"),
    ("不動產經紀相關法規", "不動產經紀相關法規概要"),
    ("不動產估價概要", "不動產估價概要"),
    ("民法概要", "民法概要"),
]

OPTION_MARKERS = {
    "\ue18c": "A",
    "\ue18d": "B",
    "\ue18e": "C",
    "\ue18f": "D",
    "\uf08c": "A",
    "\uf08d": "B",
    "\uf08e": "C",
    "\uf08f": "D",
}

CHINESE_NUMERAL_RE = r"[一二三四五六七八九十]+"


def extract_text(pdf_path):
    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def normalize_text(text):
    replacements = {
        "不": "不",
        "年": "年",
        "類": "類",
        "列": "列",
        "論": "論",
        "行": "行",
        "理": "理",
        "說": "說",
        "量": "量",
        "率": "率",
        "利": "利",
        "金": "金",
        "參": "參",
        "若": "若",
        "更": "更",
        "異": "異",
        "數": "數",
        "契": "契",
        "來": "來",
        "良": "良",
        "不動產": "不動產",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def compact_text(text):
    text = normalize_text(text)
    text = re.sub(r"\s*\n\s*", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def infer_subject(file_name, text=""):
    haystack = f"{file_name} {text}"
    for keyword, subject in SUBJECT_ALIASES:
        if keyword in haystack:
            return subject
    return None


def infer_year(file_name, text=""):
    match = re.search(r"(?<!\d)(10[3-9]|11[0-4])(?=\d|年|_)", file_name)
    if match:
        return int(match.group(1))
    match = re.search(r"(10[3-9]|11[0-4])年", text)
    if match:
        return int(match.group(1))
    return None


def classify_file(pdf_path):
    name = pdf_path.name
    if "_ANS" in name:
        kind = "answer"
    elif "_MOD" in name:
        kind = "question_mod"
    else:
        kind = "question"
    subject = infer_subject(name)
    year = infer_year(name)
    if not year or not subject:
        return None
    return {"year": year, "subject": subject, "kind": kind, "path": pdf_path}


def find_exam_pdfs(downloads_root):
    files = []
    for pdf_path in downloads_root.rglob("*.pdf"):
        info = classify_file(pdf_path)
        if info and 103 <= info["year"] <= 114:
            files.append(info)
    return files


def pick_files(files):
    grouped = defaultdict(lambda: {"question": None, "question_mod": None, "answer": None, "answer_mod": None})
    for item in files:
        key = (item["year"], item["subject"])
        if item["kind"] == "answer":
            grouped[key]["answer"] = item["path"]
        elif item["kind"] == "question_mod":
            # MOD files from 考選部 are often answer corrections rather than full question PDFs.
            grouped[key]["question_mod"] = item["path"]
            grouped[key]["answer_mod"] = item["path"]
        elif item["kind"] == "question" and grouped[key]["question"] is None:
            grouped[key]["question"] = item["path"]
    return grouped


def parse_answers(text):
    text = normalize_text(text)
    expected_match = re.search(r"單選題數[：:]\s*(\d+)\s*題", text)
    expected_count = int(expected_match.group(1)) if expected_match else 40
    letters = re.findall(r"(?<![A-Za-z])[ABCD](?![A-Za-z])", text)
    if len(letters) >= expected_count:
        return {index + 1: answer for index, answer in enumerate(letters[:expected_count])}
    return {}


def split_essay_blocks(section):
    section = normalize_text(section)
    pattern = re.compile(rf"({CHINESE_NUMERAL_RE})、")
    matches = list(pattern.finditer(section))
    blocks = []
    for idx, match in enumerate(matches):
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(section)
        body = compact_text(section[start:end])
        body = re.sub(r"^[、，。\s]+", "", body).strip()
        if body and len(body) > 20:
            blocks.append(body)
    return blocks


def parse_essays(text):
    text = normalize_text(text)
    match = re.search(r"甲、申論題部分[：:（(].*?(?=乙、測驗題部分|乙、測驗題|測驗題部分)", text, flags=re.S)
    if not match:
        return []
    return split_essay_blocks(match.group(0))


def normalize_options(block):
    for marker, letter in OPTION_MARKERS.items():
        block = block.replace(marker, f" @@{letter}@@ ")
    # Some PDFs extract options as circled numbers.
    block = block.replace("①", " @@A@@ ").replace("②", " @@B@@ ").replace("③", " @@C@@ ").replace("④", " @@D@@ ")
    return block


def split_fallback_options(block):
    raw_block = block.strip()
    compact_block = re.sub(r"\s+", " ", raw_block).strip()
    split_at = compact_block.find("？")
    if split_at == -1:
        split_at = compact_block.find("?")
    if split_at == -1:
        return None
    question_text = compact_block[: split_at + 1].strip()
    option_text = compact_block[split_at + 1 :].strip()
    if not question_text or not option_text:
        return None

    lines = [line.strip(" ，,") for line in raw_block.split("\n") if line.strip(" ，,")]
    first_option_index = 0
    for idx, line in enumerate(lines):
        if "？" in line or "?" in line:
            first_option_index = idx + 1
            break
    option_lines = lines[first_option_index:]
    candidates = partition_option_lines(option_lines)
    if len(candidates) < 4:
        candidates = re.split(r"(?<=[。；;])\s+| {2,}", option_text)
        candidates = [candidate.strip(" ，,") for candidate in candidates if candidate.strip(" ，,")]
    if len(candidates) < 4:
        words = option_text.split(" ")
        chunk_size = max(1, len(words) // 4)
        candidates = [" ".join(words[i * chunk_size : (i + 1) * chunk_size]).strip() for i in range(3)]
        candidates.append(" ".join(words[3 * chunk_size :]).strip())
    if len(candidates) < 4:
        return None
    options = {
        "A": compact_text(candidates[0]),
        "B": compact_text(candidates[1]),
        "C": compact_text(candidates[2]),
        "D": compact_text(" ".join(candidates[3:])),
    }
    if not all(options.values()):
        return None
    return question_text, options


def partition_option_lines(lines):
    lines = [line for line in lines if line]
    if len(lines) < 4:
        return []
    if len(lines) == 4:
        return lines

    continuation_endings = ("，", "、", "及", "與", "和", "或", "而", "之", "其", "該", "為", "於", "在", "由", "以", "對", "得")

    def score_group(text):
        score = 0
        if text.endswith(("。", "？", "；", "」", "）")):
            score += 3
        if text.endswith(continuation_endings):
            score -= 5
        if len(text) < 4:
            score -= 2
        return score

    best = None
    n = len(lines)
    # Choose 3 split points to create 4 contiguous groups.
    for a in range(1, n - 2):
        for b in range(a + 1, n - 1):
            for c in range(b + 1, n):
                groups = [
                    "".join(lines[:a]),
                    "".join(lines[a:b]),
                    "".join(lines[b:c]),
                    "".join(lines[c:]),
                ]
                score = sum(score_group(group) for group in groups)
                # Avoid one option absorbing too much when a balanced split is possible.
                lengths = [len(group) for group in groups]
                score -= max(lengths) / max(1, min(lengths)) * 0.2
                if best is None or score > best[0]:
                    best = (score, groups)
    return best[1] if best else []


def parse_choice_blocks(text):
    text = normalize_text(text)
    start_match = re.search(r"乙、測驗題部分.*?(?=\n\s*1\s)", text, flags=re.S)
    if start_match:
        text = text[start_match.end() :]
    text = normalize_options(text)
    text = re.sub(r"代號：\s*\d+|頁次：\s*\d+－\d+", " ", text)
    pattern = re.compile(r"(?m)(?:^|\n)\s*(\d{1,2})\s+")
    matches = [m for m in pattern.finditer(text) if 1 <= int(m.group(1)) <= 40]
    questions = []
    seen = set()
    for idx, match in enumerate(matches):
        number = int(match.group(1))
        if number in seen:
            continue
        next_start = None
        for next_match in matches[idx + 1 :]:
            next_number = int(next_match.group(1))
            if next_number > number and next_number <= 40:
                next_start = next_match.start()
                break
        block = text[match.end() : next_start].strip() if next_start else text[match.end() :].strip()
        if "@@A@@" in block and "@@B@@" in block:
            parts = re.split(r"@@([ABCD])@@", block)
            question_text = compact_text(parts[0])
            options = {}
            for part_index in range(1, len(parts), 2):
                key = parts[part_index]
                value = parts[part_index + 1] if part_index + 1 < len(parts) else ""
                value = re.split(r"@@[ABCD]@@", value)[0]
                options[key] = compact_text(value)
        else:
            fallback = split_fallback_options(block)
            if not fallback:
                continue
            question_text, options = fallback
        if question_text and all(options.get(key) for key in ("A", "B", "C", "D")):
            questions.append({"number": number, "question": question_text, "options": options})
            seen.add(number)
    return sorted(questions, key=lambda item: item["number"])


def make_question_id(subject, year, qtype, number):
    return f"{SUBJECTS[subject]['slug']}-{year}-{qtype}-{number:03d}"


def build_subject_questions(year, subject, question_path, answer_path, answer_mod_path=None):
    raw_question_text = normalize_text(extract_text(question_path))
    raw_answer_text = normalize_text(extract_text(answer_path)) if answer_path else ""
    answers = parse_answers(raw_answer_text)
    if answer_mod_path:
        mod_answers = parse_answers(normalize_text(extract_text(answer_mod_path)))
        if len(mod_answers) >= len(answers) and len(mod_answers) > 0:
            answers = mod_answers
    essays = parse_essays(raw_question_text)
    choices = parse_choice_blocks(raw_question_text)
    source = f"考選部民國{year}年不動產經紀人普考{subject}"
    data = []

    for index, essay in enumerate(essays, start=1):
        data.append(
            {
                "id": make_question_id(subject, year, "essay", index),
                "year": year,
                "exam": "不動產經紀人普考",
                "subject": subject,
                "type": "essay",
                "number": index,
                "topic": SUBJECTS[subject]["topic"],
                "question": essay,
                "referenceAnswer": "考選部未提供申論題參考答案，請自行整理或補入。",
                "keywords": ["待整理"],
                "source": source,
            }
        )

    for choice in choices:
        answer = answers.get(choice["number"], "")
        data.append(
            {
                "id": make_question_id(subject, year, "choice", choice["number"]),
                "year": year,
                "exam": "不動產經紀人普考",
                "subject": subject,
                "type": "choice",
                "number": choice["number"],
                "topic": SUBJECTS[subject]["topic"],
                "question": choice["question"],
                "options": choice["options"],
                "answer": answer,
                "explanation": "本題答案依考選部公布之測驗式標準答案。",
                "source": source,
            }
        )

    parsed_choice_numbers = {choice["number"] for choice in choices}
    for number, answer in sorted(answers.items()):
        if number in parsed_choice_numbers:
            continue
        data.append(
            {
                "id": make_question_id(subject, year, "choice", number),
                "year": year,
                "exam": "不動產經紀人普考",
                "subject": subject,
                "type": "choice",
                "number": number,
                "topic": "PDF解析待校正",
                "question": f"第 {number} 題題文待校正：PDF 自動解析未能完整切出本題題文，請依原始試題 PDF 補入。",
                "options": {
                    "A": "選項 A 待補入",
                    "B": "選項 B 待補入",
                    "C": "選項 C 待補入",
                    "D": "選項 D 待補入",
                },
                "answer": answer,
                "explanation": "本題答案依考選部公布之測驗式標準答案；題文與選項需依原始 PDF 校正。",
                "source": source,
            }
        )

    return data, {
        "year": year,
        "subject": subject,
        "questionFile": str(question_path),
        "answerFile": str(answer_path) if answer_path else None,
        "essayCount": len(essays),
        "choiceCount": len(choices),
        "placeholderChoiceCount": max(0, len(answers) - len(parsed_choice_numbers)),
        "answerCount": len(answers),
    }


def write_bank_file(year, subject, data):
    slug = SUBJECTS[subject]["slug"]
    output_dir = BANK_ROOT / str(year)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{slug}.json"
    output_file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Import past exam PDFs into the local JSON question bank.")
    parser.add_argument("--downloads", default=str(DEFAULT_DOWNLOADS), help="Downloads folder to scan.")
    parser.add_argument("--min-year", type=int, default=103)
    parser.add_argument("--max-year", type=int, default=114)
    args = parser.parse_args()

    downloads_root = Path(args.downloads)
    files = find_exam_pdfs(downloads_root)
    grouped = pick_files(files)
    reports = []
    imported_total = 0

    for year in range(args.min_year, args.max_year + 1):
        for subject in SUBJECTS:
            picked = grouped.get((year, subject), {})
            question_path = picked.get("question")
            answer_path = picked.get("answer")
            answer_mod_path = picked.get("answer_mod")
            if not question_path:
                reports.append({"year": year, "subject": subject, "status": "missing_question"})
                continue
            data, report = build_subject_questions(year, subject, question_path, answer_path, answer_mod_path)
            report["answerModFile"] = str(answer_mod_path) if answer_mod_path else None
            status = "ok"
            if report["choiceCount"] == 0:
                status = "no_choices"
            elif report["placeholderChoiceCount"] > 0:
                status = "ok_with_placeholders"
            report["status"] = status
            reports.append(report)
            write_bank_file(year, subject, data)
            imported_total += len(data)

    RAW_ROOT.mkdir(parents=True, exist_ok=True)
    (RAW_ROOT / "import-report.json").write_text(json.dumps(reports, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required. Please install Node.js and make sure `node` is available in PATH.")
    subprocess.run([node, str(PROJECT_ROOT / "scripts/buildQuestionBank.js")], check=True)
    subprocess.run([node, str(PROJECT_ROOT / "scripts/validateQuestions.js")], check=True)

    problems = [report for report in reports if report.get("status") != "ok"]
    print(f"Imported {imported_total} records from past exam PDFs.")
    print(f"Import report: {RAW_ROOT / 'import-report.json'}")
    if problems:
        print("Items needing review:")
        for report in problems:
            print(f"- {report.get('year')} {report.get('subject')}: {report.get('status')}")


if __name__ == "__main__":
    main()
