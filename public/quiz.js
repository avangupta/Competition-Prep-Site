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

  document.getElementById("backBtn").onclick = async () => {
    await fetch("/api/reset-session", { method: "POST" });
    location.href = "/";
  };
});

document.getElementById("backBtn").onclick = async () => {
  await fetch("/api/reset-session", { method: "POST" });
  location.href = "/";
};


let timerInterval;

function startTimer(seconds) {
  clearInterval(timerInterval);

  let timeLeft = seconds;

  const display = document.getElementById("timeRemaining");
  display.textContent = timeLeft;

  console.log("Timer runs");

  timerInterval = setInterval(() => {
    timeLeft--;
    display.textContent = timeLeft;
    console.log("Second");

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
  document.getElementById("question").innerText = data.question;

  const percent = ((data.index - 1) / data.total) * 100;

  document.getElementById("progressBar").style.width =`${percent}%`;

  document.getElementById("answer").disabled = false;
  document.getElementById("answer").value = "";
  document.getElementById("submitBtn").disabled = false;

  document.getElementById("timer").style.display =
  data.timeLimit ? "block" : "none";

  // 🔥 start per-question timer
  const limit = Number(data.timeLimit);

        if (!Number.isNaN(limit)) {
            if (data.timeLimit)
            {
                startTimer(limit);
            }
        }
}

async function submit(autoTimeout = false) {
  clearInterval(timerInterval);
  const submitBtn = document.getElementById("submitBtn");
  const answerInput = document.getElementById("answer");

  // ❌ Only block manual submits
  if (!autoTimeout && submitBtn.disabled) return;

  const answer = answerInput.value;

  const res = await fetch("/api/answer", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer })
  });

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
};
