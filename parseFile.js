const fs = require("fs");
const pdfParse = require("pdf-parse");

const parseByPrefix = require("./parseByPrefix");
const parseByLine = require("./parseByLine");
const shaveText = require("./shaveText");

function normalizePDFText(text) {
  return text
    .normalize("NFKD")

    // remove zero-width + soft hyphens
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, "")

    // normalize all whitespace to spaces
    .replace(/\s+/g, " ")

    // normalize unicode dashes
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")

    // normalize answer labels
    .replace(/A\s*N\s*S\s*W\s*E\s*R\s*[:\-]/gi, "ANSWER:")

    // normalize toss-up labels
    .replace(/T\s*O\s*S\s*S\s*-\s*U\s*P/gi, "TOSS-UP")
    .replace(/B\s*O\s*N\s*U\s*S/gi, "BONUS")

    // restore newlines around prefixes
    .replace(/(TOSS-UP|BONUS)/g, "\n$1\n")
    .replace(/ANSWER:/g, "\nANSWER: ");

}

module.exports = async function parseFile(filePath, config) {
  let text;

  if (filePath.endsWith(".pdf")) {
    console.log("pdf found");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    text = data.text;
    text = normalizePDFText(data.text);
  } else {
    console.log("txt found");
    text = fs.readFileSync(filePath, "utf-8");
  }

  if (!text || !text.trim()) return [];

  if (config.mode === "prefix") {
    questions = parseByPrefix(text, config);
  }

  if (config.mode === "line") {
    questions = parseByLine(text, config);
  }

  // ✂️ SHAVE PHASE (applies to ALL modes)
  if (config.shave) {
    const {
      qFront = 0,
      qBack = 0,
      aFront = 0,
      aBack = 0
    } = config.shave;

    questions = questions.map(q => ({
      question: shaveText(q.question, qFront, qBack),
      answer: shaveText(q.answer, aFront, aBack)
    }));
  }

  console.log(questions);

  return questions;
};