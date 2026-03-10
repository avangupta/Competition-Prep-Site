module.exports = function shaveText(text, front = 0, back = 0) {
  if (!text) return text;

  let result = text;

  if (front > 0) {
    result = result.slice(front);
  }

  if (back > 0) {
    result = result.slice(0, result.length - back);
  }

  return result.trim();
};
