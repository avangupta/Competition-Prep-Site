document.addEventListener("DOMContentLoaded", () => {
  loadButton();
  loadBots();
});

async function loadButton()
{
    const res = await fetch("/api/profile");
    const profile = await res.json();

    document.getElementById("loginBtn").style.display = profile ? "none" : "block";
    document.getElementById("logoutBtn").style.display = profile ? "block" : "none";
    document.getElementById("profileBtn").style.display = profile ? "block" : "none";
}

async function returnName()
{
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data)
    {
        return data.googleId;
    }
    else
    {
        return null;
    }
}


async function loadBots() {
  const res = await fetch("/api/bots");
  const {availableBots, bigDatabase} = await res.json();

  const profileId = await returnName();

  const bots = Object.keys(availableBots);

  const divPrivate = document.getElementById("botListPrivate");
  const divPublic = document.getElementById("botListPublic");
  const divFavorite = document.getElementById("botListFavorite");

  divPrivate.innerHTML = "";
  divPublic.innerHTML = "";
  divFavorite.innerHTML = "";

  // IMPORTANT: do NOT overwrite className
  divPrivate.classList.add("card-grid");
  divPublic.classList.add("card-grid");
  divFavorite.classList.add("card-grid");

  bots.forEach(name => {
    if (availableBots[name].access === "private" && profileId === availableBots[name].id)
    {
        const card = document.createElement("divPrivate");
        card.classList.add("bot-card");

        const title = document.createElement("h3");
        title.textContent = name;

        const botTags = document.createElement("div");
        botTags.classList.add("botTags");

        if (availableBots[name].tags.tag1) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag1;
            botTags.appendChild(tag);
        }

        if (availableBots[name].tags.tag2) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag2;
            botTags.appendChild(tag);
        }

        if (availableBots[name].tags.tag3) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag3;
            botTags.appendChild(tag);
        }

        const descMaker = document.createElement("option-desc");
        descMaker.textContent = `Made by ${availableBots[name].owner}`;

        let descQ;
        if (bigDatabase[name])
        {
            descQ = document.createElement("option-desc");
            descQ.textContent = `${bigDatabase[name].length} questions`;
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Start";
        btn.onclick = async () => {
          window.location.href = `/configure.html?bot=${encodeURIComponent(name)}`;
        };

        const editbtn = document.createElement("button");
        editbtn.type = "button";
        editbtn.textContent = "\u270D\uFE0FEdit";
        editbtn.onclick = async () => {
          window.location.href = `/create.html?bot=${encodeURIComponent(name)}`;
        };

        const deletebtn = document.createElement("button");
        deletebtn.type = "button";
        deletebtn.textContent = "❌Delete";
        deletebtn.onclick = async () => {
          if (window.confirm("Continue with deletion?")) {
          await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
          });
          }
        };

        card.appendChild(title);
        card.appendChild(botTags);
        card.appendChild(descMaker);
        if (bigDatabase[name])
        {
            card.appendChild(descQ);
        }
        card.appendChild(btn);
        card.appendChild(editbtn);
        card.appendChild(deletebtn);
        divPrivate.appendChild(card);
    }
    else if (availableBots[name].access === "public" && profileId === availableBots[name].id)
    {
        const card = document.createElement("divPublic");
        card.classList.add("bot-card");

        const title = document.createElement("h3");
        title.textContent = name;

        const botTags = document.createElement("div");
        botTags.classList.add("botTags");

        if (availableBots[name].tags.tag1) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag1;
            botTags.appendChild(tag);
        }

        if (availableBots[name].tags.tag2) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag2;
            botTags.appendChild(tag);
        }

        if (availableBots[name].tags.tag3) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag3;
            botTags.appendChild(tag);
        }

        const descMaker = document.createElement("option-desc");
        descMaker.textContent = `Made by ${availableBots[name].owner}`;

        const descFav = document.createElement("option-desc");
        const favs = availableBots[name].favorited.length;
        if (favs >= 100)
        {
            descFav.textContent = `${favs} people liked this💖️`;
        }
        else if (favs >= 50)
        {
            descFav.textContent = `${favs} people liked this💞️`;
        }
        else if (favs >= 25)
        {
            descFav.textContent = `${favs} people liked this💘️`;
        }
        else if (favs >= 10)
        {
            descFav.textContent = `${favs} people liked this😍️`;
        }
        else if (favs >= 5)
        {
            descFav.textContent = `${favs} people liked this💙️`;
        }
        else
        {
            descFav.textContent = `${favs} people liked this❤️`;
        }

        let descQ;
        if (bigDatabase[name])
        {
            descQ = document.createElement("option-desc");
            descQ.textContent = `${bigDatabase[name].length} questions`;
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Start";
        btn.onclick = async () => {
          window.location.href = `/configure.html?bot=${encodeURIComponent(name)}`;
        };

        const editbtn = document.createElement("button");
        editbtn.type = "button";
        editbtn.textContent = "\u270D\uFE0FEdit";
        editbtn.onclick = async () => {
          window.location.href = `/create.html?bot=${encodeURIComponent(name)}`;
        };

        const deletebtn = document.createElement("button");
        deletebtn.type = "button";
        deletebtn.textContent = "❌Delete";
        deletebtn.onclick = async () => {
          if (window.confirm("Continue with deletion?")) {
          await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
          });
          }
        };

        card.appendChild(title);
        card.appendChild(botTags);
        card.appendChild(descMaker);
        card.appendChild(descFav);
        if (bigDatabase[name])
        {
            card.appendChild(descQ);
        }
        card.appendChild(btn);
        card.appendChild(editbtn);
        card.appendChild(deletebtn);
        divPublic.appendChild(card);
    }
    else if (availableBots[name].access === "public" && availableBots[name].favorited.includes(profileId))
    {
        const card = document.createElement("divFavorite");
        card.classList.add("bot-card");

        const title = document.createElement("h3");
        title.textContent = name;

        const botTags = document.createElement("div");
        botTags.classList.add("botTags");

        if (availableBots[name].tags.tag1) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag1;
            botTags.appendChild(tag);
        }

        if (availableBots[name].tags.tag2) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag2;
            botTags.appendChild(tag);
        }

        if (availableBots[name].tags.tag3) {
            const tag = document.createElement("span");
            tag.classList.add("tag");
            tag.textContent = availableBots[name].tags.tag3;
            botTags.appendChild(tag);
        }

        const descMaker = document.createElement("option-desc");
        descMaker.textContent = `Made by ${availableBots[name].owner}`;

        const descFav = document.createElement("option-desc");
        const favs = availableBots[name].favorited.length;
        if (favs >= 100)
        {
            descFav.textContent = `${favs} people liked this💖️`;
        }
        else if (favs >= 50)
        {
            descFav.textContent = `${favs} people liked this💞️`;
        }
        else if (favs >= 25)
        {
            descFav.textContent = `${favs} people liked this💘️`;
        }
        else if (favs >= 10)
        {
            descFav.textContent = `${favs} people liked this😍️`;
        }
        else if (favs >= 5)
        {
            descFav.textContent = `${favs} people liked this💙️`;
        }
        else
        {
            descFav.textContent = `${favs} people liked this❤️`;
        }

        let descQ;
        if (bigDatabase[name])
        {
            descQ = document.createElement("option-desc");
            descQ.textContent = `${bigDatabase[name].length} questions`;
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Start";
        btn.onclick = async () => {
          window.location.href = `/configure.html?bot=${encodeURIComponent(name)}`;
        };

        const favbtn = document.createElement("button");
        favbtn.type = "button";
        favbtn.textContent = "💔Unfavorite";
        favbtn.onclick = async () => {
          await fetch("/api/unfavorite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
          });
          //loadBots();
        };

        card.appendChild(title);
        card.appendChild(botTags);
        card.appendChild(descMaker);
        card.appendChild(descFav);
        if (bigDatabase[name])
        {
            card.appendChild(descQ);
        }
        card.appendChild(btn);
        card.appendChild(favbtn);
        divFavorite.appendChild(card);
    }
  });
}
