/* Nordpol Web App Controller — wraps <nordpol-board-card> with localStorage storage,
   14-language Settings drawer, Kid Lock, Open-Meteo city search, PWA kiosk helpers,
   privacy-safe #hash sharing, and JSON backup/restore. */
(() => {
  const { defaultHomeForTz, browserTimeZone } = window.NordpolTzCities;
  const { LANG_OPTS, WEB_I18N, DEMO_KIDS, resolveLang } = window.NordpolWebI18n;
  const {
    DEFAULT_SETTINGS,
    TODO_ENTITY,
    LOG_ITEM,
    LocalStorageBackend,
    createWebHass,
    sanitizeSettings,
    sanitizeHome,
    loadSettings,
    saveSettings,
    encodeShareHash,
    parseShareHash,
    exportBackup,
    importBackup
  } = window.NordpolWebStorage;

  function readBootOpts() {
    if (window.__NORDPOL_WEB_OPTS__) return window.__NORDPOL_WEB_OPTS__;
    try {
      if (window.parent && window.parent !== window && window.parent.__NORDPOL_WEB_OPTS__) {
        return window.parent.__NORDPOL_WEB_OPTS__;
      }
    } catch {
      /* cross-origin parent */
    }
    return {};
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function init() {
    const opts = readBootOpts();
    const appEl = document.getElementById("app");
    if (!appEl) return null;

    const backend = new LocalStorageBackend();
    let settings = loadSettings();
    let appliedShared = false;

    const shared = parseShareHash(window.location.hash);
    if (shared) {
      settings = saveSettings(Object.assign({}, settings, shared));
      appliedShared = true;
      try {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch {
        /* ignore */
      }
    }

    function curLang() {
      return resolveLang(settings.language);
    }

    function t() {
      return WEB_I18N[curLang()] || WEB_I18N.en;
    }

    function effectiveTimeZone() {
      return settings.time_zone || (settings.home && settings.home.tz) || browserTimeZone();
    }

    function resolvedHome() {
      const tz = effectiveTimeZone();
      if (settings.home) {
        return {
          name: settings.home.name,
          lat: settings.home.lat,
          lon: settings.home.lon,
          tz: settings.home.tz || tz
        };
      }
      return defaultHomeForTz(tz, t().ph_home_name);
    }

    const webHass = createWebHass(backend, () => settings, resolvedHome);

    function buildBoardConfig() {
      const home = resolvedHome();
      const tz = effectiveTimeZone();
      const cfg = {
        default_tab: settings.default_tab || "sleigh",
        hero: { snow: settings.snow !== false },
        cams: {
          overlay: settings.overlay || "minimal",
          cctv_style: settings.cctv_style || "color"
        },
        sleigh: {
          eta: settings.eta || "23:59",
          home
        },
        nice: {
          store: TODO_ENTITY
        },
        elf: {}
      };
      if (settings.language) cfg.language = settings.language;
      if (settings.date) cfg.date = settings.date;
      if (settings.target) cfg.hero.target = settings.target;
      if (tz) cfg.time_zone = tz;
      const rdir = settings.remote_dir || opts.remote_dir;
      if (rdir) cfg.cams.remote_dir = rdir;
      return cfg;
    }

    const board = document.createElement("nordpol-board-card");
    appEl.appendChild(board);

    function syncDocumentMeta() {
      const lang = curLang();
      document.documentElement.lang = lang;
      document.title = t().page_title;
    }

    function refreshBoard() {
      syncDocumentMeta();
      board.hass = webHass.makeHass();
      board.setConfig(buildBoardConfig());
    }

    // Build floating corner Settings button, toast, backdrop & drawer
    const gearBtn = document.createElement("button");
    gearBtn.type = "button";
    gearBtn.id = "np-settings-btn";
    gearBtn.className = "np-gear";
    gearBtn.innerHTML = `<svg class="np-hold-ring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20"/></svg><span class="np-gear-icon" aria-hidden="true">⚙️</span>`;

    const toastEl = document.createElement("div");
    toastEl.id = "np-toast";
    toastEl.className = "np-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");

    const backdrop = document.createElement("div");
    backdrop.id = "np-backdrop";
    backdrop.className = "np-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    const drawer = document.createElement("aside");
    drawer.id = "np-drawer";
    drawer.className = "np-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-labelledby", "np-drawer-title");
    drawer.tabIndex = -1;

    document.body.append(gearBtn, toastEl, backdrop, drawer);

    let toastTimer = null;
    function showToast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add("on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove("on"), 2800);
    }

    let pendingConfirm = null;
    let searchAbort = null;
    let searchDebounce = null;
    let wakeSentinel = null;

    function isDrawerOpen() {
      return drawer.classList.contains("open");
    }

    function openDrawer() {
      renderDrawer();
      backdrop.classList.add("open");
      drawer.classList.add("open");
      backdrop.setAttribute("aria-hidden", "false");
      const closeBtn = drawer.querySelector("#np-close-btn");
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
      hideConfirm();
      backdrop.classList.remove("open");
      drawer.classList.remove("open");
      backdrop.setAttribute("aria-hidden", "true");
      gearBtn.focus();
    }

    function showConfirm(message, yesHandler) {
      pendingConfirm = yesHandler;
      const box = drawer.querySelector("#np-confirm");
      const msg = drawer.querySelector("#np-confirm-msg");
      if (!box || !msg) return;
      msg.textContent = message;
      box.hidden = false;
      const yesBtn = drawer.querySelector("#np-confirm-yes");
      if (yesBtn) yesBtn.focus();
    }

    function hideConfirm() {
      pendingConfirm = null;
      const box = drawer.querySelector("#np-confirm");
      if (box) box.hidden = true;
    }

    function updateSettings(patch, { reRenderDrawer = false } = {}) {
      settings = saveSettings(Object.assign({}, settings, patch));
      refreshBoard();
      if (reRenderDrawer && isDrawerOpen()) {
        const activeId = document.activeElement && document.activeElement.id;
        renderDrawer();
        if (activeId) {
          const el = drawer.querySelector("#" + activeId);
          if (el) el.focus();
        }
      }
    }

    // Wake Lock management
    async function syncWakeLock(desired) {
      if (!("wakeLock" in navigator)) return;
      if (desired && document.visibilityState === "visible") {
        if (wakeSentinel && !wakeSentinel.released) return;
        try {
          wakeSentinel = await navigator.wakeLock.request("screen");
          wakeSentinel.addEventListener("release", () => {
            wakeSentinel = null;
          });
        } catch {
          /* ignore battery saver / permission rejections */
        }
      } else if (!desired && wakeSentinel) {
        try {
          await wakeSentinel.release();
        } catch {
          /* ignore */
        }
        wakeSentinel = null;
      }
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && settings.wake_lock) {
        syncWakeLock(true);
      }
    });

    function updateFullscreenBtn() {
      const btn = drawer.querySelector("#np-fullscreen-btn");
      if (!btn) return;
      const supported = Boolean(document.fullscreenEnabled);
      btn.classList.toggle("np-hidden", !supported);
      if (supported) {
        btn.textContent = document.fullscreenElement ? t().btn_fullscreen_exit : t().btn_fullscreen_enter;
      }
    }

    document.addEventListener("fullscreenchange", updateFullscreenBtn);

    function clickBoardTab(index) {
      const tabs = board.shadowRoot && board.shadowRoot.querySelectorAll('.tabs button[role="tab"]');
      if (tabs && tabs[index]) tabs[index].click();
    }

    function launchTestFlight() {
      closeDrawer();
      clickBoardTab(0);
      const sleighCard = board.shadowRoot && board.shadowRoot.querySelector("nordpol-sleigh-card");
      const hd = sleighCard && sleighCard.shadowRoot && sleighCard.shadowRoot.getElementById("hd");
      if (hd) hd.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    }

    function unlockParentMode() {
      closeDrawer();
      clickBoardTab(1);
      const niceCard = board.shadowRoot && board.shadowRoot.querySelector("nordpol-nice-card");
      const sr = niceCard && niceCard.shadowRoot;
      const bd = sr && sr.getElementById("bd");
      const hd = sr && sr.getElementById("hd");
      if (hd && bd && !bd.classList.contains("parent")) {
        hd.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      }
    }

    function makeDemoItems() {
      const lang = curLang();
      const pack = DEMO_KIDS[lang] || DEMO_KIDS.en;
      const items = pack.kids.map((k, idx) => ({
        uid: "demo_" + lang + "_" + (idx + 1),
        summary: k.name,
        status: "needs_action",
        description: JSON.stringify({ emoji: k.emoji, score: k.score, start: k.start })
      }));
      if (pack.logs && pack.logs.length) {
        items.push({
          uid: "demo_log_" + lang,
          summary: LOG_ITEM,
          status: "completed",
          description: pack.logs.join("\n")
        });
      }
      return items;
    }

    function loadDemoKidsAction() {
      const existing = backend.load().filter(i => i.status !== "completed" && i.summary !== LOG_ITEM);
      const apply = () => {
        backend.save(makeDemoItems());
        refreshBoard();
        clickBoardTab(1);
        closeDrawer();
      };
      if (existing.length > 0) {
        showConfirm(t().confirm_demo_kids, apply);
      } else {
        apply();
      }
    }

    function clearNiceListAction() {
      showConfirm(t().confirm_clear_nice, () => {
        backend.save([]);
        refreshBoard();
        hideConfirm();
      });
    }

    async function runCitySearch(query) {
      const statusEl = drawer.querySelector("#np-city-status");
      const resultsEl = drawer.querySelector("#np-city-results");
      if (!statusEl || !resultsEl) return;

      const q = String(query || "").trim();
      if (q.length < 2) {
        if (searchAbort) searchAbort.abort();
        statusEl.textContent = "";
        resultsEl.innerHTML = "";
        return;
      }

      if (searchAbort) searchAbort.abort();
      searchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
      statusEl.textContent = t().search_loading;
      resultsEl.innerHTML = "";

      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${encodeURIComponent(curLang())}&format=json`;
      const fetchFn = opts.geocodeFetch || window.fetch.bind(window);

      try {
        const res = await fetchFn(url, searchAbort ? { signal: searchAbort.signal } : undefined);
        if (!res || !res.ok) throw new Error("HTTP " + (res ? res.status : "error"));
        const data = await res.json();
        const list = Array.isArray(data && data.results) ? data.results.slice(0, 6) : [];
        if (!list.length) {
          statusEl.textContent = t().search_empty;
          return;
        }
        statusEl.textContent = "";
        resultsEl.innerHTML = "";
        for (const item of list) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "np-city-item";
          const nameSpan = document.createElement("span");
          nameSpan.textContent = String(item.name || "");
          const subSpan = document.createElement("span");
          subSpan.className = "np-city-sub";
          subSpan.textContent = [item.admin1, item.country].filter(Boolean).join(", ");
          btn.append(nameSpan, subSpan);
          btn.addEventListener("click", () => {
            const nextHome = sanitizeHome({
              name: item.name,
              lat: item.latitude,
              lon: item.longitude,
              tz: item.timezone || ""
            });
            if (!nextHome) return;
            updateSettings({
              home: nextHome,
              time_zone: nextHome.tz || ""
            });
            const nameInput = drawer.querySelector("#np-home-name");
            const tzInput = drawer.querySelector("#np-tz");
            if (nameInput) nameInput.value = nextHome.name;
            if (tzInput) tzInput.value = nextHome.tz || "";
            resultsEl.innerHTML = "";
            statusEl.textContent = `📍 ${nextHome.name} (${nextHome.lat}, ${nextHome.lon})`;
          });
          resultsEl.appendChild(btn);
        }
      } catch (err) {
        if (err && err.name === "AbortError") return;
        statusEl.textContent = t().search_err;
      }
    }

    function useMyLocation() {
      const geo = opts.geolocation || navigator.geolocation;
      const statusEl = drawer.querySelector("#np-city-status");
      if (!geo) {
        if (statusEl) statusEl.textContent = t().gps_err;
        return;
      }
      if (statusEl) statusEl.textContent = t().gps_locating;
      geo.getCurrentPosition(
        pos => {
          const nameInput = drawer.querySelector("#np-home-name");
          const currentName = (nameInput && nameInput.value.trim()) || (settings.home && settings.home.name) || resolvedHome().name || t().ph_home_name;
          const tz = effectiveTimeZone();
          const nextHome = sanitizeHome({
            name: currentName,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            tz
          });
          if (!nextHome) {
            if (statusEl) statusEl.textContent = t().gps_err;
            return;
          }
          updateSettings({ home: nextHome });
          if (statusEl) statusEl.textContent = `📍 ${nextHome.name} (${nextHome.lat}, ${nextHome.lon})`;
        },
        () => {
          if (statusEl) statusEl.textContent = t().gps_err;
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }

    async function copyShareLink() {
      const url = window.location.origin + window.location.pathname + window.location.search + encodeShareHash(settings);
      const clip = opts.clipboard || navigator.clipboard;
      let copied = false;
      if (clip && typeof clip.writeText === "function") {
        try {
          await clip.writeText(url);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          copied = document.execCommand("copy");
        } catch {
          copied = false;
        }
        ta.remove();
      }
      if (copied) showToast(t().toast_copied);
    }

    function exportBackupAction() {
      const payload = exportBackup(settings, backend);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nordpol-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function handleImportFile(file) {
      if (!file) return;
      try {
        const text = await file.text();
        const restored = importBackup(text);
        const nextSettings = Object.assign({}, restored.settings);
        if (!nextSettings.remote_dir && opts.remote_dir) {
          nextSettings.remote_dir = opts.remote_dir;
        }
        settings = saveSettings(nextSettings);
        backend.save(restored.nice_items);
        if (restored.elf_tasks) {
          for (const [k, v] of Object.entries(restored.elf_tasks)) {
            try {
              localStorage.setItem(k, v);
            } catch {
              /* ignore */
            }
          }
        }
        refreshBoard();
        renderDrawer();
        showToast(t().toast_imported);
      } catch {
        showToast(t().toast_import_err);
      }
    }

    function resetSettingsAction() {
      showConfirm(t().confirm_reset_all, () => {
        const base = Object.assign({}, DEFAULT_SETTINGS);
        if (opts.remote_dir) base.remote_dir = opts.remote_dir;
        settings = saveSettings(base);
        syncWakeLock(false);
        refreshBoard();
        renderDrawer();
        hideConfirm();
        showToast(t().toast_reset);
      });
    }

    function renderDrawer() {
      const L = t();
      const home = resolvedHome();
      const langOptionsHtml = LANG_OPTS.map(o => {
        const label = o.value === "" ? L.opt_auto : o.label;
        const sel = settings.language === o.value ? "selected" : "";
        return `<option value="${escapeHtml(o.value)}" ${sel}>${escapeHtml(label)}</option>`;
      }).join("");

      const tabOpts = [
        ["sleigh", `🛷 ${L.tab_sleigh}`],
        ["nice", `⭐ ${L.tab_nice}`],
        ["elf", `🧝 ${L.tab_elf}`]
      ].map(([v, label]) => `<option value="${v}" ${settings.default_tab === v ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");

      const ovOpts = [
        ["minimal", L.ov_minimal],
        ["cctv", L.ov_cctv],
        ["off", L.ov_off]
      ].map(([v, label]) => `<option value="${v}" ${settings.overlay === v ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");

      const cctvOpts = [
        ["color", L.cctv_color],
        ["mono", L.cctv_mono]
      ].map(([v, label]) => `<option value="${v}" ${settings.cctv_style === v ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");

      const wakeSupported = "wakeLock" in navigator;
      const geoSupported = Boolean(opts.geolocation || navigator.geolocation);

      gearBtn.setAttribute("aria-label", L.btn_settings);
      gearBtn.title = L.btn_settings;

      drawer.innerHTML = `
        <div class="np-drawer-hd">
          <h2 class="np-drawer-title" id="np-drawer-title">${escapeHtml(L.drawer_title)}</h2>
          <button type="button" class="np-close-btn" id="np-close-btn" aria-label="${escapeHtml(L.drawer_close)}" title="${escapeHtml(L.drawer_close)}">✕</button>
        </div>
        <div class="np-drawer-bd">
          <section class="np-sec">
            <h3 class="np-sec-title">${escapeHtml(L.sec_general)}</h3>
            <div class="np-grid2">
              <div class="np-field">
                <label for="np-lang">${escapeHtml(L.lbl_language)}</label>
                <select class="np-select" id="np-lang">${langOptionsHtml}</select>
              </div>
              <div class="np-field">
                <label for="np-tab">${escapeHtml(L.lbl_default_tab)}</label>
                <select class="np-select" id="np-tab">${tabOpts}</select>
              </div>
            </div>
            <div class="np-grid2">
              <div class="np-field">
                <label for="np-date">${escapeHtml(L.lbl_date)}</label>
                <input class="np-input" id="np-date" type="text" placeholder="12-24" value="${escapeHtml(settings.date)}">
              </div>
              <div class="np-field">
                <label for="np-target">${escapeHtml(L.lbl_target)}</label>
                <input class="np-input" id="np-target" type="text" placeholder="12-24 18:00" value="${escapeHtml(settings.target)}">
              </div>
            </div>
          </section>

          <section class="np-sec">
            <h3 class="np-sec-title">${escapeHtml(L.sec_location)}</h3>
            <div class="np-field">
              <label for="np-city-search">${escapeHtml(L.lbl_city_search)}</label>
              <div class="np-row-inline">
                <input class="np-input" id="np-city-search" type="search" autocomplete="off" placeholder="${escapeHtml(L.ph_city_search)}">
                ${geoSupported ? `<button type="button" class="np-btn" id="np-gps-btn" title="${escapeHtml(L.btn_gps)}">📍</button>` : ""}
              </div>
              <div class="np-city-status" id="np-city-status" aria-live="polite"></div>
              <div class="np-city-results" id="np-city-results"></div>
            </div>
            <div class="np-grid2">
              <div class="np-field">
                <label for="np-home-name">${escapeHtml(L.lbl_home_name)}</label>
                <input class="np-input" id="np-home-name" type="text" maxlength="60" placeholder="${escapeHtml(L.ph_home_name)}" value="${escapeHtml(home.name)}">
              </div>
              <div class="np-field">
                <label for="np-eta">${escapeHtml(L.lbl_eta)}</label>
                <input class="np-input" id="np-eta" type="text" placeholder="23:59" value="${escapeHtml(settings.eta)}">
              </div>
            </div>
            <div class="np-field">
              <label for="np-tz">${escapeHtml(L.lbl_tz)}</label>
              <input class="np-input" id="np-tz" type="text" placeholder="${escapeHtml(browserTimeZone() || "Europe/Copenhagen")}" value="${escapeHtml(settings.time_zone)}">
            </div>
          </section>

          <section class="np-sec">
            <h3 class="np-sec-title">${escapeHtml(L.sec_cams)}</h3>
            <div class="np-grid2">
              <div class="np-field">
                <label for="np-overlay">${escapeHtml(L.lbl_overlay)}</label>
                <select class="np-select" id="np-overlay">${ovOpts}</select>
              </div>
              <div class="np-field">
                <label for="np-cctv">${escapeHtml(L.lbl_cctv_style)}</label>
                <select class="np-select" id="np-cctv">${cctvOpts}</select>
              </div>
            </div>
            <label class="np-check">
              <input type="checkbox" id="np-snow" ${settings.snow !== false ? "checked" : ""}>
              <span>${escapeHtml(L.lbl_snow)}</span>
            </label>
          </section>

          <section class="np-sec">
            <h3 class="np-sec-title">${escapeHtml(L.sec_kiosk)}</h3>
            <label class="np-check">
              <input type="checkbox" id="np-kid-lock" ${settings.kid_lock ? "checked" : ""}>
              <span>${escapeHtml(L.lbl_kid_lock)}</span>
            </label>
            <label class="np-check">
              <input type="checkbox" id="np-wake-lock" ${settings.wake_lock ? "checked" : ""} ${wakeSupported ? "" : "disabled"}>
              <span>${escapeHtml(L.lbl_wake_lock)}</span>
            </label>
            ${wakeSupported ? "" : `<p class="np-hint">${escapeHtml(L.wake_lock_unsupported)}</p>`}
            <button type="button" class="np-btn" id="np-fullscreen-btn">${escapeHtml(L.btn_fullscreen_enter)}</button>
          </section>

          <section class="np-sec">
            <h3 class="np-sec-title">${escapeHtml(L.sec_actions)}</h3>
            <div class="np-btn-grid">
              <button type="button" class="np-btn np-btn-festive" id="np-test-flight">✈️ ${escapeHtml(L.btn_test_flight)}</button>
              <button type="button" class="np-btn np-btn-primary" id="np-parent-mode">🔓 ${escapeHtml(L.btn_parent_mode)}</button>
              <button type="button" class="np-btn" id="np-demo-kids">🧒 ${escapeHtml(L.btn_demo_kids)}</button>
              <button type="button" class="np-btn np-btn-danger" id="np-clear-nice">🧹 ${escapeHtml(L.btn_clear_nice)}</button>
            </div>
          </section>

          <section class="np-sec">
            <h3 class="np-sec-title">${escapeHtml(L.sec_share)}</h3>
            <button type="button" class="np-btn" id="np-copy-link">🔗 ${escapeHtml(L.btn_copy_link)}</button>
            <p class="np-hint">${escapeHtml(L.share_hint)}</p>
            <div class="np-btn-grid">
              <button type="button" class="np-btn" id="np-export-btn">⬇️ ${escapeHtml(L.btn_export)}</button>
              <button type="button" class="np-btn" id="np-import-btn">⬆️ ${escapeHtml(L.btn_import)}</button>
            </div>
            <input type="file" id="np-import-file" accept=".json,application/json" class="np-hidden">
            <button type="button" class="np-btn np-btn-danger" id="np-reset-all">🔄 ${escapeHtml(L.btn_reset_all)}</button>
          </section>

          <section class="np-sec">
            <h3 class="np-sec-title">${escapeHtml(L.sec_about)}</h3>
            <p class="np-hint">${escapeHtml(L.about_privacy)}</p>
            <div class="np-links">
              <a href="https://my.home-assistant.io/redirect/marketplace_repository/?owner=DKAnord&repository=nordpol-card&category=plugin" target="_blank" rel="noopener noreferrer">🏠 ${escapeHtml(L.about_ha)}</a>
              <a href="https://github.com/DKAnord/nordpol-card" target="_blank" rel="noopener noreferrer">⭐ ${escapeHtml(L.about_repo)}</a>
            </div>
          </section>

          <div class="np-confirm" id="np-confirm" hidden>
            <p class="np-confirm-msg" id="np-confirm-msg"></p>
            <div class="np-btn-grid">
              <button type="button" class="np-btn np-btn-danger" id="np-confirm-yes">OK</button>
              <button type="button" class="np-btn" id="np-confirm-no">✕ ${escapeHtml(L.drawer_close)}</button>
            </div>
          </div>
        </div>
      `;

      const $ = id => drawer.querySelector("#" + id);

      $("np-close-btn").addEventListener("click", closeDrawer);
      $("np-lang").addEventListener("change", e => updateSettings({ language: e.target.value }, { reRenderDrawer: true }));
      $("np-tab").addEventListener("change", e => {
        updateSettings({ default_tab: e.target.value });
        const idx = { sleigh: 0, nice: 1, elf: 2 }[e.target.value];
        if (idx != null) clickBoardTab(idx);
      });
      $("np-date").addEventListener("change", e => {
        const raw = e.target.value.trim();
        updateSettings({ date: raw });
        e.target.value = settings.date;
      });
      $("np-target").addEventListener("change", e => {
        const raw = e.target.value.trim();
        updateSettings({ target: raw });
        e.target.value = settings.target;
      });
      $("np-eta").addEventListener("change", e => {
        const raw = e.target.value.trim();
        updateSettings({ eta: raw || "23:59" });
        e.target.value = settings.eta;
      });
      $("np-tz").addEventListener("change", e => {
        const raw = e.target.value.trim();
        updateSettings({ time_zone: raw });
        e.target.value = settings.time_zone;
      });
      $("np-home-name").addEventListener("change", e => {
        const name = e.target.value.trim();
        if (!name) {
          e.target.value = resolvedHome().name;
          return;
        }
        const cur = resolvedHome();
        const nextHome = sanitizeHome({ name, lat: cur.lat, lon: cur.lon, tz: cur.tz });
        if (nextHome) updateSettings({ home: nextHome });
      });

      $("np-city-search").addEventListener("input", e => {
        clearTimeout(searchDebounce);
        const val = e.target.value;
        searchDebounce = setTimeout(() => runCitySearch(val), 350);
      });

      const gpsBtn = $("np-gps-btn");
      if (gpsBtn) gpsBtn.addEventListener("click", useMyLocation);

      $("np-overlay").addEventListener("change", e => updateSettings({ overlay: e.target.value }));
      $("np-cctv").addEventListener("change", e => updateSettings({ cctv_style: e.target.value }));
      $("np-snow").addEventListener("change", e => updateSettings({ snow: e.target.checked }));
      $("np-kid-lock").addEventListener("change", e => updateSettings({ kid_lock: e.target.checked }));
      $("np-wake-lock").addEventListener("change", e => {
        const on = e.target.checked;
        updateSettings({ wake_lock: on });
        syncWakeLock(on);
      });

      $("np-fullscreen-btn").addEventListener("click", () => {
        if (!document.fullscreenEnabled) return;
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      });
      updateFullscreenBtn();

      $("np-test-flight").addEventListener("click", launchTestFlight);
      $("np-parent-mode").addEventListener("click", unlockParentMode);
      $("np-demo-kids").addEventListener("click", loadDemoKidsAction);
      $("np-clear-nice").addEventListener("click", clearNiceListAction);
      $("np-copy-link").addEventListener("click", copyShareLink);
      $("np-export-btn").addEventListener("click", exportBackupAction);
      $("np-import-btn").addEventListener("click", () => $("np-import-file").click());
      $("np-import-file").addEventListener("change", e => {
        const file = e.target.files && e.target.files[0];
        e.target.value = "";
        handleImportFile(file);
      });
      $("np-reset-all").addEventListener("click", resetSettingsAction);

      $("np-confirm-yes").addEventListener("click", () => {
        const fn = pendingConfirm;
        hideConfirm();
        if (typeof fn === "function") fn();
      });
      $("np-confirm-no").addEventListener("click", hideConfirm);
    }

    // Gear button interaction: instant click OR 900ms hold when kid_lock is enabled
    let holdTimer = null;
    let heldDone = false;
    let pointerActive = false;

    function clearHold() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      gearBtn.classList.remove("holding");
    }

    gearBtn.addEventListener("pointerdown", () => {
      if (!settings.kid_lock) return;
      pointerActive = true;
      heldDone = false;
      clearHold();
      // Force reflow so ring restarts cleanly on repeated presses
      void gearBtn.offsetWidth;
      gearBtn.classList.add("holding");
      holdTimer = setTimeout(() => {
        holdTimer = null;
        heldDone = true;
        gearBtn.classList.remove("holding");
        openDrawer();
      }, 900);
    });

    gearBtn.addEventListener("pointerup", () => {
      if (!pointerActive) return;
      pointerActive = false;
      const wasWaiting = Boolean(holdTimer);
      clearHold();
      if (wasWaiting && !heldDone) {
        showToast(t().kid_lock_toast);
      }
    });

    ["pointerleave", "pointercancel"].forEach(ev => {
      gearBtn.addEventListener(ev, () => {
        pointerActive = false;
        clearHold();
      });
    });

    gearBtn.addEventListener("contextmenu", e => {
      if (settings.kid_lock) e.preventDefault();
    });

    gearBtn.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDrawer();
      }
    });

    gearBtn.addEventListener("click", () => {
      if (settings.kid_lock) {
        if (heldDone) {
          heldDone = false;
          return;
        }
        showToast(t().kid_lock_toast);
        return;
      }
      openDrawer();
    });

    backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && isDrawerOpen()) {
        e.preventDefault();
        closeDrawer();
      }
    });

    // Initial render
    refreshBoard();
    gearBtn.setAttribute("aria-label", t().btn_settings);
    gearBtn.title = t().btn_settings;
    if (settings.wake_lock) syncWakeLock(true);
    if (appliedShared) showToast(t().toast_shared_applied);

    const api = {
      board,
      backend,
      getSettings: () => Object.assign({}, settings),
      buildBoardConfig,
      openDrawer,
      closeDrawer,
      refreshBoard,
      updateSettings
    };
    window.__NORDPOL_WEB_API__ = api;
    if (typeof opts.onReady === "function") opts.onReady(api);
    return api;
  }

  window.NordpolWebApp = { init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (customElements.get("nordpol-board-card")) init();
      else customElements.whenDefined("nordpol-board-card").then(() => init());
    });
  } else if (customElements.get("nordpol-board-card")) {
    init();
  } else {
    customElements.whenDefined("nordpol-board-card").then(() => init());
  }
})();
