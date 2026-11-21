# 🎅 Nordpol Card

**🇬🇧 English · 🇩🇰 Dansk (Jul / Nisse) · 🇫🇷 Français (Noël / Lutin) · 🇩🇪 Deutsch (Weihnachten / Wichtel) · 🇪🇸 Español (Navidad / Elfo) · 🇸🇪 Svenska (Jul / Tomte) · 🇳🇴 Norsk bokmål (Jul / Nisse) · 🇳🇱 Nederlands (Kerstmis / Kerstelf) · 🇫🇮 Suomi (Joulu / Tonttu) · 🇵🇱 Polski (Wigilia / Elf) · 🇮🇹 Italiano (Natale / Elfo) · 🇵🇹 Português (Natal / Elfo) · 🇨🇿 Čeština (Štědrý den / Elf)**

A self-contained Christmas dashboard for Home Assistant — **no YAML required**:

* ⏳ **Countdown hero** with falling snow
* 📹 **North Pole CCTV wall** — 4 looping elf cams that change by time of day (streams automatically, no downloads needed)
* 🛷 **Sleigh tracker** — live Santa flight to *your* home on Christmas Eve
* ⭐ **Nice list** — kids, scores, parent mode & elf log stored in a Home Assistant Local To-do list
* 🧝 **Elf of the day** — 30 built-in elves (one per day with a joke & daily task) or bring your own
* 🎛️ **Visual UI editor** — configure everything right in Home Assistant’s card editor

![Nordpol Card demo](docs/demo.gif)

---

## Quick Start (3 easy steps)

### 1. Install Nordpol Card
Click below to open Nordpol Card in the Home Assistant Marketplace, install it, and reload your browser:

[![Open your Home Assistant instance and open a repository in the Marketplace.](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=DKAnord&repository=nordpol-card&category=plugin)

<details>
<summary>Other install methods (HACS / Manual)</summary>

* **Home Assistant Marketplace (2026.11+):** *Settings → Marketplace* → search **Nordpol Card** → install and reload the browser.
* **Requirements:** Home Assistant 2024.8 or newer (HACS enforces this). The nice list needs the built-in *Local To-do* integration.
* **HACS (older Home Assistant):** *HACS* → search **Nordpol Card** (or *⋮ → Custom repositories* → `https://github.com/DKAnord/nordpol-card`, type **Dashboard**) → install and reload the browser.
* **Manual:** Copy `dist/nordpol-card.js` to `<config>/www/` and add `/local/nordpol-card.js` (JavaScript module) under *Settings → Dashboards → ⋮ → Resources*.

</details>

### 2. Create your Nice List (1 click)
Create a dedicated **Local To-do** list named **`Nordpol nice list`** (`todo.nordpol_nice_list`) so the Nice List has its own place to store kids, scores, and the elf log (your other to-do lists are never touched):

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=local_todo)

### 3. Add the card (Visual Editor)
1. Create a new dashboard view and set **View type: Panel** *(so the tablet board fills the screen cleanly on phones, tablets, and desktops)*.
2. Click **+ Add Card** → choose **Nordpol: tablet board**.
3. Pick your **Language**, **Sleigh ETA**, and **Nice list** to-do entity in the visual editor and click **Save**.

All 12 North Pole cam videos and your Home Assistant location & time zone work automatically out of the box.

> [!TIP]
> **Hidden controls for parents:**
> * **Nice list:** Press and hold the **Nice list** title for **1 second** to unlock **Parent Mode** (add/edit children, award ⭐/+5/−5 points, or reset).
> * **Sleigh tracker:** Press and hold the **Sleigh tracker** title for **1 second** to launch a **test flight** any day of the year.

---

### Screenshots

| Sleigh tracker | Nice list | Elf of the day |
|---|---|---|
| ![Sleigh](docs/screenshot-sleigh.png) | ![Nice list](docs/screenshot-nice.png) | ![Elf](docs/screenshot-elf.png) |

---

## Quick Tips & Troubleshooting

* **Layout looks zoomed or cut off on mobile?** Make sure your dashboard view is set to **View type: Panel** (edit the view tab → *View type → Panel (1 card)*).
* **Just updated and don't see changes?** Clear your browser cache, or in the Home Assistant Companion App go to *Settings → Companion App → Troubleshooting → Reset frontend cache*.
* **Want to use standalone cards instead of the full board?** All 6 cards (hero, cams, sleigh, nice list, elf, and tablet board) work standalone in any view with full visual editor support.

---

## YAML Setup & Example Dashboards

Prefer YAML? Paste one of the ready-made dashboards into **Raw configuration editor**:
[English](examples/dashboard.yaml) · [Danish](examples/dashboard.da.yaml) · [French](examples/dashboard.fr.yaml) · [German](examples/dashboard.de.yaml) · [Spanish](examples/dashboard.es.yaml) · [Swedish](examples/dashboard.sv.yaml) · [Norwegian](examples/dashboard.nb.yaml) · [Dutch](examples/dashboard.nl.yaml) · [Finnish](examples/dashboard.fi.yaml) · [Polish](examples/dashboard.pl.yaml) · [Italian](examples/dashboard.it.yaml) · [Portuguese](examples/dashboard.pt.yaml) · [Czech](examples/dashboard.cs.yaml)

