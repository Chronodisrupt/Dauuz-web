
// Hamburger toggle

const btn = document.getElementById("menu-btn");
const nav = document.getElementById("nav-links");
btn.addEventListener("click", () => {
  btn.classList.toggle("active");
  nav.classList.toggle("open");
});


document.addEventListener("DOMContentLoaded", () => {

  const supabaseUrl = 'https://ydeczzyvfgwwmfornfef.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZWN6enl2Zmd3d21mb3JuZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Njc1ODksImV4cCI6MjA4MzU0MzU4OX0.IBNkcqDJtQSurdKaic94iRrc4NYnO8m1e1bQzbkkstc";
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);



 
// Leaderboard rendering
 
const leaderboardList = document.getElementById("leaderboard-list");

async function renderLeaderboard() {
  leaderboardList.innerHTML = "<li>Loading...</li>";

  // Fetch top 10 users by balance
  const { data: users, error } = await supabase
    .from("profiles")
    .select("username, balance")
    .order("balance", { ascending: false })
    .limit(10);

  if (error) return leaderboardList.innerHTML = `<li>Error: ${error.message}</li>`;
  if (!users || users.length === 0) return leaderboardList.innerHTML = "<li>No users yet</li>";

  leaderboardList.innerHTML = "";

  users.forEach((user, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${user.username} : ${user.balance.toFixed(6)} DUZ`;
    li.style.opacity = 0;
    leaderboardList.appendChild(li);

    setTimeout(() => {
      li.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      li.style.opacity = 1;
      li.style.transform = "translateY(0)";
    }, 50);
  });
}

 
// Live refresh every 20 seconds
 
renderLeaderboard();
setInterval(renderLeaderboard, 20000);




});
