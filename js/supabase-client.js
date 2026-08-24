// ==========================================================================
// SNIPER ACADEMY — shared Supabase client
// Requires the Supabase CDN script + config.js to be loaded first.
// ==========================================================================
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Older versions of this site used an email-login system that's since been
// removed — but a browser that completed that old login once can still be
// quietly holding onto that session indefinitely, which makes it behave
// differently from a genuinely new visitor (this was the cause of several
// confusing "works on my device, not on others" bugs). Every public page
// clears that out on load, guaranteeing every visitor is a clean, real
// anon visitor. admin.html is deliberately excluded — that page's login
// needs to persist.
if (!location.pathname.includes("admin.html")) {
  sb.auth.signOut().catch(() => {});
}
