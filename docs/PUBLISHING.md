# Publishing checklist

Current release flow for Nordpol Card (HACS plugin + GitHub Release). Work on a branch, then merge to `main`.

## Cut a release

1. Bump `const VER` in `dist/nordpol-card.js` to the new version (e.g. `2.5.0`).
2. Update `CHANGELOG.md` and any README language lists, examples, or docs that mention the version or language set.
3. Validate locally:
   - `node --check dist/nordpol-card.js`
   - `node tests/run.mjs` (needs Chrome/Chromium; set `CHROME_BIN` if it is not on PATH). Every line must start with `PASS`.
   - `python3 tools/check_elves.py` (elf lists in the JS match `tools/elves_data.py`)
   - Optional, needs `pip install homeassistant`: `python3 tests/ha/test_helpers.py` (helper scripts in a real Home Assistant; also runs in CI)
   - Private-data grep (same as CI):
     ```bash
     ! grep -rEn "192\.168\.|ntfy\.sh|ses-home" --include=*.js --include=*.mjs --include=*.html --include=*.yaml --include=*.md . | grep -v "README.md"
     ```
4. Commit on `main` (or merge the release branch).
5. Create and **push an annotated tag** `vX.Y.Z` (must match `v*`). The **Release Asset** workflow (`.github/workflows/release.yml`) checks out the tag and attaches `dist/nordpol-card.js` to the GitHub Release (`filename` in `hacs.json`).
6. Confirm the release asset SHA matches `dist/nordpol-card.js`, and that the Validate workflow is green.

## Notes

- Hosted cam clips already live on GitHub Pages (`https://dkanord.github.io/nordpol-card/media`). The optional offline zip packs remain on the v2.1.0 release (12 clips, `morning` / `day` / `evening` file names).
- Do not commit MP4s; see `.gitignore` (the only exception is the 1.7 kB test fixture `tests/fixtures/tiny.mp4`).
- `hacs/action` is pinned to `1ebf01c408f29afcb6406bd431bc98fd8cbb15aa` (latest main commit as of 2026-06-08 (Bump actions/checkout 6.0.3); newest GitHub release tag is 22.5.0 (2022-05-28, SHA d556e736723344f83838d08488c983a15381059a) and is years behind main).
- Optional: submit or update the listing on the HACS default list: https://github.com/hacs/default
- Optional smoke test: a clean Home Assistant / fresh dashboard with `examples/dashboard.yaml`, with and without local cam files, and with `language` set to more than one locale (including a non-Danish HA time zone for the sleigh tracker).
