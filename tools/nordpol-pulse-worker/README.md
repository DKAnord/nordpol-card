# Nordpol Pulse — Free Cookie-Free Live Visitor Counter

A tiny Cloudflare Worker + SQLite Durable Object that powers Nordpol Web's:

- **Live viewer count & active country flags** (`👀 18 watching live · 🇩🇰 🇩🇪 🇬🇧`)
- **Total seasonal visitors, top countries, and top languages** (`GET /stats`)

## Privacy & Cost
- **Cost:** **\$0** on Cloudflare's Workers Free plan (100,000 requests/day hard stop, **no credit card required** — includes SQLite-backed Durable Objects).
- **Zero PII / Zero Cookies:** Does not read, log, or store IP addresses or set cookies. Uses Cloudflare's edge `request.cf.country` 2-letter ISO code in memory/aggregates only, plus an ephemeral browser `sessionStorage` tab ID (`sid`) that disappears when the tab closes.

## 2-Minute Deploy (`wrangler`)

```bash
cd tools/nordpol-pulse-worker
npx wrangler login        # log in with a free Cloudflare account (no card needed)
npx wrangler deploy
```

Note the printed URL (e.g. `https://nordpol-pulse.<subdomain>.workers.dev`), then paste it into `DEFAULT_PULSE_URL` in [`web/pulse.js`](../../web/pulse.js) (or test locally via `__NORDPOL_WEB_API__.updateSettings({ pulse_url: "https://..." })`).

## Optional: Home Assistant `rest` Sensor

Monitor live viewers and total visits in your own Home Assistant dashboard:

```yaml
rest:
  - resource: https://nordpol-pulse.<subdomain>.workers.dev/stats
    scan_interval: 120
    sensor:
      - name: Nordpol Web Live Viewers
        value_template: "{{ value_json.live | int(0) }}"
        json_attributes:
          - total_visits
          - live_countries
          - top_countries
          - top_languages
```
