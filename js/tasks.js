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

  let userId = null;

  // 🔐 PROTECT PAGE + LOAD USER
  async function initUser() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in!");
      window.location.href = "login.html";
      return;
    }

    userId = session.user.id;
    console.log("Logged in user:", userId);
  }

  initUser();


  // REFERRAL

  document.getElementById("referral-btn").addEventListener("click", async () => {
    if (!userId) return;

    const { data: user, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if(error) return alert("Failed to fetch your referral code");

    const referralCode = user.username;
    document.getElementById("referral-link").textContent = `Your referral code: ${referralCode}`;

    const { error: taskError } = await supabase.from("tasks").insert({
      user_id: userId,
      task_type: "Referral",
      content: referralCode,
      status: 'pending',
      reward: '0.001'
    });

    if(taskError) return alert(taskError.message);

    alert("Share your referral code with friends!");
  });


  // X POST SUBMISSION (NEW)

  document.getElementById("x-task-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!userId) return alert("You must be logged in");

    const xUsername = document.getElementById("x-username").value.trim().replace('@', '');
    const screenshot = document.getElementById("x-screenshot").files[0];
    const postUrl = document.getElementById("x-post-url").value.trim();
    const submitBtn = document.getElementById("x-submit-btn");

    if (!xUsername || !screenshot) {
      return alert("Please provide your X username and screenshot");
    }

    // Check daily limit (max 4 posts per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: countData, error: countError } = await supabase
      .from("tasks")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("task_type", "Awareness")
      .gte("created_at", today.toISOString());

    if (countError) return alert("Failed to check daily limit");
    if (countData.length >= 4) return alert("You can only submit 4 X posts per day");

    // Disable button while uploading
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
      // Upload screenshot to Supabase Storage
      const fileName = `x-posts/${userId}_${Date.now()}_${xUsername}.${screenshot.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from("awareness-images")
        .upload(fileName, screenshot);

      if (uploadError) {
        throw new Error("Failed to upload screenshot: " + uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("awareness-images")
        .getPublicUrl(fileName);

      // Submit task to database
      const { error: taskError } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          task_type: "Awareness",
          content: JSON.stringify({
            x_username: xUsername,
            screenshot_url: urlData.publicUrl,
            post_url: postUrl || null,
            submitted_at: new Date().toISOString()
          }),
          status: 'pending',
          reward: '0.00125'
        });

      if (taskError) {
        throw new Error("Failed to submit task: " + taskError.message);
      }

      alert("X post submitted successfully! Waiting for approval.");
      document.getElementById("x-task-form").reset();

    } catch (error) {
      alert(error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit for Approval";
    }
  });


  // IDEAS

  document.getElementById("idea-btn").addEventListener("click", async () => {
    if (!userId) return;

    const content = document.getElementById("ideaContent").value.trim();
    if (!content) return alert("Write your idea first");

    await supabase.from("tasks").insert({
      user_id: userId,
      task_type: "Idea",
      content,
      status: 'pending',
      reward: '1'
    });

    alert("Idea submitted!");
    document.getElementById("ideaContent").value = "";
  });


  // SURVEY

  document.getElementById("survey-btn").addEventListener("click", () => {
    alert("No survey available at the moment, come back later!");
  });


  // FEEDBACK & ROUTINE REDIRECTS

  document.getElementById("feedback-btn").addEventListener("click", () => {
    window.location.href = 'feedback.html';
  });

  document.getElementById("routine-btn").addEventListener("click", () => {
    window.location.href = "daily.html";
  });

});