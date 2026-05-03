const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const fsdel = require('fs').promises;
const path = require("path");
const downloadFile = require("./utils/downloadFile");
require("dotenv").config();

const Bot = require("./bot");
const parseFile = require("./parseFile");
const check = require("./checkCorrect");


const app = express();
app.set("trust proxy", 1);
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
    tags: {tag1: "Earth Science", tag2: "High School", tag3: ""},
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
    tags: {tag1: "Math", tag2: "MathCounts Prep", tag3: "High School"},
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
    tags: {tag1: "Biology", tag2: "Science Bowl", tag3: "High School"},
    favorited: []
  }
};

const bigDatabase = {};

async function updateBigData() {
bigDatabase["Earth Science Bot"] = await parseFile(
      availableBots["Earth Science Bot"].file,
      availableBots["Earth Science Bot"].config
);

bigDatabase["Math Bot"] = await parseFile(
      availableBots["Math Bot"].file,
      availableBots["Math Bot"].config
);

bigDatabase["Biology Bot"] = await parseFile(
      availableBots["Biology Bot"].file,
      availableBots["Biology Bot"].config
);
}

updateBigData();

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
  currentIndex: -1,
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
    mode1: game.mode,
    score: game.score,
    questions: game.questions.length,
    botName: game.botName
  });
}
game.currentIndex++;

  const q = game.questions[game.currentIndex];

  if (!q) {
    return res.json({
      done: true,
      mode1: game.mode,
      score: game.score,
      questions: game.questions.length,
      botName: game.botName
    });
  }

  // 🔥 reset per-question timer
  game.questionStartTime = Date.now();

  res.json({
    question: q.question,
    answer: q.answer,
    mode: game.mode,
    botName: game.botName,
    timeLimit: game.timeLimit,
    index: game.currentIndex + 1,
    total: game.questions.length,
    spoken: game.spoken
  });
});

app.get("/api/backquestion", (req, res) => {
  const game = req.session.game;
  if (!game) return res.json({ error: "No active game" });

  if (game.done) {
  return res.json({
    done: true,
    mode1: game.mode,
    score: game.score,
    questions: game.questions.length,
    botName: game.botName
  });
}
  game.currentIndex -= 1;
  const q = game.questions[game.currentIndex];

  if (!q) {
    return res.json({
      done: true,
      mode1: game.mode,
      score: game.score,
      questions: game.questions.length,
      botName: game.botName
    });
  }

  // 🔥 reset per-question timer
  game.questionStartTime = Date.now();

  res.json({
    question: q.question,
    answer: q.answer,
    mode: game.mode,
    botName: game.botName,
    timeLimit: game.timeLimit,
    index: game.currentIndex + 1,
    total: game.questions.length,
    spoken: game.spoken
  });
});

app.get("/api/samequestion", (req, res) => {
  const game = req.session.game;
  if (!game) return res.json({ error: "No active game" });

  if (game.done) {
  return res.json({
    done: true,
    mode1: game.mode,
    score: game.score,
    questions: game.questions.length,
    botName: game.botName
  });
}

  const q = game.questions[game.currentIndex];

  if (!q) {
    return res.json({
      done: true,
      mode1: game.mode,
      score: game.score,
      questions: game.questions.length,
      botName: game.botName
    });
  }

  // 🔥 reset per-question timer
  game.questionStartTime = Date.now();

  res.json({
    question: q.question,
    answer: q.answer,
    mode: game.mode,
    botName: game.botName,
    timeLimit: game.timeLimit,
    index: game.currentIndex + 1,
    total: game.questions.length,
    spoken: game.spoken
  });
});

