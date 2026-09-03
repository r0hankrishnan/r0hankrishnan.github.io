# r0hankrishnan.github.io
Personal portfolio website

## Editing content

Content lives in `data/` as plain JS files, separate from the rendering
logic in `script.js` / `noodles.js`.

- **`data/projects.js`** — the Projects list on the homepage. Add, edit, or
  delete an object in the array; each needs `title`, `status`, `demoUrl`,
  `codeUrl`, `desc`.
- **`data/noodles.js`** — the noodle tier list. Add, edit, or delete an
  object; each needs `tier` (`S`/`A`/`B`/`C`/`D`/`F`), `src` (path under
  `assets/`), `alt`, `label`. Moving a noodle to a different tier is just
  changing its `tier` field.
- **`data/site.js`** — email, résumé link, copyright year, and the "Now"
  block shown on the homepage.
