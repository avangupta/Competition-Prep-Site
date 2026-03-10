document.addEventListener("DOMContentLoaded", () => {
  loadUsername();
});

async function loadUsername()
{
    const res = await fetch("/api/profile");
    const data = await res.json();

    if (data.name && data.email)
    {
        document.getElementById("username").textContent = data.name;
        document.getElementById("email").textContent = data.email;
    }
}