app.get("/api/getMC", async (req, res) => {
    const game = req.session.game;
    if (!game) return res.json({ error: "No active game" });
    const questions = game.questions;
    const accAnswer = questions[game.currentIndex].answer;
    const possAnswers = [];

    for(const question of questions) {
        const answer = question.answer;
        console.log(await check.checkMCVal(answer, accAnswer));
        if( await check.checkMC(answer, accAnswer, 0.35, 0.9) )
        {
            possAnswers.push(answer);
            console.log("added answer in main");
            if(possAnswers.length === 3) break;
        }
    }

    if (possAnswers.length < 3)
    {
        for (const botName of Object.keys(availableBots)) {
            if (game.botName !== botName)
            {
                const bot = availableBots[botName];

                const tags = availableBots[botName].tags;
                const currentTags = availableBots[game.botName].tags;

                if( (Object.values(currentTags).includes(tags.tag1) && tags.tag1) || (Object.values(currentTags).includes(tags.tag2) && tags.tag2) || (Object.values(currentTags).includes(tags.tag3) && tags.tag3) )
                {
                    for (const entry of Object.values(bigDatabase[botName])) {
                        console.log(entry);
                        const answer = entry.answer;
                        console.log(await check.checkMCVal(answer, accAnswer));
                        if( await check.checkMC(answer, accAnswer, 0.35, 0.9) )
                        {
                            possAnswers.push(answer);
                            console.log("added answer in backup");
                            //if(possAnswers.length === 3) break;
                        }
                    }
                }
            }
            //if(possAnswers.length === 3) break;
        }
    }

    if(possAnswers.length < 3) console.log("Why bro");

    possAnswers.push(accAnswer);
    for (let i = possAnswers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possAnswers[i], possAnswers[j]] = [possAnswers[j], possAnswers[i]];
    }
    return res.json(possAnswers);

    /*
    if (possAnswers.length < 3)
    {
        possAnswers.push(accAnswer);
        console.log("1");
        for (let i = possAnswers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possAnswers[i], possAnswers[j]] = [possAnswers[j], possAnswers[i]];
        }
        return res.json(possAnswers);
    }
    else
    {
        const newPoss = possAnswers.slice(0, 3);
        newPoss.push(accAnswer);
        newPoss.sort(() => Math.random() - 0.5);
        return res.json(newPoss);

        // Fisher-Yates shuffle
        for (let i = possAnswers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possAnswers[i], possAnswers[j]] = [possAnswers[j], possAnswers[i]];
        }

        const newPoss = possAnswers.slice(0, 3);
        newPoss.push(accAnswer);

        for (let i = newPoss.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPoss[i], newPoss[j]] = [newPoss[j], newPoss[i]];
        }

        return res.json(newPoss);
    }
    */
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
    await check.checkCorrectEmbed(answer.trim().toLowerCase(), current.answer.trim().toLowerCase(), 0.75);
    /* answer.trim().toLowerCase() ===
    current.answer.trim().toLowerCase(); */

  if (!current) {
    return res.json({
      done: true,
      score: game.score,
      botName: game.botName,
      mode: game.mode
    });
  }

if (mode === "timed") {
  if (!elapsed)
  {
  elapsed =
    (Date.now() - game.questionStartTime) / 1000;
  }

  if (elapsed >= game.timeLimit) {

    return res.json({
      correct: false,
      timeout: true,
      correctAnswer: current.answer,
      score: game.score,
      done: game.currentIndex + 1 >= game.questions.length,
      mode: game.mode
    });
  }
}


  if (correct) game.score++;


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
  if (game.currentIndex + 1 >= game.questions.length) {
    return res.json({
      correct,
      correctAnswer: current.answer,
      botName: game.botName,
      mode: game.mode
    });
  }

  // Normal continuation
  res.json({
    correct,
    correctAnswer: current.answer,
    score: game.score,
    done: false,
    botName: game.botName,
    mode: game.mode
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
    let val = "";
    while (bigDatabase[name + val])
    {
        if(!val)
        {
            val = " 1";
        }
        else
        {
            val = " " + (parseInt(val, 10) + 1);
        }
    }
    console.log(val + " is val.");
    newname = name;
    if(val)
    {
        newname = name + val;
    }
    if (!bigDatabase[newname]) {
        const ext = path.extname(req.file.originalname); // ".pdf" or ".txt"
        const newPath = req.file.path + ext;
        fs.renameSync(req.file.path, newPath);

        //Register bot
        availableBots[newname] = {
          file: newPath,
          config,
          owner: req.user.name,
          id: req.user.googleId,
          access: req.body.access,
          tags,
          favorited: []
        }

        delete bigDatabase[newname];

        bigDatabase[newname] = await parseFile(
        availableBots[newname].file,
        config
        );
        if(val)
        {
            console.log("Your name was changed to " + newname + ".");
        }
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

    await fsdel.unlink(availableBots[name].file);

    delete availableBots[name];
    delete bigDatabase[name];
});

app.post("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
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
  console.log(`Server running at port: ${PORT}`);
});
