# AlgoLab v22 Audit Notes

## Changes
- Replaced forced Cambria typography with a standard system UI stack: Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif. Code examples retain their monospace editor styling.
- Rebuilt the complexity panel as clearly separated Best time, Average time, Worst time, and Auxiliary space cards.
- Added algorithm-specific special-case notes for all nine sorting algorithms, including input-shape effects, key-range/digit assumptions, stability, and auxiliary-space caveats.
- Added dedicated light- and dark-theme text/background colours for all complexity metrics and special-case notes to avoid white-on-white text.
- Corrected Bubble Sort best-case label to O(n²) for this particular simulator because its implementation does not early-exit; the note explains that an optimized variant can achieve O(n).

## Validation
- `node --check src/app.js` passes.
- Static checks confirm nine algorithm special-case notes, four complexity metrics, theme-specific contrast rules, and standard web typography.
- ZIP integrity checked after packaging.
- No pixel-level browser screenshot test is claimed.

## AlgoLab v27 — Dynamic Programming Lab

### Changes
- Integrated the supplied Dynamic Programming visualizer into the AlgoLab landing page as an available lab.
- Added a persistent left-side navigation matching the existing Greedy Lab sidebar, with direct access to all nine algorithms.
- Preserved the supplied interactive visualizers for 0/1 Knapsack, Longest Common Subsequence, Longest Increasing Subsequence, Matrix Chain Multiplication, Bellman–Ford, Floyd–Warshall, Edit Distance, Kadane’s Algorithm, and Egg Dropping.
- Added a theory, use-cases, when-to-avoid, implementation-note, time/space complexity, and code section for every algorithm.
- Added a code-language selector for C, C++, Python, Java, and JavaScript to each theory section.
- Kept the existing Sorting, Tower of Hanoi, and Greedy labs intact.

### Validation
- `node --check` passes for `src/app.js`, `algorithms.js`, `greedy-learning.js`, `dp-algorithms.js`, and `dp-learning.js`.
- Automated checks confirm nine sidebar links, nine visualizer panels, nine theory sections, nine overview cards, all five language options, and working theory language-selector rerender callbacks.
- HTML parsed successfully and ZIP archive integrity was checked.
- A full browser interaction test could not be run in this environment because the browser launch was blocked by the execution environment; no browser-test pass is claimed.


## v28 — Backtracking Lab integration
- Added `backtracking.html`, `backtracking-algorithms.js`, and `backtracking-learning.js`.
- Integrated six visualizers from the user-provided files: N-Queens, Rat in a Maze, Sudoku, Graph Coloring, Hamiltonian Cycle, and Subset Sum.
- Added left sidebar navigation consistent with Greedy and DP labs.
- Added theory, use cases, when-to-avoid notes, implementation notes, complexity, and C/C++/Python/Java/JavaScript examples for all six.
- Added a landing-page card and reset cleanup for logs/results.
- Validation: syntax and ZIP integrity checks performed; no browser-based interaction test performed.


## v29 — Branch and Bound integration
- Added `branch-bound.html` using the same AlgoLab sidebar, per-algorithm theory panels, complexity metrics, and five-language selector order (C, C++, Python, Java, JavaScript).
- Added the supplied interactive Branch and Bound visualizers for Traveling Salesperson and 0/1 Knapsack.
- Added `branch-bound-algorithms.js`, `branch-bound-learning.js`, and the Branch and Bound catalog card.
- Snippet notes identify required helper bound functions; snippets are instructional templates, not standalone compilable programs.


## v30 — Graph Exploration & Network Topology
- Added `graph.html`, `graph-algorithms.js`, and `graph-learning.js` from the supplied graph visualizer.
- Integrated seven graph algorithms with Play, Next Step, Reset, adjustable speed, progress, status, event log, result display, sound and completion confetti.
- Added theory, use cases, when-to-avoid notes, special cases, complexity and code selectors for C, C++, Python, Java, and JavaScript to all seven algorithms.
- Added AlgoLab sidebar navigation and linked Graph Algorithms from the landing catalog.
- Fixed per-step render cleanup so logs accumulate during playback instead of being cleared on every step.
- Existing Sorting, Tower of Hanoi, Greedy, Dynamic Programming, Backtracking, and Branch and Bound labs preserved.


