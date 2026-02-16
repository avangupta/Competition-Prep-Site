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

  const funDropdown = document.getElementById("funDropdown");
  const fun = document.getElementById("fun");

  // Add an event listener to the checkbox
  funDropdown.addEventListener('change', function() {
   fun.style.display = funDropdown.checked ? "block" : "none";
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
