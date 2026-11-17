# Style guide

The rules every page follows. Read this before changing anything visual, and
update it in the same commit if a rule changes.

## The idea in one paragraph

A calm, editorial page with the tactility of the 2010s web hidden in how
things respond. At rest the site is neutral paper, ink, and type. Anything you
can press feels physical: it lifts on hover, squishes when pressed, and can
make a soft pop. Color means one thing: **this is pressable**. Personality
lives in a few small toys (a record, a tennis ball) and in the copy, never in
decoration.

## Color

All colors are custom properties on `:root` in `base.css`. Never hardcode a
color in a component; if a new one is needed, add a token here first.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--paper` | `#f2f2ee` | Page background | |
| `--surface` | `#fbfbf9` | Raised things: secondary keys, dialogs, the game canvas | |
| `--ink` | `#16171b` | Text, headings, focus ring | 15.9:1 on paper |
| `--ink-soft` | `#575a62` | Secondary text, labels, metadata | 6.1:1 on paper |
| `--rule` | `#dcdcd5` | Hairlines between rows, link underlines at rest | decorative |
| `--accent` | `#3a63d8` | Fill of primary and pressed keys, link underline on hover, record label, text selection | 4.7:1 on paper, 5.3:1 with white text |
| `--accent-strong` | `#2f55c4` | Accent hover/pressed state | 6.5:1 with white text |
| `--accent-ink` | `#ffffff` | Text on accent fills | |
| `--ball` | `#d4ef3a` | The tennis ball only (toy and game). Fill only, never text | 13.8:1 with ink text |
| `--shine` | `rgb(255 255 255 / .55)` | The faint top highlight on keys (a gradient over their fill) | decorative |

Rules:

- **Accent marks pressable things only.** No accent on headings, dots,
  dividers, or decoration. If something is accent-colored, clicking it must do
  something.
- To try a different accent, change `--accent`, `--accent-strong`, and
  `--accent-ink` together. Candidates explored: butter `#ffd447` and lime
  `#d4ef3a` (both need `--accent-ink: var(--ink)`), or none (`--accent:
  var(--ink)`, `--accent-ink: var(--paper)`).
- Light theme only, by choice. No dark mode.
- Shadows are ink at low alpha (`rgba(22, 23, 27, …)`), never pure black.

## Type

Three families from Google Fonts, loaded in each page's `<head>`.

| Role | Family | Weights | Token |
|---|---|---|---|
| Display: name, headings, project names, tier letters | Gabarito | 700, 800 | `--f-display` |
| Body: paragraphs, links, keys | Onest | 400, 500, 600 | `--f-body` |
| Utility: margin labels, metadata, tooltips, commands | Reddit Mono | 400, 500 | `--f-mono` |

Scale (body is 17px):

| Step | Size | Font / weight | Where |
|---|---|---|---|
| Name | `clamp(2.6rem, 9vw, 3.9rem)`, line-height .95, tracking -0.025em | Display 800 | `h1` |
| Section | 1.45rem, line-height 1.1 | Display 800 | `h2` |
| Item | 1.3rem, line-height 1.2 | Display 700 | Project names |
| Body | 1rem (17px), line-height 1.62 | Body 400 | Paragraphs |
| Small | .86rem | Body 600 | Keys |
| Label | .68rem, uppercase, tracking .06em | Mono 500 | Margin column, eyebrows |
| Micro | .68rem, no transform | Mono 500 | Tooltips, bubbles |

Rules:

- Headings get `text-wrap: balance`. Running text stays under ~60ch.
- Mono is for metadata only, never for paragraphs.
- No italics: Onest has no italic, and a synthesized one looks cheap. Use
  `--ink-soft` for quiet text instead.
- No decorative symbols in the UI: no arrows, middots, checkmarks, bullets
  before headings, or periods after names. Separate things with space and
  layout instead.

## Layout: the ledger

Every content section uses the same structure, so the page reads as one
system.

```
Section heading                       [optional toys / action]
───────────────────────────────────────────────────────────────
MARGIN LABEL        Content column
(mono, soft)        (name, text, actions)
───────────────────────────────────────────────────────────────
```

- Column `--margin: 9.5rem`, gap `1.5rem`, row padding `1.25rem 0`.
  Tighter variants: Now rows `.7rem 0`, Writing rows `.95rem 0`, tier rows
  `1rem 0`. The tier list narrows the margin to `3rem` (just the letter)
  and keeps it beside the content on phones.
- Rows are separated by `1px solid var(--rule)` on top; the last row also
  gets a bottom rule.
- At `max-width: 560px` the margin moves above the content and lays out as a
  row (label left, secondary link right).
