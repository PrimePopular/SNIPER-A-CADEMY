// ==========================================================================
// SNIPER ACADEMY — site-wide editable media
// Pulls logo / mentorship video / bootcamp video / founder photo from
// site_settings and swaps them into every page that has the matching
// data-attribute. Falls back to the default placeholder if nothing's set.
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
  const { data, error } = await sb
    .from("site_settings")
    .select("logo_url, mentorship_video_url, bootcamp_video_url, founder_photo_url")
    .eq("id", 1)
    .single();

  if (error || !data) return;

  if (data.logo_url) {
    document.querySelectorAll("[data-logo-custom]").forEach((img) => {
      img.src = data.logo_url;
      img.style.display = "block";
    });
    document.querySelectorAll("[data-logo-default]").forEach((el) => { el.style.display = "none"; });
  }

  if (data.mentorship_video_url) {
    document.querySelectorAll("[data-mentorship-video]").forEach((video) => {
      video.querySelector("source").src = data.mentorship_video_url;
      video.load();
    });
  }

  if (data.bootcamp_video_url) {
    document.querySelectorAll("[data-bootcamp-video]").forEach((video) => {
      video.querySelector("source").src = data.bootcamp_video_url;
      video.load();
    });
  }

  if (data.founder_photo_url) {
    document.querySelectorAll("[data-founder-photo]").forEach((img) => {
      img.src = data.founder_photo_url;
      img.style.display = "block";
    });
    document.querySelectorAll("[data-founder-default]").forEach((el) => { el.style.display = "none"; });
  }
});