## v30 — Graph Exploration & Network Topology
- Added `graph.html`, `graph-algorithms.js`, and `graph-learning.js` from the supplied graph visualizer.
- Integrated seven graph algorithms with Play, Next Step, Reset, adjustable speed, progress, status, event log, result display, sound and completion confetti.
- Added theory, use cases, when-to-avoid notes, special cases, complexity and code selectors for C, C++, Python, Java, and JavaScript to all seven algorithms.
- Added AlgoLab sidebar navigation and linked Graph Algorithms from the landing catalog.
- Fixed per-step render cleanup so logs accumulate during playback instead of being cleared on every step.
- Existing Sorting, Tower of Hanoi, Greedy, Dynamic Programming, Backtracking, and Branch and Bound labs preserved.

## v31 UI consistency update (2026-10-09)
- Added `design-system.css` as a shared visual layer across all eight HTML pages, using the Sorting Lab's Inter/Segoe UI/Arial stack, 14px body baseline, 1.45 base line-height, navy/blue palette, and consistent heading scale.
- Added persistent Light/Dark theme controls to the landing page and all interactive labs. The Sorting Lab continues using its existing theme control; all pages share the `algolab-theme` local-storage key.
- Added shared accessible focus indicators, reduced-motion handling, improved explanatory text spacing, and higher-contrast light-theme surfaces and secondary text.
- Existing algorithm pages and visualizer scripts are retained; this update is a presentation/theme layer.
- Validation: Node syntax checks passed for the shared theme script and project JavaScript files; HTML references and CSS brace balance checked. Browser-based smoke test could not run in the current environment because Chromium navigation to both `file://` and localhost was blocked by the environment.


## v32 — String Matching Lab integration

- Added `string-matching.html` and `string-matching-algorithms.js` based on the supplied interactive visualizer.
- Integrated the lab into the AlgoLab catalog as an available module, replacing the planned String Algorithms card.
- Added shared typography and persistent theme support; retained the five supplied visualizers: Naive, KMP, Rabin–Karp, Boyer–Moore, and Aho–Corasick.
- Validation: JavaScript syntax, HTML/script references, referenced element IDs, and ZIP integrity checked. Browser navigation testing remains limited by the environment restrictions recorded for v31.


## v36 update — String Matching theory
- Added per-algorithm Theory, Complexity & Code learning panels for Naive, KMP, Rabin–Karp, Boyer–Moore, and Aho–Corasick.
- Each panel includes the core idea, steps, use cases, limitations, implementation notes, complexity metrics, and language selector (C → C++ → Python → Java → JavaScript).
- Added `string-matching-learning.js`; retained all v35 visualizer files and existing page design.

## v37 — Advanced Data Structures theory + shared typography
- Added dedicated AlgoLab-format learning panels to all five Advanced Data Structures modules: AVL trees, Red-Black trees, DSU, Segment/Fenwick Trees, and Tries.
- Each panel includes concept/theory, when to use, when to avoid, complexity, implementation sketch, and a language selector in C → C++ → Python → Java → JavaScript order.
- Standardized typography on all module pages to the same Inter/system font stack used by the landing page, preserving code-editor/visualizer monospace styling and each page's layout hierarchy.
- Validation: JavaScript syntax checks passed; all five theory containers and the language options verified; referenced local assets checked; ZIP integrity passed. Live browser interaction testing was not completed.

