// -------- IMPORTANT: DO NOT REDECLARE "supabase" --------

const supabaseUrl = 'https://ydeczzyvfgwwmfornfef.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZWN6enl2Zmd3d21mb3JuZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Njc1ODksImV4cCI6MjA4MzU0MzU4OX0.IBNkcqDJtQSurdKaic94iRrc4NYnO8m1e1bQzbkkstc";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

/* ---------------- HELPERS ---------------- */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2, 14);
    localStorage.setItem("device_id", id);
  }
  return id;
}

/* -------- GOOGLE SIGN-IN -------- */

async function signInWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/dashboard.html"
    }
  });

  if (error) alert(error.message);
}

/* -------- CREATE / PREFILL PROFILE FOR GOOGLE USERS -------- */

async function ensureProfileExists() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data?.session?.user;
  if (!user) return;

  const deviceId = getDeviceId();

  // Check if profile already exists
  const { data: existing } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return; // 👈 IMPORTANT: do nothing if profile already exists

  // Extract Google info safely
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Google User";

  const email = user.email;

  // Create clean username from email
  const baseUsername = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "");

  const username = baseUsername + "_" + user.id.slice(0, 6);

  const referralCode = username;

  // Insert new profile
  const { error } = await supabaseClient.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    username: username,
    email: email,
    phone: "",
    device_id: deviceId,
    referral_code: referralCode,
    balance: 0
  });

  if (error) {
    console.error("Profile creation failed:", error);
  } else {
    console.log("Google profile created!");
  }
}

/* ---------------- MAIN INIT ---------------- */

function authInit(mode) {

  /* ---------- SIGNUP ---------- */
  if (mode === "signup") {
    const btn = document.getElementById("signup-btn");

    btn.addEventListener("click", async () => {
      const full_name = document.getElementById("name").value.trim();
      const username = document.getElementById("username").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const referralCode = document.getElementById("referral")?.value.trim();

      if (!full_name || !username || !phone || !email || !password)
        return alert("All fields are required");

      if (!isValidEmail(email))
        return alert("Please enter a valid email");

      const deviceId = getDeviceId();

      const { data: existingProfile } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("device_id", deviceId)
        .maybeSingle();

      if (existingProfile)
        return alert("This device has already been used to sign up.");

      const { data: authData, error: authError } =
        await supabaseClient.auth.signUp({ email, password });

      if (authError) return alert(authError.message);

      const user = authData.user;
      if (!user) return alert("Failed to create user");

      let referredBy = null;
      let referrerId = null;

      if (referralCode) {
        const { data: refUser } = await supabaseClient
          .from("profiles")
          .select("id, username, balance")
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (refUser) {
          referredBy = refUser.username;
          referrerId = refUser.id;
        }
      }

      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
          id: user.id,
          full_name,
          username,
          phone,
          email,
          device_id: deviceId,
          referral_code: username,
          referred_by: referredBy,
          balance: 0
        });

      if (profileError) return alert(profileError.message);

      alert("Account created successfully!");
      window.location.href = "login.html";
    });

    const googleBtn = document.getElementById("google-signup-btn");
    googleBtn.addEventListener("click", signInWithGoogle);
  }

  /* ---------- LOGIN ---------- */
  if (mode === "login") {
    const btn = document.getElementById("login-btn");

    btn.addEventListener("click", async () => {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password)
        return alert("Please enter email and password");

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) return alert(error.message);

      localStorage.setItem("user_session", JSON.stringify(data.session));
      window.location.href = "dashboard.html";
    });

    const googleBtn = document.getElementById("google-login-btn");
    googleBtn.addEventListener("click", signInWithGoogle);
  }

  // ✅ CRITICAL FIX: always check profile AFTER login/Google redirect
  setTimeout(() => {
    ensureProfileExists();
  }, 800);
}


/* ---------- FORGOT PASSWORD ---------- */
  const forgot = document.getElementById("forgot-password");
  if (forgot) {
    forgot.addEventListener("click", async () => {
      const email = document.getElementById("email")?.value.trim();
      if (!email) return alert("Enter your email first");

      const { error } =
        await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo:
            "https://dauuz.netlify.app/forget-password.html"
        });

      if (error) alert(error.message);
      else alert("Password reset email sent!");
    });
  }
}





/* ---------- PAGE GUARD ---------- */
async function protectPage() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) window.location.href = "login.html";
}
