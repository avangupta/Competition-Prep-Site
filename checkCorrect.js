const stringSimilarity = require("string-similarity");

function stripPdfGarbage(s) {
  return s.replace(
    /(high school|middle school|round\s*\d+|page\s*\d+)/gi,
    ""
  );
}

module.exports = function checkCorrect(userAnswer, correctAnswer) {
  const normalize = s =>
    stripPdfGarbage(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w && !/^\d+$/.test(w)); // remove empty + numbers

  const uTokens = new Set(normalize(userAnswer));
  const cTokens = normalize(correctAnswer);

  if (uTokens.size === 0 || cTokens.length === 0) return false;

  let match = 0;
  for (const word of cTokens) {
    if (uTokens.has(word)) match++;
  }

  return match / cTokens.length >= 0.8;
};