module.exports = function parseByLine(text, config) {
  const lines = text.split("\n");
  const questions = [];

  const startLine = (config.startLine ?? 1) - 1;
  const QADiff = config.QADiff ?? 1;   // answer is next line by default
  const QQDiff = config.QQDiff ?? 2;   // move to next Q/A pair
  let i = startLine;

  while (i + QADiff < lines.length) {
    const questio = lines[i]?.trim();
    const answe = lines[i + QADiff]?.trim();

    //questions.push({ question: questio, answer: answe });

    if (questio && answe) {
      questions.push({ question: questio, answer: answe });
    }

    i += QQDiff;
  }

  return questions;
};
