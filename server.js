const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");

const Bot = require("./bot");
const { parseFile } = require("./parser");

const app = express();
const PORT = 3000;

/* ---------- GLOBAL STATE ---------- */

const availableBots = {
  "Earth Science Bot": {
    file: "data/earthscience.txt",
    qPrefix: "Q:",
    aPrefix: "A:"
  },
  "Math Bot": {
    file: "data/math.txt",
    qPrefix: "Question:",
    aPrefix: "Answer:"
  },
  "Biology Bot": {
    file: "data/biology.txt",
    qPrefix: "Q:",
    aPrefix: "A:"
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
app.post("/api/select-bot", async (req, res) => {
  const { name } = req.body;
  const config = availableBots[name];

  if (!config) return res.json({ error: "Bot not found" });

  if (!bigDatabase[name]) {
    bigDatabase[name] = await parseFile(
      config.file,
      config.qPrefix,
      config.aPrefix
    );
  }

  req.session.botState = {
  currentIndex: 0,
  score: 0
  };
  req.session.botName = name;

  res.json({ success: true });
});

// Get question
app.get("/api/question", (req, res) => {
  const name = req.session.botName;
  const state = req.session.botState;

  if (!name || !state) {
    return res.json({ error: "No bot selected" });
  }

  const bot = new Bot(name);
  bot.currentIndex = state.currentIndex;
  bot.score = state.score;


  const question = bot.getCurrentQuestion(bigDatabase[name]);

  if (!question) {
    return res.json({ done: true, score: bot.score });
  }

  res.json({ question, name });
});

// Submit answer
app.post("/api/answer", (req, res) => {
  const name = req.session.botName;
const state = req.session.botState;

if (!name || !state) {
  return res.json({ error: "No bot selected" });
}

const bot = new Bot(name);
bot.currentIndex = state.currentIndex;
bot.score = state.score;


  const result = bot.submitAnswer(
    req.body.answer,
    bigDatabase[name]
  );

  req.session.botState = {
  currentIndex: bot.currentIndex,
  score: bot.score
};

  res.json(result);
});

// Create user bot
app.post("/api/create-bot", upload.single("file"), (req, res) => {
  const { name, qPrefix, aPrefix } = req.body;

  if (!req.file || !name || !qPrefix || !aPrefix) {
    return res.json({ error: "Missing fields" });
  }

  const newPath = `uploads/${Date.now()}_${req.file.originalname}`;
  fs.renameSync(req.file.path, newPath);

  availableBots[name] = {
    file: newPath,
    qPrefix,
    aPrefix
  };

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
