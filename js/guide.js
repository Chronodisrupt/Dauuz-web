
// --- Initialize Supabase client ---
const supabaseUrl = 'https://ydeczzyvfgwwmfornfef.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZWN6enl2Zmd3d21mb3JuZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Njc1ODksImV4cCI6MjA4MzU0MzU4OX0.IBNkcqDJtQSurdKaic94iRrc4NYnO8m1e1bQzbkkstc";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);


// Function to protect pages
async function protectPage() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    // Redirect to login if no session
    window.location.href = "login.html";
  }
}


async function loadUserInfo() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return; // safety check

  const userId = session.user.id;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return alert(error.message);

  // Example: update elements in HTML
  const usernameElem = document.getElementById("username");
  const fullNameElem = document.getElementById("fullName");

  if (usernameElem) usernameElem.textContent = profile.username;
  if (fullNameElem) fullNameElem.textContent = profile.full_name;
}
