/* ==========================================================================
   The Comu Times — behaviour.

   Responsibilities:
     * resolve a translatable field for the active language, with fallback
     * resolve the active language: ?lang -> saved preference -> browser -> en
     * render movements and cards from one template, sorted independently of
       the order of data.js
     * generated placeholders for cards with no media, plus real media support
     * a per-rank seen / want-to-watch watchlist held in localStorage

   Every storage read and write is guarded so unavailable or corrupt storage
   degrades to plain rendering rather than throwing.
   ========================================================================== */
(function () {
  'use strict';

  var LOCALES = window.LOCALES || ['es', 'en'];
  var DEFAULT_LOCALE = window.DEFAULT_LOCALE || 'en';
  var COPY = window.COPY || {};
  var TOPPER = window.TOPPER || {};
  var SECTIONS = window.SECTIONS || [];
  var MOVIES = window.MOVIES || [];

  var STORE_KEYS = {
    lang: 'comu:lang',
    seen: 'comu:seen',
    want: 'comu:want',
  };

  /* The single place card colour saturation/lightness is scaled for review. */
  var HUE_STEP = 36;

  var state = {
    locale: DEFAULT_LOCALE,
    seen: Object.create(null),
    want: Object.create(null),
    order: [],      // ranks, descending, as rendered
    anchors: Object.create(null), // rank -> element id
    langButtons: [],
    i18nNodes: [],
    bindings: [],
  };

  /* ------------------------------------------------------------- storage */

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  }

  /* Ranks are stored as a JSON array of integers. Anything else — absent,
   * corrupt, or of the wrong shape — is treated as "nothing marked". */
  function loadRanks(key) {
    var raw = storageGet(key);
    if (!raw) return Object.create(null);
    var out = Object.create(null);
    try {
      var parsed = JSON.parse(raw);
      if (Object.prototype.toString.call(parsed) !== '[object Array]') return out;
      parsed.forEach(function (rank) {
        var n = Number(rank);
        if (Number.isInteger(n) && n >= 1 && n <= MOVIES.length) out[n] = true;
      });
    } catch (err) {
      return Object.create(null);
    }
    return out;
  }

  function saveRanks(key, map) {
    var ranks = Object.keys(map)
      .map(Number)
      .filter(function (n) { return Number.isInteger(n); })
      .sort(function (a, b) { return a - b; });
    storageSet(key, JSON.stringify(ranks));
  }

  function countOf(map) {
    return Object.keys(map).length;
  }

  /* ---------------------------------------------------------- i18n core */

  function supported(locale) {
    return LOCALES.indexOf(locale) !== -1;
  }

  /* 3.1 — a plain string is identical in every language; an object resolves by
   * the active language and falls back to any other supported language; a field
   * with no value in any language resolves to an empty string. */
  function field(value, locale) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      for (var i = 0; i < LOCALES.length; i++) {
        if (typeof value[LOCALES[i]] === 'string') return value[LOCALES[i]];
      }
      return '';
    }
    if (typeof value === 'object') {
      if (typeof value[locale] === 'string' && value[locale] !== '') {
        return value[locale];
      }
      for (var j = 0; j < LOCALES.length; j++) {
        var candidate = value[LOCALES[j]];
        if (typeof candidate === 'string' && candidate !== '') return candidate;
      }
    }
    return '';
  }

  function t(key) {
    return field(COPY[key], state.locale);
  }

  function getPath(path) {
    return path.split('.').reduce(function (acc, part) {
      return acc === null || acc === undefined ? undefined : acc[part];
    }, window);
  }

  /* Handles both "COPY.foo" and "TOPPER.headline.0" (an indexed line of the
   * topper). The topper's array is itself locale-keyed, so it is selected here
   * rather than through field(), which only ever yields a string. */
  function lookup(path) {
    var indexed = /^([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\.(\d+)$/.exec(path);
    if (indexed) {
      var group = getPath(indexed[1]);
      if (group && typeof group === 'object') {
        var lines = Array.isArray(group[state.locale]) ? group[state.locale] : null;
        if (!lines) {
          for (var i = 0; i < LOCALES.length && !lines; i++) {
            if (Array.isArray(group[LOCALES[i]])) lines = group[LOCALES[i]];
          }
        }
        if (lines) {
          var at = lines[Number(indexed[2])];
          return typeof at === 'string' ? at : '';
        }
      }
    }
    /* Static [data-i18n] keys are authored bare (e.g. "listIntro") but the
     * interface strings live in window.COPY. A COPY.-prefixed path resolves
     * directly; a bare one falls back to COPY, so every interface string
     * translates instead of sitting on its markup fallback. */
    var direct = field(getPath(path), state.locale);
    if (direct) return direct;
    return field(getPath('COPY.' + path), state.locale);
  }

  /* 3.2 — URL parameter, then saved preference, then the browser when it is a
   * language we ship, then English. An unsupported value falls through. */
  function resolveLocale() {
    try {
      var fromUrl = new URLSearchParams(window.location.search).get('lang');
      if (fromUrl && supported(fromUrl)) return fromUrl;
    } catch (err) {
      /* file:// URLs and malformed queries degrade silently. */
    }

    var saved = storageGet(STORE_KEYS.lang);
    if (saved && supported(saved)) return saved;

    try {
      var candidates = navigator.languages || [navigator.language];
      for (var i = 0; i < candidates.length; i++) {
        var tag = String(candidates[i] || '').toLowerCase();
        var base = tag.split('-')[0];
        if (supported(base)) return base;
        if (supported(tag)) return tag;
      }
    } catch (err) {
      /* no navigator language available */
    }

    return DEFAULT_LOCALE;
  }

  /* ------------------------------------------------------- node helpers */

  /* Generated copy lives in nodes built by app.js, so it cannot use the static
   * [data-i18n] hook. Each one registers a binding instead: a getter that
   * returns the string for the active language. Switching locale re-runs the
   * getters and writes textContent in place, so the page is built once and
   * nothing is re-rendered -- scroll position, focus and node identity hold. */
  function bind(node, getter) {
    if (node) state.bindings.push({ node: node, get: getter });
    return node;
  }

  function updateBindings() {
    state.bindings.forEach(function (binding) {
      if (!binding.node.isConnected) return;
      var value = binding.get();
      binding.node.textContent = value === undefined || value === null ? '' : String(value);
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function slug(rank) {
    return 'pelicula-' + rank;
  }

  /* 4.4 — an anchor per entry, derived from its rank. If two entries ever share
   * a rank the later one gets a suffix, so anchors never collide. */
  function assignAnchors() {
    var used = Object.create(null);
    MOVIES.forEach(function (movie) {
      var base = slug(movie.rank);
      used[base] = (used[base] || 0) + 1;
      var id = used[base] === 1 ? base : base + '-' + used[base];
      movie.anchor = id;
      if (!state.anchors[movie.rank]) state.anchors[movie.rank] = id;
    });
  }

  /* --------------------------------------------------------------- media */

  function mediaSpec(movie) {
    var m = movie.media;
    if (!m) return null;
    if (typeof m === 'string') return { src: m, poster: null };
    if (typeof m === 'object' && typeof m.src === 'string' && m.src) {
      return { src: m.src, poster: typeof m.poster === 'string' ? m.poster : null };
    }
    return null;
  }

  function isVideoSrc(src) {
    return /\.(mp4|webm|ogv|ogg|m4v|mov)(\?|#|$)/i.test(src);
  }

  /* 5.1 / 5.2 — a generated placeholder filling the same 16:9 box as real
   * media, carrying the rank as a large low-contrast numeral over the hue. */
  function buildFrame(movie) {
    var frame = el('div', 'card__frame');

    var placeholder = el('div', 'card__placeholder');
    placeholder.appendChild(el('span', 'card__watermark', movie.rank));
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.appendChild(bind(el('span', 'card__note'), function () {
      return t('placeholderNote');
    }));
    frame.appendChild(placeholder);

    var spec = mediaSpec(movie);
    if (!spec) return frame;

    var media;
    if (isVideoSrc(spec.src)) {
      media = el('video');
      media.setAttribute('controls', '');
      media.setAttribute('playsinline', '');
      media.setAttribute('preload', 'metadata');
      if (spec.poster) media.setAttribute('poster', spec.poster);
      media.src = spec.src;
    } else {
      media = el('img');
      media.loading = 'lazy';
      media.decoding = 'async';
      media.alt = '';
      media.src = spec.src;
    }

    /* 5.3 — a path that does not resolve leaves the placeholder in place, and
     * because the placeholder already occupies the frame there is no shift. */
    media.addEventListener('error', function () {
      if (media.parentNode) media.parentNode.removeChild(media);
      var note = frame.querySelector('.card__note');
      if (note) {
        note.textContent = t('mediaFallbackNote');
        note.dataset.isError = 'true';
      }
    });

    /* Real media that loads takes over the frame the placeholder was holding. */
    var reveal = function () {
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    };
    if (isVideoSrc(spec.src)) {
      media.addEventListener('loadeddata', reveal);
      media.addEventListener('error', reveal);
    } else {
      if (media.complete && media.naturalWidth > 0) reveal();
      media.addEventListener('load', reveal);
    }

    frame.insertBefore(media, frame.firstChild);
    return frame;
  }

  /* --------------------------------------------------------------- card */

  function buildToggle(kind, movie) {
    var pressed = kind === 'seen' ? !!state.seen[movie.rank] : !!state.want[movie.rank];
    var label = t(kind === 'seen' ? 'seen' : 'want');
    var title = field(movie.title, state.locale);

    var button = el('button', 'toggle');
    button.type = 'button';
    button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    /* The accessible name says which film the action applies to. */
    button.setAttribute('aria-label', label + ': ' + title);
    button.dataset.kind = kind;
    button.dataset.rank = String(movie.rank);
    button.appendChild(el('span', 'toggle__box'));
    button.appendChild(bind(el('span', 'toggle__label'), function () {
      return t(kind === 'seen' ? 'seen' : 'want');
    }));
    return button;
  }

  /* 4.3 — one template for every film, for every movement. */
  function buildCard(movie) {
    var card = el('article', 'card');
    card.id = movie.anchor;
    /* 5.2 — hue is the only per-card variable; saturation and lightness come
     * from the stylesheet so the ten placeholders differ only in hue. */
    card.style.setProperty('--hue', String((movie.rank * HUE_STEP) % 360));

    var media = el('div', 'card__media');
    media.appendChild(buildFrame(movie));
    card.appendChild(media);

    var text = el('div', 'card__text');

    var heading = el('h3', 'card__title');
    heading.appendChild(el('span', 'sr-only', '#' + movie.rank + ' — '));
    var titleMain = el('span', 'card__title-main');
    bind(titleMain, function () {
      titleMain.setAttribute('lang', state.locale);
      return field(movie.title, state.locale);
    });
    heading.appendChild(titleMain);
    /* When a film has a different title in each language, show both: the
     * localized title leads and the other follows, so a reader who knows the
     * film by one name still recognises it. Titles identical in both languages
     * are stored once and render once. */
    if (movie.title && movie.title.es !== movie.title.en) {
      var titleAlt = el('span', 'card__title-alt');
      bind(titleAlt, function () {
        var other = state.locale === 'es' ? 'en' : 'es';
        titleAlt.setAttribute('lang', other);
        return field(movie.title, other);
      });
      heading.appendChild(titleAlt);
    }
    text.appendChild(heading);

    /* The vote count is a first-class fact, not a footnote: it is what the
     * reader compares between films, and it is visible without opening
     * anything. The numeral alone does not say it, because a rank inside a tie
     * is not a measured preference. */
    if (typeof movie.votes === 'number') {
      var votes = el('p', 'card__votes');
      votes.appendChild(bind(el('span', 'card__votes-n'), function () {
        return String(movie.votes);
      }));
      votes.appendChild(bind(el('span', 'card__votes-label'), function () {
        return t('votesLabel');
      }));
      text.appendChild(votes);
    }

    text.appendChild(
      el('p', 'card__meta', movie.director + ' · ' + movie.year)
    );
    text.appendChild(bind(
      el('p', 'card__blurb'),
      function () { return field(movie.blurb, state.locale); }
    ));

    /* Who picked it sits behind a native disclosure, collapsed by default, so
     * the names are available without being the first thing a reader sees. A
     * build made with --omit-voters carries no voter list at all, and then no
     * disclosure is rendered rather than an empty one. */
    if (Array.isArray(movie.voters) && movie.voters.length) {
      var disclosure = el('details', 'card__voters');
      disclosure.appendChild(bind(el('summary', 'card__voters-summary'), function () {
        return t('votersToggle') + ' (' + movie.voters.length + ')';
      }));
      var names = el('ul', 'card__voter-list');
      movie.voters.forEach(function (voter) {
        names.appendChild(el('li', 'card__voter', voter));
      });
      disclosure.appendChild(names);
      text.appendChild(disclosure);
    }

    if (Array.isArray(movie.links) && movie.links.length) {
      var links = el('ul', 'card__links');
      movie.links.forEach(function (link) {
        var item = el('li');
        var anchor = bind(
          el('a'),
          function () { return field(link.label, state.locale) || link.url; }
        );
        anchor.href = link.url;
        item.appendChild(anchor);
        links.appendChild(item);
      });
      text.appendChild(links);
    }

    var actions = el('div', 'card__actions');
    actions.appendChild(buildToggle('seen', movie));
    actions.appendChild(buildToggle('want', movie));
    text.appendChild(actions);

    card.appendChild(text);
    return card;
  }

  /* ---------------------------------------------------------- watchlist */

  /* 6.3 — rendered inside the final movement, in rank order to match the way
   * the page reads, and rebuilt whenever the marked set changes. */
  function buildWatchlist() {
    var panel = el('aside', 'watchlist');
    panel.id = 'watchlist';
    panel.setAttribute('aria-labelledby', 'watchlist-title');

    var title = el('h3', 'watchlist__title', t('watchlistPanelTitle'));
    title.id = 'watchlist-title';
    panel.appendChild(title);
    panel.appendChild(el('p', 'watchlist__hint', t('watchlistSaved')));

    var marked = MOVIES.filter(function (movie) {
      return state.seen[movie.rank] || state.want[movie.rank];
    }).sort(function (a, b) {
      return b.rank - a.rank;
    });

    if (!marked.length) {
      panel.appendChild(el('p', 'watchlist__empty', t('watchlistEmpty')));
      return panel;
    }

    var list = el('ol', 'watchlist__list');
    marked.forEach(function (movie) {
      var item = el('li', 'watchlist__item');
      item.appendChild(el('span', 'watchlist__rank', movie.rank));

      var titleLink = el('a', 'watchlist__title-text');
      titleLink.href = '#' + movie.anchor;
      titleLink.appendChild(el('span', 'watchlist__title-main',
        field(movie.title, state.locale)));
      if (movie.title && movie.title.es !== movie.title.en) {
        titleLink.appendChild(el('span', 'watchlist__title-alt',
          field(movie.title, state.locale === 'es' ? 'en' : 'es')));
      }
      item.appendChild(titleLink);

      var states = el('span', 'watchlist__states');
      [
        { on: !!state.seen[movie.rank], text: t('seenShort') },
        { on: !!state.want[movie.rank], text: t('wantShort') },
      ].forEach(function (entry) {
        var chip = el('span', 'watchlist__state' + (entry.on ? ' watchlist__state--on' : ''), entry.text);
        states.appendChild(chip);
      });
      item.appendChild(states);

      list.appendChild(item);
    });
    panel.appendChild(list);
    return panel;
  }

  /* ------------------------------------------------------------ counters */

  /* 6.2 — both counters live in the jumpbar, localised, and update in place. */
  function renderCounters() {
    var host = document.getElementById('jumpbar-counters');
    if (!host) return;
    var total = MOVIES.length;
    host.textContent = '';

    function counter(value, noun) {
      var span = el('span', 'jumpbar__counter');
      span.appendChild(el('b', null, String(value)));
      span.appendChild(document.createTextNode(
        ' ' + t('ofTotal') + ' ' + total + ' ' + t(noun)
      ));
      return span;
    }

    host.appendChild(counter(countOf(state.seen), 'counterSeen'));
    host.appendChild(counter(countOf(state.want), 'counterWant'));
  }

  /* --------------------------------------------------------------- band */

  /* 8.1 — full-bleed band, one segment per movie in list order. */
  function renderBand() {
    var host = document.getElementById('band');
    if (!host) return;
    host.textContent = '';
    state.order.forEach(function (rank) {
      var seg = el('span', 'band__seg');
      seg.style.setProperty('--hue', String((rank * HUE_STEP) % 360));
      host.appendChild(seg);
    });
  }

  /* ------------------------------------------------------------ jumpbar */

  /* 4.4 — targets come from the same list that was rendered, so a target can
   * only ever name a rank that actually exists on the page. */
  function renderJumpbar() {
    var host = document.getElementById('jumpbar-ranks');
    if (!host) return;
    host.textContent = '';
    state.order.forEach(function (rank) {
      var id = state.anchors[rank];
      if (!id || !document.getElementById(id)) return;
      var item = el('li', 'jumpbar__rank');
      var anchor = el('a', null, String(rank));
      anchor.href = '#' + id;
      anchor.dataset.rank = String(rank);
      item.appendChild(anchor);
      host.appendChild(item);
    });
  }

  /* ------------------------------------------------------------- render */

  /* 4.1 / 4.2 — group by movement, sorting by descending rank so the rendered
   * order never depends on the order of data.js. A movie whose section matches
   * no declared movement is still rendered, under an empty-state movement. */
  function renderMovements() {
    var host = document.getElementById('movements');
    if (!host) return;
    host.textContent = '';

    var bySection = Object.create(null);
    MOVIES.forEach(function (movie) {
      (bySection[movie.section] = bySection[movie.section] || []).push(movie);
    });
    Object.keys(bySection).forEach(function (key) {
      bySection[key].sort(function (a, b) { return b.rank - a.rank; });
    });

    var declared = SECTIONS.slice();
    Object.keys(bySection).forEach(function (key) {
      var n = Number(key);
      var known = declared.some(function (s) { return Number(s.n) === n; });
      if (!known) {
        declared.push({
          n: n,
          num: '?',
          title: { es: 'MOVIMIENTO ' + n, en: 'MOVEMENT ' + n },
          quote: { es: '', en: '' },
          lede: { es: '', en: '' },
          undeclared: true,
        });
      }
    });
    declared.sort(function (a, b) { return a.n - b.n; });

    declared.forEach(function (movement, index) {
      var movies = bySection[movement.n] || [];
      var section = el('section', 'movement' + (movement.undeclared ? ' movement--empty' : ''));
      section.id = 'movimiento-' + movement.n;

      var head = el('header', 'movement__head');
      head.appendChild(el('p', 'movement__num', movement.num));

      var body = el('div', 'movement__body');
      body.appendChild(bind(
        el('h2', 'movement__title'),
        function () { return field(movement.title, state.locale); }
      ));

      var quote = field(movement.quote, state.locale);
      if (quote) {
        body.appendChild(bind(
          el('p', 'movement__quote'),
          function () { return field(movement.quote, state.locale); }
        ));
      }

      var lede = field(movement.lede, state.locale);
      if (lede) {
        body.appendChild(bind(
          el('p', 'movement__lede'),
          function () { return field(movement.lede, state.locale); }
        ));
      }

      /* The header states the count its films share, so the band is legible
       * without counting cards. The top movement merges the leading counts, so
       * it lists them rather than claiming a single one. */
      if (Array.isArray(movement.counts) && movement.counts.length) {
        body.appendChild(bind(
          el('p', 'movement__counts'),
          function () {
            var label = movement.counts.length === 1
              ? t('movementVotesEach')
              : t('movementVotesList');
            return movement.counts.join(' / ') + ' ' + label;
          }
        ));
      }

      head.appendChild(body);
      section.appendChild(head);

      var grid = el('div', 'movement__grid');
      if (!movies.length) {
        grid.appendChild(bind(el('p', 'movement__empty-note'), function () {
          return t('movementEmpty');
        }));
      }
      movies.forEach(function (movie) {
        grid.appendChild(buildCard(movie));
      });

      /* 6.3 — the watchlist lives in the final movement. */
      if (index === declared.length - 1) {
        grid.appendChild(buildWatchlist());
      }

      section.appendChild(grid);
      host.appendChild(section);
    });
  }

  function renderAll() {
    assignAnchors();
    state.order = MOVIES.map(function (m) { return m.rank; })
      .sort(function (a, b) { return b - a; });
    renderBand();
    syncJumpbarOffset();
    /* Movements first: the jumpbar resolves each target against the rendered
     * anchors, so the cards have to exist before it walks the list. */
    renderMovements();
    renderJumpbar();
    renderCounters();
  }

  /* ------------------------------------------------------- translations */

  /* 3.3 — the page is built once; switching only rewrites text in place, so
   * scroll position, keyboard focus, and watchlist state are untouched. */
  function collectI18nNodes() {
    state.i18nNodes = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      state.i18nNodes.push({ node: node, path: node.getAttribute('data-i18n') });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (node) {
      node.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length === 2) {
          state.i18nNodes.push({
            node: node,
            attr: bits[0],
            path: bits[1],
          });
        }
      });
    });
  }

  function applyTranslations() {
    document.documentElement.lang = state.locale; /* 10.2 */

    state.i18nNodes.forEach(function (entry) {
      var value = lookup(entry.path);
      if (!value) return;
      if (entry.attr) entry.node.setAttribute(entry.attr, value);
      else entry.node.textContent = value;
    });

    updateBindings();

    state.langButtons.forEach(function (button) {
      button.setAttribute(
        'aria-pressed',
        button.dataset.setLang === state.locale ? 'true' : 'false'
      );
    });
  }

  /* Toggle buttons, jumpbar counters and the watchlist carry generated copy, so
   * they are refreshed separately from the static [data-i18n] nodes. */
  function refreshGenerated() {
    document.querySelectorAll('.toggle').forEach(function (button) {
      var kind = button.dataset.kind;
      var rank = Number(button.dataset.rank);
      var movie = MOVIES.filter(function (m) { return m.rank === rank; })[0];
      if (!movie) return;
      var label = t(kind === 'seen' ? 'seen' : 'want');
      var text = button.querySelector('.toggle__label');
      if (text) text.textContent = label;
      button.setAttribute(
        'aria-label',
        label + ': ' + field(movie.title, state.locale)
      );
      button.setAttribute(
        'aria-pressed',
        (kind === 'seen' ? state.seen[rank] : state.want[rank]) ? 'true' : 'false'
      );
    });

    document.querySelectorAll('.card__note').forEach(function (note) {
      if (!note.dataset.isError) note.textContent = t('placeholderNote');
    });

    renderCounters();

    var oldPanel = document.getElementById('watchlist');
    if (oldPanel) {
      var grid = oldPanel.parentNode;
      var replacement = buildWatchlist();
      grid.replaceChild(replacement, oldPanel);
    }
  }

  function setLocale(locale) {
    if (!supported(locale) || locale === state.locale) return;

    var scrollY = window.scrollY;
    var active = document.activeElement;
    var activeRank = active && active.dataset ? active.dataset.rank : null;
    var activeKind = active && active.dataset ? active.dataset.kind : null;

    state.locale = locale;
    storageSet(STORE_KEYS.lang, locale);

    applyTranslations();
    refreshGenerated();

    /* Keep the keyboard where it was if a toggle had focus. */
    if (activeRank !== null && activeKind !== null) {
      var again = document.querySelector(
        '.toggle[data-rank="' + activeRank + '"][data-kind="' + activeKind + '"]'
      );
      if (again) again.focus();
    }
    window.scrollTo(0, scrollY);
  }

  /* ------------------------------------------------------------- events */

  /* The sticky bar's real height is not a constant: its borders add to the
   * declared minimum, it carries a row of rank targets that grows with the
   * list, and the narrow layout stacks the counters above them. Anchors are
   * offset by a custom property measured from the rendered bar, so a target
   * scrolled to never lands underneath it. Measured rather than assumed, so
   * adding entries cannot silently reintroduce the overlap. */
  function syncJumpbarOffset() {
    var bar = document.querySelector('.jumpbar');
    if (!bar) return;
    var height = Math.round(bar.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty('--jumpbar-actual', height + 'px');
    }
  }

  function bindEvents() {
    state.langButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setLocale(button.dataset.setLang);
      });
    });

    document.addEventListener('click', function (event) {
      var toggle = event.target.closest ? event.target.closest('.toggle') : null;
      if (!toggle) return;
      var rank = Number(toggle.dataset.rank);
      var kind = toggle.dataset.kind;
      var map = kind === 'seen' ? state.seen : state.want;
      var key = kind === 'seen' ? STORE_KEYS.seen : STORE_KEYS.want;

      if (map[rank]) {
        delete map[rank];
        toggle.setAttribute('aria-pressed', 'false');
      } else {
        map[rank] = true;
        toggle.setAttribute('aria-pressed', 'true');
      }
      saveRanks(key, map);
      renderCounters();

      var panel = document.getElementById('watchlist');
      if (panel && panel.parentNode) {
        panel.parentNode.replaceChild(buildWatchlist(), panel);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.activeElement) {
        document.activeElement.blur();
      }
    });

    window.addEventListener('resize', syncJumpbarOffset);
  }

  /* --------------------------------------------------------------- boot */

  function init() {
    state.seen = loadRanks(STORE_KEYS.seen);
    state.want = loadRanks(STORE_KEYS.want);
    state.locale = resolveLocale();

    state.langButtons = Array.prototype.slice.call(
      document.querySelectorAll('[data-set-lang]')
    );

    state.bindings = [];
    collectI18nNodes();
    renderAll();
    applyTranslations();
    bindEvents();

    document.documentElement.setAttribute('data-ready', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();