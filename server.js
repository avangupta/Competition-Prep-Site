const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const downloadFile = require("./utils/downloadFile");
require("dotenv").config();

const Bot = require("./bot");
const parseFile = require("./parseFile");
const checkCorrect = require("./checkCorrect");


const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- GLOBAL STATE ---------- */

const availableBots = {
  "Earth Science Bot": {
    file: "data/earthscience.txt",
    config:
    {
        mode: "prefix",
        qPrefixes: ["Q:"],
        aPrefixes: ["A:"]
    },
    owner: "Avan Gupta",
    access: "public",
    tags: {tag1: "Earth Science", tag2: "ES", tag3: ""},
    favorited: []
  },
  "Math Bot": {
    file: "data/math.txt",
    config:
    {
        mode: "prefix",
        qPrefixes: ["Question:"],
        aPrefixes: ["Answer:"]
    },
    owner: "Avan Gupta",
    access: "public",
    tags: {tag1: "Math", tag2: "MathCounts Prep", tag3: "Idk"},
    favorited: []
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
    },
    owner: "Avan Gupta",
    access: "public",
    tags: {tag1: "Biology", tag2: "Science Bowl", tag3: "Bio"},
    favorited: []
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

const passport = require("./auth/google");

app.use(passport.initialize());
app.use(passport.session());
app.use('/data', express.static('data'));


const upload = multer({ dest: "uploads/" });

/* ---------- ROUTES ---------- */

// List bots
app.get("/api/bots", async (req, res) => {
  res.json({availableBots, bigDatabase});
});

// Select bot
app.post("/api/start-game", async (req, res) => {
  const { botName, mode, questionOrder, timeLimit, spoken } = req.body;

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
  timeLimit: mode === "timed" ? timeLimit : null,
  spoken
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
    total: game.questions.length,
    spoken: game.spoken
  });
});


// Submit answer
app.post("/api/answer", async (req, res) => {
  const game = req.session.game;
  const mode = game.mode;

  if (!game) {
    return res.json({ error: "No active game" });
  }

  let { answer, elapsed } = req.body;
  const current = game.questions[game.currentIndex];

const correct =
    await checkCorrect(answer.trim().toLowerCase(), current.answer.trim().toLowerCase());
    /* answer.trim().toLowerCase() ===
    current.answer.trim().toLowerCase(); */

  if (!current) {
    return res.json({
      done: true,
      score: game.score,
      botName: game.botName
    });
  }

if (mode === "timed") {
  if (!elapsed)
  {
  elapsed =
    (Date.now() - game.questionStartTime) / 1000;
  }

  if (elapsed >= game.timeLimit) {
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
app.post("/api/create-bot", upload.single("file"), requireLogin, async (req, res) => {
  const { name } = req.body;

  if (!req.user)
  {
    return res.json({ error: "Log in to build a bot" });
  }

  if (!name || (!req.file && !req.body.fileURL && !req.body.edit)) {
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
if (!req.body.edit) {
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
      config.QQDiff < 1
    ) {
      return res.json({ error: "Invalid line parsing values" });
    }
  }

    let tags;
    try {
      tags = JSON.parse(req.body.tags);
    } catch {
      tags = {};
    }

  if (!req.body.edit)
  {
     if (!bigDatabase[name]) {
        const ext = path.extname(req.file.originalname); // ".pdf" or ".txt"
        const newPath = req.file.path + ext;
        fs.renameSync(req.file.path, newPath);

        //Register bot
        availableBots[name] = {
          file: newPath,
          config,
          owner: req.user.name,
          id: req.user.googleId,
          access: req.body.access,
          tags,
          favorited: []
        }

        delete bigDatabase[name];

        bigDatabase[name] = await parseFile(
        availableBots[name].file,
        config
        );
    }
    else
    {
        return res.json({ error: "Bot already exists"});
    }
  }
  else if (req.body.edit)
  {
      //Register bot
      availableBots[name] = {
      file: availableBots[name].file,
      config,
      owner: availableBots[name].owner,
      id: availableBots[name].id,
      access: req.body.access,
      tags,
      favorited: availableBots[name].favorited
      }

      // Remove any old parsed data
      delete bigDatabase[name];

      bigDatabase[name] = await parseFile(
      availableBots[name].file,
      config
      );
  }

  res.json({ success: true });
});


// Reset session
app.post("/api/reset-session", (req, res) => {
  req.session.bot = null;
  req.session.botName = null;
  res.json({ success: true });
});

// Login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/"
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/api/profile", (req, res) => {
  res.json(req.user || null);
});

app.post("/api/favorite", requireLogin, async (req, res) => {
    if (!req.user)
    {
      return res.json({ error: "Log in to favorite bots" });
    }

    const { name } = req.body;
    availableBots[name].favorited.push(req.user.googleId);
});

app.post("/api/unfavorite", requireLogin, async (req, res) => {
    if (!req.user)
    {
      return res.json({ error: "Log in to unfavorite bots" });
    }

    const { name } = req.body;
    availableBots[name].favorited.splice(availableBots[name].favorited.indexOf(req.user.googleId), 1);
});

app.post("/api/delete", requireLogin, async (req, res) => {
    if (!req.user)
    {
      return res.json({ error: "Log in to delete bots" });
    }

    const { name } = req.body;

    delete availableBots[name];
    delete bigDatabase[name];
});

app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

function requireLogin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

/* ---------- START ---------- */

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
