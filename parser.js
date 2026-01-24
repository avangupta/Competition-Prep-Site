const fs = require("fs");

async function parseFile(file, qPrefix, aPrefix) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");

  const questions = [];
  let currentQ = null;

  for (const line of lines) {
    if (line.startsWith(qPrefix)) {
      currentQ = { question: line.slice(qPrefix.length).trim() };
    } else if (line.startsWith(aPrefix) && currentQ) {
      currentQ.answer = line.slice(aPrefix.length).trim();
      questions.push(currentQ);
      currentQ = null;
    }
  }

  return questions;
}

module.exports = { parseFile };
