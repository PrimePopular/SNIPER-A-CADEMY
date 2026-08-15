// ==========================================================================
// SNIPER ACADEMY — community join flow (simplified)
// Email in -> saved straight to the subscribers table -> immediate
// redirect to whatever community link the admin has set.
// No confirmation email step — that was the source of nearly every
// subscriber bug (rate limits, redirect URL config, silent failures).
// This is simpler and more reliable: one step, not two.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("join-form");
  const status = document.getElementById("join-status");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("join-email").value.trim();
    const submitBtn = form.querySelector("button[type=submit]");

    submitBtn.disabled = true;
    submitBtn.textContent = "Joining...";
    showStatus("");

    try {
      const { error: subError } = await sb.from("subscribers").upsert(
        { email, source: "join_modal", verified: true },
        { onConflict: "email" }
      );
      if (subError) throw subError;

      const { data: settings } = await sb
        .from("site_settings")
        .select("community_link")
        .eq("id", 1)
        .single();

      const link = settings?.community_link || FALLBACK_COMMUNITY_LINK;
      showStatus("You're in — redirecting...", "ok");
      setTimeout(() => { window.location.href = link; }, 600);
    } catch (err) {
      console.error("[join-form]", err);
      showStatus(err.message || "Something went wrong — try again in a moment.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Join now";
    }
  });

  function showStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.style.display = msg ? "block" : "none";
    status.style.color = kind === "error" ? "#ff6b6b" : "var(--accent-bright)";
  }
});
