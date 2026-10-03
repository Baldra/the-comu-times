#!/usr/bin/env python3
"""Generate data.js from the committed survey snapshot and the authored files.

The page has no build step and must keep working from file://, so this script does
not run as part of the page. It exists so that data.js is reproducible output
rather than a hand-edited source: the survey decides the ranking, the vote counts
and the voter lists, while data/annotations.json and data/copy.json carry the
editorial material the survey does not record.

Usage:
    python3 scripts/build-data.py [--omit-voters]

    --omit-voters   emit vote counts but no voter names.

Nothing is written unless every check passes, so a failed run leaves the previous
data.js in place rather than shipping a partial page.
"""

import argparse
import collections
import csv
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SUMMARY_CSV = os.path.join(ROOT, "data/survey/resumen_peliculas_acumulado_completo.csv")
VOTES_CSV = os.path.join(ROOT, "data/survey/votos_usuarios_acumulado_completo.csv")
ANNOTATIONS = os.path.join(ROOT, "data/annotations.json")
COPY = os.path.join(ROOT, "data/copy.json")
OUTPUT = os.path.join(ROOT, "data.js")

# Films with at least this many votes ship. See design.md "Why 4".
CUTOFF = 4

# The leading films of the list each hold a distinct vote count, so grouping by
# count alone would open the page with single-film movements. The leading
# distinct counts are merged into one top movement; every other count gets a
# movement of its own.
TOP_BAND_MIN_SIZE = 3

# Vote bands expected from the committed snapshot, highest first. This is a
# checked assertion, not a constant the output depends on: the bands are derived
# from the data and these numbers only fail the build if the data moved.
EXPECTED_BANDS = [(9, 8, 7), (6,), (5,), (4,)]

ROMAN = [
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
]


class BuildError(Exception):
    """A reason to refuse to write data.js."""


