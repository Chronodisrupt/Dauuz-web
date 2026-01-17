 
// Hamburger toggle
 
const btn = document.getElementById("menu-btn");
const nav = document.getElementById("nav-links");
btn.addEventListener("click", () => {
  btn.classList.toggle("active");
  nav.classList.toggle("open");
});



document.addEventListener("DOMContentLoaded", async () => {

  console.log("DASHBOARD JS LOADED");

  const supabaseUrl = 'https://ydeczzyvfgwwmfornfef.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZWN6enl2Zmd3d21mb3JuZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Njc1ODksImV4cCI6MjA4MzU0MzU4OX0.IBNkcqDJtQSurdKaic94iRrc4NYnO8m1e1bQzbkkstc";
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // --- SESSION CHECK ---
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("You must log in to access Wellness Routine.");
    window.location.href = "login.html";
    return;
  }

  const userId = session.user.id;

  // --- CHECK IF ALREADY SUBMITTED TODAY ---
  const today = new Date();
  today.setHours(0,0,0,0);

  const { data: existing, error: existErr } = await supabase
    .from("daily_rituals")
    .select("*")
    .eq("user_id", userId)
    .gte("date", today.toISOString())
    .limit(1);

  if (existErr) console.error(existErr);

  if (existing && existing.length > 0) {
    document.getElementById("rituals-form").innerHTML = "<p style='text-align:center;color:#3d5a5a;font-weight:bold;'>You've already submitted today's Wellness Routine. Come back tomorrow!</p>";
    return;
  }

  // --- CALM TIMER MODAL ---
  let calmDone = false;
  const calmBtn = document.getElementById("calm-btn");

  // Create modal
  const calmModal = document.createElement("div");
  calmModal.classList.add("calm-modal");
  calmModal.innerHTML = `
    <div class="calm-content">
      <h2>🌿 Calm Challenge</h2>
      <p id="breath-text">Get ready to breathe...</p>
      <div id="breath-circle"></div>
      <button id="close-calm-btn">Done</button>
    </div>
  `;
  document.body.appendChild(calmModal);

  const breathText = calmModal.querySelector("#breath-text");
  const breathCircle = calmModal.querySelector("#breath-circle");
  const closeCalmBtn = calmModal.querySelector("#close-calm-btn");

  calmBtn.addEventListener("click", () => {
    calmModal.style.display = "flex";
    calmBtn.disabled = true;

    const steps = [
      { text: "Breath...", duration: 4650 },
      { text: "Breath...", duration: 4650 },
      { text: "Yes...", duration: 4650 },
      { text: "Feel the pressure leaving...", duration: 4650 },
      { text: "Ease the tension...", duration: 4650 },
      { text: "You are unique...", duration: 4650 },
      { text: "You are special...", duration: 4650 },
      { text: "You are healing...", duration: 4650 },
      { text: "One more time...", duration: 4650 },
      { text: "Breath...", duration: 4650 },
      { text: "Breath...", duration: 4650 },
      { text: "Yes...", duration: 4650 },
      { text: "Feel the pressure leaving...", duration: 4650 },
      { text: "Ease the tension...", duration: 4650 },
      { text: "You are unique...", duration: 4650 },
      { text: "You are special...", duration: 4650 },
      { text: "You are healing...", duration: 4650 },
      { text: "One more time...", duration: 4650 }
    ];

    let elapsed = 0;
    const totalDuration = 2 * 60 * 1000; // 2 min
    let i = 0;

    function breatheCycle() {
      if (elapsed >= totalDuration) {
        breathText.textContent = "Well done!";
        breathCircle.style.animation = "none";
        closeCalmBtn.style.display = "inline-block";

        // Automatically mark calmDone and award points
        calmDone = true;
        return;
      }

      breathText.textContent = steps[i].text;
      breathCircle.style.animation = `breathe ${steps[i].duration/1000}s ease-in-out infinite`;
      setTimeout(() => {
        elapsed += steps[i].duration;
        i = (i + 1) % steps.length;
        breatheCycle();
      }, steps[i].duration);
    }

    breatheCycle();
  });

  closeCalmBtn.addEventListener("click", () => {
    calmModal.style.display = "none";
    closeCalmBtn.style.display = "none";
    calmBtn.disabled = false;
  });

  // --- FORM SUBMISSION ---
  document.getElementById("rituals-form").addEventListener("submit", async e => {
    e.preventDefault();

    const stress = document.getElementById("stress").value.trim();
    const helped = document.getElementById("helped").value.trim();
    const tomorrow = document.getElementById("tomorrow").value.trim();
    const gratitude = document.getElementById("gratitude").value.trim();
    const kindness = document.getElementById("kindness").value.trim();

    if (!stress || !helped || !tomorrow || !gratitude || !kindness)
      return alert("Please complete all fields.");
    if (!calmDone) return alert("Complete the Calm Challenge before submitting.");

    const points = 0.006 + 0.002 + 0.004 + 0.002; // total 0.014 DUZ

    // Insert daily ritual
    const { error: insertErr } = await supabase.from("daily_rituals").insert([{
      user_id: userId,
      date: new Date(),
      stress,
      helped,
      tomorrow,
      gratitude,
      calm_completed: calmDone,
      kindness,
      points_earned: points
    }]);
    if (insertErr) return alert("Failed to submit Routine: " + insertErr.message);

    // Update balance
    const { data: profileData, error: updateErr } = await supabase.from("profiles").select("balance").eq("id", userId).single();
    if (updateErr) console.error(updateErr);

    const newBalance = (profileData?.balance || 0) + points;

    const { error: balErr } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", userId);
    if (balErr) console.error(balErr);

    document.getElementById("message").textContent = `Routine submitted! You earned ${points.toFixed(3)} DUZ.`;
    document.getElementById("rituals-form").reset();
    calmDone = false;
    document.getElementById("calm-status").textContent = "Not started";
  });
});
