let editBotName;

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("createBtn").onclick = createBot();
  const params = new URLSearchParams(window.location.search);
  editBotName = params.get("bot");
  console.log(editBotName);
  if (editBotName)
  {
    document.getElementById("botSettings").style.display = "none";
    document.getElementById("nameField").required = false;
    document.getElementById("header").textContent = `Edit ${editBotName}`;
    document.getElementById("createBtn").textContent = `Save Changes`;

    const res = await fetch("/api/bots");
    const {availableBots, bigDatabase} = await res.json();
    const config = availableBots[editBotName].config;

    if (config.mode === "prefix")
    {
        document.getElementById("prefix").checked = true;
        document.getElementById("line").checked = false;
        document.getElementById("qPrefixes").value = config.qPrefixes.join(",");
        document.getElementById("aPrefixes").value = config.aPrefixes.join(",");
    }
    else if (config.mode === "line")
    {
        document.getElementById("prefix").checked = false;
        document.getElementById("line").checked = true;
        document.getElementById("startLine").value = config.startLine;
        document.getElementById("QADiff").value = config.QADiff;
        document.getElementById("QQDiff").value = config.QQDiff;
    }
    if (config.shave) {

    if (config.shave.qFront){
    document.getElementById("qFront").value = config.shave.qFront;
    } if (config.shave.qBack) {
    document.getElementById("qBack").value = config.shave.qBack;
    } if (config.shave.aFront) {
    document.getElementById("aFront").value = config.shave.aFront;
    } if (config.shave.aBack) {
    document.getElementById("aBack").value = config.shave.aBack;
    }

    }

    if (availableBots[editBotName].access === "private")
    {
        document.getElementById("private").checked = true;
        document.getElementById("public").checked = false;
    }
    else if (availableBots[editBotName].access === "public")
    {
        document.getElementById("private").checked = false;
        document.getElementById("public").checked = true;
    }

    if (availableBots[editBotName])
    document.getElementById("tag1").value = availableBots[editBotName].tags.tag1;
    document.getElementById("tag2").value = availableBots[editBotName].tags.tag2;
    document.getElementById("tag3").value = availableBots[editBotName].tags.tag3;
  }
  else
  {
    document.getElementById("botSettings").style.display = "block";
    document.getElementById("nameField").style.display = "block";
    document.getElementById("nameField").required = true;
    document.getElementById("fileField").style.display = "block";
    document.getElementById("fileURL").style.display = "block";
    document.getElementById("private").checked = true;
    document.getElementById("public").checked = false;
    document.getElementById("prefix").checked = true;
    document.getElementById("line").checked = false;
    document.getElementById("header").textContent = `Build a Bot`;
    document.getElementById("createBtn").textContent = `Create`;
  }
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

document.querySelectorAll("input[name='format']").forEach(radio => {
  radio.addEventListener("change", () => {
    const val = radio.value;
    if (val === "sciBowlT")
    {
        document.getElementById("prefix").checked = true;
        document.getElementById("line").checked = false;
        document.getElementById("qPrefixes").value = "TOSS-UP";
        document.getElementById("aPrefixes").value = "ANSWER:";
        document.getElementById("startLine").value = "";
        document.getElementById("QADiff").value = "";
        document.getElementById("QQDiff").value = "";
        document.getElementById("qFront").value = "";
        document.getElementById("qBack").value = "";
        document.getElementById("aFront").value = "";
        document.getElementById("aBack").value = "";
    }
    else if (val === "sciBowlA")
    {
        document.getElementById("prefix").checked = true;
        document.getElementById("line").checked = false;
        document.getElementById("qPrefixes").value = "TOSS-UP,BONUS";
        document.getElementById("aPrefixes").value = "ANSWER:";
        document.getElementById("startLine").value = "";
        document.getElementById("QADiff").value = "";
        document.getElementById("QQDiff").value = "";
        document.getElementById("qFront").value = "";
        document.getElementById("qBack").value = "";
        document.getElementById("aFront").value = "";
        document.getElementById("aBack").value = "";
    }
    else if (val === "sciBowlB")
    {
        document.getElementById("prefix").checked = true;
        document.getElementById("line").checked = false;
        document.getElementById("qPrefixes").value = "BONUS";
        document.getElementById("aPrefixes").value = "ANSWER:";
        document.getElementById("startLine").value = "";
        document.getElementById("QADiff").value = "";
        document.getElementById("QQDiff").value = "";
        document.getElementById("qFront").value = "";
        document.getElementById("qBack").value = "";
        document.getElementById("aFront").value = "";
        document.getElementById("aBack").value = "";
    }
    else if (val === "spell")
    {
        document.getElementById("prefix").checked = false;
        document.getElementById("line").checked = true;
        document.getElementById("qPrefixes").value = "";
        document.getElementById("aPrefixes").value = "";
        document.getElementById("startLine").value = "1";
        document.getElementById("QADiff").value = "0";
        document.getElementById("QQDiff").value = "1";
        document.getElementById("qFront").value = "";
        document.getElementById("qBack").value = "";
        document.getElementById("aFront").value = "";
        document.getElementById("aBack").value = "";
    }
    else if (val === "custom")
    {
        document.getElementById("qPrefixes").value = "";
        document.getElementById("aPrefixes").value = "";
        document.getElementById("startLine").value = "";
        document.getElementById("QADiff").value = "";
        document.getElementById("QQDiff").value = "";
        document.getElementById("qFront").value = "";
        document.getElementById("qBack").value = "";
        document.getElementById("aFront").value = "";
        document.getElementById("aBack").value = "";
    }
  });
});

async function createBot() {
  document.getElementById("form").onsubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const mode = formData.get("mode");
  const access = formData.get("access");

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
    config.startLine = Number(formData.get("startLine"));
    config.QADiff = Number(formData.get("QADiff"));
    config.QQDiff = Number(formData.get("QQDiff"));
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

  const tags = {
    tag1: formData.get("tag1"),
    tag2: formData.get("tag2"),
    tag3: formData.get("tag3")
  };

  console.log(tags.tag1);
  console.log(tags.tag2);
  console.log(tags.tag3);


  const payload = new FormData();
  if (editBotName)
  {
    payload.append("name", editBotName);
    payload.append("edit", true);
  }
  else
  {
    payload.append("name", formData.get("name"));
    payload.append("file", formData.get("file"));
    payload.append("fileURL", formData.get("fileURL"));
  }
  payload.append("config", JSON.stringify(config));
  payload.append("access", access);
  payload.append("tags", JSON.stringify(tags));

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