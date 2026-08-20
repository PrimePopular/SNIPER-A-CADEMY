// ==========================================================================
// SNIPER ACADEMY — Payment (Paystack)
// Every button with data-pay="tier" calls initiatePayment(tier). Collects
// email first (same rule as everywhere else on the site, and it's saved
// as a lead even if checkout gets abandoned), then opens Paystack's
// checkout for the real payment.
// ==========================================================================

const PAYSTACK_PUBLIC_KEY = "pk_test_c8751d628263ad70d931606cbd34184980d51ca7";

const PAYMENT_CONFIG = {
  bootcamp: {
    label: "3-Day Bootcamp",
    amount: null,      // free — this tier has no paid checkout
    currency: "NGN",
  },
  academy: {
    label: "Main Academy",
    amount: 70000,
    currency: "NGN",
  },
  mentorship: {
    label: "1:1 Mentorship",
    amount: 100000,
    currency: "NGN",
  },
};

function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function initiatePayment(tier) {
  const config = PAYMENT_CONFIG[tier];
  if (!config) {
    console.warn(`[payment] Unknown tier: ${tier}`);
    return;
  }
  if (!config.amount) {
    console.warn(`[payment] ${tier} has no price set — skipping checkout.`);
    return;
  }
  openPaymentEmailModal(tier, config);
}

function openPaymentEmailModal(tier, config) {
  let overlay = document.getElementById("payment-email-modal");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "payment-email-modal";
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <svg class="reticle-mini" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/><path d="M12 1V5M12 19V23M1 12H5M19 12H23" stroke="currentColor" stroke-width="1.4"/></svg>
      <h3>${config.label}</h3>
      <p>₦${config.amount.toLocaleString()} — enter your email to continue to checkout.</p>
      <form id="payment-email-form" style="margin-top:18px;">
        <div class="field" style="margin-bottom:14px;">
          <label for="pay-email">Email</label>
          <input type="email" id="pay-email" placeholder="you@email.com" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Continue to payment</button>
      </form>
      <p id="payment-status" style="margin-top:12px; font-size:13.5px; display:none;"></p>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const close = () => { overlay.remove(); document.body.style.overflow = ""; };
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  overlay.querySelector("#payment-email-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = overlay.querySelector("#pay-email").value.trim();
    const submitBtn = e.target.querySelector("button[type=submit]");
    const statusEl = overlay.querySelector("#payment-status");

    submitBtn.disabled = true;
    submitBtn.textContent = "Loading checkout...";

    try {
      // Save as a lead regardless of whether checkout completes.
      await sb.from("subscribers").upsert(
        { email, source: `payment_${tier}`, verified: true },
        { onConflict: "email" }
      );

      await loadPaystackScript();

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: config.amount * 100, // Paystack expects kobo
        currency: config.currency,
        ref: `sniper-${tier}-${Date.now()}`,
        callback: function (response) {
          close();
          alert(`Payment successful. Reference: ${response.reference}\n\nWe'll follow up at ${email} shortly.`);
        },
        onClose: function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "Continue to payment";
        },
      });
      handler.openIframe();
    } catch (err) {
      console.error("[payment]", err);
      statusEl.textContent = err.message || "Something went wrong — try again in a moment.";
      statusEl.style.color = "#ff6b6b";
      statusEl.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Continue to payment";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-pay]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      initiatePayment(btn.getAttribute("data-pay"));
    });
  });
});
