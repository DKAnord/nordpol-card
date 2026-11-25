/* Client-side storage adapter (localStorage + HA todo.* bridge),
   URL #hash settings sharing, and JSON backup/restore for Nordpol Web. */
(() => {
  const SETTINGS_KEY = "nordpol.web.settings.v1";
  const NICE_KEY = "nordpol.web.nice.v1";
  const TODO_ENTITY = "todo.nordpol_nice_list";
  const LOG_ITEM = "📜 log";

  const VALID_LANGS = new Set(["", "en", "da", "fr", "de", "es", "sv", "nb", "nl", "fi", "pl", "it", "pt", "cs", "hu"]);
  const VALID_TABS = new Set(["sleigh", "nice", "elf"]);
  const VALID_OVERLAYS = new Set(["minimal", "cctv", "off"]);
  const VALID_CCTV = new Set(["color", "mono"]);
  const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

  const DEFAULT_SETTINGS = Object.freeze({
    v: 1,
    language: "",
    default_tab: "sleigh",
    date: "",
    target: "",
    eta: "23:59",
    time_zone: "",
    home: null,
    overlay: "minimal",
    cctv_style: "color",
    snow: true,
    kid_lock: false,
    wake_lock: false,
    remote_dir: ""
  });

  function safeParseJson(raw) {
    return JSON.parse(raw, (key, val) => (BAD_KEYS.has(key) ? undefined : val));
  }

  function clamp100(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 75;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function isValidTimeZone(tz) {
    if (!tz || typeof tz !== "string" || tz.length > 64) return false;
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }

  function sanitizeHome(h) {
    if (!h || typeof h !== "object" || Array.isArray(h)) return null;
    const lat = Number(h.lat);
    const lon = Number(h.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return null;
    }
    const name = String(h.name || "").trim().slice(0, 60);
    if (!name) return null;
    const tz = isValidTimeZone(h.tz) ? String(h.tz) : "";
    return {
      name,
      lat: Math.round(lat * 10000) / 10000,
      lon: Math.round(lon * 10000) / 10000,
      tz
    };
  }

  function sanitizeSettings(raw) {
    const out = Object.assign({}, DEFAULT_SETTINGS);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;

    const lang = String(raw.language || "").trim().toLowerCase();
    if (VALID_LANGS.has(lang)) out.language = lang;

    const tab = String(raw.default_tab || "").trim();
    if (VALID_TABS.has(tab)) out.default_tab = tab;

    const dt = String(raw.date || "").trim();
    if (/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dt) && dt !== "12-24") {
      out.date = dt;
    }

    const tgt = String(raw.target || "").trim();
    if (/^((0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\s+)?([01]?\d|2[0-3]):[0-5]\d$/.test(tgt)) {
      out.target = tgt;
    }

    const eta = String(raw.eta || "").trim();
    if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(eta)) {
      out.eta = eta;
    }

    const tz = String(raw.time_zone || "").trim();
    if (isValidTimeZone(tz)) out.time_zone = tz;

    if (raw.home) out.home = sanitizeHome(raw.home);

    const ov = String(raw.overlay || "").trim();
    if (VALID_OVERLAYS.has(ov)) out.overlay = ov;

    const cs = String(raw.cctv_style || "").trim();
    if (VALID_CCTV.has(cs)) out.cctv_style = cs;

    if (typeof raw.snow === "boolean") out.snow = raw.snow;
    if (typeof raw.kid_lock === "boolean") out.kid_lock = raw.kid_lock;
    if (typeof raw.wake_lock === "boolean") out.wake_lock = raw.wake_lock;

    const rdir = String(raw.remote_dir || "").trim();
    if (rdir && (/^https?:\/\//i.test(rdir) || rdir.startsWith("/")) && rdir.length <= 240) {
      out.remote_dir = rdir;
    }

    return out;
  }

  function makeUid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "np_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function sanitizeNiceItems(raw) {
    if (!Array.isArray(raw)) return [];
    const items = [];
    for (const entry of raw) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const summary = String(entry.summary || "").trim().slice(0, 60);
      if (!summary) continue;
      const uid = String(entry.uid || makeUid()).trim().slice(0, 80) || makeUid();
      const status = entry.status === "completed" ? "completed" : "needs_action";
      let description = entry.description == null ? null : String(entry.description);
      if (summary !== LOG_ITEM && status !== "completed" && description) {
        try {
          const parsed = safeParseJson(description);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const start = clamp100(parsed.start != null ? parsed.start : 75);
            const score = clamp100(parsed.score != null ? parsed.score : start);
            const emoji = String(parsed.emoji || "🧒").trim().slice(0, 120) || "🧒";
            description = JSON.stringify({ emoji, score, start });
          }
        } catch {
          description = JSON.stringify({ emoji: "🧒", score: 75, start: 75 });
        }
      } else if (summary === LOG_ITEM && description) {
        description = description.split("\n").slice(0, 30).join("\n");
      }
      items.push({ uid, summary, status, description });
    }
    return items;
  }

  function cloneItems(items) {
    return items.map(i => ({ uid: i.uid, summary: i.summary, status: i.status, description: i.description }));
  }

  class LocalStorageBackend {
    constructor(storageKey = NICE_KEY) {
      this.key = storageKey;
      this._listeners = new Set();
      this._onStorage = ev => {
        if (ev && ev.key === this.key) {
          this._notify();
        }
      };
      this._bound = false;
    }

    load() {
      try {
        const raw = localStorage.getItem(this.key);
        if (!raw) return [];
        const parsed = safeParseJson(raw);
        return sanitizeNiceItems(parsed);
      } catch {
        return [];
      }
    }

    save(items) {
      const clean = sanitizeNiceItems(items);
      try {
        localStorage.setItem(this.key, JSON.stringify(clean));
      } catch {
        /* ignore quota / private mode failures gracefully */
      }
      this._notify(clean);
      return clean;
    }

    _notify(preloaded) {
      const snapshot = cloneItems(preloaded || this.load());
      for (const cb of this._listeners) {
        try {
          cb(cloneItems(snapshot));
        } catch {
          /* isolate listener errors */
        }
      }
    }

    subscribe(cb) {
      if (typeof cb !== "function") return () => {};
      this._listeners.add(cb);
      if (!this._bound && typeof window !== "undefined") {
        window.addEventListener("storage", this._onStorage);
        this._bound = true;
      }
      return () => {
        this._listeners.delete(cb);
        if (this._listeners.size === 0 && this._bound && typeof window !== "undefined") {
          window.removeEventListener("storage", this._onStorage);
          this._bound = false;
        }
      };
    }

    destroy() {
      this._listeners.clear();
      if (this._bound && typeof window !== "undefined") {
        window.removeEventListener("storage", this._onStorage);
        this._bound = false;
      }
    }
  }

  function createWebHass(backend, getSettings, getResolvedHome) {
    const subs = new Set();
    const unsubBackend = backend.subscribe(items => {
      for (const fn of [...subs]) {
        try {
          fn(items);
        } catch {
          /* ignore */
        }
      }
    });

    function buildStates() {
      const items = backend.load();
      const openCount = items.filter(i => i.status !== "completed" && i.summary !== LOG_ITEM).length;
      return {
        [TODO_ENTITY]: {
          entity_id: TODO_ENTITY,
          state: String(openCount),
          attributes: {
            friendly_name: "Nordpol nice list",
            supported_features: 127
          }
        }
      };
    }

    function findItem(items, key) {
      return items.find(i => i.uid === key) || items.find(i => i.summary === key) || null;
    }

    function makeHass() {
      const settings = (typeof getSettings === "function" ? getSettings() : null) || DEFAULT_SETTINGS;
      const home = (typeof getResolvedHome === "function" ? getResolvedHome() : null) || { name: "Home", lat: 51.5, lon: 0, tz: "" };
      return {
        config: {
          time_zone: settings.time_zone || home.tz || "",
          latitude: home.lat,
          longitude: home.lon,
          location_name: home.name
        },
        language: settings.language || (typeof navigator !== "undefined" && navigator.language) || "en",
        user: { is_admin: true },
        states: buildStates(),
        connection: {
          subscribeMessage(cb, msg) {
            if (!msg || msg.entity_id !== TODO_ENTITY) {
              return Promise.reject({ code: "invalid_entity_id", message: "Entity not found" });
            }
            let active = true;
            const listener = items => {
              if (active) cb({ items: cloneItems(items) });
            };
            subs.add(listener);
            setTimeout(() => {
              if (active) cb({ items: cloneItems(backend.load()) });
            }, 0);
            return Promise.resolve(() => {
              active = false;
              subs.delete(listener);
            });
          }
        },
        callWS(msg) {
          if (msg && msg.type === "todo/item/list" && msg.entity_id === TODO_ENTITY) {
            return Promise.resolve({ items: cloneItems(backend.load()) });
          }
          return Promise.reject(new Error("Unsupported WS command"));
        },
        callService(domain, service, data = {}, target = {}) {
          if (domain !== "todo") return Promise.reject(new Error("Unsupported domain: " + domain));
          const entityId = (target && target.entity_id) || TODO_ENTITY;
          if (entityId !== TODO_ENTITY) return Promise.reject(new Error("Unknown entity: " + entityId));

          const items = backend.load();
          if (service === "get_items") {
            return Promise.resolve({ response: { [TODO_ENTITY]: { items: cloneItems(items) } } });
          }
          if (service === "add_item") {
            const summary = String(data.item || "").trim();
            if (!summary) return Promise.reject(new Error("Item name required"));
            items.push({
              uid: makeUid(),
              summary,
              status: "needs_action",
              description: data.description != null ? String(data.description) : null
            });
            backend.save(items);
            return Promise.resolve({});
          }
          if (service === "update_item") {
            const it = findItem(items, data.item);
            if (!it) return Promise.reject(new Error("Item not found: " + data.item));
            if (typeof data.rename === "string" && data.rename.trim()) it.summary = data.rename.trim();
            if ("description" in data) it.description = data.description != null ? String(data.description) : null;
            if (data.status === "completed" || data.status === "needs_action") it.status = data.status;
            backend.save(items);
            return Promise.resolve({});
          }
          if (service === "remove_item") {
            const keys = Array.isArray(data.item) ? data.item : [data.item];
            let next = items;
            for (const k of keys) {
              const it = findItem(next, k);
              if (it) next = next.filter(x => x !== it);
            }
            backend.save(next);
            return Promise.resolve({});
          }
          return Promise.reject(new Error("Unsupported todo service: " + service));
        }
      };
    }

    return {
      makeHass,
      destroy() {
        subs.clear();
        unsubBackend();
      }
    };
  }

  function loadSettings(storageKey = SETTINGS_KEY) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      return sanitizeSettings(safeParseJson(raw));
    } catch {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(settings, storageKey = SETTINGS_KEY) {
    const clean = sanitizeSettings(settings);
    try {
      localStorage.setItem(storageKey, JSON.stringify(clean));
    } catch {
      /* ignore */
    }
    return clean;
  }

  /* Shareable URL #hash encodes SETTINGS ONLY — strictly excludes Nice List & Elf logs. */
  function encodeShareHash(settings) {
    const s = sanitizeSettings(settings);
    const p = new URLSearchParams();
    if (s.language) p.set("lang", s.language);
    if (s.default_tab && s.default_tab !== "sleigh") p.set("tab", s.default_tab);
    if (s.date) p.set("date", s.date);
    if (s.target) p.set("target", s.target);
    if (s.eta && s.eta !== "23:59") p.set("eta", s.eta);
    if (s.time_zone) p.set("tz", s.time_zone);
    if (s.home) {
      p.set("hn", s.home.name);
      p.set("hl", String(s.home.lat));
      p.set("ho", String(s.home.lon));
      if (s.home.tz) p.set("ht", s.home.tz);
    }
    if (s.overlay && s.overlay !== "minimal") p.set("ov", s.overlay);
    if (s.cctv_style && s.cctv_style !== "color") p.set("cs", s.cctv_style);
    if (s.snow === false) p.set("snow", "0");
    if (s.kid_lock === true) p.set("kl", "1");
    const str = p.toString();
    return str ? "#" + str : "#v=1";
  }

  function parseShareHash(hash) {
    const raw = String(hash || "").replace(/^#\??/, "").trim();
    if (!raw) return null;
    const p = new URLSearchParams(raw);
    const recognized = ["v", "lang", "tab", "date", "target", "eta", "tz", "hn", "hl", "ho", "ht", "ov", "cs", "snow", "kl"];
    if (!recognized.some(k => p.has(k))) return null;

    const patch = {};
    if (p.has("lang")) patch.language = p.get("lang");
    if (p.has("tab")) patch.default_tab = p.get("tab");
    if (p.has("date")) patch.date = p.get("date");
    if (p.has("target")) patch.target = p.get("target");
    if (p.has("eta")) patch.eta = p.get("eta");
    if (p.has("tz")) patch.time_zone = p.get("tz");
    if (p.has("hn") && p.has("hl") && p.has("ho")) {
      const h = sanitizeHome({
        name: p.get("hn"),
        lat: Number(p.get("hl")),
        lon: Number(p.get("ho")),
        tz: p.get("ht") || p.get("tz") || ""
      });
      if (h) patch.home = h;
    }
    if (p.has("ov")) patch.overlay = p.get("ov");
    if (p.has("cs")) patch.cctv_style = p.get("cs");
    if (p.has("snow")) patch.snow = p.get("snow") !== "0";
    if (p.has("kl")) patch.kid_lock = p.get("kl") === "1";

    return sanitizeSettings(Object.assign({}, DEFAULT_SETTINGS, patch));
  }

  function collectElfTasks() {
    const out = Object.create(null);
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("nordpol-task-") && localStorage.getItem(k) === "1") {
          out[k] = "1";
        }
      }
    } catch {
      /* ignore */
    }
    return out;
  }

  function exportBackup(settings, backend) {
    return {
      app: "nordpol-web",
      version: 1,
      exported_at: new Date().toISOString(),
      settings: sanitizeSettings(settings),
      nice_items: backend ? backend.load() : [],
      elf_tasks: collectElfTasks()
    };
  }

  function importBackup(rawJson) {
    let data;
    if (typeof rawJson === "string") {
      data = safeParseJson(rawJson);
    } else {
      data = rawJson;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Backup must be a JSON object");
    }
    if (data.app !== undefined && data.app !== "nordpol-web") {
      throw new Error("Unrecognized backup app");
    }
    if (data.version !== undefined && data.version !== 1) {
      throw new Error("Unsupported backup version");
    }
    if (!("settings" in data) && !("nice_items" in data)) {
      throw new Error("Backup contains neither settings nor nice_items");
    }
    if ("settings" in data && (!data.settings || typeof data.settings !== "object" || Array.isArray(data.settings))) {
      throw new Error("Invalid settings in backup");
    }
    if ("nice_items" in data && !Array.isArray(data.nice_items)) {
      throw new Error("Invalid nice_items in backup");
    }

    const settings = sanitizeSettings(data.settings || DEFAULT_SETTINGS);
    const nice_items = sanitizeNiceItems(data.nice_items || []);
    const elf_tasks = Object.create(null);
    if (data.elf_tasks && typeof data.elf_tasks === "object" && !Array.isArray(data.elf_tasks)) {
      let count = 0;
      for (const [k, v] of Object.entries(data.elf_tasks)) {
        if (count++ >= 64) break;
        if (typeof k === "string" && k.startsWith("nordpol-task-") && k.length <= 80 && v === "1") {
          elf_tasks[k] = "1";
        }
      }
    }

    return { settings, nice_items, elf_tasks };
  }

  window.NordpolWebStorage = {
    SETTINGS_KEY,
    NICE_KEY,
    TODO_ENTITY,
    LOG_ITEM,
    DEFAULT_SETTINGS,
    LocalStorageBackend,
    createWebHass,
    sanitizeSettings,
    sanitizeHome,
    sanitizeNiceItems,
    loadSettings,
    saveSettings,
    encodeShareHash,
    parseShareHash,
    exportBackup,
    importBackup
  };
})();
