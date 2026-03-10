const fs = require("fs");
const readline = require("readline");

// --- Reusable parser function ---
function parseQuestions(filePath, format) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");

  let questions = [];
  let current = null;

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith(format.question)) {
      current = {};
      current.question = line.slice(format.question.length).trim();
    } 
    else if (line.startsWith(format.answer) && current !== null) {
      current.answer = line.slice(format.answer.length).trim();
      questions.push(current);
      current = null;
    }
  }

  return questions;
}

// --- Central database ---
const bigDatabase = {};

// --- Bot class ---
class Bot {
  constructor(name, filePath, questionFormat, answerFormat) {
    this.name = name;
    this.filePath = filePath;   // path to the txt file
    this.format = { question: questionFormat, answer: answerFormat };
    this.currentIndex = 0;
    this.score = 0;

    if (bigDatabase[this.name]) {
      console.log(`\nBot "${this.name}" already exists in the database. Skipping add.`);
    } 
    else {
      this.addToDatabase();
    }
  }

  // Method to load this bot's questions into the central database
  addToDatabase() {
    const questions = parseQuestions(this.filePath, this.format);
    bigDatabase[this.name] = questions;
    console.log(`\n${this.name} added ${questions.length} questions to the database.`);
  }

  // Ask next question
  askNextQuestion() {
    const questions = bigDatabase[this.name];
    if (!questions || this.currentIndex >= questions.length) {
      console.log("\nNo more questions!");
      return;
    }
    const q = questions[this.currentIndex];
    console.log(`\n${this.currentIndex + 1}: ${q.question}`);
  }

  // Answer the current question
  answerQuestion(answer) {
    const questions = bigDatabase[this.name];
    if (!questions || this.currentIndex >= questions.length) {
      console.log("\nNo more questions!");
      return;
    }
    const q = questions[this.currentIndex];

    if (answer.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
      console.log("\nCorrect!");
      this.score += 1;
    } else {
      console.log(`\nIncorrect. Correct answer: ${q.answer}`);
    }

    this.currentIndex += 1;
  }

  async runSession() {
    console.log(`\n--- ${this.name} ---`);
    const questions = bigDatabase[this.name];
    if (!questions || questions.length === 0) {
      console.log("\nNo questions in this bot!");
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    while (this.currentIndex < questions.length) {
      this.askNextQuestion();

      // Ask user for answer
      const answer = await new Promise(resolve => rl.question("Your answer: ", resolve));
      this.answerQuestion(answer);
    }

    console.log(`\nSession complete! Your final score: ${this.score}/${questions.length}`);
    rl.close();
  }
    

}

// --- Example usage ---

// Create bots with their own files
const scienceBot = new Bot("ScienceBot", "science.txt", "Q:", "A:");
const mathBot = new Bot("MathBot", "math.txt", "Question:", "Answer:");

// Ask questions and answer them
(async () => {
  await scienceBot.runSession();

  await mathBot.runSession();

  console.log("\nAll bots finished!");
})();