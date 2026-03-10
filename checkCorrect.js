const stringSimilarity = require("string-similarity");
const natural = require("natural");
const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();

function stripPdfGarbage(s) {
  return s.toLowerCase().replace(
    /(high school|middle school|round\s*\d+|page\s*\d+)/gi,
    ""
  );
}

function normalize(text) {
  return tokenizer
    .tokenize(
      stripPdfGarbage(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
    )
    .map(word => stemmer.stem(word))
    .filter(word =>
      !["the", "a", "an", "of", "and", "in", "to", "for", "by"].includes(word)
    );
}

function grams(s) {
  if (!s || s.length < 3) return new Set();

  const set = new Set();
  for (let i = 0; i < s.length - 2; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}

function semanticScore(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();

  let score = 0;

  // Strong suffix match (important for science terms)
  const suffixes = ["osis","sis","tion","sion","ism","ology","graphy","ment","ity"];
  for (const suf of suffixes) {
    if (a.endsWith(suf) && b.endsWith(suf)) {
      score += 5;  // big boost
    }
  }

  // Length similarity
  const lenDiff = Math.abs(a.length - b.length);
  if (lenDiff <= 2) score += 2;
  else if (lenDiff <= 4) score += 1;

  const aTri = grams(a);
  const bTri = grams(b);
  const overlap = [...aTri].filter(x => bTri.has(x)).length;

  score += overlap * 0.8; // much stronger weight

  return score;
}

const threshold = 2;

async function tokenMatch(user, correct) {
  if (!user || !correct) return false;

  const uTokens = normalize(user);
  const cTokens = normalize(correct);

  if (uTokens.length === 0 || cTokens.length === 0) return false;

  const uString = uTokens.join(" ");
  const cString = cTokens.join(" ");

  // ❌ Reject exact match
  if (uString === cString) return false;

  const score = semanticScore(uString, cString);
  console.log(score);
  return score >= threshold;
}


/* async function tokenMatch(user, correct) {
  const clean = s =>
    stripPdfGarbage(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  const u = clean(user);
  const c = clean(correct);

  if (!u || !c) return false;

  // ❌ Reject exact match
  if (u === c) return false;

  const tokenize = s => s.split(/\s+/);

  const uTokens = tokenize(u);
  const cTokens = tokenize(c);

  // ✅ Word count similarity filter
  const wordDiff = Math.abs(uTokens.length - cTokens.length);
  if (wordDiff > 2) return false;

  // String similarity
  const similarity = stringSimilarity.compareTwoStrings(u, c);

  // Token overlap ratio
  const overlap =
    uTokens.filter(t => cTokens.includes(t)).length /
    Math.max(uTokens.length, cTokens.length);

  const score =
    0.6 * similarity +
    0.4 * overlap;

  console.log({
  user: u,
  correct: c,
  score
    });

  // ✅ Accept mid-range similarity only
  return score > 0.25 && score < 0.8;
} */

function checkCorrect(user, correct) {
  const clean = s =>
    stripPdfGarbage(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  const u = clean(user);
  const c = clean(correct);

  if (!u || !c) return false;

  // Direct containment boost (VERY important)
  if (c.includes(u) || u.includes(c)) {
    return true;
  }

  const tokenize = s => s.split(/\s+/);

  const uTokens = tokenize(u);
  const cTokens = tokenize(c);

  const overlap =
    uTokens.filter(t => cTokens.includes(t)).length /
    Math.max(cTokens.length, uTokens.length);

  const similarity = stringSimilarity.compareTwoStrings(u, c);

  const lengthRatio =
    Math.min(u.length, c.length) /
    Math.max(u.length, c.length);

  const score =
    0.4 * overlap +
    0.4 * similarity +
    0.2 * lengthRatio;

  // Adaptive threshold
  if (cTokens.length <= 2) {
    return score > 0.45;
  }

  if (cTokens.length <= 5) {
    return score > 0.6;
  }

  return score > 0.7;
}

module.exports = {tokenMatch, checkCorrect};