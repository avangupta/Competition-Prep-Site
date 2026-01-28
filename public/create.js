document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("createBtn").onclick = createBot();
});

const prefixCard = document.getElementById("prefixOptions");
const lineCard = document.getElementById("lineOptions");

document.querySelectorAll("input[name='mode']").forEach(radio => {
  radio.addEventListener("change", () => {
    const isPrefix = radio.value === "prefix";
    prefixCard.style.display = isPrefix ? "block" : "none";
    lineCard.style.display = isPrefix ? "none" : "block";
  });
});

async function createBot() {

  document.getElementById("form").onsubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const mode = formData.get("mode");

  // Base config
  const config = {
    mode
  };

  // PREFIX MODE
  if (mode === "prefix") {
    config.qPrefixes = formData
      .get("qPrefixes")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    config.aPrefixes = formData
      .get("aPrefixes")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  // LINE MODE
  if (mode === "line") {
    config.startLine = Number(formData.get("startLine")) || 1;
    config.QADiff = Number(formData.get("QADiff")) || 1;
    config.QQDiff = Number(formData.get("QQDiff")) || 2;
  }

  // SHAVING (optional)
  const shave = {
    qFront: Number(formData.get("qFront")) || 0,
    qBack: Number(formData.get("qBack")) || 0,
    aFront: Number(formData.get("aFront")) || 0,
    aBack: Number(formData.get("aBack")) || 0
  };

  // Only include shave if at least one value > 0
  if (Object.values(shave).some(v => v > 0)) {
    config.shave = shave;
  }

  const payload = new FormData();
  payload.append("name", formData.get("name"));
  payload.append("file", formData.get("file"));
  payload.append("fileURL", formData.get("fileURL"));
  payload.append("config", JSON.stringify(config));

  const res = await fetch("/api/create-bot", {
    method: "POST",
    body: payload
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  location.href = "/";
};

};