## v38 — Cryptography & Mathematical Algorithms integration
- Added `cryptography-math.html` from the supplied interactive visualizer and renamed its script to `cryptography-algorithms.js` to avoid overwriting the existing sorting `algorithms.js`.
- Added the Cryptography & Mathematical Algorithms card to the landing catalog.
- Added six theory-and-code learning sections: Euclidean GCD, Sieve of Eratosthenes, Modular Exponentiation, RSA, AES, and SHA-256/MD5.
- Each section includes explanation, steps, use cases, limitations/security cautions, complexity, and a C/C++/Python/Java/JavaScript code selector with indented snippets.
- Matched interface typography to the landing page's Inter/Segoe UI/Arial stack while retaining monospace typography for code and algorithm values.
- Validation: both new JavaScript files passed `node --check`; all six learning hosts and panels were verified; ZIP integrity checked after packaging. Browser interaction/rendering was not tested.


## v41 — Advanced Network Flows & Approximation integration
- Added standalone advanced-network-flows.html with Ford–Fulkerson, Edmonds–Karp, Vertex Cover approximation and Greedy Set Cover visualizers from user-supplied files.
- Added four theory and complexity sections with code-language selectors (C, C++, Python, Java, JavaScript) and indented code skeletons.
- Added the new module card to the landing page.
- Normalized module UI font family to Inter / Segoe UI / Arial to match the landing page.
- Static JavaScript syntax, HTML structure, and ZIP integrity checks performed; no live browser interaction test.


## v42 shared-shell consistency pass
- Preserved `index.html` and `sorting.html` unchanged.
- Added shared responsive navigation, active-page indication, theme control, and the shared typography/design-system stylesheets to every other existing HTML learning lab.
- Kept original module markup and algorithm scripts in place.
- Automated structural checks completed; browser rendering/interaction has not been performed.


## v43 structural repair (12 Oct 2026)
- Removed duplicate module sidebars from Greedy, Dynamic Programming, Graph, Backtracking, and Branch-and-Bound pages; their original algorithm navigation controls now live in the single shared sidebar.
- Centralized the shared shell CSS in design-system.css so it is applied consistently on all non-index/non-sorting lab pages.
- Removed the Sorting Lab `.main` class from the outer wrapper to prevent unintended width/padding conflicts from style.css.
- Removed the duplicate theme button on Tower of Hanoi; retained its original header theme control.
- `index.html` and `sorting.html` remain unchanged from v42.
- Static and runtime checks are listed in the release notes; live visualizer behavior still requires browser QA.
- Browser-runtime smoke tests were run in an isolated Chromium page context for all 10 non-index/non-sorting labs: theme toggle, navigation controls, and no JavaScript page errors.
- Responsive-width checks at 390px found no document/body horizontal overflow in those 10 labs.
- Fixed Dynamic Programming table-cell addressing so updates are scoped to the selected algorithm panel; replaced duplicate generated cell IDs with scoped `data-cell` attributes.
- Corrected the overly broad `.home .tag` selectors on seven pages so card badges no longer inherit the page tagline's large bottom margin.
- Removed the global Sorting stylesheet from non-Sorting labs to prevent unrelated generic selectors (`.card`, `.logo`, `.main`, etc.) from overriding each module's own layout.
- Added light-theme contrast fixes for the Greedy, DP, Graph, Backtracking, and Branch-and-Bound theory cards and sidebar notes.


## v44 — Searching Algorithms and implementation-code consistency
- Added `searching.html` and `searching-algorithms.js` from the user-provided searching visualizer source, retaining its 12 visualizers and step controls.
- Added theory, complexity and five-language implementation panels for all 12 search methods.
- Added Searching Algorithms to the landing-page catalog and shared side navigation.
- Added the shared sidebar and theme control to the Searching lab, with light/dark styles for its visualizer surfaces.
- Standardized implementation code typography, indentation, scrolling containers, and language selector styling across learning labs; normalized implementation section headings where they differed.
- Validation: all project JavaScript files pass `node --check`; HTML parser, duplicate-ID, link-target, and ZIP integrity checks run before packaging. Browser smoke test attempted but Chromium did not terminate within the available execution window, so no claim of completed interactive browser QA is made.


