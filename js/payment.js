// ==========================================================================
// SNIPER ACADEMY — Payment placeholder
// Two payment surfaces to wire up later: "bootcamp" and "academy".
// Drop in real Flutterwave/Stripe/Paystack keys + logic when ready —
// every button that should trigger payment already calls initiatePayment(tier).
// ==========================================================================

const PAYMENT_CONFIG = {
  bootcamp: {
    label: "3-Day Bootcamp",
    amount: null,     // TODO: set amount once pricing is confirmed
    currency: "USD",  // TODO: confirm currency
  },
  academy: {
    label: "Main Academy",
    amount: null,     // TODO: set amount once pricing is confirmed
    currency: "USD",
  },
};

function initiatePayment(tier) {
  const config = PAYMENT_CONFIG[tier];
  if (!config) {
    console.warn(`[payment] Unknown tier: ${tier}`);
    return;
  }

  // ------------------------------------------------------------------
  // TODO: replace this block with the real payment integration, e.g.
  //
  // FlutterwaveCheckout({
  //   public_key: "YOUR_PUBLIC_KEY",
  //   tx_ref: `sniper-${tier}-${Date.now()}`,
  //   amount: config.amount,
  //   currency: config.currency,
  //   customer: { email, name },
  //   callback: (response) => { /* on success: show Telegram join link, etc. */ },
  //   onclose: () => {},
  // });
  // ------------------------------------------------------------------
  console.log(`[payment] initiatePayment("${tier}") — ${config.label}. Payment integration not wired up yet.`);
  alert(`Payment for ${config.label} isn't connected yet — this button is wired and ready for the real checkout.`);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-pay]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      initiatePayment(btn.getAttribute("data-pay"));
    });
  });
});
