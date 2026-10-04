// ==========================================================================
// SNIPER ACADEMY — free ebook lead magnet
// One shared script powers all three placements (Bootcamp feature section,
// Home page teaser, and the "Join Academy" popup on the Bootcamp page) so
// the cover/PDF/title only ever need to be set in one place (admin).
// ==========================================================================

async function fetchEbookSettings() {
  const { data } = await sb
    .from("site_settings")
    .select("ebook_cover_url, ebook_pdf_url, ebook_title")
    .eq("id", 1)
    .single();
  return data || {};
}

// ---- Placement 1: featured section (Bootcamp page) ----
async function renderEbookFeature(container) {
  const ebook = await fetchEbookSettings();
  const title = ebook.ebook_title || "Money Grows on Trees";
  const cover = ebook.ebook_cover_url
    ? `<img class="cover" src="${ebook.ebook_cover_url}" alt="${title}">`
    : `<div class="cover"></div>`;

  container.innerHTML = `
    <div class="ebook-feature card glass">
      ${cover}
      <div>
        <span class="eyebrow">Free gift, today only</span>
        <h3 style="margin-top:10px; font-size:22px;">${title}</h3>
        <p class="text-muted" style="margin-top:10px;">The book that shaped our own trading psychology — written for beginners and amateurs starting from zero.</p>
        <p style="margin-top:12px;"><span class="value-tag">$30 value</span><strong>Free when you sign up below</strong></p>
        <button class="btn btn-primary" style="margin-top:16px;" data-ebook-download>Get the free ebook</button>
      </div>
    </div>`;

  container.querySelector("[data-ebook-download]").addEventListener("click", () => openEbookDownloadGate(ebook));
}

// ---- Placement 2: small teaser (Home page) ----
async function renderEbookTeaser(container) {
  const ebook = await fetchEbookSettings();
  const title = ebook.ebook_title || "Money Grows on Trees";
  const cover = ebook.ebook_cover_url
    ? `<img class="cover-mini" src="${ebook.ebook_cover_url}" alt="${title}">`
    : `<div class="cover-mini"></div>`;

  container.innerHTML = `
    <div class="ebook-teaser card">
      ${cover}
      <div style="flex:1;">
        <div style="font-size:14.5px; font-weight:600;">Free ebook: ${title}</div>
        <div class="text-muted" style="font-size:13px; margin-top:2px;">Usually $30 — free with the 3-day bootcamp</div>
      </div>
      <a href="bootcamp.html" class="btn-link">Get it <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    </div>`;
}

// ---- Placement 3: "Join Academy" popup (Bootcamp page, on load) ----
async function showEbookPopup() {
  const ebook = await fetchEbookSettings();
  const title = ebook.ebook_title || "Money Grows on Trees";
  const cover = ebook.ebook_cover_url
    ? `<img class="cover-popup" src="${ebook.ebook_cover_url}" alt="${title}">`
    : `<div class="cover-popup"></div>`;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open ebook-popup";
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <span class="eyebrow">Congratulations</span>
      <h3 style="margin-top:10px;">You just found something extra.</h3>
      <p class="text-muted" style="margin-top:10px;">Every bootcamp signup gets a free copy of <strong>${title}</strong> — usually $30, free today.</p>
      ${cover}
      <button class="btn btn-primary" style="width:100%; margin-top:20px;" data-ebook-continue>Continue to sign up</button>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const close = () => { overlay.remove(); document.body.style.overflow = ""; };
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector("[data-ebook-continue]").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}

// ---- Download gate: email first, same rule as everywhere else on the site ----
function openEbookDownloadGate(ebook) {
  let overlay = document.getElementById("ebook-download-modal");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "ebook-download-modal";
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <svg class="reticle-mini" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M12 1V5M12 19V23M1 12H5M19 12H23" stroke="currentColor" stroke-width="1.4"/></svg>
      <h3>Get your free copy</h3>
      <p>Enter your email and the download starts right away.</p>
      <form id="ebook-download-form" style="margin-top:18px;">
        <div class="field" style="margin-bottom:14px;">
          <label for="ebook-email">Email</label>
          <input type="email" id="ebook-email" placeholder="you@email.com" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Send me the ebook</button>
      </form>
      <p id="ebook-status" style="margin-top:12px; font-size:13.5px; display:none;"></p>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const close = () => { overlay.remove(); document.body.style.overflow = ""; };
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  overlay.querySelector("#ebook-download-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = overlay.querySelector("#ebook-email").value.trim();
    const submitBtn = e.target.querySelector("button[type=submit]");
    const statusEl = overlay.querySelector("#ebook-status");

    submitBtn.disabled = true;
    submitBtn.textContent = "One moment...";

    try {
      const { error } = await sb.from("subscribers").insert(
        { email, source: "ebook_download", verified: true }
      );
      if (error && error.code !== "23505") throw error;

      if (ebook.ebook_pdf_url) {
        window.open(ebook.ebook_pdf_url, "_blank", "noopener");
        statusEl.textContent = "Your download should be starting now.";
        statusEl.style.color = "var(--accent-bright)";
      } else {
        statusEl.textContent = "You're on the list — the ebook file isn't uploaded yet, check back soon.";
        statusEl.style.color = "var(--accent-bright)";
      }
      statusEl.style.display = "block";
      e.target.reset();
    } catch (err) {
      console.error("[ebook-download-form]", err);
      statusEl.textContent = err.message || "Something went wrong — try again in a moment.";
      statusEl.style.color = "#ff6b6b";
      statusEl.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send me the ebook";
    }
  });
}
