# Changelog

All notable changes to Nordpol Card are documented here. Dates are in Europe/Copenhagen.

## 2.5.0 – 2026-11-21

- **Languages:** Added built-in **Norwegian Bokmål (`nb`)**, **Dutch (`nl`)**, **Finnish (`fi`)**, **Polish (`pl`)**, **Italian (`it`)**, **Portuguese (`pt`, European)** and **Czech (`cs`)** — card strings, visual-editor labels and helpers, 16 sleigh-route country names, and 30 localized elves (jokes and daily tasks) per language.
- Auto-detect: `nb` also matches browser/HA prefixes `no` and `nn`. Countdown default remains `12-24 18:00` for `nb`/`fi`/`pl`/`cs`, and `12-25 00:00` for `nl`/`it`/`pt` (same mechanism as existing `fr`/`es`). Celebration date `date` still defaults to `12-24` unless set, matching `fr`/`es`.
- Examples: `examples/dashboard.nb.yaml`, `.nl.yaml`, `.fi.yaml`, `.pl.yaml`, `.it.yaml`, `.pt.yaml`, `.cs.yaml`.
- Visual editor: camera overlay and CCTV filter dropdown labels are now translated per language. `nordpol-board-card` reports `getGridOptions()` like the other cards (`columns: "full"`, `rows: "auto"`).
- Docs: added this changelog, refreshed the publishing checklist, documented optional hosted cam clips in the JS header (local files still win), and pinned `hacs/action` to a commit SHA. `hacs.json` now has `"render_readme": true`.

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
