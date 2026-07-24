document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search").addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("searchBtn").click();
  });

  loadCourses();
});

async function getUser()
{
    const res = await fetch("/api/getuser");
    const data = await res.json();
    return data;
}

async function calcScore(confidence, qAnswered, cAnswered, a, b, c)
{
    return a * (1 - confidence) + b/(Math.sqrt(qAnswered) > 0 ? qAnswered : 0.5) + c * (qAnswered - cAnswered);
}

async function returnRecommendations(data)
{
    const book = data.book;

    let topUmb = "";
    let topSub = "";
    let topScore = 0;
    for(const umbTopic in book)
    {
        for(const subTopic in book[umbTopic])
        {
            const score = await calcScore(book[umbTopic][subTopic].confidence, book[umbTopic][subTopic].questionsAnswered, book[umbTopic][subTopic].correctlyAnswered,
            10, 10, 10);
            console.log(score, umbTopic, subTopic);
            if(score >= topScore)
            {
                topScore = score;
                topUmb = umbTopic;
                topSub = subTopic;
            }
        }
    }

    return {topUmb, topSub};
}

async function loadCourses()
{
  const res = await fetch("/api/courses");
  const availableBots = await res.json();

  const res1 = await fetch("/api/getuser");
  const data = await res1.json();

  let topUmb = "";
  let topSub = "";
  if(data)
  {
    const x = await returnRecommendations(data);
    topUmb = x.topUmb;
    topSub = x.topSub;
  }
  console.log(topSub);

  const courses = Object.keys(availableBots);

  const divCommunity = document.getElementById("courseList");

  divCommunity.innerHTML = "";
  divCommunity.classList.add("card-grid");

  courses.forEach(name => {
        let term = document.getElementById("search").value.toLowerCase();
        const allBotTags = availableBots[name].topics;
        if(!term && data)
        {
            document.getElementById("caption").textContent = "Try answering more questions to get accurate recommendations.";
            term = topSub.toLowerCase();
            if ( (term.includes(allBotTags[0].toLowerCase()) && allBotTags[0]) || (term.includes(allBotTags[1].toLowerCase()) && allBotTags[1]) ||
            (allBotTags[0].toLowerCase().includes(term) && allBotTags[0]) || (allBotTags[1].toLowerCase().includes(term) && allBotTags[1]) ||
            (name.toLowerCase().includes(term)) || (term.includes(name.toLowerCase())) )
            {
                const card = document.createElement("divCommunity");
                card.classList.add("bot-card");

                const title = document.createElement("h3");
                title.textContent = name;
                card.appendChild(title);

                const botTags = document.createElement("div");
                botTags.classList.add("botTags");

                if (availableBots[name].topics[0]) {
                    const tag = document.createElement("span");
                    tag.classList.add("tag");
                    tag.textContent = availableBots[name].topics[0];
                    botTags.appendChild(tag);
                }

                if (availableBots[name].topics[1]) {
                    const tag = document.createElement("span");
                    tag.classList.add("tag");
                    tag.textContent = availableBots[name].topics[1];
                    botTags.appendChild(tag);
                }

                card.appendChild(botTags);

                const desc = document.createElement("div");
                desc.classList.add("option-desc");
                desc.textContent = availableBots[name].description;
                card.appendChild(desc);

                card.appendChild(document.createElement("h3"));

                const diff = document.createElement("div");
                diff.classList.add("option-desc");
                diff.textContent = `Rated ${availableBots[name].difficulty / 10} / 10`;
                card.appendChild(diff);

                card.appendChild(document.createElement("h3"));

                const descMaker = document.createElement("div");
                descMaker.classList.add("option-desc");
                descMaker.textContent = `Made by ${availableBots[name].owner}`;
                card.appendChild(descMaker);

                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = "Begin";
                btn.onclick = async () => {
                  window.location.href = `/course.html?course=${encodeURIComponent(name)}`;
                };
                card.appendChild(btn);

                divCommunity.appendChild(card);
            }
        }
        else if(!term)
        {
            document.getElementById("caption").textContent = "Log in to get recommendations.";
        }
        else if ( (term.includes(allBotTags[0].toLowerCase()) && allBotTags[0]) || (term.includes(allBotTags[1].toLowerCase()) && allBotTags[1]) ||
        (allBotTags[0].toLowerCase().includes(term) && allBotTags[0]) || (allBotTags[1].toLowerCase().includes(term) && allBotTags[1]) ||
        (name.toLowerCase().includes(term)) || (term.includes(name.toLowerCase())) )
        {
            document.getElementById("caption").textContent = "Try being more specific with your search.";
            const card = document.createElement("divCommunity");
            card.classList.add("bot-card");

            const title = document.createElement("h3");
            title.textContent = name;
            card.appendChild(title);

            const botTags = document.createElement("div");
            botTags.classList.add("botTags");

            if (availableBots[name].topics[0]) {
                const tag = document.createElement("span");
                tag.classList.add("tag");
                tag.textContent = availableBots[name].topics[0];
                botTags.appendChild(tag);
            }

            if (availableBots[name].topics[1]) {
                const tag = document.createElement("span");
                tag.classList.add("tag");
                tag.textContent = availableBots[name].topics[1];
                botTags.appendChild(tag);
            }

            card.appendChild(botTags);

            const desc = document.createElement("div");
            desc.classList.add("option-desc");
            desc.textContent = availableBots[name].description;
            card.appendChild(desc);

            card.appendChild(document.createElement("h3"));

            const diff = document.createElement("div");
            diff.classList.add("option-desc");
            diff.textContent = `Rated ${availableBots[name].difficulty / 10} / 10`;
            card.appendChild(diff);

            card.appendChild(document.createElement("h3"));

            const descMaker = document.createElement("div");
            descMaker.classList.add("option-desc");
            descMaker.textContent = `Made by ${availableBots[name].owner}`;
            card.appendChild(descMaker);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = "Begin";
            btn.onclick = async () => {
              window.location.href = `/course.html?course=${encodeURIComponent(name)}`;
            };
            card.appendChild(btn);

            divCommunity.appendChild(card);
    }
  });
}