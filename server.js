const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const downloadFile = require("./utils/downloadFile");

const Bot = require("./bot");
const parseFile = require("./parseFile");

const app = express();
const PORT = 3000;

/* ---------- GLOBAL STATE ---------- */

const availableBots = {
  "Earth Science Bot": {
    file: "data/earthscience.txt",
    config:
    {
        mode: "prefix",
        qPrefixes: ["Q:"],
        aPrefixes: ["A:"]
    }
  },
  "Math Bot": {
    file: "data/math.txt",
    config:
    {
        mode: "prefix",
        qPrefixes: ["Question:"],
        aPrefixes: ["Answer:"]
    }
  },
  "Biology Bot": {
    file: "data/biology.txt",
    config:
    {
        mode: "line",
        startLine: 1,
        QADiff: 1,
        QQDiff: 3,
        shave: {
            qFront: 11,
            aFront: 7
        }
    }
  }
};

const bigDatabase = {};

/* ---------- MIDDLEWARE ---------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "dev-secret",
    resave: false,
    saveUninitialized: true
  })
);

app.use(express.static("public"));

/* ---------- FILE UPLOAD ---------- */

const upload = multer({ dest: "uploads/" });

/* ---------- ROUTES ---------- */

// List bots
app.get("/api/bots", (req, res) => {
  res.json(Object.keys(availableBots));
});

// Select bot
app.post("/api/start-game", async (req, res) => {
  const { botName, mode, questionOrder, timeLimit } = req.body;

  if (!botName) {
    return res.json({ error: "Missing botName" });
  }

  const botConfig = availableBots[botName];
  if (!botConfig) {
    return res.json({ error: "Bot not found" });
  }

  // Parse questions if not already cached
  if (!bigDatabase[botName]) {
    bigDatabase[botName] = await parseFile(
      botConfig.file,
      botConfig.config
    );
  }

  let questions = [...bigDatabase[botName]];

  if (questionOrder === "random") {
    questions.sort(() => Math.random() - 0.5);
  }

  // 🔥 THIS is the session your quiz expects
  req.session.game = {
  botName,
  mode,
  questions,
  currentIndex: 0,
  score: 0,
  questionStartTime: Date.now(),
  timeLimit: mode === "timed" ? timeLimit : null
};


  res.json({ success: true });
});


app.get("/api/question", (req, res) => {
  const game = req.session.game;
  if (!game) return res.json({ error: "No active game" });

  if (game.done) {
  return res.json({
    done: true,
    score: game.score,
    questions: game.questions.length,
    botName: game.botName
  });
}

  const q = game.questions[game.currentIndex];

  if (!q) {
    return res.json({
      done: true,
      score: game.score,
      questions: game.questions.length,
      botName: game.botName
    });
  }

  // 🔥 reset per-question timer
  game.questionStartTime = Date.now();

  res.json({
    question: q.question,
    botName: game.botName,
    timeLimit: game.timeLimit,
    index: game.currentIndex + 1,
    total: game.questions.length
  });
});


// Submit answer
app.post("/api/answer", (req, res) => {
  const game = req.session.game;
  const mode = game.mode;

  if (!game) {
    return res.json({ error: "No active game" });
  }

  const { answer } = req.body;
  const current = game.questions[game.currentIndex];



  if (!current) {
    return res.json({
      done: true,
      score: game.score,
      botName: game.botName
    });
  }

if (mode === "timed") {
  const elapsed =
    (Date.now() - game.questionStartTime) / 1000;

  if (elapsed > game.timeLimit) {
    game.currentIndex++;

    return res.json({
      correct: false,
      timeout: true,
      correctAnswer: current.answer,
      score: game.score,
      done: game.currentIndex >= game.questions.length
    });
  }
}


  const correct =
    answer.trim().toLowerCase() ===
    current.answer.trim().toLowerCase();

  if (correct) game.score++;

  game.currentIndex++;

  // Sudden death mode: one wrong answer ends the game
  if (game.mode === "sudden" && !correct) {
    game.done = true;

    return res.json({
      correct,
      correctAnswer: current.answer,
      botName: game.botName,
      mode: game.mode
    });
  }

  // End of questions
  if (game.currentIndex >= game.questions.length) {
    return res.json({
      correct,
      correctAnswer: current.answer,
      botName: game.botName
    });
  }

  // Normal continuation
  res.json({
    correct,
    correctAnswer: current.answer,
    score: game.score,
    done: false,
    botName: game.botName
  });
});


// Create user bot
app.post("/api/create-bot", upload.single("file"), async (req, res) => {
  const { name } = req.body;

  if (!name || (!req.file && !req.body.fileURL)) {
    return res.json({ error: "Missing name or file" });
  }

  const isValidURL = str => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

if (!isValidURL(req.body.fileURL) && req.body.fileURL)
  {
     return res.json({ error: "Invalid URL - only .txt or .pdf files allowed" });
  }

  if (req.file && req.body.fileURL)
  {
     return res.json({ error: "Only enter one file" });
  }

  // If URL provided, convert it into a Multer-like file
if (req.body.fileURL) {
  req.file = await downloadFile(req.body.fileURL);
}



  if (req.file)
  {
  if (!req.file.originalname.match(/\.(txt|pdf)$/i)) {
  return res.json({ error: "Only .txt or .pdf files allowed" });
  }
  }




  let config;
  try {
    config = JSON.parse(req.body.config);
  } catch {
    return res.json({ error: "Invalid config JSON" });
  }

  // Basic validation
  if (!config.mode) {
    return res.json({ error: "Parse mode required" });
  }

  if (config.mode === "prefix") {
    if (!config.qPrefixes?.length || !config.aPrefixes?.length) {
      return res.json({ error: "Prefixes required" });
    }
  }

  if (config.mode === "line") {
    if (
      config.startLine < 1 ||
      config.QADiff < 1 ||
      config.QQDiff < 1
    ) {
      return res.json({ error: "Invalid line parsing values" });
    }
  }



  const ext = path.extname(req.file.originalname); // ".pdf" or ".txt"
  const newPath = req.file.path + ext;
  fs.renameSync(req.file.path, newPath);

  //Register bot
  availableBots[name] = {
    file: newPath,
    config
  };

  // Remove any old parsed data
  delete bigDatabase[name];

  res.json({ success: true });
});


// Reset session
app.post("/api/reset-session", (req, res) => {
  req.session.bot = null;
  req.session.botName = null;
  res.json({ success: true });
});

/* ---------- START ---------- */

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
