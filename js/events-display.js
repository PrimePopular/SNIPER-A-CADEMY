// ==========================================================================
// SNIPER ACADEMY — public events rendering (countdown cards + calendar)
// ==========================================================================

async function fetchEvents() {
  const { data, error } = await sb.from("events").select("*").order("starts_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
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
    const ended = starts < now;
    const media = ev.media_url
      ? (ev.media_type === "video"
          ? `<video class="media" src="${ev.media_url}" muted autoplay loop playsinline></video>`
          : `<img class="media" src="${ev.media_url}" alt="${escapeHtmlEv(ev.title)}">`)
      : `<div class="media"></div>`;

    return `
      <div class="event-card card">
        ${media}
        <div class="body">
          <h3>${escapeHtmlEv(ev.title)}</h3>
          ${ev.description ? `<p>${escapeHtmlEv(ev.description)}</p>` : ""}
          ${ended
            ? `<span class="event-ended-badge">Event ended</span>`
            : `<div class="countdown" data-countdown="${ev.starts_at}"></div>`}
          <div class="event-date">${starts.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
        </div>
      </div>`;
  }).join("");

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
    const d = new Date(ev.starts_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      (eventsByDay[key] ||= []).push(ev);
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
