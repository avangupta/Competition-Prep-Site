let data2;

document.addEventListener("DOMContentLoaded", () => {
  loadVals();
});

document.querySelectorAll(".topic-header").forEach(header => {

    header.addEventListener("click", () => {

        const card = header.closest(".topic-card");

        const subtopics = card.querySelector(".subtopics");

        const icon = card.querySelector(".expand-icon");

        subtopics.classList.toggle("open");

        icon.classList.toggle("open");

        const open = icon.classList.contains("open");
        const umbTopic = header.querySelector("span").id;
        subtopics.innerHTML = null;
        if(open)
        {
            for (const subtopic in data2.book[umbTopic])
            {
                const div = document.createElement("div");
                div.className = "subtopic-card";

                const nameHeader = document.createElement("div");
                nameHeader.className = "subtopic-header";
                nameHeader.innerText = subtopic;
                div.appendChild(nameHeader);

                const levelHeader = document.createElement("div");
                levelHeader.className = "subtopic-level";
                levelHeader.innerText = "Level " + data2.book[umbTopic][subtopic].level;
                div.appendChild(levelHeader);

                const progressContainer = document.createElement("div");
                progressContainer.className = "progress-container";
                const bar = document.createElement("div");
                bar.className = "progress-bar";
                const levelThreshold = 25 * (data2.book[umbTopic][subtopic].level ** 2 - data2.book[umbTopic][subtopic].level + 4);
                bar.style.width = data2.book[umbTopic][subtopic].xp * 100 / levelThreshold + "%";
                progressContainer.appendChild(bar);
                div.appendChild(progressContainer);

                div.appendChild(document.createElement("br"));

                const xpHeader = document.createElement("div");
                xpHeader.className = "subtopic-level";
                xpHeader.innerText = data2.book[umbTopic][subtopic].xp + "/" + levelThreshold + " XP";
                div.appendChild(xpHeader);

                div.appendChild(document.createElement("br"));

                const questionsHeader = document.createElement("div");
                questionsHeader.className = "subtopic-name";
                questionsHeader.innerText = "Answered " + data2.book[umbTopic][subtopic].correctlyAnswered + "/" + data2.book[umbTopic][subtopic].questionsAnswered + " questions correctly";
                div.appendChild(questionsHeader);

                subtopics.appendChild(div);
            }
        }
    });
});

async function loadVals()
{
    const res = await fetch("/api/profile");
    const data1 = await res.json();

    const re = await fetch("/api/getuser");
    data2 = await re.json();

    if (data1)
    {
        document.getElementById("username").textContent = data1.name;
        document.getElementById("email").textContent = data1.email;

        document.getElementById("theme").textContent = data2.theme;


        for(const umbTopic in data2.book)
        {
            const x = Object.values(data2.book[umbTopic]);
            if(x.length > 0)
            {
                let levelSum = x.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level, 0);
                let xpSum = x.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.xp, 0);
                while(xpSum > 25 * (levelSum ** 2 - levelSum + 4))
                {
                    levelSum++;
                    xpSum -= 25 * (levelSum ** 2 - levelSum + 4);
                }
                const sum = levelSum + xpSum/(25 * (levelSum ** 2 - levelSum + 4));
                document.getElementById(umbTopic).textContent = `Score: ${Math.round(sum * 100) / 100}`;
            }
            else { document.getElementById(umbTopic).textContent = "Score: 1"; }
        }
    }
}