async function loadQuestion() {
  const res = await fetch("/api/question");
  const data = await res.json();

  if (data.done) {
    document.getElementById("question").innerText =
      `Finished! Score: ${data.score}`;
    return;
  }

  document.getElementById("question").innerText = data.question;
  document.getElementById("title").innerText = data.name;
}

async function submit() {
  const ans = document.getElementById("answer").value;
  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer: ans })
  });

  const data = await res.json();
  document.getElementById("feedback").innerText =
    data.correct ? "Correct!" : `Wrong. Answer: ${data.correctAnswer}`;

  document.getElementById("answer").value = "";
  loadQuestion();
}

document.getElementById("backBtn").onclick = async () => {
  await fetch("/api/reset-session", { method: "POST" });
  location.href = "/";
};

document.addEventListener("DOMContentLoaded", () => {
  loadBots();
});

loadQuestion();
answerInput.focus();

answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitBtn.click();
  }
});