```yaml
type: custom:nordpol-board-card   # best inside a Panel view
language: en                      # en | da | fr | de | es | sv | nb | nl | fi | pl | it | pt | cs
cams:
  cams:
    - label: "CAM 01 – REINDEER PADDOCK"
    - label: "CAM 02 – TOY WORKSHOP"
    - label: "CAM 03 – MAILROOM"
    - label: "CAM 04 – BAKERY"
nice:
  store: todo.nordpol_nice_list   # dedicated Local To-do list
elf: {}
sleigh: { eta: "23:59" }
```

## Advanced & Offline Options

<details>
<summary>Offline cam videos, HA automations, custom location & custom elves</summary>

* **Offline / custom cam videos:** All 12 clips stream automatically, so you don't need to download anything. If you want local/offline copies in `<config>/www/nordpol/`, set `cams.prefer_files: true` (or `cams.remote: false` for fully offline), then run this in the HA **Terminal & SSH** add-on (or download from [Release v2.1.0](https://github.com/DKAnord/nordpol-card/releases/tag/v2.1.0)):
  ```bash
  mkdir -p /config/www/nordpol && cd /config/www/nordpol && \
  curl -LO https://github.com/DKAnord/nordpol-card/releases/download/v2.1.0/nordpol-videos-cam1-2.zip && \
  curl -LO https://github.com/DKAnord/nordpol-card/releases/download/v2.1.0/nordpol-videos-cam3-4.zip && \
  unzip -o nordpol-videos-cam1-2.zip && unzip -o nordpol-videos-cam3-4.zip && rm -f nordpol-videos-cam*.zip
  ```
  See [docs/VIDEOS.md](docs/VIDEOS.md) for customising periods or generating your own clips.
* **Automations:** Add [`helpers/nordpol_package.yaml`](helpers/nordpol_package.yaml) (Home Assistant 2024.8 or newer) if you want to award nice points from HA scripts or automations: `script.nordpol_give_points` (`child`, `points`, optional `reason`) and `script.nordpol_reset_nice_list` (optional `start`). They write the elf log to the same place the card reads it: the completed `📜 log` item in the nice list. If your card uses `log_entity: input_text.nordpol_elf_log`, pass `log_entity: input_text.nordpol_elf_log` to the scripts as well.
* **Sleigh home:** Defaults to your Home Assistant location and time zone. Override with `sleigh.home`.
* **Advanced YAML keys preserved:** Keys like `cams.cams`, `strings`, `sleigh.home`, `extra_stops`, and custom `elves` are preserved untouched when using the visual editor.

</details>

## Privacy: hosted cam clips

By default the cam card streams its 12 clips from `https://dkanord.github.io/nordpol-card/media/` (GitHub Pages). Each viewer's browser then contacts GitHub, which can see the viewer's IP address and user agent, like any website. Nothing from Home Assistant is sent, and the card has no tracking or analytics.

To opt out, download the clips (see *Advanced & Offline Options*) and set:

```yaml
cams:
  remote: false        # never contact github.io; play only /local/nordpol clips (shows "signal lost" if one is missing)
```

Use `prefer_files: true` instead if you want local clips first with the hosted clips as a fallback. You can also point `remote_dir` at your own server.

## Individual Cards

| Card | Type | Visual editor options |
|---|---|---|
| Tablet board | `custom:nordpol-board-card` | `language`, `default_tab`, `date`, `hero.target`, `sleigh.eta`, `nice.store`, `cams.overlay`, `cams.cctv_style`, `home_button.path`, `time_zone`, `hero.snow` |
| Countdown hero | `custom:nordpol-hero-card` | `language`, `date`, `title`, `subtitle`, `target`, `until`, `time_zone`, `snow` |
| North Pole cams | `custom:nordpol-cam-card` | `language`, `title`, `overlay`, `cctv_style`, `date_format`, `time_zone`, `footer`, `glitch` |
| Sleigh tracker | `custom:nordpol-sleigh-card` | `language`, `title`, `eta`, `date`, `time_zone` |
| Nice list | `custom:nordpol-nice-card` | `language`, `title`, `store`, `log_entity`, `default_start`, `log_lines` |
| Elf of the day | `custom:nordpol-elf-card` | `language`, `title`, `date`, `time_zone`, `entity` |

## Configuration Reference (Board Card)

<details>
<summary>Full YAML configuration reference</summary>

