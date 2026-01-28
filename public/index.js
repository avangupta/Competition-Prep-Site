document.addEventListener("DOMContentLoaded", () => {
  loadBots();
});

async function loadBots() {
  const res = await fetch("/api/bots");
  const bots = await res.json();

  const div = document.getElementById("botList");
  div.innerHTML = "";

  // IMPORTANT: do NOT overwrite className
  div.classList.add("card-grid");

  bots.forEach(name => {
    const card = document.createElement("div");
    card.classList.add("bot-card");

    const title = document.createElement("h3");
    title.textContent = name;

    const desc = document.createElement("option-desc");
    //desc.textContent = bigDatabase[name].length

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Start";
    btn.onclick = async () => {
      await fetch("/api/select-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      window.location.href = `/configure.html?bot=${encodeURIComponent(name)}`;
    };

    card.appendChild(title);
    card.appendChild(btn);
    div.appendChild(card);
  });
}