let question = "";
let actual = "";
let name = "";

document.addEventListener("DOMContentLoaded", () => {
  loadQuestion();

  const answerInput = document.getElementById("answer");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");
  answerInput.focus();

  answerInput.addEventListener("keydown", e => {
    if (e.key === "Enter") submitBtn.click();
  });

  submitBtn.onclick = submit;
});

async function calcScore(confidence, qAnswered, cAnswered, a, b, c, d)
{
    return a * (1 - confidence) + b/(Math.sqrt(qAnswered) > 0 ? qAnswered : 0.5) + c * (qAnswered - cAnswered) + d * (Math.random() * 3 - 1.5);
}

async function loadQuestion()
{
    const res = await fetch("/api/getuser");
    const data = await res.json();

    let happen = false;

    if(data)
    {
        const bigD = await fetch("/api/questions");
        const bigDatabase = await bigD.json();
        const keys = Object.keys(bigDatabase);

        const randomList = [];
        for(const umbrellaTopic in data.book)
        {
            let scores = [];
            for(const subTopic in data.book[umbrellaTopic])
            {
                scores.push(await calcScore(data.book[umbrellaTopic][subTopic].confidence, data.book[umbrellaTopic][subTopic].questionsAnswered, data.book[umbrellaTopic][subTopic].correctlyAnswered,
                10, 10, 10, 1));
            }
            let score = 5;
            if(Object.keys(data.book[umbrellaTopic]).length != 0) score = scores.reduce((accumulator, item) => accumulator + item, 0) / scores.length;
            console.log(scores);
            console.log(score);
            for(let x = 0; x < Math.trunc(score); x++)
            {
                randomList.push(umbrellaTopic);
            }
        }

        const chosenTopic = randomList[Math.trunc(Math.random() * randomList.length)] || null;

        console.log(randomList);
        console.log(chosenTopic);

        let randomTopic = "";
        let x = 0;
        do
        {
            name = keys[ Math.trunc(  Math.random() * keys.length  ) ];
            const questions = bigDatabase[name];
            const randomQ = questions[Math.trunc(Math.random() * questions.length)];
            randomTopic = randomQ.topics ? randomQ.topics[0] : null;
            question = randomQ.question;
            actual = randomQ.answer;
            x++;
        }
        while(randomTopic != chosenTopic && x < 100);

        if(x === 100)
        {
            happen = true;
        }
        else
        {
            document.getElementById("question").innerText = question;
            document.getElementById("bot").innerText = `From ${name}`;
        }
    }
    else
    {
        document.getElementById("question").innerText = "You must be logged in to use Flow.";
        document.getElementById("bot").innerText = "Please log in.";
    }

    document.getElementById("answer").disabled = false;
    document.getElementById("submitBtn").style.display = "block";

    if(happen)
    {
        document.getElementById("submitBtn").style.display = "none";
        document.getElementById("answer").style.display = "none";
        document.getElementById("question").textContent = "Answer more questions to get the best recommendations for you.";
        document.getElementById("bot").innerText = "Please go to the Bots to answer more questions.";
    }
}

async function submit()
{
    document.getElementById("answer").disabled = true;
    document.getElementById("submitBtn").style.display = "none";

    const answer = document.getElementById("answer").value;
    const payload = {answer, question, actual, name};

    res = await fetch("/api/answerflow", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const correct = await res.json();

    if(correct)
    {
        feedback.textContent = "✅ Correct!";
        feedback.className = "feedback correct";
    }
    else
    {
        feedback.innerHTML =
        `❌ Wrong.<br>
        Correct answer: <strong>${actual}</strong>`;
        feedback.className = "feedback wrong";
    }

    document.getElementById("nextBtn").style.display = "block";
}

nextBtn.onclick = () => {
  nextBtn.style.display = "none";
  document.getElementById("answer").value = "";
  loadQuestion();
  feedback.textContent = "";
  feedback.className = "feedback";
};