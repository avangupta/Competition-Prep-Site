document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const botName = params.get("course");

  loadCourse(botName);
});

async function loadCourse(name)
{
    document.getElementById("title").textContent = name;

    const res = await fetch("/api/courses");
    const data = await res.json();

    const courseText = data[name].blocks;

    const visible = document.getElementById("visible");

    const pages = [];
    let page = document.createElement("div");
    page.classList.add("course-page");

    for(const block of courseText)
    {
        const type = block.type;
        const element = document.createElement("div");
        element.classList.add(`course-${type}`);
        element.textContent = block.text;
        page.appendChild(element);
        if(type === "pagebreak")
        {
            pages.push(page);

            page = document.createElement("div");
            page.classList.add("course-page");
        }
    }

    pages.push(page); //for the last page in a course that doesn't need a pagebreak

    for(let x = 0; x < pages.length; x++)
    {
        const nav = document.createElement("div");
        nav.classList.add("course-nav");

        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.textContent = "Back";
        backBtn.onclick = async () => {
          visible.replaceChildren(pages[x - 1]);
        };
        if(x === 0)
        {
            backBtn.style.visibility = "hidden";
        }
        nav.appendChild(backBtn);

        const counter = document.createElement("div");
        counter.classList.add("option-desc");
        counter.textContent = `Page ${x + 1} out of ${pages.length}`;
        nav.appendChild(counter);

        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.textContent = "Next";
        nextBtn.onclick = async () => {
          visible.replaceChildren(pages[x + 1]);
        };
        if(x === pages.length - 1)
        {
            nextBtn.style.visibility = "hidden";
        }
        nav.appendChild(nextBtn);

        pages[x].appendChild(nav);
    }

    visible.appendChild(pages[0]);
}