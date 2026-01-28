class Bot {
  constructor(name) {
    this.name = name;
    this.currentIndex = 0;
    this.score = 0;
  }

  getCurrentQuestion(questions) {
    if (!questions || this.currentIndex >= questions.length) return null;
    return questions[this.currentIndex].question;
  }

  submitAnswer(answer, questions) {
    if (!questions || this.currentIndex >= questions.length) return null;

    const q = questions[this.currentIndex];
    const correct =
      answer.trim().toLowerCase() === q.answer.trim().toLowerCase();

    if (correct) this.score++;
    this.currentIndex++;

    return {
      correct,
      correctAnswer: q.answer,
      score: this.score,
      done: this.currentIndex >= questions.length
    };
  }
}

module.exports = Bot;