| Key | Default | Description |
|---|---|---|
| `language` | browser/HA | `en`, `da`, `fr`, `de`, `es`, `sv`, `nb`, `nl`, `fi`, `pl`, `it`, `pt`, or `cs` |
| `strings` | – | override any text |
| `default_tab` / `return_after_min` | `sleigh` / `3` | tab shown, and auto-return time |
| `date` | `12-24` | celebration day as `MM-DD` – e.g. `12-25`, or `01-07` for Orthodox Christmas. Moves the countdown, sleigh flight and elf calendar. Also set `sleigh.eta`, and `hero.until` for the countdown label |
| `time_zone` | HA `time_zone` | IANA time zone (e.g. `Europe/Paris`) used for the countdown, cam clock, and elf calendar (falls back to HA server time zone, then browser local time) |
| `hero.title/subtitle/target/snow` | – | header; `hero.target` (`MM-DD HH:MM` or `HH:MM`) sets the exact countdown target (defaults to `12-24 18:00` for `en`/`da`/`de`/`sv`/`nb`/`fi`/`pl`/`cs`, `12-25 00:00` for `fr`/`es`/`nl`/`it`/`pt`, or `00:00` when `date` is changed) |
| `cams.cams[]` | 4 built-in | `label`, optional `file`, optional fallback `src` |
| `cams.file_dir` / `cams.periods` | `/local/nordpol` / morning, day, evening | see [docs/VIDEOS.md](docs/VIDEOS.md). Setting `file_dir` also turns on local clips |
| `cams.remote` | `true` | `false` = never stream the hosted clips from github.io (see *Privacy*); only local files are played |
| `cams.remote_dir` | `https://dkanord.github.io/nordpol-card/media` | where hosted clips are streamed from (`cam1_morning.mp4` … `cam4_evening.mp4`) |
| `cams.prefer_files` | off | `true` = look for your own clips in `file_dir` first (one quick check per clip, rechecked every 10 minutes), hosted clips are the fallback. Off by default, so a normal install makes no requests to `/local/nordpol`. `false` = never look for local files |
| `cams.fill_lost` / `cams.lost_label` | `true` / `CAM 01 – SANTA'S OFFICE` (translated) | with an odd number of cams, add a "signal lost" tile to fill the grid, and its label |
| `cams.period_labels` | translated | override the period names shown in the header, e.g. `{morning: "AM", day: "Day", evening: "PM"}` |
| `cams.overlay` | `minimal` | `minimal` = REC dot, live date/clock and camera label · `true` / `cctv` = also scanlines, vignette and muted colours · `false` / `off` = clip only |
| `cams.cctv_style` | `color` | only with `overlay: true` / `cctv`: `color` (muted) or `mono` (black & white) |
| `cams.date_format` | `DD-MM-YYYY HH:mm:ss` | tokens `YYYY MM DD HH mm ss` – e.g. `MM/DD/YYYY HH:mm:ss` for US |
| `sleigh.eta` | `23:59` | local time Santa reaches *you* on Dec 24; all other stops shift with it |
| `sleigh.home` | HA location + time zone | `{name, lat, lon, tz}` override |
| `sleigh.extra_stops` / `sleigh.skip_stops` | – | add `{name, lat, lon, utc_offset, local}` or hide named stops |
| `nice.store` / `nice.log_entity` / `nice.default_start` / `nice.log_lines` | `todo.nordpol_nice_list` (if present) / – / `75` / `4` | dedicated to-do list backing the nice list (set explicitly in YAML or the visual editor, or name the list `Nordpol nice list`; `log_lines` sets how many log entries show; the Emoji field also accepts image URLs like `/local/kids/emma.jpg`) |
| `nice.log_entity` | – | where the Elf Log lives. Omitted: a completed to-do item called `📜 log` in the same list (up to 30 lines, no extra helper needed). Set to an `input_text` (e.g. `input_text.nordpol_elf_log` from the helper package) to keep the log there instead, as `line • line • …` up to the helper's `max` length (255) |
| `elf.elves` | 30 built-in | your own list: `[{name, joke, task}, …]`. Day 1…30 of the advent calendar picks entry 1…30 (Dec 1 = entry 1). Jokes are written as `question? answer` |
| `elf.entity` | built-in | optional sensor whose state (`name\|joke\|task`) overrides the elf of the day |
| `home_button` | none | `{label, icon, path}` extra tab that navigates to another dashboard |
| `min_version` | – | board only: if the browser has loaded an older card than this (e.g. `2.5.0`), show a banner and reload (at most twice), so wall tablets pick up an update |

Accessibility: the countdown is exposed as a timer, the board tabs as a tab list, and the nice-list title (parent mode), sleigh title (demo flight), elf joke and task, and cam tiles work with Enter/Space. Fullscreen cams close with Esc. With *reduce motion* turned on in the OS or browser, snow, twinkling, glitches and other animations are switched off.

</details>

## Credits & Licence
MIT – see [LICENSE](LICENSE). World outline: [Natural Earth](https://www.naturalearthdata.com/) (public domain). Videos (optional pack): AI-generated with Google Flow (Veo), shared for personal Home Assistant dashboard use.

Maintainer: `DKAnord` (`12734694+DKAnord@users.noreply.github.com`)