## v45 — Foundational Data Structures module
- Added `data-structures.html` from the supplied interactive visualizer source.
- Added the paired implementation script as `data-structures-algorithms.js` to avoid collisions with the existing sorting `algorithms.js`.
- Added a Data Structures landing-page card; updated the existing Searching Algorithms card to reflect its available lab.
- Kept the existing landing page and other algorithm modules intact apart from the two catalog-card updates.
- Static validation performed; live browser interactions still require manual QA.


## v46 — Cross-page consistency and catalog audit (2026-10-13)
- Removed the duplicate Searching Algorithms landing-page card; retained one canonical card linking to `searching.html`.
- Renumbered the 13 unique catalog cards sequentially and consistently.
- Added Data Structures to the shared navigation on all shared-shell learning pages.
- Integrated the new Data Structures page with the shared responsive navigation, active-page state, theme control, typography layer, and a home link; added initial light-theme surface adjustments without changing its visualizer logic.
- Corrected the signed 32-bit integer range label to `−2³¹` through `2³¹−1`.
- Static checks: syntax, links/scripts, IDs, catalog uniqueness/order, navigation coverage, HTML parsing and ZIP integrity. Live browser QA is reported separately in the release summary.

- Follow-up content review: corrected int32 range and two's-complement wording, clarified ASCII as 7-bit, qualified Boolean storage representation, improved IEEE-754 field terminology, removed a repeated Tower of Hanoi rules list, and made its page title a semantic H1. Shared navigation is now in the same 13-item order on every learning page.


## v47 — Cross-page interactivity enhancement (2026-10-13)
- Fixed a structural defect in `branch-bound.html`: an extra closing `</div>` at line 200 unbalanced the layout tree (depth dropped to −1); removed the stray tag.
- Added `enhance.js` and `enhance.css`, injected into all 14 HTML pages (one stylesheet link in `<head>`, one deferred script before `</body>`). Both files are loaded alongside the existing per-page scripts; no existing script was modified except the two structural/consistency fixes below.
- Command palette on `Ctrl+K` or `/`: groups Labs, This page, and Actions; arrow-key navigation; `Enter` runs; filter-as-you-type; `Esc` closes. Page-scoped items are built from each lab's `[data-a]` algorithm cards/nav buttons, with a shared `algoTitle()` helper that skips icon spans so titles resolve to the algorithm name rather than an emoji.
- Keyboard shortcuts per page type: visualizer labs — `Space` play/pause, `→`/`S` step, `R` reset, `N` next, `Esc` back, `1–9` jump to algorithm, `[`/`]` previous/next, `M` mute, `T` theme; Sorting (`src/app.js` owns its own key handling) — digits and `[`/`]` only to avoid double-binding; Hanoi — `S` solve, `U` undo, `H` hint, `3–8` disk count; Landing — `1–9` open catalog cards. `aria-keyshortcuts` added to the play/step/reset controls.
- Global sound toggle wrapping `beep`/`sfxStep`/`sfxGood`/`sfxDone`/`sfxBad` when present; state persisted in `localStorage` under `algolab-sound`. Floating action buttons (Search / Keys / Sound / Back-to-top) injected on every page.
- Progress tracking per page in `localStorage` under `algolab-progress` with explored badges on cards and sidebar entries, a `al-labprog` counter, and a landing-page Resume chip using `algolab-last` and `?algo=N` deep links.
- Mobile sidebar collapse toggle; one-time hint chip; landing hero live bubble-sort bars with click-to-shuffle; `data-al-ready` and `data-al-page` attributes set on `<html>` for test hooks.
- Copy buttons added to all `<pre><code>` blocks via a MutationObserver plus a clone-and-strip fallback (button text excluded from the copied source).
- CSS covers fabs, toasts, palette, help overlay, copy buttons, explored markers, progress bars, mobile nav, and reduced-motion, with light-theme overrides and responsive breakpoints at 900px/520px.
- Validation: `node --check` passes on all 25 project JavaScript files; HTML parse, duplicate-ID, and local-reference checks pass on all 14 pages; catalog remains 13 unique cards in order; shared navigation remains 13-link on all learning pages; headless Edge smoke test initializes `data-al-ready` with zero uncaught errors on all 14 pages; a 21-assertion functional suite and a 16-assertion greedy-lab integration suite both pass, covering palette open/filter/close, keyboard dispatch, progress recording, resume title, mute wrapping, and copy injection.
- Transient verification scripts (`_check.ps1`, `_inject.ps1`, `_smoke.ps1`, `_test.html`, `_itest.html`) were used during development and removed before delivery.

