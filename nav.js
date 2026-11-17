// ─── Floating nav: mark the section you're reading ─────────────────────────
// The nav itself is plain links in the HTML (styles in base.css). This only
// sets aria-current on the link whose section crosses a band a third of the
// way down the screen, so the nav shows where you are.

(function currentSection() {
  const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const sections = links.map((link) => document.querySelector(link.hash));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = links[sections.indexOf(entry.target)];
        if (entry.isIntersecting) {
          links.forEach((l) => l.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-30% 0px -60% 0px" },
  );
  sections.forEach((section) => observer.observe(section));
})();
