// ==========================================================================
// SNIPER ACADEMY — public events rendering (countdown cards + calendar)
// ==========================================================================

async function fetchEvents() {
  const { data, error } = await sb.from("events").select("*").order("starts_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

function eventStatus(ev, now) {
  const starts = new Date(ev.starts_at);
  const ends = ev.ends_at ? new Date(ev.ends_at) : null;
  if (now < starts) return "upcoming";
  if (ends && now <= ends) return "live";
  if (!ends && now.getTime() - starts.getTime() < 3600000) return "live"; // no end date: treat as live for 1hr
  return "ended";
}

function renderCountdownCards(events, container, { limit } = {}) {
  const now = new Date();
  let list = events.slice();
  if (limit) list = list.slice(0, limit);

  if (!list.length) {
    container.innerHTML = `<p class="text-muted">No events scheduled right now — check back soon.</p>`;
    return;
  }

  container.innerHTML = list.map((ev) => {
    const starts = new Date(ev.starts_at);
    const ends = ev.ends_at ? new Date(ev.ends_at) : null;
    const status = eventStatus(ev, now);
    const media = ev.media_url
      ? (ev.media_type === "video"
          ? `<video class="media" src="${ev.media_url}" muted autoplay loop playsinline></video>`
          : `<img class="media" src="${ev.media_url}" alt="${escapeHtmlEv(ev.title)}">`)
      : `<div class="media"></div>`;

    let statusBlock = "";
    if (status === "upcoming") statusBlock = `<div class="countdown" data-countdown="${ev.starts_at}"></div>`;
    else if (status === "live") statusBlock = `<span class="event-ended-badge" style="color:var(--accent-bright); border-color:var(--accent-bright);">● Live now</span>`;
    else statusBlock = `<span class="event-ended-badge">Event ended</span>`;

    const dateLabel = ends
      ? `${starts.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${ends.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : starts.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

    const inner = `
        ${media}
        <div class="body">
          <h3>${escapeHtmlEv(ev.title)}</h3>
          ${ev.description ? `<p>${escapeHtmlEv(ev.description)}</p>` : ""}
          ${statusBlock}
          <div class="event-date">${dateLabel}</div>
          ${ev.link_url ? `<div class="btn-link" style="margin-top:12px;">Open link <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` : ""}
        </div>`;

    return ev.link_url
      ? `<div class="event-card card" data-event-link="${ev.link_url}" style="display:flex; flex-direction:column; cursor:pointer;">${inner}</div>`
      : `<div class="event-card card">${inner}</div>`;
  }).join("");

  container.querySelectorAll("[data-event-link]").forEach((card) => {
    card.addEventListener("click", () => openEventLinkEmailGate(card.dataset.eventLink));
  });

  tickCountdowns(container);
  if (!container.dataset.ticking) {
    container.dataset.ticking = "1";
    setInterval(() => tickCountdowns(container), 1000);
  }
}

function tickCountdowns(container) {
  container.querySelectorAll("[data-countdown]").forEach((el) => {
    const target = new Date(el.dataset.countdown).getTime();
    const diff = target - Date.now();
    if (diff <= 0) { el.innerHTML = `<span class="event-ended-badge">Starting now</span>`; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `
      <div class="unit"><div class="n">${d}</div><div class="u">days</div></div>
      <div class="unit"><div class="n">${h}</div><div class="u">hrs</div></div>
      <div class="unit"><div class="n">${m}</div><div class="u">min</div></div>
      <div class="unit"><div class="n">${s}</div><div class="u">sec</div></div>`;
  });
}

function renderCalendar(events, container, monthDate = new Date()) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = firstDay.toLocaleString(undefined, { month: "long", year: "numeric" });

  const eventsByDay = {};
  events.forEach((ev) => {
    const start = new Date(ev.starts_at);
    const end = ev.ends_at ? new Date(ev.ends_at) : start;
    // Walk every calendar day the event spans, so Mon–Fri events show all 5 days.
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= last) {
      if (cursor.getFullYear() === year && cursor.getMonth() === month) {
        const key = cursor.getDate();
        (eventsByDay[key] ||= []).push(ev);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let cells = dows.map((d) => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < startOffset; i++) cells += `<div class="day empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = eventsByDay[day] || [];
    cells += `<div class="day">${day}${dayEvents.map((ev) => `<span class="ev-label">${escapeHtmlEv(ev.title)}</span>`).join("")}</div>`;
  }

  container.innerHTML = `
    <div class="calendar">
      <div class="calendar-head"><strong>${monthLabel}</strong></div>
      <div class="calendar-grid">${cells}</div>
    </div>`;
}

function escapeHtmlEv(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function openEventLinkEmailGate(link) {
  let overlay = document.getElementById("event-link-modal");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "event-link-modal";
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <svg class="reticle-mini" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M12 1V5M12 19V23M1 12H5M19 12H23" stroke="currentColor" stroke-width="1.4"/></svg>
      <h3>Continue to event</h3>
      <p>Enter your email and you'll be taken straight there.</p>
      <form id="event-link-form" style="margin-top:18px;">
        <div class="field" style="margin-bottom:14px;">
          <label for="ev-link-email">Email</label>
          <input type="email" id="ev-link-email" placeholder="you@email.com" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Continue</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const close = () => { overlay.remove(); document.body.style.overflow = ""; };
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  overlay.querySelector("#event-link-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = overlay.querySelector("#ev-link-email").value.trim();
    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "One moment...";
    try {
      await sb.from("subscribers").upsert(
        { email, source: "event_link", verified: true },
        { onConflict: "email" }
      );
    } catch (err) {
      console.error("[event-link-form]", err);
    }
    window.open(link, "_blank", "noopener");
    close();
  });
}
