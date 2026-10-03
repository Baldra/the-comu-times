<div align="center">

# The Comu Times

*The twenty films that won a community vote. Ranked, and nothing more.*

[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat-square)](https://www.python.org/)
[![Dependencies](https://img.shields.io/badge/dependencies-none-success?style=flat-square)](#quick-start)
[![Build step](https://img.shields.io/badge/build-none-informational?style=flat-square)](#quick-start)
[![Third-party requests](https://img.shields.io/badge/third--party%20requests-0-success?style=flat-square)](#constraints)

[Features](#features) • [Quick start](#quick-start) • [How it works](#how-it-works) • [Data pipeline](#data-pipeline) • [Authoring](#authoring) • [Localization](#localization) • [Accessibility](#accessibility)

</div>

---

A bilingual (Spanish / English) editorial page that ranks the twenty films a
community vote actually landed on, ordered from twentieth to first. Sixty-six
people cast 593 votes across 398 candidates; twenty films cleared the bar.

The design borrows its posture from a broadsheet — masthead, standfirst, a
full-bleed colour band, a sticky jumpbar, and a list read from the bottom up so
the winner closes the page. Nothing about it is dynamic in the usual sense: there
is no framework, no bundler, no server, and no request that leaves your machine.

## Features

- **Zero dependencies and zero build step.** No `package.json`, no `node_modules`,
  no `requirements.txt`. Open `index.html` and the page is finished.
- **Works from `file://`.** Data is a plain `<script>` assigning `window.*`
  globals rather than a `fetch()` of JSON, and fonts are inlined as base64 data
  URIs as a CORS-proof fallback, so a double-clicked file behaves like a served one.
- **Bilingual at runtime.** Spanish and English copy throughout, switchable
  without a page load, preserving scroll position, keyboard focus and watchlist state.
- **A real watchlist.** Two independent toggles per film — *seen* and *want to
  watch* — persisted in `localStorage` and summarised in a panel.
- **A personal shortlist in the URL.** `?lang=es` opens the page in Spanish.
- **Progressive enhancement.** Without JavaScript the masthead, headline,
  standfirst, list intro and footer all remain readable in authored English.
- **Self-hosted fonts.** Playfair Display, Source Serif 4 and Libre Franklin,
  subset from upstream TTFs so old-style figure features survive. Nothing is
  fetched from a font CDN.
- **A reproducible data build.** One stdlib-only Python script turns two survey
  CSVs plus hand-authored JSON into a deterministic `data.js`.

## Quick start

There is nothing to install. Serve the directory or open it directly:

```bash
# Option 1 — just open it
open index.html

# Option 2 — any static server, if you prefer real HTTP semantics
python3 -m http.server 8000
```

Both routes render identically. The only runtime requirement is a browser with
ES2015 support.

## How it works

Four files carry the whole page. `index.html` is a thin shell with authored
English copy baked into every translatable node; `app.js` fills in the dynamic
regions.

```
index.html      static shell, masthead, topper, footer, <noscript>
styles.css      all styling; also carries the base64 font fallbacks
app.js          the renderer — band, jumpbar, movements, cards, watchlist
data.js         GENERATED — do not edit; run the build script instead
```

`index.html` provides empty host elements (`#band`, `#jumpbar-ranks`,
`#jumpbar-counters`, `#movements`) and `app.js` fills them. Ranks are *never*
computed in the browser — the generator decides them, and the renderer only
re-sorts defensively.

| Path | Role |
| --- | --- |
| `data/survey/*.csv` | Raw survey export: per-film summary and per-voter pairs |
| `data/annotations.json` | Hand-authored year, director, bilingual title and blurb, media |
| `data/copy.json` | Hand-authored editorial copy: topper, movements, UI strings |
| `scripts/build-data.py` | The generator. Standard library only |
| `assets/img/` | 20 poster / still assets |
| `assets/fonts/` | Four `woff2` subsets plus their OFL licences |

## Data pipeline

```bash
python3 scripts/build-data.py
```

This reads the two CSVs, `data/annotations.json` and `data/copy.json`, applies
the ranking rules, and writes `data.js` — printing a short report as it goes:

```
cut at >= 4 votes
  shipped          20
  next tier down   26 at 3 votes

movements
  I    4       9 films
  II   5       3 films
  III  6       5 films
  IV   9/8/7    3 films

wrote data.js
```

Three rules drive everything:

1. **Cutoff.** A film ships with at least 4 votes. Four is the last tier before
   the cliff from 9 films to 26, and it lands on exactly twenty.
2. **Ranking.** Most votes first; ties break alphabetically. Every rank is
   unique — the alphabetisation is an ordering convention, not a measured
   preference, and the page says so out loud.
3. **Movements.** Films are grouped into roman-numbered sections by vote band,
   and the groups are rendered in reverse so rank 1 lands last.

> [!IMPORTANT]
> The generator refuses to write anything if a film inside the cutoff has no
> entry in `data/annotations.json`, or if the derived vote bands stop matching
> what `data/copy.json` was written against. A failed build leaves the previous
> `data.js` untouched rather than shipping a partial page. When bands do move,
> re-review `copy.json`'s `movements` and the `EXPECTED_BANDS` constant.

Output is byte-identical across runs, so a regenerated `data.js` reads as a clean
diff in review. Run it from any working directory; paths resolve relative to the
script.

> [!TIP]
> `--omit-voters` emits vote counts without voter names. The page detects the
> absence and simply omits the disclosure instead of rendering an empty one.

## Authoring

**Change the copy.** Edit `data/copy.json` — headline, standfirst, document
title, meta description, movement titles, quotes, ledes, and every UI string.
Both languages live side by side; add `es` and `en` to each. Then regenerate.

**Add a film.** Add an entry to `data/annotations.json` keyed by the film title
*exactly* as it appears in the survey CSV, with `year`, `director`, `title`,
`blurb` and `media`, drop the asset in `assets/img/`, and regenerate. If the film
carries the same title in both languages, author only `title.en` — the Spanish
falls back to it rather than duplicating.

**Change a film.** These are authored, not derived. The vote count, rank, movement
and voter list all come from the survey and are not editable by hand.

```json
"Oldboy": {
  "year": 2003,
  "director": "Park Chan-wook",
  "title": { "en": "Oldboy" },
  "blurb": { "en": "…", "es": "…" },
  "media": "assets/img/oldboy.gif"
}
```

Nine of the twenty films have a different title in Spanish and English — those
carry both. The other eleven store only `title.en`, as above.

## Localization

Two locales, `es` and `en`, resolved on first load in this order: the `?lang=`
query parameter, then a saved preference, then the browser's languages, then the
default. Markup declares its own bindings:

```html
<h1 class="topper__headline">
  <span class="topper__line" data-i18n="TOPPER.headline.0">THE 20 BEST FILMS</span>
  <span class="topper__line" data-i18n="TOPPER.headline.1">ACCORDING TO</span>
  <span class="topper__line" data-i18n="TOPPER.headline.2">LA COMU</span>
</h1>
```

`data-i18n` sets text; `data-i18n-attr="aria-label:someKey"` sets an attribute.
Nodes generated by JavaScript cannot carry these, so they register a binding
instead and are re-labelled on every switch.

Switching language rewrites text in place. It does not re-render the page, so
scroll offset, keyboard focus, open disclosures, loaded media and every watchlist
toggle survive the change. The choice persists under `comu:lang`.

> [!NOTE]
> The page reads `?lang=` but does not write it. A shared link only carries the
> sender's language if they append the parameter themselves.

## Accessibility

- Rank numerals are visible, not screen-reader-only, and sit inside each card's
  heading so the rank is announced once, in context, with no hidden duplicate.
- Toggles are real buttons carrying `aria-pressed` and an accessible name that
  includes the film title.
- Live counters announce changes through a polite live region.
- Film images are decorative (`alt=""`) because the adjacent heading names the
  film; the informative placeholder note sits outside the hidden decorative layer.
- Voter lists are collapsed `<details>`, labelled with a count, and omitted
  entirely when there is nothing to disclose.
- Every translatable node carries authored English, so a script failure degrades
  to readable text instead of blank.
- `prefers-reduced-motion` disables animation and smooth scrolling; the print
  stylesheet drops the chrome and keeps cards from breaking across pages.

## Constraints

Worth knowing before you change anything:

- **Never hand-edit `data.js`.** It is generated and will overwrite your work.
- **Never add a third-party request.** Fonts are self-hosted for this reason, and
  the `file://` fallback depends on staying that way.
- **Ship copy and data together.** `data/copy.json` and `data.js` belong in the
  same commit.