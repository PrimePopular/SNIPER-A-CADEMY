// ==========================================================================
// SNIPER ACADEMY — admin dashboard
// ==========================================================================

const loginGate = document.getElementById("login-gate");
const dashboard = document.getElementById("dashboard");

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showDashboard(); else showLogin();

  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await sb.auth.signOut();
    showLogin();
  });

  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("event-form").addEventListener("submit", handleAddEvent);
  document.getElementById("team-form").addEventListener("submit", handleAddTeamMember);
  document.getElementById("testimonial-form").addEventListener("submit", handleAddTestimonial);
  document.getElementById("settings-form").addEventListener("submit", handleSaveSettings);
  document.getElementById("bootcamp-link-form").addEventListener("submit", handleSaveBootcampLink);
  document.getElementById("export-csv").addEventListener("click", exportSubscribersCSV);

  document.querySelectorAll("[data-upload-media]").forEach((btn) => {
    btn.addEventListener("click", () => handleSiteMediaUpload(btn));
  });
  document.querySelectorAll("[data-remove-media]").forEach((btn) => {
    btn.addEventListener("click", () => handleSiteMediaRemove(btn));
  });
});

function showLogin() { loginGate.style.display = "block"; dashboard.style.display = "none"; }

function showDashboard() {
  loginGate.style.display = "none";
  dashboard.style.display = "block";
  loadEvents();
  loadTeam();
  loadTestimonials();
  loadSubscribers();
  loadSettings();
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pass").value;
  const errEl = document.getElementById("login-error");
  errEl.style.display = "none";

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = "Login failed — check your email and password.";
    errEl.style.display = "block";
    return;
  }
  showDashboard();
}

function switchTab(name) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".admin-panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${name}`));
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 2600);
}

// ---- Media upload helper ----
async function uploadMedia(file, folder) {
  if (!file) return { url: null, type: null };
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, file);
  if (error) throw error;
  const { data } = sb.storage.from("media").getPublicUrl(path);
  const type = file.type.startsWith("video") ? "video" : "image";
  return { url: data.publicUrl, type };
}

// ---- EVENTS ----
async function handleAddEvent(e) {
  e.preventDefault();
  const title = document.getElementById("ev-title").value.trim();
  const description = document.getElementById("ev-desc").value.trim();
  const starts_at = document.getElementById("ev-date").value;
  const endsRaw = document.getElementById("ev-end").value;
  const ends_at = endsRaw ? endsRaw : null;
  const link_url = document.getElementById("ev-link").value.trim() || null;
  const mediaFile = document.getElementById("ev-media").files[0];
  const submitBtn = e.target.querySelector("button[type=submit]");

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  try {
    const { url, type } = await uploadMedia(mediaFile, "events");
    const { error } = await sb.from("events").insert({
      title, description, starts_at, ends_at, link_url,
      media_url: url, media_type: type || "image",
    });
    if (error) throw error;
    e.target.reset();
    toast("Event added");
    loadEvents();
  } catch (err) {
    console.error(err);
    toast(`Couldn't save that event — ${err.message || "try again"}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add event";
  }
}

async function loadEvents() {
  const list = document.getElementById("events-list");
  const { data, error } = await sb.from("events").select("*").order("starts_at", { ascending: true });
  if (error) { list.innerHTML = `<p class="text-muted">Couldn't load events.</p>`; return; }
  if (!data.length) { list.innerHTML = `<p class="text-muted" style="margin-top:12px;">No events yet.</p>`; return; }

  list.innerHTML = data.map((ev) => `
    <div class="admin-row">
      ${ev.media_url ? (ev.media_type === "video"
        ? `<video class="thumb" src="${ev.media_url}" muted></video>`
        : `<img class="thumb" src="${ev.media_url}" alt="">`)
        : `<div class="thumb"></div>`}
      <div class="grow">
        <strong>${escapeHtml(ev.title)}</strong>
        <div class="meta">
          ${new Date(ev.starts_at).toLocaleString()}${ev.ends_at ? ` → ${new Date(ev.ends_at).toLocaleString()}` : ""}
          ${ev.link_url ? " · has link" : ""}
        </div>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-delete-event="${ev.id}" aria-label="Delete">✕</button>
      </div>
    </div>`).join("");

  list.querySelectorAll("[data-delete-event]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this event?")) return;
      await sb.from("events").delete().eq("id", btn.dataset.deleteEvent);
      loadEvents();
    });
  });
}

// ---- TEAM ----
async function handleAddTeamMember(e) {
  e.preventDefault();
  const name = document.getElementById("tm-name").value.trim();
  const role = document.getElementById("tm-role").value.trim();
  const bio = document.getElementById("tm-bio").value.trim();
  const photoFile = document.getElementById("tm-photo").files[0];
  const submitBtn = e.target.querySelector("button[type=submit]");

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  try {
    const { url } = await uploadMedia(photoFile, "team");
    const { error } = await sb.from("team_members").insert({ name, role, bio, photo_url: url });
    if (error) throw error;
    e.target.reset();
    toast("Team member added");
    loadTeam();
  } catch (err) {
    console.error(err);
    toast("Couldn't save that member — try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add member";
  }
}

async function loadTeam() {
  const list = document.getElementById("team-list");
  const { data, error } = await sb.from("team_members").select("*").order("sort_order", { ascending: true });
  if (error) { list.innerHTML = `<p class="text-muted">Couldn't load team.</p>`; return; }
  if (!data.length) { list.innerHTML = `<p class="text-muted" style="margin-top:12px;">No team members yet.</p>`; return; }

  list.innerHTML = data.map((tm) => `
    <div class="admin-row">
      ${tm.photo_url ? `<img class="thumb" src="${tm.photo_url}" alt="">` : `<div class="thumb"></div>`}
      <div class="grow">
        <strong>${escapeHtml(tm.name)}</strong>
        <div class="meta">${escapeHtml(tm.role || "")}</div>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-delete-member="${tm.id}" aria-label="Delete">✕</button>
      </div>
    </div>`).join("");

  list.querySelectorAll("[data-delete-member]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this team member?")) return;
      await sb.from("team_members").delete().eq("id", btn.dataset.deleteMember);
      loadTeam();
    });
  });
}

