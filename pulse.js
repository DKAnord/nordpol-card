/* Cookie-free client for the optional Nordpol Pulse Cloudflare Worker.
   Uses only an ephemeral sessionStorage tab ID + edge country (never IPs or cookies). */
(() => {
  const DEFAULT_PULSE_URL = "";
  const SID_KEY = "nordpol.pulse.sid";
  const PING_INTERVAL_MS = 120000;

  function countryFlag(cc) {
    const s = String(cc || "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(s)) return "";
    return String.fromCodePoint(0x1f1e6 + s.charCodeAt(0) - 65, 0x1f1e6 + s.charCodeAt(1) - 65);
  }

  function getSessionId() {
    try {
      let sid = sessionStorage.getItem(SID_KEY);
      if (!sid || sid.length < 8) {
        const arr = new Uint8Array(12);
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
          crypto.getRandomValues(arr);
        } else {
          for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        }
        sid = Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
        sessionStorage.setItem(SID_KEY, sid);
      }
      return sid;
    } catch {
      return "anon_" + Math.random().toString(36).slice(2, 12);
    }
  }

  function normalizeBaseUrl(raw) {
    const s = String(raw || "").trim().replace(/\/+$/, "");
    if (!s) return "";
    if (!/^https?:\/\//i.test(s) && !s.startsWith("/")) return "";
    return s;
  }

  function createPulseClient({ getUrl, getLang, isOptOut, fetchFn, onUpdate }) {
    const sid = getSessionId();
    let timer = null;
    let lastPingAt = 0;
    let lastLang = "";
    let lastStats = null;
    let destroyed = false;

    async function ping(force = false) {
      if (destroyed) return null;
      const base = normalizeBaseUrl(getUrl ? getUrl() : DEFAULT_PULSE_URL);
      if (!base || (isOptOut && isOptOut())) {
        if (lastStats !== null) {
          lastStats = null;
          if (onUpdate) onUpdate(null);
        }
        return null;
      }
      if (!force && document.visibilityState === "hidden") return null;

      const lang = (getLang ? getLang() : "en") || "en";
      const now = Date.now();
      if (!force && lastLang === lang && now - lastPingAt < 25000) return lastStats;
      lastPingAt = now;
      lastLang = lang;

      const doFetch = fetchFn || window.fetch.bind(window);
      try {
        const res = await doFetch(base + "/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sid, lang })
        });
        if (!res || !res.ok) return null;
        const data = await res.json();
        if (!data || !data.ok) return null;
        lastStats = data;
        if (!destroyed && onUpdate) onUpdate(data);
        return data;
      } catch {
        return null;
      }
    }

    function onVisibility() {
      if (!destroyed && document.visibilityState === "visible") {
        ping(false);
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    timer = setInterval(() => {
      if (document.visibilityState === "visible") ping(false);
    }, PING_INTERVAL_MS);

    return {
      ping,
      getStats: () => lastStats,
      refresh(force = true) {
        return ping(force);
      },
      destroy() {
        destroyed = true;
        clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }

  window.NordpolPulse = {
    DEFAULT_PULSE_URL,
    countryFlag,
    createPulseClient
  };
})();
