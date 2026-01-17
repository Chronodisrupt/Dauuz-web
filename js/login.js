document.addEventListener("DOMContentLoaded", () => {

  console.log("LOGIN JS LOADED");

  const supabaseUrl = "https://pdvjaxccdsziyvtznamb.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdmpheGNjZHN6aXl2dHpuYW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MzUxNTEsImV4cCI6MjA4MzAxMTE1MX0.Ye8kHuBUVMZLgt6prnRfe9qSdk3KAOM1Fo6ABjR7b_E";   // <-- paste anon key ONLY
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const usernameInput = document.getElementById("username");
  const statusText = document.getElementById("status");
  const loginBtn = document.getElementById("loginBtn");

  loginBtn.addEventListener("click", async () => {
    console.log("BUTTON CLICKED");

    let username = usernameInput.value.trim();

    if (!username) {
      statusText.textContent = "Enter a username.";
      return;
    }

    statusText.textContent = "Checking account...";

    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      statusText.textContent = "Error connecting. Try again.";
      console.error(checkError);
      return;
    }

    let user;

    if (!existingUser) {
      statusText.textContent = "Creating account...";

      const { data, error } = await supabase
        .from("users")
        .insert([{ username, balance: 0 }])
        .select()
        .single();

      if (error) {
        statusText.textContent = "Failed to create account.";
        console.error(error);
        return;
      }

      user = data;
    } else {
      user = existingUser;
    }

    localStorage.setItem("duz_user", JSON.stringify(user));

    statusText.textContent = "Success — redirecting...";
    window.location.href = "dashboard.html";
  });
});