// ---- TESTIMONIALS ----
async function handleAddTestimonial(e) {
  e.preventDefault();
  const quote = document.getElementById("ts-quote").value.trim();
  const name = document.getElementById("ts-name").value.trim();
  const handle = document.getElementById("ts-handle").value.trim();
  const photoFile = document.getElementById("ts-photo").files[0];
  const submitBtn = e.target.querySelector("button[type=submit]");

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  try {
    const { url } = await uploadMedia(photoFile, "testimonials");
    const { error } = await sb.from("testimonials").insert({ quote, name, handle, photo_url: url });
    if (error) throw error;
    e.target.reset();
    toast("Testimonial added");
    loadTestimonials();
  } catch (err) {
    console.error(err);
    toast(`Couldn't save that testimonial — ${err.message || "try again"}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add testimonial";
  }
}

async function loadTestimonials() {
  const list = document.getElementById("testimonials-list");
  const { data, error } = await sb.from("testimonials").select("*").order("sort_order", { ascending: true });
  if (error) { list.innerHTML = `<p class="text-muted">Couldn't load testimonials.</p>`; return; }
  if (!data.length) { list.innerHTML = `<p class="text-muted" style="margin-top:12px;">No testimonials yet.</p>`; return; }

  list.innerHTML = data.map((ts) => `
    <div class="admin-row">
      ${ts.photo_url ? `<img class="thumb" src="${ts.photo_url}" alt="">` : `<div class="thumb"></div>`}
      <div class="grow">
        <strong>${escapeHtml(ts.name)}</strong>
        <div class="meta">${escapeHtml(ts.quote).slice(0, 60)}${ts.quote.length > 60 ? "..." : ""}</div>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-delete-testimonial="${ts.id}" aria-label="Delete">✕</button>
      </div>
    </div>`).join("");

  list.querySelectorAll("[data-delete-testimonial]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this testimonial?")) return;
      await sb.from("testimonials").delete().eq("id", btn.dataset.deleteTestimonial);
      loadTestimonials();
    });
  });
}

// ---- SUBSCRIBERS ----
let cachedSubscribers = [];

async function loadSubscribers() {
  const list = document.getElementById("subscribers-list");
  const { data, error } = await sb.from("subscribers").select("*").order("created_at", { ascending: false });
  if (error) { list.innerHTML = `<p class="text-muted">Couldn't load subscribers.</p>`; return; }
  cachedSubscribers = data;
  if (!data.length) { list.innerHTML = `<p class="text-muted" style="margin-top:12px;">No subscribers yet.</p>`; return; }

  list.innerHTML = data.map((s) => `
    <div class="admin-row">
      <div class="grow">
        <strong>${escapeHtml(s.email)}</strong>
        <div class="meta">${s.verified ? "Verified" : "Pending"} · ${new Date(s.created_at).toLocaleDateString()} · ${escapeHtml(s.source || "")}</div>
      </div>
    </div>`).join("");
}

function exportSubscribersCSV() {
  if (!cachedSubscribers.length) { toast("No subscribers to export yet"); return; }
  const rows = [["email", "verified", "source", "joined_at"]];
  cachedSubscribers.forEach((s) => rows.push([s.email, s.verified, s.source, s.created_at]));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sniper-academy-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ---- SITE MEDIA (fixed slots: logo, mentorship video, bootcamp video, founder photo) ----
async function handleSiteMediaUpload(btn) {
  const column = btn.dataset.uploadMedia;
  const inputEl = document.getElementById(btn.dataset.input);
  const file = inputEl.files[0];
  if (!file) { toast("Choose a file first"); return; }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Uploading...";
  try {
    const { url } = await uploadMedia(file, "site");
    const { error } = await sb.from("site_settings").update({ [column]: url }).eq("id", 1);
    if (error) throw error;
    toast("Updated — live on the site now");
    inputEl.value = "";
  } catch (err) {
    console.error(err);
    toast(`Couldn't upload — ${err.message || "try again"}`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function handleSiteMediaRemove(btn) {
  const column = btn.dataset.removeMedia;
  if (!confirm("Remove this and go back to the site's default?")) return;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Removing...";
  try {
    const { error } = await sb.from("site_settings").update({ [column]: null }).eq("id", 1);
    if (error) throw error;
    toast("Reverted to default");
  } catch (err) {
    console.error(err);
    toast("Couldn't remove — try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ---- SETTINGS ----
async function loadSettings() {
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).single();
  if (!data) return;
  document.getElementById("set-platform").value = data.community_platform || "";
  document.getElementById("set-link").value = data.community_link || "";
  document.getElementById("set-bootcamp-link").value = data.bootcamp_form_link || "";
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const community_platform = document.getElementById("set-platform").value.trim();
  const community_link = document.getElementById("set-link").value.trim();
  const { error } = await sb.from("site_settings").update({ community_platform, community_link }).eq("id", 1);
  if (error) { toast("Couldn't save settings"); return; }
  toast("Settings saved");
}

async function handleSaveBootcampLink(e) {
  e.preventDefault();
  const bootcamp_form_link = document.getElementById("set-bootcamp-link").value.trim();
  const { error } = await sb.from("site_settings").update({ bootcamp_form_link }).eq("id", 1);
  if (error) { toast("Couldn't save link"); return; }
  toast("Bootcamp form link saved");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
