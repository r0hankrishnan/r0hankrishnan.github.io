# CLAUDE.md

Personal portfolio site, deployed by GitHub Pages straight from `main`. **Anything merged to `main` is live.**

## Stack & structure

- Plain HTML/CSS/JS with **no build step**. Small libraries loaded from a CDN are fine when they clearly earn their place. Don't add npm, bundlers, or frameworks to the repo.
- Pages: `index.html` (+ `styles.css`, `script.js`) and `noodles.html` (+ `noodles.css`, `noodles.js`).
- Content lives in `data/*.js` as plain globals (`siteData`, `projectsData`, noodle data), loaded with `<script>` tags before the page script. See README.md for field schemas.
- **Keep the data/ separation:** content goes in `data/`, rendering logic stays in the page scripts. New content-driven sections should follow the same pattern.
- Colors are CSS custom properties on `:root` (`--paper`, `--ink`, ...). Reuse them instead of hardcoding values.

## Guardrails

- **Don't modify, replace, or delete anything in `assets/`** (résumé PDF, images) without asking. Adding a new asset the user provides is fine.
- **Don't rewrite the user's copy** (bio, project descriptions, Now block, labels) unless asked. Fix obvious typos only after pointing them out.
- **Accessibility is required:** semantic HTML, meaningful `alt` text, sufficient contrast, visible focus states, and full keyboard navigation.

## How to work

- **Small changes** (content edits, minor CSS tweaks, bug fixes): just do them.
- **Big changes** (new pages/sections, layout or visual redesigns, refactors across files): propose a short plan and wait for approval first.
- Design is evolving: keep things consistent with the current look, but feel free to **suggest** visual improvements. Suggest them; don't apply them unasked.
- Communication: explain the *why* behind changes briefly. The user wants to learn as they go.
- Keep code simple and maintainable; avoid clever or convoluted solutions. Visual effects and animations should be isolated so they're easy to revert (e.g. removing one file or one block).
- Avoid decorative symbols like ↗ and ✓ in the UI. The user sees them as telltale signs of AI-generated design.

## Verification (required before handing back)

Use headless Playwright (Chromium is already installed). Install it in the session scratchpad, **not** the repo (`npm init -y && npm i playwright@1` there).

1. Serve the repo: `python3 -m http.server 8765` from the repo root. Stop it when done.
2. Functional check: load every affected page and fail on any `pageerror` or console error. Exercise any interactive behavior the change touches.
3. Visual check: take full-page screenshots at desktop (1280px) and mobile (390px) widths, then look at them.
4. For visual changes, take **before** screenshots on `main` and **after** screenshots on the branch.

## Git & PRs

- Never commit to `main`. Create a feature branch and commit the changes there.
- **Don't push or open PRs.** The user pushes and opens PRs themselves.
- Save before/after screenshots to `screenshots/<branch-name>/` (gitignored, never committed), using names like `before-desktop.png` and `after-mobile.png`.
- Save a ready-to-paste PR description to `screenshots/<branch-name>/PR.md`: what changed, why, how it was verified, and which screenshots to attach.
