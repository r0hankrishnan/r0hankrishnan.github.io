// ─── Site-wide info ─────────────────────────────────────────────────────────
// Single source of truth for values that were previously hardcoded/duplicated
// across index.html and noodles.html (email, résumé link, copyright year,
// the "now" block). Edit here; script.js/noodles.js render them into place.

const siteData = {
  email: "krishnan.rohan@outlook.com",
  resumeUrl: "./assets/krishnan_rohan_resume.pdf",
  copyrightYear: 2026,
  now: {
    location: "Philadelphia, PA",
    study: "M.S.E. Data Science, Penn SEAS",
    role: "Technology Policy Project Lead, Paragon Policy Fellowship",
    building: "FrameFinder",
    buildingNote: "semantic search for tennis racquets",
    reading: "If Cats Disappeared from the World",
  },
};
