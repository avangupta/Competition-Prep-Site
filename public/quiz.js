document.addEventListener("DOMContentLoaded", () => {
  loadQuestion();

  const answerInput = document.getElementById("answer");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");

  answerInput.focus();

  answerInput.addEventListener("keydown", e => {
    if (e.key === "Enter") submitBtn.click();
  });

  submitBtn.onclick = submit;
});

document.getElementById("backBtn").onclick = async () => {
  window.speechSynthesis.cancel();
  await fetch("/api/reset-session", { method: "POST" });
  location.href = "/";
};

document.getElementById("replayBtn").onclick = () => {
  window.speechSynthesis.cancel();
  if (speakingEnabled) speak(formatForSpeech(question1234), false, null);
};

let isSpeaking = false;
let elapsed = -1;

function formatForSpeech(text) {
  return text
    .replace(/\./g, ". ")
    .replace(/,/g, ", ")
    .replace(/\(/g, ", ")
    .replace(/\)/g, ", ");
}

let speechUtterance = null;
let speakingEnabled = false;
let question1234;

function speak(text, first, limit) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  speechUtterance = new SpeechSynthesisUtterance(text);
  speechUtterance.rate = 0.95;   // slightly slower = clearer
  speechUtterance.pitch = 1;
  speechUtterance.volume = 1;

  // Choose a good English voice
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith("en"));
  if (voice) speechUtterance.voice = voice;

  speechUtterance.onstart = () => {
    isSpeaking = true;
    document.getElementById("replayBtn").disabled = true;
    if (first)
    {
    document.getElementById("timeRemaining").textContent = limit;
    if (limit <= 5) {
      timer.className = "danger";
    } else if (limit <= 10) {
      timer.className = "warning";
    } else {
      timer.className = "";
    }
    }
  };

  speechUtterance.onend = () => {
    isSpeaking = false;
    elapsed = 0;
    document.getElementById("replayBtn").disabled = false;
    if (first)
    {
        if (!Number.isNaN(limit)) {
            if (limit)
            {
                startTimer(limit);
            }
        }
    }
  }
  window.speechSynthesis.speak(speechUtterance);
}

let timerInterval;

function startTimer(seconds) {
  clearInterval(timerInterval);
  elapsed = 0;
  let timeLeft = seconds;

  if (timeLeft <= 5) {
      timer.className = "danger";
    } else if (timeLeft <= 10) {
      timer.className = "warning";
    } else {
      timer.className = "";
    }

  const display = document.getElementById("timeRemaining");
  display.textContent = timeLeft;


  timerInterval = setInterval(() => {
    timeLeft--;
    display.textContent = timeLeft;
    elapsed++;

    if (timeLeft <= 5) {
      timer.className = "danger";
    } else if (timeLeft <= 10) {
      timer.className = "warning";
    } else {
      timer.className = "";
    }

    if (timeLeft <= 0) {
  clearInterval(timerInterval);

  // 🔥 CALL FIRST
  submit(true);

  // 🔒 LOCK INPUT AFTER
  document.getElementById("answer").disabled = true;
  document.getElementById("submitBtn").disabled = true;
}
  }, 1000);
}


async function loadQuestion() {
  const res = await fetch("/api/question", {
    credentials: "same-origin"
  });

  const data = await res.json();

  if (data.done) {
    clearInterval(timerInterval);
    document.getElementById("question").innerText =
      `Finished! Score: ${data.score}/${data.questions}`;
    document.getElementById("timer").style.display = "none";
    document.getElementById("answer").value = "";
    document.getElementById("answer").disabled = true;
    document.getElementById("submitBtn").disabled = true;
    document.getElementById("replayBtn").disabled = true;
    document.getElementById("progressBar").style.width = '100%';
    document.getElementById("progressBar").style.animation = "donePulse 1.2s infinite";

    // 🎉 CONFETTI
    confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 }
    });

    setTimeout(() => {
        confetti({
        particleCount: 120,
        spread: 120,
        origin: { y: 0.4 }
        });
    }, 350);

    return;
  }

  document.getElementById("title").innerText = data.botName;


  if (data.spoken)
  {
    speakingEnabled = true;
  }

  document.getElementById("replayBtn").style.display =
  speakingEnabled ? "block" : "none";

  if (speakingEnabled)
  {
        document.getElementById("question").innerText = "Question being read...📢";
        speak(formatForSpeech(data.question), true, data.timeLimit);
  }
  else
  {
    document.getElementById("question").innerText = data.question;
  }
  question1234 = data.question;


  const percent = ((data.index - 1) / data.total) * 100;

  document.getElementById("progressBar").style.width =`${percent}%`;

  document.getElementById("answer").disabled = false;
  document.getElementById("answer").value = "";
  document.getElementById("submitBtn").disabled = false;

  document.getElementById("timer").style.display =
  data.timeLimit ? "block" : "none";

  // 🔥 start per-question timer
  if (!speakingEnabled) {
  const limit = Number(data.timeLimit);

        if (!Number.isNaN(limit)) {
            if (data.timeLimit)
            {
                startTimer(limit);
            }
        }
  }
}

async function submit(autoTimeout = false) {
  clearInterval(timerInterval);

  const submitBtn = document.getElementById("submitBtn");
  const answerInput = document.getElementById("answer");

  // ❌ Block ONLY manual double-submits
  if (!autoTimeout && submitBtn.disabled) {
    return;
  }

  window.speechSynthesis.cancel();
  document.getElementById("replayBtn").disabled = false;

  const answer = answerInput.value;
  let res;

  try {
    const payload = speakingEnabled
      ? { answer, elapsed }
      : { answer };

    res = await fetch("/api/answer", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Fetch failed:", err);
    return;
  }

  if (!res) return; // 🛡️ absolute safety

  const data = await res.json();

  const feedback = document.getElementById("feedback");
  if (data.mode === "sudden")
  {
        feedback.innerHTML =
        `💀<strong>SUDDEN DEATH!</strong><br>
        Correct answer: <strong>${data.correctAnswer}</strong>`;
        feedback.className = "feedback sudden";
  }
  else if (data.timeout) {
    feedback.innerHTML =
      `⏰ <strong>Time’s up!</strong><br>
       Correct answer: <strong>${data.correctAnswer}</strong>`;
    feedback.className = "feedback timeout";
  } else if (data.correct && elapsed === -1 && speakingEnabled) {
    feedback.textContent = "✔Interrupt!!🚀";
    feedback.className = "feedback interrupt";
  } else if (data.correct) {
    feedback.textContent = "✅ Correct!";
    feedback.className = "feedback correct";
  } else {
    feedback.innerHTML =
      `❌ Wrong.<br>
       Correct answer: <strong>${data.correctAnswer}</strong>`;
    feedback.className = "feedback wrong";
  }

  submitBtn.disabled = true;
  answerInput.disabled = true;

  nextBtn.style.display = "inline-block";
}

nextBtn.onclick = () => {
  nextBtn.style.display = "none";
  loadQuestion();
  feedback.textContent = "";
  feedback.className = "feedback";
  elapsed = -1;
};
