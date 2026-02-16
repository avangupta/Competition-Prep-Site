document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("searchBtn").click();
  });

  loadBots();
});

async function loadButton()
{
    const res = await fetch("/api/profile");
    const profile = await res.json();
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

  const divCommunity = document.getElementById("botListCommunity");

  divCommunity.innerHTML = "";

  // IMPORTANT: do NOT overwrite className
  divCommunity.classList.add("card-grid");

  bots.forEach(name => {
    if (availableBots[name].access === "public" && profileId !== availableBots[name].id)
    {
        const term = document.getElementById("search").value.toLowerCase();
        const allBotTags = availableBots[name].tags;
        if (!term || (term.includes(allBotTags.tag1.toLowerCase()) && allBotTags.tag1) || (term.includes(allBotTags.tag2.toLowerCase()) && allBotTags.tag2) || (term.includes(allBotTags.tag3.toLowerCase()) && allBotTags.tag3) ||
        (allBotTags.tag1.toLowerCase().includes(term) && allBotTags.tag1) || (allBotTags.tag2.toLowerCase().includes(term) && allBotTags.tag2) || (allBotTags.tag3.toLowerCase().includes(term) && allBotTags.tag3) ){
            if (availableBots[name].favorited.includes(profileId))
            {
            const card = document.createElement("divCommunity");
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
            divCommunity.appendChild(card);
        }
            else if (!availableBots[name].favorited.includes(profileId))
            {
            const card = document.createElement("divCommunity");
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
            favbtn.textContent = "\u2764\uFE0FFavorite";
            favbtn.onclick = async () => {
            await fetch("/api/favorite", {
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
            divCommunity.appendChild(card);
        }
        }
    }
  });
}