def read_csv(path, expected_header):
    with io.open(path, encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        try:
            header = next(reader)
        except StopIteration:
            raise BuildError("%s is empty" % os.path.relpath(path, ROOT))
        if [h.strip() for h in header] != expected_header:
            raise BuildError(
                "%s has header %s, expected %s"
                % (os.path.relpath(path, ROOT), header, expected_header)
            )
        rows = [row for row in reader if row and any(cell.strip() for cell in row)]
    return rows


def load_json(path):
    try:
        with io.open(path, encoding="utf-8") as handle:
            return json.load(handle)
    except ValueError as exc:
        raise BuildError("%s is not valid JSON: %s" % (os.path.relpath(path, ROOT), exc))


def split_names(raw):
    return [name.strip() for name in raw.split(",") if name.strip()]


def load_snapshot():
    """Read both CSVs and check they describe the same votes before using them."""
    summary_rows = read_csv(SUMMARY_CSV, ["pelicula", "votos", "usuarios"])
    vote_rows = read_csv(VOTES_CSV, ["usuario", "pelicula"])

    films = collections.OrderedDict()
    for title, votes_raw, users_raw in summary_rows:
        if title in films:
            raise BuildError("%s lists %r twice" % (os.path.relpath(SUMMARY_CSV, ROOT), title))
        try:
            votes = int(votes_raw)
        except ValueError:
            raise BuildError("%s has a non-numeric vote count for %r" % (
                os.path.relpath(SUMMARY_CSV, ROOT), title))
        if votes < 0:
            raise BuildError("%s has a negative vote count for %r" % (
                os.path.relpath(SUMMARY_CSV, ROOT), title))
        films[title] = {"title": title, "votes": votes, "voters": split_names(users_raw)}

    # Rebuild each film's voters from the per-voter file, so a disagreement
    # between the two exports is caught here rather than shipping as a count
    # that does not match the names next to it.
    per_voter = collections.OrderedDict((title, []) for title in films)
    seen_pairs = set()
    voters_seen = set()
    for voter, title in vote_rows:
        if title not in films:
            raise BuildError("%s votes for %r, which the summary does not list" % (
                os.path.relpath(VOTES_CSV, ROOT), title))
        if (voter, title) in seen_pairs:
            raise BuildError("%s repeats the pair %r / %r" % (
                os.path.relpath(VOTES_CSV, ROOT), voter, title))
        seen_pairs.add((voter, title))
        voters_seen.add(voter)
        per_voter[title].append(voter)

    mismatches = []
    for title, film in films.items():
        if len(film["voters"]) != film["votes"]:
            mismatches.append("%s: declares %d votes but lists %d voters" % (
                title, film["votes"], len(film["voters"])))
        if sorted(film["voters"]) != sorted(per_voter[title]):
            mismatches.append("%s: the two CSVs disagree about who voted for it" % title)
    if mismatches:
        raise BuildError("the snapshot is inconsistent:\n  " + "\n  ".join(mismatches))

    total = sum(f["votes"] for f in films.values())
    if total != len(seen_pairs):
        raise BuildError("the summary totals %d votes but the per-voter file holds %d pairs" % (
            total, len(seen_pairs)))

    return films, len(seen_pairs), len(voters_seen)


def tally(films):
    """Vote counts across the whole snapshot, highest first."""
    counts = collections.Counter(f["votes"] for f in films.values())
    return sorted(counts.items(), reverse=True)


def cut_and_rank(films):
    """Apply the cutoff and rank the survivors, rank 1 being the most-voted."""
    kept = [f for f in films.values() if f["votes"] >= CUTOFF]
    kept.sort(key=lambda f: (-f["votes"], f["title"]))
    for index, film in enumerate(kept, start=1):
        film["rank"] = index
    return kept


def derive_bands(kept):
    """Group the ranked films into movements, highest band first.

    The leading distinct vote counts are merged into one top band so the page
    does not open with a run of single-film movements. The remaining counts each
    get a band of their own.
    """
    by_count = collections.OrderedDict()
    for film in kept:
        by_count.setdefault(film["votes"], []).append(film)

    descending = sorted(by_count, reverse=True)

    top_members = []
    while len(top_members) < TOP_BAND_MIN_SIZE and descending:
        count = descending.pop(0)
        top_members.extend(by_count[count])

    bands = []
    if top_members:
        bands.append({
            "key": "top",
            "counts": sorted({f["votes"] for f in top_members}, reverse=True),
            "films": top_members,
        })
    for count in descending:
        bands.append({
            "key": str(count),
            "counts": [count],
            "films": by_count[count],
        })

    actual = [tuple(b["counts"]) for b in bands]
    if actual != EXPECTED_BANDS:
        raise BuildError(
            "the snapshot no longer yields the reviewed vote bands.\n"
            "  derived:    %s\n"
            "  reviewed:   %s\n"
            "  If the survey moved, re-review the movement copy in data/copy.json and "
            "EXPECTED_BANDS in scripts/build-data.py." % (actual, EXPECTED_BANDS)
        )
    return bands


def resolve_titles(annotation):
    """A film whose title is identical in both languages stores only title.en."""
    title = annotation.get("title") or {}
    english = title.get("en")
    if not english:
        raise BuildError("annotation %r has no title.en" % annotation.get("_key"))
    spanish = title.get("es") or english
    if spanish == english:
        return {"es": english, "en": english}
    return {"es": spanish, "en": english}


def collect_missing(kept, annotations):
    missing = [f["title"] for f in kept if f["title"] not in annotations]
    if missing:
        raise BuildError(
            "%d film%s inside the cutoff of %d votes %s no annotation in %s:\n  %s" % (
                len(missing),
                "" if len(missing) == 1 else "s",
                CUTOFF,
                "has" if len(missing) == 1 else "have",
                os.path.relpath(ANNOTATIONS, ROOT),
                "\n  ".join(missing),
            )
        )


def build_movies(kept, annotations, omit_voters):
    movies = []
    for film in kept:
        annotation = annotations[film["title"]]
        movie = collections.OrderedDict()
        movie["rank"] = film["rank"]
        movie["section"] = film["section"]
        movie["votes"] = film["votes"]
        if not omit_voters:
            movie["voters"] = list(film["voters"])
        movie["year"] = annotation["year"]
        movie["director"] = annotation["director"]
        movie["title"] = resolve_titles(annotation)
        movie["blurb"] = collections.OrderedDict(
            [("es", annotation["blurb"]["es"]), ("en", annotation["blurb"]["en"])]
        )
        if annotation.get("media"):
            movie["media"] = annotation["media"]
        movies.append(movie)
    return movies


def render(movies, sections, copy, topper, omit_voters):
    def js(value, indent=0):
        pad = "  " * indent
        if isinstance(value, dict):
            if not value:
                return "{}"
            inner = ",\n".join(
                "%s  %s: %s" % (pad, json.dumps(k, ensure_ascii=False), js(v, indent + 1))
                for k, v in value.items()
            )
            return "{\n%s\n%s}" % (inner, pad)
        if isinstance(value, list):
            if not value:
                return "[]"
            if all(not isinstance(v, (dict, list)) for v in value):
                return "[%s]" % ", ".join(js(v) for v in value)
            inner = ",\n".join("%s  %s" % (pad, js(v, indent + 1)) for v in value)
            return "[\n%s\n%s]" % (inner, pad)
        return json.dumps(value, ensure_ascii=False)

    lines = []
    lines.append("/* The Comu Times — content data. GENERATED FILE, DO NOT EDIT.")
    lines.append(" *")
    lines.append(" * Regenerate with:  python3 scripts/build-data.py")
    lines.append(" *")
    lines.append(" * Source of truth for the ranking, vote counts and voter lists:")
    lines.append(" *   data/survey/*.csv        the committed survey snapshot")
    lines.append(" * Source of truth for the editorial copy:")
    lines.append(" *   data/annotations.json    year, director, bilingual title and blurb")
    lines.append(" *   data/copy.json           topper, interface strings, movement copy")
    lines.append(" *")
    lines.append(" * Loaded as a plain script before app.js so the page works from file://")
    lines.append(" * without a server. Global `window.SECTIONS` / `window.MOVIES` rather than")
    lines.append(" * a JSON fetch, because fetch() of a local file is blocked by CORS on the")
    lines.append(" * file: protocol.")
    if omit_voters:
        lines.append(" *")
        lines.append(" * BUILT WITH --omit-voters: entries carry vote counts but no voter names.")
    lines.append(" */")
    lines.append("(function () {")
    lines.append("  'use strict';")
    lines.append("")
    lines.append("  window.LOCALES = %s;" % json.dumps(copy.get("_locales", ["es", "en"])))
    lines.append("  window.DEFAULT_LOCALE = %s;" % json.dumps(copy.get("_defaultLocale", "en")))
    lines.append("")
    lines.append("  /* ------------------------------------------------------------- topper */")
    lines.append("")
    lines.append("  window.TOPPER = %s;" % js(topper, 1))
    lines.append("")
    lines.append("  /* ---------------------------------------------------------- interface */")
    lines.append("")
    lines.append("  window.COPY = %s;" % js(copy, 1))
    lines.append("")
    lines.append("  /* ----------------------------------------------------------- movements */")
    lines.append("")
    lines.append("  /* Movements are derived from the vote bands in the snapshot. Numeral, n and")
    lines.append("   * counts are generated; only the editorial copy is authored, in")
    lines.append("   * data/copy.json. Movements render in n order and the entry holding rank 1")
    lines.append("   * is the last of them, so the winner stays at the foot of the page. */")
    lines.append("")
    lines.append("  window.SECTIONS = %s;" % js(sections, 1))
    lines.append("")
    lines.append("  /* ---------------------------------------------------------------- movies */")
    lines.append("")
    if omit_voters:
        lines.append("  /* This build omits `voters`. Entries carry the ranking fields plus any")
        lines.append("   * authored `media` or `links`; cards without media fall back to the")
        lines.append("   * generated placeholder. */")
    else:
        lines.append("  /* Entries carry the ranking fields, voter names, and any authored `media`")
        lines.append("   * or `links`; cards without media fall back to the generated placeholder.")
        lines.append("   * Shapes honoured by the page:")
        lines.append("   *   media: 'assets/img/x.jpg'                     -> chosen by extension")
        lines.append("   *   media: { src: 'assets/video/x.mp4', poster: 'assets/img/x.jpg' }")
        lines.append("   *   links: [{ label: { es, en }, url: 'https://...' }] */")
    lines.append("")
    lines.append("  window.MOVIES = %s;" % js(movies, 1))
    lines.append("")
    lines.append("}());")
    return "\n".join(lines) + "\n"


def main(argv):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--omit-voters",
        action="store_true",
        help="emit vote counts but no voter names",
    )
    args = parser.parse_args(argv)

    try:
        films, pair_count, voter_count = load_snapshot()
        distribution = tally(films)

        annotations = load_json(ANNOTATIONS)
        annotations.pop("_comment", None)
        copy_doc = load_json(COPY)
        copy_strings = copy_doc.get("copy") or {}
        topper = copy_doc.get("topper") or {}
        movement_copy = copy_doc.get("movements") or {}

        kept = cut_and_rank(films)
        collect_missing(kept, annotations)

        bands = derive_bands(kept)

        # Page order is the reverse of the ranking, so the band holding rank 1 is
        # rendered last and the winner closes the page.
        render_bands = list(reversed(bands))

        sections = []
        missing_copy = []
        for index, band in enumerate(render_bands, start=1):
            authored = movement_copy.get(str(index))
            if not authored:
                missing_copy.append(str(index))
                continue
            if index > len(ROMAN):
                raise BuildError(
                    "%d movements need a numeral but the generator only knows %d"
                    % (index, len(ROMAN))
                )
            for film in band["films"]:
                film["section"] = index
            sections.append(collections.OrderedDict([
                ("n", index),
                ("num", ROMAN[index - 1]),
                ("counts", list(band["counts"])),
                ("title", authored["title"]),
                ("quote", authored["quote"]),
                ("lede", authored["lede"]),
            ]))
        if missing_copy:
            raise BuildError(
                "data/copy.json has no movement copy for position%s %s; %d movement%s derived"
                % (
                    "" if len(missing_copy) == 1 else "s",
                    ", ".join(missing_copy),
                    len(render_bands),
                    "" if len(render_bands) == 1 else "s",
                )
            )

        movies = build_movies(kept, annotations, args.omit_voters)

        if not args.omit_voters:
            for movie in movies:
                if len(movie["voters"]) != movie["votes"]:
                    raise BuildError(
                        "%s emits %d votes but %d voter names"
                        % (movie["title"]["en"], movie["votes"], len(movie["voters"]))
                    )

        output = render(movies, sections, copy_strings, topper, args.omit_voters)

    except BuildError as exc:
        sys.stderr.write("build-data: %s\n" % exc)
        sys.stderr.write("build-data: data.js was not written.\n")
        return 1

    with io.open(OUTPUT, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(output)

    sys.stdout.write("survey snapshot\n")
    sys.stdout.write("  films            %d\n" % len(films))
    sys.stdout.write("  voters           %d\n" % voter_count)
    sys.stdout.write("  votes            %d\n" % pair_count)
    sys.stdout.write("\nfilms by vote count\n")
    for count, films_at_count in distribution:
        marker = ""
        if count == CUTOFF:
            marker = "   <- cutoff"
        sys.stdout.write("  %2d votes  %4d%s\n" % (count, films_at_count, marker))
    at_or_above = sum(n for c, n in distribution if c >= CUTOFF)
    next_down = sum(n for c, n in distribution if c == CUTOFF - 1)
    sys.stdout.write("\ncut at >= %d votes\n" % CUTOFF)
    sys.stdout.write("  shipped          %d\n" % at_or_above)
    sys.stdout.write("  next tier down   %d at %d votes\n" % (next_down, CUTOFF - 1))
    sys.stdout.write("\nmovements\n")
    for section in sections:
        counts = section["counts"]
        held = sum(1 for m in movies if m["section"] == section["n"])
        band = "/".join(str(c) for c in counts)
        sys.stdout.write(
            "  %-4s %-7s %2d films\n" % (section["num"], band, held)
        )
    sys.stdout.write("\nwrote %s\n" % os.path.relpath(OUTPUT, ROOT))
    if args.omit_voters:
        sys.stdout.write("  voter names omitted by --omit-voters\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))