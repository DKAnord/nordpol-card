# Changelog

All notable changes to Nordpol Card are documented here. Dates are in Europe/Copenhagen.

## 2.6.0 – 2026-11-28

- **1-View Cycle Mode (`cams.view: "cycle"` / `#viewbtn`):** Toggle between the classic 4-view CCTV wall (`view: "grid"`, default) and a single-screen 4-scene cycle view (`view: "cycle"`) with dual-`<video>` background preloading, `1..4` scene dots, visual-editor support (`nordpol-board-card` & `nordpol-cam-card`), and 12 dedicated 25-second perspective-shifted clips (`cycle1..4_{morning,day,evening}.mp4`, with automatic fallback to `cam1..4_*`).
- **Letter-to-Santa Live Mailroom Spotlight (`#ltrbtn`, `triggerLetter({ child, text })`, `cams.letter_cue`):** Added an in-card wish composer dialog and programmatic `triggerLetter` hook across all 14 languages; highlights CAM 03 Mailroom, plays a dedicated 25-second pneumatic-tube arrival clip (`mailroom_letter.mp4`), and unfolds an XSS-safe aged-parchment overlay showing the wish + `★ RECEIVED · NORTH POLE ★` stamp timed to the wax stamper (`cams.letter_cue`).
- **Card UX & Advent History:** Added visible `✈️ Test flight` / `⏹` toggle button (`#demobtn`), drag-safe `#holdpill` Parent Mode button, visible `NordpolElf` header in tab mode, gift-tag joke reveal pill, December Advent history (`◀ / ▶ / Today` + `⭐ done/24`), cam buffering & hover expand indicators, and desktop typography/flex refinements.
- **Standalone Public Web App (`web/`):** Zero-build PWA live at [nordpol.pages.dev](https://nordpol.pages.dev/) and GitHub Pages (`LocalStorageBackend`, 14-language Settings drawer including grid/cycle view toggle, Santa's Mailroom Postbox + Parent Inbox, printable Nice List certificate, clickable city picker, optional Web Audio chimes, offline QR sharing, and optional cookie-free visitor counter).

## 2.5.1 – 2026-11-22

- **Languages:** Added built-in **Hungarian (`hu`)** — card strings, visual-editor labels, helpers and dropdown options, 16 sleigh-route country names, and 30 localized elves (jokes and daily tasks). Auto-detected from `language: hu`, `<html lang="hu-HU">` or a Hungarian browser; dates and numbers use `hu-HU` (“december 24.”).
- Countdown default for `hu` is `12-24 18:00` (Szenteste), like `da`/`de`/`sv`/`nb`/`fi`/`pl`/`cs`.
- Local touches: the nice list is *A Mikulás aranykönyve*, a naughty score means *virgács* in the boot, Jézuska brings the presents on Szenteste, and the elves follow the Hungarian December (boots in the window on 5 December, Mikulás on 6 December, Luca-búza on 13 December, bejgli on 23 December, the bell on Szenteste; szaloncukor, halászlé and the Budapest Christmas fair in the sleigh news).
- Example: `examples/dashboard.hu.yaml`.
- Tests: Hungarian added to every language loop (editor labels/helpers, placeholders/HTML, list lengths, all-cards render, elf date format, fallback editor placeholder), plus new checks for `langOf` auto-detect (config, `<html lang>`, `navigator.language`), the `hu` countdown default, `hu-HU` date labels, `LANG_OPTS`/overlay/CCTV options for every language, and long Hungarian words at 320 px (longest elf name, sleigh in flight, after Christmas, board tabs).

## 2.5.0 – 2026-11-21

- **Languages:** Added built-in **Norwegian Bokmål (`nb`)**, **Dutch (`nl`)**, **Finnish (`fi`)**, **Polish (`pl`)**, **Italian (`it`)**, **Portuguese (`pt`, European)** and **Czech (`cs`)** — card strings, visual-editor labels and helpers, 16 sleigh-route country names, and 30 localized elves (jokes and daily tasks) per language.
- Auto-detect: `nb` also matches browser/HA prefixes `no` and `nn`. Countdown default remains `12-24 18:00` for `nb`/`fi`/`pl`/`cs`, and `12-25 00:00` for `nl`/`it`/`pt` (same mechanism as existing `fr`/`es`). Celebration date `date` still defaults to `12-24` unless set, matching `fr`/`es`.
- Examples: `examples/dashboard.nb.yaml`, `.nl.yaml`, `.fi.yaml`, `.pl.yaml`, `.it.yaml`, `.pt.yaml`, `.cs.yaml`.
- Translation review of the seven new language packs: tighter, more faithful wording where meaning had drifted; native jokes where English puns did not carry; local gift-bringer names in UI strings (Julenissen, Kerstman, Joulupukki, Święty Mikołaj, Babbo Natale, Pai Natal, and Czech **Ježíšek** in place of Santa); and a few local Christmas-tradition touches in elves, daily tasks and sleigh news.
- Visual editor: camera overlay and CCTV filter dropdown labels are now translated per language. `nordpol-board-card` reports `getGridOptions()` like the other cards (`columns: "full"`, `rows: "auto"`).
- Docs: added this changelog, refreshed the publishing checklist, documented the hosted cam clips in the JS header, and pinned `hacs/action` to a commit SHA.

### Fixes (2.5.0)

- **Countdown fits narrow columns and 320 px phones:** digits, labels and the nights pill scale with the card width (container query units), so nothing is clipped in 1/3 columns, Sections, or on small phones (all 13 languages, 3-digit day counts).
- **Countdown is right when the browser and the configured time zone disagree on DST** (e.g. a tablet in New York or Sydney showing Copenhagen time in late October or March). It was off by 1–2 h; the target is now computed as an absolute instant in the configured zone. The sleigh progress uses the same instant.
- **Nice list keeps every tap:** quick taps (or a slow Home Assistant) no longer lose points (+1 +1 now gives 82, not 81), every tap gets its log line, the `📜 log` item is created only once, and a failed write shows the error banner and rolls back instead of failing silently.
- **No more 404s from the cam card:** a default install used to probe 24 missing `/local/nordpol/*.mp4` files on every load (console errors, slower start). The hosted clips are now used directly; local probes happen once per clip only when you opt in, with in-flight de-duplication and a bounded 10-minute recheck.
- **Live config changes apply immediately** on a mounted card: switching the nice list `store` re-subscribes, `snow` follows setConfig, and the elf card shows its `entity` right away.
- **Christmas week is consistent across cards:** hero, sleigh and elf now agree on when the celebration and the after-Christmas window start and end (24/25/26 December, New Year, a custom `date` such as `01-07`), in the configured time zone.
- **Elf of the day date label** no longer switches format on 25 December (“December 25” stays “December 25”, not “25 December”).
- **Visual editor:** the countdown hint in the fallback board editor shows the right default for `nl`/`it`/`pt` (`12-25 00:00`) and for custom dates.
- **Card picker and editor previews are quiet:** no page-wide snow, no video downloads and no file probes from the preview tiles.
- **Accessibility:** respects *reduce motion* (no snow, twinkle, wobble, glitch, blinking or noise animation); keyboard access with Enter/Space for the nice-list title (parent mode), sleigh title (demo), elf joke and task, and cam tiles; fullscreen cams are a focused dialog that closes with Esc; the countdown is a timer and the board tabs a tab list for screen readers.
- **Helper package** (`helpers/nordpol_package.yaml`): `script.nordpol_give_points` was rejected by Home Assistant at startup (`selector: { text: {} }`), and both scripts wrote the log to `input_text.nordpol_elf_log`, which the card only reads with `log_entity`. They now write to the `📜 log` to-do item by default (optional `log_entity` field for the input_text variant). Tested in a real Home Assistant.

### Changed (2.5.0)

- **Your own cam clips need `cams.prefer_files: true`.** Local `/local/nordpol` clips are no longer looked for automatically (that caused the 404s above). Set `prefer_files: true` (local first, hosted fallback) or `remote: false` (local only, never contacts github.io). Setting `file_dir` or a cam `file` also turns local clips on.
- `hacs.json` declares the minimum Home Assistant version: `2024.8.0`.
- README: privacy note about the github.io clips and how to opt out, and documentation for `cams.remote`, `remote_dir`, `prefer_files`, `fill_lost`, `lost_label`, `period_labels`, board `min_version`, and `nice.log_entity`.
- Tests: new behaviour suite (`tests/behavior.html`, run by `node tests/run.mjs`) with a fake Home Assistant and clock, run under Copenhagen, New York and Sydney time zones, at 320 px, and with reduced motion; `tools/check_elves.py` asserts the elf lists match `tools/elves_data.py`; `tests/ha/test_helpers.py` runs the helper package in a real Home Assistant. All three run in CI.

## 2.4.5 – 2026-11-21

- Added Swedish (`sv`) translation (card strings, visual editor, sleigh country names, 30 elves) — thanks @CrallH ([#1](https://github.com/DKAnord/nordpol-card/pull/1)).

## 2.4.4 – 2026-11-20

- Default 4 cams, stricter hosted-video probe (require a `video/*` content type), visual-editor Nice list hint, and a simplified Marketplace-first README.
- (From the same window:) headless browser test suite in CI.

## 2.4.3 – 2026-11-20

- Serve hosted cam clips via GitHub Pages with a `video/mp4` content type, so they play on iOS/Safari.

## 2.4.2 – 2026-11-20

- Home Assistant graphical card configuration (`getConfigForm` / board visual editor) and Marketplace/HACS prep.

## 2.4.1 – 2026-11-20

- Responsive typography, cam overlay sizing, and a strings-escaping fix.

## 2.4.0 – 2026-11-20

- Added full built-in French (`fr`), German (`de`), and Spanish (`es`) translations across all cards, the visual editor, sleigh radar country names, and 30 localized elves per language.
- Countdown, camera clock/periods, and elf calendar respect `time_zone` (falling back to Home Assistant's `time_zone`, then the browser). Visual editor field for `hero.target`. Default countdown target `12-25 00:00` for `fr`/`es`, `12-24 18:00` otherwise (or `00:00` when a custom `date` is set). Top-level `target` and `time_zone` on the board card are forwarded to child cards.
- Added `examples/dashboard.fr.yaml`, `.de.yaml`, and `.es.yaml`.
