import { DurableObject } from "cloudflare:workers";

const ACTIVE_TTL_MS = 3 * 60 * 1000;
const VISIT_DEDUPE_MS = 30 * 60 * 1000;
const VALID_LANGS = new Set(["en", "da", "fr", "de", "es", "sv", "nb", "nl", "fi", "pl", "it", "pt", "cs", "hu"]);

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": (env && env.ALLOWED_ORIGIN) || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function jsonResponse(data, env, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl
    }, corsHeaders(env))
  });
}

export class PulseRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.active = new Map();
    this.seen = new Map();
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS counts (kind TEXT NOT NULL, code TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (kind, code));
        INSERT OR IGNORE INTO meta (k, v) VALUES ('total_visits', 0);
      `);
    });
  }

  _prune(now) {
    for (const [sid, entry] of this.active) {
      if (now - entry.t > ACTIVE_TTL_MS) this.active.delete(sid);
    }
    for (const [sid, ts] of this.seen) {
      if (now - ts > VISIT_DEDUPE_MS) this.seen.delete(sid);
    }
  }

  _snapshot(now) {
    this._prune(now);

    const liveCountriesMap = new Map();
    for (const entry of this.active.values()) {
      if (entry.cc) {
        liveCountriesMap.set(entry.cc, (liveCountriesMap.get(entry.cc) || 0) + 1);
      }
    }
    const live_countries = [...liveCountriesMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([code, count]) => ({ code, count }));

    const totalRow = [...this.ctx.storage.sql.exec("SELECT v FROM meta WHERE k = 'total_visits'")][0];
    const total_visits = totalRow ? Number(totalRow.v) : 0;

    const top_countries = [...this.ctx.storage.sql.exec(
      "SELECT code, n FROM counts WHERE kind = 'c' ORDER BY n DESC, code ASC LIMIT 10"
    )].map(r => ({ code: r.code, count: Number(r.n) }));

    const top_languages = [...this.ctx.storage.sql.exec(
      "SELECT code, n FROM counts WHERE kind = 'l' ORDER BY n DESC, code ASC LIMIT 10"
    )].map(r => ({ code: r.code, count: Number(r.n) }));

    return {
      ok: true,
      live: this.active.size,
      live_countries,
      total_visits,
      top_countries,
      top_languages
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();

    if (request.method === "POST" && url.pathname === "/ping") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ ok: false, error: "Invalid JSON" }, this.env, 400);
      }

      const sid = String((body && body.sid) || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
      const rawLang = String((body && body.lang) || "").trim().toLowerCase().slice(0, 8);
      const lang = VALID_LANGS.has(rawLang) ? rawLang : (/^[a-z]{2}$/.test(rawLang) ? rawLang : "");
      const rawCc = String((body && body.country) || "").trim().toUpperCase();
      const cc = /^[A-Z]{2}$/.test(rawCc) && rawCc !== "XX" && rawCc !== "T1" ? rawCc : "";

      if (sid.length >= 8) {
        this._prune(now);
        this.active.set(sid, { t: now, cc });
        if (!this.seen.has(sid)) {
          this.seen.set(sid, now);
          this.ctx.storage.sql.exec("UPDATE meta SET v = v + 1 WHERE k = 'total_visits'");
          if (cc) {
            this.ctx.storage.sql.exec(
              "INSERT INTO counts (kind, code, n) VALUES ('c', ?, 1) ON CONFLICT(kind, code) DO UPDATE SET n = n + 1",
              cc
            );
          }
          if (lang) {
            this.ctx.storage.sql.exec(
              "INSERT INTO counts (kind, code, n) VALUES ('l', ?, 1) ON CONFLICT(kind, code) DO UPDATE SET n = n + 1",
              lang
            );
          }
        }
      }

      return jsonResponse(this._snapshot(now), this.env, 200, "no-store");
    }

    if (request.method === "GET" && (url.pathname === "/stats" || url.pathname === "/")) {
      return jsonResponse(this._snapshot(now), this.env, 200, "public, max-age=20");
    }

    return jsonResponse({ ok: false, error: "Not found" }, this.env, 404);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    if (request.method !== "GET" && !(request.method === "POST" && url.pathname === "/ping")) {
      return jsonResponse({ ok: false, error: "Method not allowed" }, env, 405);
    }

    const id = env.PULSE.idFromName("global");
    const stub = env.PULSE.get(id);

    if (request.method === "POST" && url.pathname === "/ping") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ ok: false, error: "Invalid JSON" }, env, 400);
      }
      const country = (request.cf && typeof request.cf.country === "string") ? request.cf.country : "";
      const fwd = new Request(new URL("/ping", url.origin), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid: body && body.sid, lang: body && body.lang, country })
      });
      return stub.fetch(fwd);
    }

    return stub.fetch(new Request(new URL("/stats", url.origin), { method: "GET" }));
  }
};
