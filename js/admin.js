document.addEventListener("DOMContentLoaded", async () => {

  console.log("DASHBOARD JS LOADED");

  const supabaseUrl = 'https://ydeczzyvfgwwmfornfef.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZWN6enl2Zmd3d21mb3JuZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Njc1ODksImV4cCI6MjA4MzU0MzU4OX0.IBNkcqDJtQSurdKaic94iRrc4NYnO8m1e1bQzbkkstc";
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const loginBox = document.getElementById("login-box");
  const dashboard = document.getElementById("dashboard");
  const loginError = document.getElementById("login-error");
  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if(localStorage.getItem("adminUser")) showDashboard();

  loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if(!username||!password){ loginError.textContent="Enter username & password"; return; }

    const { data, error } = await supabase.from("admins")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if(error || !data){ loginError.textContent="Invalid credentials"; return; }

    localStorage.setItem("adminUser", username);
    showDashboard();
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminUser");
    dashboard.classList.add("hidden");
    loginBox.classList.remove("hidden");
  });

  async function showDashboard(){
    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadMetrics();
    await loadTasks();
    animateCards();
    animateTasks();
  }

  async function loadMetrics(){
    let metricsContainer = document.querySelector(".metrics") || createMetricsContainer();
    const [usersRes, ritualsRes, profilesRes, pendingRes] = await Promise.all([
      supabase.from("profiles").select("id"),
      supabase.from("daily_rituals").select("id"),
      supabase.from("profiles").select("balance"),
      supabase.from("tasks").select("id").eq("status","pending")
    ]);

    const totalUsers = usersRes.data.length;
    const ritualsCompleted = ritualsRes.data.length;
    const totalDUZ = profilesRes.data.reduce((sum,u)=>sum+parseFloat(u.balance||0),0);
    const pendingTasks = pendingRes.data.length;

    metricsContainer.innerHTML = `
      <div class="card"><h3>Total Users</h3><p>${totalUsers}</p></div>
      <div class="card"><h3>Rituals Completed</h3><p>${ritualsCompleted}</p></div>
      <div class="card"><h3>Total DUZ</h3><p>${totalDUZ.toFixed(3)}</p></div>
      <div class="card"><h3>Pending Tasks</h3><p>${pendingTasks}</p></div>
    `;
  }

  function createMetricsContainer(){
    const div = document.createElement("div");
    div.classList.add("metrics");
    dashboard.insertBefore(div,dashboard.firstChild);
    return div;
  }

  async function loadTasks(){
    let tasksContainer = document.querySelector(".tasks-container");
    if(!tasksContainer){
      tasksContainer = document.createElement("div");
      tasksContainer.classList.add("tasks-container");
      dashboard.appendChild(tasksContainer);
    }
    tasksContainer.innerHTML="";

    const { data,error } = await supabase.from("tasks").select("*").order("created_at",{ascending:false});
    if(error) { tasksContainer.innerHTML="<p>Error loading tasks</p>"; return; }

    const pending = data.filter(t=>t.status==="pending");
    const approved = data.filter(t=>t.status==="approved");

    // Pending table
    const pendingWrapper = document.createElement("div");
    pendingWrapper.classList.add("task-table-wrapper");
    pendingWrapper.innerHTML="<h3>Pending Tasks</h3>";
    const pendingTable = document.createElement("table");
    pendingTable.innerHTML=`<thead><tr><th>User</th><th>Task</th><th>Content</th><th>Status</th><th>Approve</th><th>Delete</th></tr></thead><tbody></tbody>`;
    const tbodyPending = pendingTable.querySelector("tbody");
    pending.forEach(t=>{
      const tr = document.createElement("tr");
      tr.innerHTML=`<td>${t.user_id}</td><td>${t.task_type}</td><td>${t.content??t.image_url??''}</td><td>${t.status}</td><td><button class="approve-btn">Approve</button></td><td><button class="delete-btn">Delete</button></td>`;
      tr.querySelector(".approve-btn").addEventListener("click",()=>approveTask(t.id));
      tr.querySelector(".delete-btn").addEventListener("click",()=>deleteTask(t.id,tr));
      tbodyPending.appendChild(tr);
    });
    pendingWrapper.appendChild(pendingTable);
    tasksContainer.appendChild(pendingWrapper);

    // Approved table
    const approvedWrapper = document.createElement("div");
    approvedWrapper.classList.add("task-table-wrapper");
    approvedWrapper.innerHTML="<h3>Approved Tasks</h3>";
    const approvedTable = document.createElement("table");
    approvedTable.innerHTML=`<thead><tr><th>User</th><th>Task</th><th>Content</th><th>Status</th><th></th><th>Delete</th></tr></thead><tbody></tbody>`;
    const tbodyApproved = approvedTable.querySelector("tbody");
    approved.forEach(t=>{
      const tr = document.createElement("tr");
      tr.innerHTML=`<td>${t.user_id}</td><td>${t.task_type}</td><td>${t.content??t.image_url??''}</td><td>${t.status}</td><td></td><td><button class="delete-btn">Delete</button></td>`;
      tr.querySelector(".delete-btn").addEventListener("click",()=>deleteTask(t.id,tr));
      tbodyApproved.appendChild(tr);
    });
    approvedWrapper.appendChild(approvedTable);
    tasksContainer.appendChild(approvedWrapper);
  }

  async function approveTask(taskId){
    const { error } = await supabase.rpc('approve_task',{task_id:Number(taskId)});
    if(error){ alert("Failed to approve task: "+error.message); return; }
    await loadMetrics();
    await loadTasks();
    animateCards();
    animateTasks();
  }

  async function deleteTask(taskId,row){
    const { error } = await supabase.from("tasks").delete().eq("id",taskId);
    if(error){ alert("Failed to delete"); return; }
    row.remove();
    await loadMetrics();
    animateCards();
    animateTasks();
  }

  // SCROLL IN ANIMATION
  function animateCards(){
    document.querySelectorAll('.card').forEach((el, i) => {
      setTimeout(()=> el.style.opacity='1', i*100);
      el.style.transform='scale(1)';
    });
  }

  function animateTasks(){
    document.querySelectorAll('.task-table-wrapper').forEach((el,i)=>{
      setTimeout(()=> el.style.opacity='1', i*150);
      el.style.transform='scale(1)';
    });
  }












  async function loadAnalytics() {
  try {
    
    // Approved tasks today
    const today = new Date().toISOString().split('T')[0];
    const { count: approvedToday } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('approved_at', today);
    
    // New signups today
    const { count: signupsToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    // Update the UI
    document.getElementById('approved-today').textContent = approvedToday || 0;
    document.getElementById('signups-today').textContent = signupsToday || 0;
    
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

// Call this when admin page loads
loadAnalytics();

});