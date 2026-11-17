# Style guide

The rules every page follows. Read this before changing anything visual, and
update it in the same commit if a rule changes.

## The idea in one paragraph

A calm, editorial page with the tactility of the 2010s web hidden in how
things respond. At rest the site is neutral paper, ink, and type. Anything you
can press feels physical: it lifts on hover, squishes when pressed, and can
make a soft pop. Color means one thing: **this is pressable**. Personality
lives in how things respond and in the copy, never in decoration.

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
| `--accent` | `#3a63d8` | Fill of primary and pressed keys, link underline on hover, text selection | 4.7:1 on paper, 5.3:1 with white text |
| `--accent-strong` | `#2f55c4` | Accent hover/pressed state | 6.5:1 with white text |
| `--accent-ink` | `#ffffff` | Text on accent fills | |
| `--ball` | `#d4ef3a` | The tennis ball in Rally Run only. Fill only, never text | 13.8:1 with ink text |
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
| Label | .68rem, uppercase, tracking .06em | Mono 500 | Margin column, card headers, flags |
| Field | .74rem, lowercase as written | Mono 400 | Field names in the Now card (`.field-label`) |
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
Section heading                            [optional controls]
───────────────────────────────────────────────────────────────
MARGIN LABEL        Content column
(mono, soft)        (name, text, actions)
───────────────────────────────────────────────────────────────
```

- Column `--margin: 9.5rem`, gap `1.5rem`, row padding `1.25rem 0`.
  Variants: Writing rows `.95rem 0`; tier rows `1rem 0`, with the margin
  narrowed to `3rem` (just the letter) and kept beside the content on
  phones; Now rows live inside a card (see Card) with a `7rem` margin,
  `.75rem 16px` padding and dashed dividers.
- Rows are separated by `1px solid var(--rule)` on top; the last row also
  gets a bottom rule.
- At `max-width: 560px` the margin moves above the content and lays out as a
  row (label left, secondary link right).
- Boxes are earned: cards hold a section's main content (the Now card, each
  project) and dialogs hold modal tasks. Lists (Writing, the tier list) stay
  as open ledger rows.
- Page width: `.wrap` max 680px, side padding 20px (16px minimum).
- Vertical rhythm: sections are `4.25rem` apart (`3.5rem` on phones);
  heading to first row `1.1rem`. Every heading row is at least 36px tall
  (a key's height) so all headings sit on the same rhythm.
- The right side of a heading row holds that section's controls: the filter
  keys (Writing, shown only when posts come from more than one source), the
  Spin key (Tier List).

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
Close keys. Any
element with `data-copy` copies that text on click and shows the **bubble**.

Use a key for actions and for the one or two links that are the point of a
section (Email, Résumé, Try the demo). Everything else stays a text link.
A quiet action that shouldn't draw the eye (the footer's "Play Rally Run")
is a `.text-button`: a real `<button>` styled like a text link.

### Text link

Body links and the four profile links.

| State | Look |
|---|---|
| Rest | Underline `--rule`, 1.5px, offset 3px |
| Hover | Underline turns `--accent` |
| Focus-visible | 2px ink outline |

### Bubble (`[data-bubble]`)

Ink fill, paper text, mono micro, radius 6px, appears 4 to 8px above its
anchor with a spring scale-in. Used for "Copied" (set `data-bubble` on the
element). Always paired with a screen-reader equivalent (the `role="status"`
region). If the clipboard is unavailable, the bubble shows the text
itself instead of "Copied".

### Floating nav (`.site-nav`)

A pill fixed 12px from the top of every page: surface at 88% with a blur,
1px rule border, soft shadow. It holds the page's section links (text, no
underline) and, last, the sound switch. Always visible, so the switch is
always in reach.

| State | Look |
|---|---|
| Link rest | `--ink-soft` |
| Link hover | Ink text on a 6% ink wash |
| Current section (`aria-current`, set by nav.js) | Paper text on ink |
| Focus-visible | 2px ink outline |

`html` has `scroll-padding-top: 4.5rem`, so anchor jumps and keyboard focus
both land below the nav, never under it. Scrolling is smooth unless reduced
motion is on. A "Skip to content" key
appears top-left on first Tab.

### Sound switch (`.sound-switch`, `role="switch"`)

"Sound" plus a 26x16px track with a 12px knob. Off: `--ink-soft` track,
knob left. On: `--accent` track, knob slides right with the spring.
Under 400px wide only the track shows; `aria-label="Sound"` keeps its name.

### Card (`.card`)

Surface fill, 1px rule border, radius 14px, a barely-there shadow. Optional
`.card-head`: a row with a `.label` on the left, `12px 16px` padding and a
solid rule below. Cards are static: no hover lift, because a lift says
"pressable" and a card doesn't open anything yet. If cards later open a
full write-up, make the title the link and add the key's hover lift then.

Each project is a card (no header) with `20px 22px` padding, stacked 12px
apart: an optional status flag (`.label`, only for something worth flagging
such as "In progress"), the name, the description, then an actions row:
the action keys followed by a "View the code" text link.

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
  feedback the user started (a rolling reel, rising steam).
- Durations: press-in .06s, release/hover .25 to .3s spring, fades .15s.
- `prefers-reduced-motion: reduce` turns off all transitions and animations
  (in `base.css`). JS-driven motion checks it too.
- Each effect lives in one removable file or block (see "Files").

## Sound

- On by default, but nothing plays until the visitor presses something. The
  sound switch in the floating nav turns it off, remembered per visitor.
- Keys: a soft rising pop on press (Doodle Jump, not 8-bit).
- Noodle reel: a short falling tick each time a cup passes the window
  (synced to the reel's real position, so it slows as the reel does), then
  a two-note chime when it lands.
- Rally Run (game-sound.js): an original 8-bit tennis theme (square lead,
  triangle bass, noise hats; 8 bars in C at 150 BPM) loops while the game is
  open and stops on a fault, coming back on the next serve. Effects: a rising
  arpeggio on serve, an upward blip on each jump, a thud and falling tone on
  a fault. All of it follows the sound switch.
- Everything is synthesized with Web Audio; no audio files.

## Accessibility checklist

- Semantic elements: `button` for actions, `a` for navigation, `dl` for the
  Now list, `section` with headings.
- Every control is reachable and usable by keyboard, with the focus ring
  visible. Each page starts with a "Skip to content" link to `<main>`.
- Toggles use `aria-pressed` (the sound switch uses `role="switch"` with
  `aria-checked`). Copy actions announce through the shared `role="status"`
  region.
- Text contrast at least 4.5:1 (see the color table).
- Touch targets at least 24px.
- Each page has a `<main>` landmark. axe-core reports no violations on
  either page (re-run it after big changes).

## Files

| File | What it owns | Remove it to |
|---|---|---|
| `base.css` | Tokens, type, links, keys, bubbles, ledger, cards, nav, headings, footer, dialogs | (required) |
| `styles.css` / `noodles.css` | Page-specific layout | (required) |
| `effects.css` / `effects.js` | Page cross-fade, noodle tilt, steam | drop that polish |
| `nav.js` | Marks the current section in the floating nav | stop highlighting (the links still work) |
| `sound.js` | Sound switch, key pops, spin sounds | go silent |
| `game.css` / `game.js` | Rally Run, opened from the footer | drop the game (also remove the footer button and game-sound.js) |
| `game-sound.js` | Rally Run's theme and effects | make the game silent |
