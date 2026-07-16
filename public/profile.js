document.addEventListener("DOMContentLoaded", () => {
  loadVals();
});

async function loadVals()
{
    const res = await fetch("/api/profile");
    const data1 = await res.json();

    const re = await fetch("/api/getuser");
    const data2 = await re.json();

    if (data1)
    {
        document.getElementById("username").textContent = data1.name;
        document.getElementById("email").textContent = data1.email;

        document.getElementById("theme").textContent = data2.theme;

        const earth = Object.values(data2.book["Earth Science"]);
        if(earth.length > 0)
        {
            const sum = earth.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("es").textContent = sum/earth.length;
        }
        else { document.getElementById("es").textContent = 0; }

        const space = Object.values(data2.book["Astronomy"]);
        if(space.length > 0)
        {
            const sum = space.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("spa").textContent = sum/space.length;
        }
        else { document.getElementById("spa").textContent = 0; }

        const lifescience = Object.values(data2.book["Biology"]);
        if(lifescience.length > 0)
        {
            const sum = lifescience.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("life").textContent = sum/lifescience.length;
        }
        else { document.getElementById("life").textContent = 0; }

        const chemistry = Object.values(data2.book["Chemistry"]);
        if(chemistry.length > 0)
        {
            const sum = chemistry.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("chem").textContent = sum/chemistry.length;
        }
        else { document.getElementById("chem").textContent = 0; }

        const physical = Object.values(data2.book["Physics"]);
        if(physical.length > 0)
        {
            const sum = physical.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("phy").textContent = sum/physical.length;
        }
        else { document.getElementById("phy").textContent = 0; }

        const ma = Object.values(data2.book["Math"]);
        if(ma.length > 0)
        {
            const sum = ma.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("math").textContent = sum/ma.length;
        }
        else { document.getElementById("math").textContent = 0; }

        const liter = Object.values(data2.book["Literature"]);
        if(liter.length > 0)
        {
            const sum = liter.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("lit").textContent = sum/liter.length;
        }
        else { document.getElementById("lit").textContent = 0; }

        const histo = Object.values(data2.book["History"]);
        if(histo.length > 0)
        {
            const sum = histo.reduce((accumulator, currentPropertyObj) => accumulator + currentPropertyObj.level + currentPropertyObj.xp/(25 * (currentPropertyObj.level ** 2 - currentPropertyObj.level + 4)), 0);
            document.getElementById("hist").textContent = sum/histo.length;
        }
        else { document.getElementById("hist").textContent = 0; }
    }
}