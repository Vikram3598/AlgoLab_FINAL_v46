# AlgoLab v46 — Page-by-page audit

## Catalog and navigation
- Removed the duplicate Searching Algorithms card; there is now one card linked to `searching.html`.
- Renumbered all 13 catalog cards sequentially.
- All 12 non-index/non-sorting learning pages now use the same 13-link navigation order, active-page marker, shared typography layer, and theme control.
- `index.html` keeps its distinct landing-page design; `sorting.html` remains the formatting/reference lab.

## Page content inventory

| Page | Content reviewed |
|---|---|
| `index.html` | 13 unique lab cards |
| `sorting.html` | 9 sorting algorithms |
| `searching.html` | 12 searching visualizers + theory/code |
| `greedy.html` | 7 greedy visualizers + theory/code |
| `dp.html` | 9 DP visualizers + theory/code |
| `graph.html` | 7 graph visualizers + theory/code |
| `data-structures.html` | 27 foundational data-structure visualizers |
| `hanoi.html` | Tower of Hanoi simulator + theory/code |
| `string-matching.html` | 5 pattern-matching visualizers + theory/code |
| `backtracking.html` | 6 backtracking visualizers + theory/code |
| `branch-bound.html` | 2 branch-and-bound visualizers + theory/code |
| `advanced-data-structures.html` | 5 advanced-structure visualizers + theory/code |
| `cryptography-math.html` | 6 cryptography/math visualizers + theory/code |
| `advanced-network-flows.html` | 4 flow/approximation visualizers + theory/code |

## Content corrections
- Data Structures: corrected signed 32-bit range and two’s-complement explanation, clarified 7-bit ASCII versus byte storage, and qualified Boolean storage representation.
- Tower of Hanoi: removed duplicated rules and added a semantic H1 heading.
- Shared navigation ordering is now identical across the learning pages.

## Validation results
- JavaScript syntax: all project JavaScript files passed `node --check`.
- HTML parsing: all 14 HTML pages parsed.
- Static IDs: no duplicate IDs detected.
- Local links, stylesheets, and script references: no missing references detected.
- Catalog: 13 unique cards; Searching Algorithms appears once.
- Shared shell: navigation order and theme controls checked across all learning pages.
- Live browser screenshot/interaction test: **not completed**; Chromium did not finish in the available execution window. The validation above is static, not a claim that every visualizer was exercised interactively.

## v47 interactivity enhancement (2026-10-13)
- Fixed stray `</div>` in `branch-bound.html` (unbalanced layout tree).
- Added `enhance.js` + `enhance.css` to all 14 pages: command palette (`Ctrl+K`), page-aware keyboard shortcuts, global mute, copy buttons, per-page progress/resume, floating action buttons, mobile nav toggle, landing hero bars.
- Algorithm titles in the palette/resume chip are extracted via a shared `algoTitle()` helper that skips icon spans (fixes empty/emoji titles on greedy/dp/graph-style nav buttons).
- Headless Edge: `data-al-ready` set and zero uncaught errors on all 14 pages; 21-assertion functional suite and 16-assertion greedy integration suite pass; full static check suite passes.

## v48 sorting unification (2026-10-13)
- `sorting.html` fully rewritten to the shared-shell layout used by the other labs: `.shared-shell` / `.shared-sidebar` / `#sharedMainContent`, shared 13-link `#sharedAlgoLabNav`, `SORTING ALGORITHMS` divider with 9 `data-a` sort-nav buttons, and `#themeToggle`.
- One global `Sim` + one visible panel (`#p0`—`#p8`); home screen with 9 `.card[data-a]` tiles; deep-link `?algo={n}`; `Esc` returns home; switching algorithms stops the sim and creates a fresh one.
- Per-panel controls all wired to the shared sim: play/pause toggle, step, think, reveal, reset, new array, custom array input, speed slider; workspace renders stats, algorithm-specific special view, color legend, complexity, and a 3-language learning section.
- GSAP removed; swap animation rewritten with Web Animations API + SVG stroke-dashoffset (`animateLiveMovement`), 720ms cleanup.
- `enhance.js`: sorting is now a visual lab (`isSortLab`) sharing the unified keyboard set plus sorting-only `A`/`K`/`X` shortcuts; dead sorting branches removed from openAlgo/decorate/palette/help/key-handler/ariaControls.
- Fixed quick-sort progress reporting: engine ends at `PARTITION_DONE`, so `progressPct()` now measures real array progress (sorted prefix + suffix + in-place cells) with a monotonic high-water mark, reaching 100% at completion.
- Added `id="sharedAlgoLabNav"` to `searching.html` (the only page missing it).
- Verification: `node --check` on all 25 JS files; static suite PASS across all 14 pages; headless Edge smoke 14/14 (all pages set `data-al-ready`, zero uncaught errors); all-9 sort algorithms functional probe 108/108; deep-link + A/K/X/keys/light-theme probe PASS.

## v48b encoding fix (2026-10-13)
- `src/app.js` had ~434 mojibake sequences from triple UTF-8/cp1252 encoding. Decoded and verified: all `O(n�)`, `�`, `�`, `�`, `=`, and emoji restored. `AUDIT_NOTES.md` and `PAGE_AUDIT_v46.md` also fixed. Zero mojibake across all project files. All test suites re-run and pass (90/90 all-9 algorithms, learning panel renders `Bubble Sort � Concept, Use & Implementation` correctly).

## v48c font + play-button consistency fix (2026-10-13)
- Fixed sorting-page font inconsistency: legacy `Cambria,Georgia,serif!important` overrides in `style.css` were beating the later Inter `!important` block by source order, so sorting rendered serif while other labs used Inter. Rewrote all five Cambria overrides (L657, L786, L806, L808, L845) to the shared Inter stack.
- Fixed sorting Play button: `src/app.js` L341 had leftover mojibake setting the label to `—` instead of the standard glyphs. Now `⏸ Pause` / `▶ Play`, matching the other labs and the static `▶ Play` markup.
- Verified: computed-style probe — sorting `body`/`.nav-item`/`#play0` all Inter, zero Cambria, `#play0` text exactly `▶ Play` (matches greedy). Sorting retains its own cyan→blue accent gradient (intentional). Smoke 14/14, all-9 sort functional 9/9, `node --check` OK. Temp probes deleted.

## v49 syntax-highlighting consistency fix (2026-10-13)
- Unified code-console syntax colouring across all algorithm pages. Previously crypto, advanced-data-structures, advanced-network-flows and searching rendered plain code (no highlighter); string-matching produced token spans but had no CSS so they looked plain. The other seven consoles (sorting, hanoi, greedy, dp, graph, branch-bound, backtracking) were already coloured.
- Added shared `code .kw/.str/.num/.com/.fn` token colours to `design-system.css` and the greedy-style `highlight()` tokenizer to the four plain renderers; language switches now re-highlight via `innerHTML`.
- Verified: `node --check` OK; headless probe shows keyword/string/number/comment spans with the correct computed colours (#c792ea/#c3e88d/#f78c6c/#8294a8) on all five previously-plain pages; smoke 14/14. Temp probes deleted.
