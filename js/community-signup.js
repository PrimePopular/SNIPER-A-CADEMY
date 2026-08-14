// ==========================================================================
// SNIPER ACADEMY — community join flow
// Email in -> Supabase sends a real confirmation link -> visitor clicks it
// -> confirm.html marks them verified -> redirected to whatever link the
// admin has set in site_settings.
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
    submitBtn.textContent = "Sending...";
    showStatus("");

    try {
      // Record the interest immediately (verified starts false).
      await sb.from("subscribers").upsert(
        { email, source: "join_modal" },
        { onConflict: "email", ignoreDuplicates: false }
      );

      // Supabase sends the actual confirmation email. Clicking it lands on
      // confirm.html, which finishes verification and redirects.
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/confirm.html` },
      });

      if (error) throw error;

      showStatus("Check your email — click the confirmation link to get your invite.", "ok");
      form.reset();
    } catch (err) {
      console.error("[join-form]", err);
      showStatus("Something went wrong sending that — try again in a moment.", "error");
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
