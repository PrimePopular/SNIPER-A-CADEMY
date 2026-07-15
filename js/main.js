// ==========================================================================
// SNIPER ACADEMY — shared behavior
// ==========================================================================

// ---- Config: swap this with your real Telegram (or WhatsApp) group link ----
const JOIN_LINK = "https://t.me/your_sniper_academy_handle"; // TODO: replace placeholder

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initJoinModal();
  initScrollReveal();
  initVideoFallback();
  initPaymentStubs();
  initBootcampForm();
  initContactForm();
  initYear();
});

// ---- Mobile nav toggle ----
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
    const isOpen = menu.classList.contains("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// ---- Join / Telegram modal ----
function initJoinModal() {
  const overlay = document.getElementById("join-modal");
  if (!overlay) return;

  const openers = document.querySelectorAll("[data-open-join]");
  const closeBtn = overlay.querySelector(".modal-close");
  const goBtn = overlay.querySelector("[data-join-link]");

  if (goBtn) goBtn.setAttribute("href", JOIN_LINK);

  const open = () => {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  openers.forEach((btn) => btn.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  }));

  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

// ---- Scroll reveal ----
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => io.observe(el));
}

// ---- Bootcamp background video: fall back gracefully if no file is present ----
function initVideoFallback() {
  const video = document.querySelector("[data-bg-video]");
  if (!video) return;
  const wrapper = video.closest("[data-video-wrapper]");

  video.addEventListener("error", () => {
    if (wrapper) wrapper.classList.add("video-fallback");
  }, true);

  // If no source resolves at all (e.g. placeholder never replaced), swap in fallback class shortly after
  setTimeout(() => {
    if (video.readyState === 0 && wrapper) {
      wrapper.classList.add("video-fallback");
    }
  }, 1500);
}

// ==========================================================================
// PAYMENT INTEGRATION — STUB
// Two products need a real payment provider wired in later (you mentioned
// Flutterwave elsewhere, but swap this for whatever you land on):
//   1. "bootcamp" — 3-Day Bootcamp (if/when it becomes paid, or an upsell)
//   2. "academy"  — Full Academy enrollment (paid, then a personal invite
//                    is sent — not the automatic Telegram modal)
// Any button/link with data-payment="bootcamp" or data-payment="academy"
// is already wired to call showPaymentPlaceholder() below. Replace the
// body of that function with your real checkout call when ready.
// ==========================================================================
function initPaymentStubs() {
  document.querySelectorAll("[data-payment]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      showPaymentPlaceholder(btn.getAttribute("data-payment"));
    });
  });
}

function showPaymentPlaceholder(tier) {
  const label = tier === "bootcamp" ? "3-Day Bootcamp" : "Academy Enrollment";
  // TODO: replace this alert with a real checkout call, e.g.:
  //   FlutterwaveCheckout({ public_key: "...", tx_ref: ..., amount: ..., ... })
  alert(
    `${label} checkout isn't connected yet.\n\nThis button already fires — open js/main.js and replace the body of showPaymentPlaceholder() with your real payment provider call.`
  );
}

// ---- Bootcamp signup form (client-side only until a backend is wired) ----
function initBootcampForm() {
  const form = document.getElementById("bootcamp-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const status = form.querySelector("[data-form-status]");
    // TODO: send this to your real signup endpoint / email service.
    if (status) {
      status.textContent = "You're in — check your inbox for the first lesson shortly.";
      status.style.color = "var(--accent-bright)";
    }
    form.reset();
  });
}

// ---- Contact form ----
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const status = form.querySelector("[data-form-status]");
    // TODO: send this to your real contact endpoint / email service.
    if (status) {
      status.textContent = "Message received — we'll get back to you soon.";
      status.style.color = "var(--accent-bright)";
    }
    form.reset();
  });
}

// ---- Footer year ----
function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}
