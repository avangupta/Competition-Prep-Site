const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const fsdel = require('fs').promises;
const path = require("path");
const downloadFile = require("./utils/downloadFile");
require("dotenv").config();
const {GoogleGenAI: GeminiAI} = require("@google/genai");

const Bot = require("./bot");
const parseFile = require("./parseFile");
const check = require("./checkCorrect");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

const TD_Grader_1 = new GeminiAI({ apiKey: process.env.TD_GRADER_1 });
const TD_Grader_2 = new GeminiAI({ apiKey: process.env.TD_GRADER_2 });
const TD_Grader_3 = new GeminiAI({ apiKey: process.env.TD_GRADER_3 });
const TD_Grader_4 = new GeminiAI({ apiKey: process.env.TD_GRADER_4 });
const TD_Grader_5 = new GeminiAI({ apiKey: process.env.TD_GRADER_5 });
const TD_Grader_List = [TD_Grader_1, TD_Grader_2, TD_Grader_3, TD_Grader_4, TD_Grader_5];
let TD_Num = 0;

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
  },
  "Chemistry Bot": {
    file: "data/chemistry.txt",
    config:
    {
        mode: "prefix",
        qPrefixes: ["Q:"],
        aPrefixes: ["A:"]
    },
    owner: "Avan Gupta",
    access: "public",
    tags: {tag1: "Chemistry", tag2: "High School", tag3: "Science Bowl"},
    favorited: []
  },
  "Literature Bot": {
    file: "data/literature.txt",
    config:
    {
        mode: "prefix",
        qPrefixes: ["Q:"],
        aPrefixes: ["A:"]
    },
    owner: "Avan Gupta",
    access: "public",
    tags: {tag1: "English", tag2: "High School", tag3: "Quiz Bowl"},
    favorited: []
  },
  "History Bot": {
    file: "data/history.txt",
    config:
    {
        mode: "prefix",
        qPrefixes: ["Q:"],
        aPrefixes: ["A:"]
    },
    owner: "Avan Gupta",
    access: "public",
    tags: {tag1: "History", tag2: "High School", tag3: "Quiz Bowl"},
    favorited: []
  },
};

const availableCourses = {
  "Glaciology for Dummies": {
    topics: ["Earth Science", "Glaciology"],
    difficulty: 30,
    time: 30,
    tags: {tag1: "Earth Science", tag2: "Glaciers", tag3: "Easy"},
    description: "This course delves into the study of glacier formation and glacial processes, all the while putting information in an easily-understood way.",
    owner: "Avan Gupta"
  },
  "Crash Course Physics": {
    topics: ["Physics", "Entropy Sciences"],
    difficulty: 55,
    time: 90,
    tags: {tag1: "Physics", tag2: "High School", tag3: "Crash Course"},
    description: "This course delves into the study of physics, especially entropy, all the while putting information in an easily-understood way.",
    owner: "Avan Gupta"
  },
};

const users = {};

const bigDatabase = {};

async function updateBigDatabase() {
for(const botName in availableBots)
    {
        bigDatabase[botName] = await parseFile(availableBots[botName].file, availableBots[botName].config);
    }
}

updateBigDatabase();

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

app.get("/api/questions", async (req, res) => {
  res.json(bigDatabase);
});

