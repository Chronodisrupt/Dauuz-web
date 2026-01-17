// ---------------------------
// DUZ Web Rewards & Leaderboard
// ---------------------------

// Users object
const users = {};

// Action constants
const ACTIONS = {
  REFERRAL: { amount: 0.01, dailyLimit: 10 },
  AWARENESS: { amount: 0.0125, dailyLimit: 4 },
  SURVEY: { amount: 0.025, once: true },
  INNOVATIVE_IDEA: { amount: 1 },
  GROUNDBREAKING: { amount: 10 }
};

const DAILY_CAP = 0.125;

// Helper to get today's date
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

// Ensure user exists
function ensureUser(id) {
  if (!users[id]) {
    users[id] = { balance: 0, history: {}, completed: {} };
  }
}

// Check if user can earn DUZ
function canEarn(id, action) {
  ensureUser(id);
  const today = getTodayKey();
  const user = users[id];
  const record = user.history[today] || { earnedToday: 0, actions: {} };

  if (record.earnedToday >= DAILY_CAP) return false;
  if (ACTIONS[action].once && user.completed[action]) return false;
  if (ACTIONS[action].dailyLimit) {
    const count = record.actions[action] || 0;
    if (count >= ACTIONS[action].dailyLimit) return false;
  }
  return true;
}

// Leaderboard subscribers
let leaderboardSubscribers = [];
function subscribeLeaderboard(callback) { leaderboardSubscribers.push(callback); }
function notifyLeaderboard() { leaderboardSubscribers.forEach(cb => cb()); }

// Animate DUZ increase
function animateEarn(userId, amount) {
  const leaderboardList = document.getElementById("leaderboard-list");
  if (!leaderboardList) return;

  const userElement = Array.from(leaderboardList.children)
    .find(li => li.textContent.includes(userId));

  if (!userElement) return;

  const plus = document.createElement("span");
  plus.textContent = ` +${amount.toFixed(6)} DUZ`;
  plus.style.color = "#d4a254";
  plus.style.fontWeight = "bold";
  plus.style.marginLeft = "8px";
  plus.style.opacity = 0;
  plus.style.transition = "all 0.8s ease";
  userElement.appendChild(plus);

  setTimeout(() => {
    plus.style.opacity = 1;
    plus.style.transform = "translateY(-10px)";
  }, 50);

  setTimeout(() => userElement.removeChild(plus), 1000);
}

// Reward function
function reward(id, action) {
  if (!ACTIONS[action]) return console.log("Unknown action");

  if (!canEarn(id, action)) {
    console.log(`❌ Reward denied for ${id} (${action})`);
    return;
  }

  ensureUser(id);
  const today = getTodayKey();
  const user = users[id];

  const amount = ACTIONS[action].amount;
  if (!user.history[today]) user.history[today] = { earnedToday: 0, actions: {} };

  // Cap protection
  if (user.history[today].earnedToday + amount > DAILY_CAP) {
    console.log("❌ Would exceed daily cap");
    return;
  }

  user.balance += amount;
  user.history[today].earnedToday += amount;
  user.history[today].actions[action] = (user.history[today].actions[action] || 0) + 1;

  if (ACTIONS[action].once) user.completed[action] = true;

  console.log(`✅ ${id} earned ${amount} DUZ for ${action}`);

  // Animate and refresh leaderboard
  animateEarn(id, amount);
  notifyLeaderboard();
}

// ---------------------------
// Leaderboard rendering
// ---------------------------
function renderLeaderboard() {
  const leaderboardList = document.getElementById("leaderboard-list");
  if (!leaderboardList) return;

  leaderboardList.innerHTML = "";
  const userArray = Object.entries(users).map(([id, data]) => ({
    id,
    balance: data.balance
  }));

  userArray.sort((a, b) => b.balance - a.balance);
  const topUsers = userArray.slice(0, 10);

  topUsers.forEach((user, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${user.id} — ${user.balance.toFixed(6)} DUZ`;
    li.style.opacity = 0;
    li.style.transform = "translateY(5px)";
    leaderboardList.appendChild(li);

    setTimeout(() => {
      li.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      li.style.opacity = 1;
      li.style.transform = "translateY(0)";
    }, 50);

    // Highlight top 3
    if (index === 0) li.style.borderLeft = "6px solid #ffd700"; // gold
    if (index === 1) li.style.borderLeft = "6px solid #c0c0c0"; // silver
    if (index === 2) li.style.borderLeft = "6px solid #cd7f32"; // bronze
  });
}

// Subscribe leaderboard for live updates
subscribeLeaderboard(renderLeaderboard);
renderLeaderboard(); // initial render







