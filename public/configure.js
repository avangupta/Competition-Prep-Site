document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const botName = params.get("bot");

  document.getElementById("botName").innerText = `Configure ${botName}`;

  const timeOptions = document.getElementById("timeOptions");

  document.querySelectorAll("input[name='mode']").forEach(radio => {
    radio.addEventListener("change", () => {
      timeOptions.classList.toggle(
        "hidden",
        radio.value !== "timed"
      );
    });
  });

  document.getElementById("startBtn").onclick = async () => {
    const mode = document.querySelector("input[name='mode']:checked").value;

    const config = {
      botName,
      mode,
      questionOrder: document.getElementById("randomOrder").checked
        ? "random"
        : "ordered",
      timeLimit: mode === "timed"
        ? Number(document.getElementById("timeLimit").value)
        : null,
      spoken: document.getElementById("spokenQuestions").checked
        ? "spoken"
        : null,
    };

    await fetch("/api/start-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });

    location.href = "/quiz.html";
  };
});