app.get("/api/courses", async (req, res) => {
  res.json(availableCourses);
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
        console.log(await check.checkVal(answer, accAnswer));
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
                        console.log(await check.checkVal(answer, accAnswer));
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

  const {correctVal, correct} = await checkCorrect(answer, current.answer);
  //await check.checkCorrectEmbed(answer.trim().toLowerCase(), current.answer.trim().toLowerCase(), 0.75);
  // answer.trim().toLowerCase() === current.answer.trim().toLowerCase();

  updateBook(correctVal, correct, game.botName, current.question, req.user ? users[req.user.googleId] : null);

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

app.post("/api/answerflow", async (req, res) => {
    let {answer, question, actual, name} = req.body;
    const {correctVal, correct} = await checkCorrect(answer, actual);
    updateBook(correctVal, correct, name, question, req.user ? users[req.user.googleId] : null);
    return res.json(correct);
});

async function checkCorrect(submitted, actual)
{
    const correctVal = await check.checkVal(submitted.trim().toLowerCase(), actual.trim().toLowerCase());
    const correct = correctVal >= 0.85 || submitted.trim().toLowerCase() == actual.trim().toLowerCase();
    return {correctVal, correct};
}

async function updateBook(val, correct, name, question, user)
{
    let topics = [];
    let diff = 0;

    let questionNum = 0;
    for(let i = 0; i < bigDatabase[name].length; i++)
    {
        if(bigDatabase[name][i].question == question)
        {
            questionNum = i;
            break;
        }
    }

    if(bigDatabase[name][questionNum].topics && bigDatabase[name][questionNum].diff) //gets from database
    {
        topics = bigDatabase[name][questionNum].topics;
        diff = bigDatabase[name][questionNum].diff;
    }
    else//Gemini 3.1 Flash Lite generates
    {
        //let TD_Grader = TD_Grader_List[ Math.trunc(  Math.random() * TD_Grader_List.length  ) ];
        let TD_Grader = TD_Grader_List[TD_Num];
        console.log(TD_Num);
        TD_Num = (TD_Num + 1) % TD_Grader_List.length;

        const topicResponseRaw = await TD_Grader.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Generate ONLY a comma-separated(no spaces after commas) list of 1 umbrella topic and 1 specific \
subtopic, nothing else, for the question: '${question}'. Some subtopics \
could be microbiology, glaciology, phonetics, or others that fit well. The umbrella topic can only \
be earth science, astronomy, biology, chemistry, physics, math, literature, or history. Capitalize the first \
letter of all words. The subtopic does not have to be the answer, and it has to be one word.`
        });

        topics = topicResponseRaw.text.split(",");

        console.log(topics);

        //-----

        const diffResponseRaw = await TD_Grader.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `Grade the question: '${question}' out of 100 based on solely difficulty. The upper end of the \
scale should include questions which require deep insight on ${topics[1]}, and the lower end requires surface \
level insight. The response must only be the number, no scale. Only evaluate based on cognitive effort \
required and how commonly known it is. 'What are the outer features of an organism called in genetics?' is \
difficulty 30. 'Where, when, and to which parents was Pythagoras born?' is difficulty 90. Slightly overestimate it.`
        });

        diff = parseInt(diffResponseRaw.text, 10);

        console.log("Difficulty: ", diff);

        bigDatabase[name][questionNum].topics = topics;
        bigDatabase[name][questionNum].diff = diff;
    }

    if(["Earth Science", "Astronomy", "Biology", "Chemistry", "Physics", "Math", "Literature", "History"].includes(topics[0]))
    {
        if(user)
        {
            if(!user.book[topics[0]][topics[1]]) //creates subtopic in book if there isn't one in the umbrella topic
            {
                user.book[topics[0]][topics[1]] = {
                    level: 1,
                    xp: 0,
                    confidence: 0.5,
                    questionsAnswered: 0,
                    correctlyAnswered: 0,
                    lastPracticed: Date.now()
                }
            }
            else
            {
                user.book[topics[0]][topics[1]].lastPracticed = Date.now();
            }

            user.book[topics[0]][topics[1]].questionsAnswered++;
            if(correct) user.book[topics[0]][topics[1]].correctlyAnswered++;
            user.book[topics[0]][topics[1]].confidence += (1 - user.book[topics[0]][topics[1]].confidence) * 0.1 * (val > 1 ? 1 : val);

            let xpAdded = 0;
            if(correct)
            {
                xpAdded = Math.round(Math.sqrt(diff) * 5);
            }
            else
            {
                xpAdded = Math.round(Math.sqrt(diff));
            }
            const levelThreshold = 25 * (user.book[topics[0]][topics[1]].level ** 2 - user.book[topics[0]][topics[1]].level + 4);
            console.log("XP earned: ", xpAdded);
            console.log("Level Threshold: ", levelThreshold);
            if(user.book[topics[0]][topics[1]].xp + xpAdded > levelThreshold)
            {
                user.book[topics[0]][topics[1]].level++;
                user.book[topics[0]][topics[1]].xp += xpAdded - levelThreshold;
            }
            else
            {
                user.book[topics[0]][topics[1]].xp += xpAdded;
            }

            for(const umbrellaTopic in user.book)
            {
                for(const subtopic in user.book[umbrellaTopic])
                {
                    if(umbrellaTopic != topics[0] || subtopic != topics[1])
                    {
                        user.book[umbrellaTopic][subtopic].confidence -= (user.book[umbrellaTopic][subtopic].confidence) * 0.01 * (Date.now() - user.book[umbrellaTopic][subtopic].lastPracticed) / 86400000;
                    }
                }
            }
            //...edit subtopic based on question & answer since by now it is for sure created

        }
    }

}

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
    let newname = name;
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

app.get("/api/profile", async (req, res) => {
  res.json(req.user || null);
});

app.get("/api/getuser", async (req, res) => {
  const user = req.user ? users[req.user.googleId] : null;
  res.json(user);
});

app.post("/api/addprofile", async (req, res) => {
  if(req.user)
  {
    if(!users[req.user.googleId])
    {
        users[req.user.googleId] = {theme: req.body.theme, book: {
        "Earth Science": {},
        "Astronomy": {},
        "Biology": {},
        "Chemistry": {},
        "Physics": {},
        "Math": {},
        "Literature": {},
        "History": {}
        }};
    }
  }
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
