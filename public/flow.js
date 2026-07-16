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

async function loadQuestion()
{
    const res = await fetch("/api/profile");
    const data = await res.json();

    const bigD = await fetch("/api/questions");
    const bigDatabase = await bigD.json();
}