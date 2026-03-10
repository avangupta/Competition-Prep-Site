module.exports = function parseByPrefix(text, config) {
  const qPrefixes = config.qPrefixes || [];
  const aPrefixes = config.aPrefixes || [];

  if (!qPrefixes.length || !aPrefixes.length) return [];

  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const qPattern = qPrefixes.map(escape).join("|");
  const aPattern = aPrefixes.map(escape).join("|");

  // Find question prefixes
  const qRegex = new RegExp(qPattern, "g");
  const aRegex = new RegExp(aPattern, "g");

  const questions = [];

  let qMatch;
  while ((qMatch = qRegex.exec(text)) !== null) {
    const qStart = qMatch.index + qMatch[0].length;

    // Find the next answer AFTER this question
    aRegex.lastIndex = qStart;
    const aMatch = aRegex.exec(text);
    if (!aMatch) {
    console.warn("No ANSWER found for question starting at", qMatch.index);
    continue;
    }

    const questio = text
      .slice(qStart, aMatch.index)
      .trim();

    // Answer = ONE LINE only
    const answerStart = aMatch.index + aMatch[0].length;
    const answerLineEnd = text.indexOf("\n", answerStart);

    const answe = text
      .slice(
        answerStart,
        answerLineEnd === -1 ? text.length : answerLineEnd
      )
      .trim();

    if (questio && answe) {
      questions.push({ question: questio, answer: answe });
    }

    // Move question regex forward so we don't reparse inside same block
    qRegex.lastIndex = answerLineEnd === -1
      ? text.length
      : answerLineEnd;
  }

  return questions;
};