## v48 sorting unification (2026-10-13)
- Rebuilt `sorting.html` into the shared-shell architecture (`.shared-shell`, `.shared-sidebar`, `#sharedMainContent`, shared 13-link `#sharedAlgoLabNav`, `SORTING ALGORITHMS` divider with 9 `data-a` sort-nav buttons, `#themeToggle`), matching the pattern used by greedy/dp/graph.
- Home screen (`#homeScreen`, 9 `.card[data-a]` tiles) plus per-algorithm screen (`#algoScreen`, panels `#p0`—`#p8`) with a single `Sim` instance and one visible panel at a time; deep-link `?algo={n}` and `Esc` home navigation.
- Each panel carries its own controls wired to the shared sim: `#play{n}` (label toggles Play/Pause), `#step{n}`, `#think{n}`, `#reveal{n}`, `#reset{n}`, `#newarray{n}`, `#cust{n}`/`#custbtn{n}`, `#spd{n}`/`#spdv{n}`, and renders into `#ws{n}` with stats, algorithm-specific special view, color legend, complexity, and a 3-language learning section (`#sortLearn{n}`).
- Removed the GSAP dependency from `sorting.html` and rewrote swap animation (`animateLiveMovement`) with the Web Animations API plus SVG stroke-dashoffset; no GSAP references remain anywhere in the project.
- `enhance.js`: sorting is now a first-class visual lab (`isSortLab`), with the unified keyboard set (Space/arrow step/R/T/1-9/[]/Esc/M//) plus sorting-only `A`=reveal, `K`=think, `X`=new array; dead sorting branches removed from openAlgo/decorate/palette/help/key-handler.
- Fixed quick-sort progress: the engine finishes at `PARTITION_DONE`, so `progressPct()` now computes real array progress (sorted prefix + suffix + in-place cells) with a monotonic high-water mark, landing on 100% at completion.
- Added `id="sharedAlgoLabNav"` to `searching.html` (the only page missing it) for consistency across all learning pages.
- Validation: `node --check` passes on `src/app.js` and `enhance.js`; static suite PASS across all 14 pages (shared-shell conventions, 12-link shared nav with exactly one active+aria-current, no GSAP, all 17 per-index element families present for 9 sort panels); headless Edge smoke 14/14 (all pages set `data-al-ready`, zero uncaught errors, correct `data-al-page` tags); all-9 algorithm functional probe 108/108 (render, step through states, progress advancing to 100%, DONE, reset to IDLE, explanation/complexity/learning/code filled for every algorithm); keys probe PASS (deep-link, A/K/X, Esc, theme toggle, home card, light-theme bars+learning render).
- Temp verification scripts under `%TEMP%\opencode\` were removed before delivery.

## v48b encoding fix (2026-10-13)
- `src/app.js` contained ~434 mojibake sequences (triple-encoded UTF-8 via cp1252 misinterpretation of UTF-8 bytes, 3 rounds). All special characters were corrupted: superscript `�` (O(n�)), middle dot `�`, em-dash `�`, en-dash `�`, `=`, and the `??`/`??` emoji were partially or fully mangled. This produced visible garbage in the learning panel (`ALGORITHM KNOWLEDGE Bubble Sort â€�" Concept, Use & Implementation`) and throughout all status messages, complexity labels, and UI captions.
- Decoded by simulating the inverse: 3 rounds of (UTF-8 bytes ? cp1252 characters), then fixing the two characters not present in cp1252 (`=` at 2 rounds deep, em-dash/en-dash which survived as U+FFFD replacement chars) and restoring the untouched astral emoji. Verified round-trip on the `O(n�)` token (`Ã‚Â²` ? `O(n�)`) before applying.
- Fixed `AUDIT_NOTES.md` and `PAGE_AUDIT_v46.md` (1 U+FFFD each). Verified zero mojibake across all project files after the fix.
- Re-ran all suites after the decode: `node --check` OK; all-9 sort algorithms functional probe 90/90 (render, step, progress to 100%, DONE, reset, explanation/learning/code filled for every algorithm); learning-panel probe PASS (`Bubble Sort � Concept, Use & Implementation` renders correctly, status separator `�`, no mojibake in any text node).

## v48c font + play-button consistency fix (2026-10-13)
- Sorting page rendered in serif Cambria and its Play button showed a mojibake glyph instead of the standard `▶ Play`, diverging from every other lab.
- Font root cause: `style.css` carried legacy v17/v18 `!important` overrides (`html,body,*`, `button,input,select`, `html,body`, `button,input,select,textarea`) forcing `Cambria,Georgia,serif`. Because these sit earlier in the cascade than the later Inter block (`html,body,button,input,select,textarea` at L925), both rules being `!important` meant source order won and Cambria took effect. All five Cambria declarations (L657, L786, L806, L808, L845) were rewritten to the shared Inter stack (`Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif`), matching the other labs and the `algolab-shared-typography` block already present in `sorting.html` head.
- Play-button root cause: leftover mojibake in `src/app.js` L341 set the label to em-dash `—` instead of the real glyphs. Fixed to `⏸ Pause` / `▶ Play` (U+23F8 / U+25B6) so the button matches the other labs and the static markup in `sorting.html`.
- Verification: headless computed-style probe shows `body`, `.nav-item`, and `#play0` all resolve to the Inter stack with zero Cambria hits on sorting; `#play0` text is exactly `▶ Play`. Sorting and greedy both report `data-al-ready=1`, real `▶ Play`, Inter everywhere. Sorting keeps its own accent gradient (cyan→blue) while greedy keeps its accent gradient — same button shape, intentional per-lab accent. Headless smoke 14/14 (all pages `data-al-ready=1`, zero uncaught errors); all-9 sort functional probe passes (9/9 panels open, step advances status, progress reports). `node --check` on `src/app.js` OK.
- Temp probe scripts under `%TEMP%\opencode\` were removed before delivery.

## v49 syntax-highlighting consistency fix (2026-10-13)
- Five code consoles rendered plain black-and-white code while the other seven showed colourful syntax highlighting, because their learning renderers had no `highlight()` function (or, for string-matching, produced token spans with no CSS to colour them).
- Audit result: sorting (app.js `highlightCode`), hanoi, greedy, dp, graph, branch-bound, backtracking were already coloured. Cryptography, advanced-data-structures, advanced-network-flows and searching emitted plain text (no token spans at all); string-matching ran its own `highlight()` but its page had no `.kw/.str/.num/.com` rules, so the spans were invisible.
- Fix: added a shared `code .kw/.str/.num/.com/.fn` token-colour block to `design-system.css` (loaded by every page) using the same palette as the sorting lab (`#c792ea` keyword, `#c3e88d` string, `#f78c6c` number, `#8294a8` comment, `#82aaff` function). Added the proven greedy-style `highlight()` tokenizer to the four plain renderers (cryptography-learning.js, advanced-data-structures-learning.js, advanced-network-flows-learning.js, searching-learning.js) and switched their language `<select>` handlers from `textContent` to `innerHTML=highlight(...)` so switching language re-highlights.
- Verification: `node --check` OK on all four renderers. Headless computed-style probe confirms keyword spans resolve to `rgb(199,146,234)` (#c792ea), strings `rgb(195,232,141)`, numbers `rgb(247,140,108)`, comments `rgb(130,148,168)` on crypto, searching, ADS, ANF and string-matching. Headless smoke 14/14 (all pages `data-al-ready=1`, zero uncaught errors).
- Temp probe scripts under `%TEMP%\opencode\` were removed before delivery.
