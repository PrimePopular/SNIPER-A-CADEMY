// ==========================================================================
// SNIPER ACADEMY — community join flow
// Email in -> Supabase sends a real confirmation link -> visitor clicks it
// -> confirm.html marks them verified -> redirected to whatever link the
// admin has set in site_settings.
// ==========================================================================

// Builds the confirm.html URL correctly even when the site lives in a
// subfolder (e.g. GitHub Pages project sites like
// username.github.io/repo-name/) — window.location.origin alone drops
// that subfolder and breaks the confirmation link.
function siteBaseUrl() {
  const path = window.location.pathname;
  const dir = path.substring(0, path.lastIndexOf("/") + 1);
  return window.location.origin + dir;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("join-form");
  const status = document.getElementById("join-status");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("join-email").value.trim();
    const submitBtn = form.querySelector("button[type=submit]");

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    showStatus("");

    try {
      // Record the interest immediately (verified starts false).
      const { error: subError } = await sb.from("subscribers").upsert(
        { email, source: "join_modal" },
        { onConflict: "email" }
      );
      if (subError) {
        // This used to be silently ignored, which is exactly why emails
        // looked like they "weren't collecting" — surface it now.
        console.error("[join-form] couldn't save subscriber:", subError.message);
      }

      // Supabase sends the actual confirmation email. Clicking it lands on
      // confirm.html, which finishes verification and redirects.
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${siteBaseUrl()}confirm.html` },
      });

      if (error) throw error;

      showStatus("Check your email — click the confirmation link to get your invite.", "ok");
      form.reset();
    } catch (err) {
      console.error("[join-form]", err);
      const raw = (err.message || "").toLowerCase();
      let msg = err.message || "Something went wrong — try again in a moment.";
      if (raw.includes("rate limit") || raw.includes("too many")) {
        msg = "Too many attempts right now — Supabase's free plan limits how many confirmation emails send per hour. Wait a bit and try again.";
      }
      showStatus(msg, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send confirmation link";
    }
  });

  function showStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.style.display = msg ? "block" : "none";
    status.style.color = kind === "error" ? "#ff6b6b" : "var(--accent-bright)";
  }
});
