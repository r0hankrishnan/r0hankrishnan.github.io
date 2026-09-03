// ─── Noodle tier list content ──────────────────────────────────────────────
// To add a noodle: drop the package photo in assets/ and append an object
// below — no HTML markup needed, no background pre-processing needed (it's
// removed in the browser on load). `tier` must be one of: S, A, B, C, D, F.
// To move a noodle to a different tier: change its `tier` field.
// To remove a noodle: delete its object.

const noodlesData = [
  {
    tier: "S",
    src: "./assets/Nongshim-Ramyun-Hot-Spicy.jpg",
    alt: "Nongshim Ramyun Hot & Spicy package",
    label: "Nongshim Ramyun Hot &amp; Spicy",
  },
  {
    tier: "B",
    src: "./assets/Nongshim-Ramyun-Spicy-Kimchi.jpg",
    alt: "Nongshim Ramyun Spicy Kimchi package",
    label: "Nongshim Ramyun Spicy Kimchi",
  },
  {
    tier: "C",
    src: "./assets/Nongshim-Ramen-Tonkostsu-Kuromayu.png",
    alt: "Nongshim Ramen Tonkotsu with Kuromayu Black Garlic Oil package",
    label: "Nongshim Tonkotsu, Kuromayu Black Garlic Oil",
  },
];