- No boxed cards. Dialogs are the only boxed surfaces.
- Page width: `.wrap` max 680px, side padding 20px (16px minimum).
- Vertical rhythm: sections are `4.25rem` apart (`3.5rem` on phones);
  heading to first row `1.1rem`. Every heading row is at least 36px tall
  (the toys' size) so all headings sit on the same rhythm.
- The right side of a heading row holds that section's controls: the toys
  (Now), the filter keys (Writing), the Spin key (Tier List).

## Components and their states

Every interactive component defines all of these states. "Spring" is
`cubic-bezier(.3, 1.5, .5, 1)`.

### Key (`.key`)

The one pressable primitive. Used for every button and for link-buttons
that are actions (Email, Résumé, Try the demo, filters, pagination, dialog
actions).

| State | Look |
|---|---|
| Rest | Surface fill, 1px ink-16% border, radius 10px, faint top highlight, short soft shadow |
| Hover | Rises 1px, shadow grows (spring, .28s) |
| Active / pressed down | `scale(.95)`, shadow becomes a small inset, .06s in |
| Focus-visible | 2px ink outline, 3px offset |
| Toggled on (`aria-pressed="true"`) | Accent fill, accent-ink text |
| Pressed by keyboard | Enter/Space add `.is-down` (effects.js), same look as active |
| Disabled | 40% opacity, no hover lift, default cursor |

Variants: `.key.primary` (accent fill at rest; hover uses `--accent-strong`),
`.key.cmd` (mono text, for copyable commands), `.key-inline` (noodles page,
small enough to sit in a sentence). `.key-sm` is the compact size
(`.78rem` text, `.55em .9em` padding) for filters, pagination, dialog
Close keys and the footer Sounds toggle. Any
element with `data-copy` copies that text on click and shows the **bubble**.

Use a key for actions and for the one or two links that are the point of a
section (Email, Résumé, Try the demo). Everything else stays a text link.

### Text link

Body links and the four profile links.

| State | Look |
|---|---|
| Rest | Underline `--rule`, 1.5px, offset 3px |
| Hover | Underline turns `--accent` |
| Focus-visible | 2px ink outline |

### Bubble / tooltip (`[data-bubble]`, `.tip`)

Ink fill, paper text, mono micro, radius 6px, appears 4 to 8px above its
anchor with a spring scale-in. Used for "Copied" (set `data-bubble` on the
element) and for toy hints (`.tip`, shown on hover and keyboard focus; the
last toy's hint grows leftward so it never leaves the page). Always paired
with a screen-reader equivalent (the `role="status"` region or
`aria-label`). If the clipboard is unavailable, the bubble shows the text
itself instead of "Copied".

### Toys

Small objects with personality: 36px round buttons around a smaller
drawing, 8px apart at the right of a heading row, with a hint on
hover/focus.

- **Record** (`#record`): plays the jazz loop. Rest: still disc, arm parked.
  Hover: disc nudges -25deg, arm twitches. Playing: disc spins (1.8s/turn),
  arm on the record, notes float up, `aria-pressed="true"`.
- **Tennis ball** (`#ball`): rest is tennis yellow with white seams and a
  faint ink edge (the yellow alone barely separates from the paper); hover
  tilts it. Click bounces it (thwack, then two pocks) and Rally Run opens
  as it lands (650ms; immediately with reduced motion).

### Ledger row

Rest only; rows themselves are not interactive. Links and keys inside them
carry the states.

### Dialog

`dialog.panel`: surface fill, 1px rule border, radius 14px, soft large
shadow, backdrop ink at 45%. A `.panel-head` row holds a mono label on the
left and a compact "Close" key on the right. Opens with a short rise (.2s). Closed by a "Close" key, Esc, or
clicking the backdrop. Focus moves into the dialog and returns on close
(native `<dialog>`).

## Motion

- Physical, short, and caused by the user. Nothing moves on its own except
  feedback the user started (a spinning record, a rolling reel, rising steam).
- Durations: press-in .06s, release/hover .25 to .3s spring, fades .15s.
- `prefers-reduced-motion: reduce` turns off all transitions and animations
  (in `base.css`). JS-driven motion checks it too.
- Each effect lives in one removable file or block (see "Files").

## Sound

- Off by default. One toggle key in the footer of each page ("Sounds off" /
  "Sounds on", `aria-pressed`), remembered per visitor.
- Keys: a soft rising pop on press (Doodle Jump, not 8-bit).
- Tennis ball: a round "thwock" with a stadium echo, then a duller "pock" on
  each landing.
- Music only starts from the record, independent of the sound toggle (it is
  an explicit request), fades in, and stops when the tab is hidden.
- Everything is synthesized with Web Audio; no audio files.

## Accessibility checklist

- Semantic elements: `button` for actions, `a` for navigation, `dl` for the
  Now list, `section` with headings.
- Every control is reachable and usable by keyboard, with the focus ring
  visible.
- Toggles use `aria-pressed`. Copy actions announce through the shared
  `role="status"` region.
- Text contrast at least 4.5:1 (see the color table).
- Touch targets at least 24px; toys are 36px buttons.
- Each page has a `<main>` landmark. axe-core reports no violations on
  either page (re-run it after big changes).

## Files

| File | What it owns | Remove it to |
|---|---|---|
| `base.css` | Tokens, type, links, keys, bubbles, ledger, headings, footer, dialogs | (required) |
| `styles.css` / `noodles.css` | Page-specific layout | (required) |
| `effects.css` / `effects.js` | Page cross-fade, noodle tilt, steam | drop that polish |
| `sound.js` | Sound toggle, key pops, ball sounds | go silent |
| `toys.css` / `toys.js` | Record and ball visuals, ball bounce | remove the toys (also remove their markup) |
| `music.js` | The jazz loop behind the record | make the record inert |
| `game.css` / `game.js` | Rally Run, opened from the ball | drop the game |
