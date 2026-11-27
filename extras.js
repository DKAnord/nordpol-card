/* Web-exclusive enhancements for Nordpol Web:
   - Clickable Home City chip on Sleigh Tracker
   - Live North Pole Pulse badge on Cams header
   - Santa's Mailroom Postbox (send wishes + Parent Inbox)
   - Printable Official Nice List Certificate */
(() => {
  const { loadWishes, saveWishes, LOG_ITEM } = window.NordpolWebStorage;
  const { countryFlag } = window.NordpolPulse;

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function scoreRank(score, lang) {
    const lvMap = {
      en: ["Coal in stocking? 🪨", "Elves are watching 👀", "Almost nice 🙂", "Nice ⭐", "SUPER nice 🌟"],
      da: ["Kul i sokken? 🪨", "Nisserne holder øje 👀", "Næsten artig 🙂", "Artig ⭐", "SUPER-artig 🌟"],
      fr: ["Charbon ? 🪨", "Les lutins observent 👀", "Presque sage 🙂", "Sage ⭐", "SUPER sage 🌟"],
      de: ["Kohle im Stiefel? 🪨", "Wichtel schauen zu 👀", "Fast artig 🙂", "Artig ⭐", "SUPER artig 🌟"],
      es: ["¿Carbón? 🪨", "Los elfos miran 👀", "Casi bueno 🙂", "Bueno ⭐", "SUPER bueno 🌟"],
      sv: ["Kol i strumpan? 🪨", "Nissarna ser 👀", "Nästan snäll 🙂", "Snäll ⭐", "SUPERsnäll 🌟"],
      nb: ["Kull i strømpen? 🪨", "Nissene ser 👀", "Nesten snill 🙂", "Snill ⭐", "SUPER-snill 🌟"],
      nl: ["Kool in de sok? 🪨", "Elfen kijken mee 👀", "Bijna lief 🙂", "Lief ⭐", "SUPER lief 🌟"],
      fi: ["Kiviä sukassa? 🪨", "Tontut tarkkailevat 👀", "Melkein kiltti 🙂", "Kiltti ⭐", "SUPER-kiltti 🌟"],
      pl: ["Węgiel? 🪨", "Elfy patrzą 👀", "Prawie grzeczny 🙂", "Grzeczny ⭐", "SUPER-grzeczny 🌟"],
      it: ["Carbone? 🪨", "Gli elfi guardano 👀", "Quasi buono 🙂", "Buono ⭐", "SUPER buono 🌟"],
      pt: ["Carvão? 🪨", "Os elfos veem 👀", "Quase bom 🙂", "Bom ⭐", "SUPER bom 🌟"],
      cs: ["Uhlí? 🪨", "Skřítci se dívají 👀", "Skoro hodný 🙂", "Hodný ⭐", "SUPER hodný 🌟"],
      hu: ["Szén? 🪨", "A manók figyelnek 👀", "Majdnem jó 🙂", "Jó ⭐", "SZUPER jó 🌟"]
    };
    const arr = lvMap[lang] || lvMap.en;
    if (score >= 90) return arr[4];
    if (score >= 70) return arr[3];
    if (score >= 45) return arr[2];
    if (score >= 25) return arr[1];
    return arr[0];
  }

  function createExtras({ board, backend, getT, getLang, getHome, onOpenLocation, playSfx }) {
    let lastPulse = null;
    let modalBackdrop = null;
    let wishModal = null;
    let certModal = null;
    let wishCloseTimer = null;

    function ensureContainers() {
      if (modalBackdrop) return;
      modalBackdrop = document.createElement("div");
      modalBackdrop.id = "np-modal-backdrop";
      modalBackdrop.className = "np-modal-backdrop";
      modalBackdrop.setAttribute("aria-hidden", "true");

      wishModal = document.createElement("div");
      wishModal.id = "np-wish-modal";
      wishModal.className = "np-modal";
      wishModal.setAttribute("role", "dialog");
      wishModal.setAttribute("aria-modal", "true");
      wishModal.hidden = true;

      certModal = document.createElement("div");
      certModal.id = "np-cert-modal";
      certModal.className = "np-modal np-modal-wide";
      certModal.setAttribute("role", "dialog");
      certModal.setAttribute("aria-modal", "true");
      certModal.hidden = true;

      document.body.append(modalBackdrop, wishModal, certModal);
      modalBackdrop.addEventListener("click", closeModals);
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && (!wishModal.hidden || !certModal.hidden)) {
          e.preventDefault();
          closeModals();
        }
      });
    }

    function closeModals() {
      clearTimeout(wishCloseTimer);
      wishCloseTimer = null;
      if (!modalBackdrop) return;
      modalBackdrop.classList.remove("open");
      modalBackdrop.setAttribute("aria-hidden", "true");
      wishModal.hidden = true;
      certModal.hidden = true;
    }

    function activeKids() {
      return backend.load()
        .filter(i => i && i.status !== "completed" && i.summary && i.summary !== LOG_ITEM)
        .map(i => {
          let d = {};
          try { d = JSON.parse(i.description || "{}") || {}; } catch {}
          const start = Number.isFinite(+d.start) ? +d.start : 75;
          const score = Number.isFinite(+d.score) ? +d.score : start;
          return { uid: i.uid, name: i.summary, emoji: d.emoji || "🧒", score };
        });
    }

    function openWishModal(view = "send") {
      ensureContainers();
      const L = getT();
      const kids = activeKids();
      const wishes = loadWishes();
      modalBackdrop.classList.add("open");
      modalBackdrop.setAttribute("aria-hidden", "false");
      certModal.hidden = true;
      wishModal.hidden = false;

      if (view === "inbox") {
        const listHtml = wishes.length
          ? wishes.map(w => {
              const dt = new Date(w.created_at);
              const dStr = Number.isNaN(dt.getTime()) ? "" : dt.toLocaleDateString(getLang(), { month: "short", day: "numeric" });
              return `<div class="np-wish-card">
                <div class="np-wish-meta"><strong>${escapeHtml(w.child || "🧒")}</strong><span>${escapeHtml(dStr)}</span></div>
                <p>${escapeHtml(w.text)}</p>
              </div>`;
            }).join("")
          : `<p class="np-hint">${escapeHtml(L.wish_inbox_empty)}</p>`;

        wishModal.innerHTML = `
          <div class="np-modal-hd">
            <h3>${escapeHtml(L.wish_inbox_btn.replace("{n}", String(wishes.length)))}</h3>
            <button type="button" class="np-close-btn" id="np-wish-close" aria-label="${escapeHtml(L.drawer_close)}">✕</button>
          </div>
          <div class="np-modal-bd">
            <div class="np-wish-list">${listHtml}</div>
            ${wishes.length ? `<button type="button" class="np-btn np-btn-danger" id="np-wish-clear">🧹 ${escapeHtml(L.wish_clear)}</button>` : ""}
          </div>
        `;
        wishModal.querySelector("#np-wish-close").addEventListener("click", closeModals);
        const clr = wishModal.querySelector("#np-wish-clear");
        if (clr) {
          clr.addEventListener("click", () => {
            saveWishes([]);
            decorateBoard();
            openWishModal("inbox");
          });
        }
        wishModal.querySelector("#np-wish-close").focus();
        return;
      }

      const chipsHtml = kids.length
        ? `<div class="np-chip-row">${kids.map(k => `<button type="button" class="np-kid-chip" data-name="${escapeHtml(k.name)}">${escapeHtml(k.emoji)} ${escapeHtml(k.name)}</button>`).join("")}</div>`
        : "";

      wishModal.innerHTML = `
        <div class="np-modal-hd">
          <h3>${escapeHtml(L.wish_title)}</h3>
          <button type="button" class="np-close-btn" id="np-wish-close" aria-label="${escapeHtml(L.drawer_close)}">✕</button>
        </div>
        <div class="np-modal-bd">
          ${chipsHtml}
          <div class="np-field">
            <label for="np-wish-child">${escapeHtml(L.wish_child_lbl)}</label>
            <input class="np-input" id="np-wish-child" type="text" maxlength="40" placeholder="${escapeHtml(L.wish_child_ph)}">
          </div>
          <div class="np-field">
            <label for="np-wish-text">${escapeHtml(L.wish_text_lbl)}</label>
            <textarea class="np-input np-textarea" id="np-wish-text" rows="4" maxlength="280" placeholder="${escapeHtml(L.wish_text_ph)}"></textarea>
          </div>
          <div class="np-wish-stamp" id="np-wish-stamp" hidden>
            <div class="np-stamp-badge">${escapeHtml(L.wish_stamp)}</div>
            <p>${escapeHtml(L.wish_sent_note)}</p>
          </div>
          <button type="button" class="np-btn np-btn-festive" id="np-wish-send">📮 ${escapeHtml(L.wish_send)}</button>
        </div>
      `;

      const childIn = wishModal.querySelector("#np-wish-child");
      const textIn = wishModal.querySelector("#np-wish-text");
      const stampEl = wishModal.querySelector("#np-wish-stamp");
      const sendBtn = wishModal.querySelector("#np-wish-send");

      wishModal.querySelector("#np-wish-close").addEventListener("click", closeModals);
      wishModal.querySelectorAll(".np-kid-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          childIn.value = btn.dataset.name || "";
          textIn.focus();
        });
      });

      sendBtn.addEventListener("click", () => {
        const text = textIn.value.trim();
        if (!text) {
          textIn.focus();
          return;
        }
        const wishChild = childIn.value.trim().slice(0, 40);
        const wishText = text.slice(0, 280);
        const next = [{
          id: "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
          child: wishChild,
          text: wishText,
          created_at: new Date().toISOString()
        }, ...loadWishes()].slice(0, 50);
        saveWishes(next);
        if (playSfx) playSfx("stamp");
        stampEl.hidden = false;
        stampEl.classList.remove("pop");
        void stampEl.offsetWidth;
        stampEl.classList.add("pop");
        textIn.value = "";
        decorateBoard();
        const camCard = board.shadowRoot && board.shadowRoot.querySelector("nordpol-cam-card");
        if (camCard && typeof camCard.triggerLetter === "function") {
          camCard.triggerLetter({ child: wishChild, text: wishText });
        }
        clearTimeout(wishCloseTimer);
        wishCloseTimer = setTimeout(closeModals, 1100);
      });

      (kids.length ? textIn : childIn).focus();
    }

    function openCertModal() {
      ensureContainers();
      const L = getT();
      const lang = getLang();
      const kids = activeKids();
      const list = kids.length ? kids : [{ uid: "sample", name: L.cert_sample_kid, emoji: "🧒", score: 95 }];
      let selectedIdx = 0;

      modalBackdrop.classList.add("open");
      modalBackdrop.setAttribute("aria-hidden", "false");
      wishModal.hidden = true;
      certModal.hidden = false;

      const renderCert = () => {
        const k = list[selectedIdx] || list[0];
        const rank = scoreRank(k.score, lang);
        const dateStr = new Date().toLocaleDateString(lang, { year: "numeric", month: "long", day: "numeric" });
        const selHtml = list.length > 1
          ? `<select class="np-select" id="np-cert-kid">${list.map((c, idx) => `<option value="${idx}" ${idx === selectedIdx ? "selected" : ""}>${escapeHtml(c.emoji)} ${escapeHtml(c.name)}</option>`).join("")}</select>`
          : "";

        certModal.innerHTML = `
          <div class="np-modal-hd np-no-print">
            <h3>${escapeHtml(L.cert_title)}</h3>
            <button type="button" class="np-close-btn" id="np-cert-close" aria-label="${escapeHtml(L.drawer_close)}">✕</button>
          </div>
          <div class="np-modal-bd">
            <div class="np-cert-controls np-no-print">
              ${selHtml}
              <button type="button" class="np-btn np-btn-primary" id="np-cert-print">${escapeHtml(L.cert_print)}</button>
            </div>
            <div class="np-cert-sheet" id="np-cert-sheet">
              <div class="np-cert-inner">
                <div class="np-cert-top">🎅 ⭐ 🎄</div>
                <h2 class="np-cert-h">${escapeHtml(L.cert_header)}</h2>
                <p class="np-cert-lead">${escapeHtml(L.cert_awarded)}</p>
                <div class="np-cert-name">${escapeHtml(k.emoji)} ${escapeHtml(k.name)}</div>
                <p class="np-cert-body">${escapeHtml(L.cert_body)}</p>
                <div class="np-cert-badges">
                  <div><span>${escapeHtml(L.cert_rank)}</span><strong>${escapeHtml(rank)}</strong></div>
                  <div><span>${escapeHtml(L.cert_score)}</span><strong>${k.score} / 100</strong></div>
                </div>
                <div class="np-cert-foot">
                  <div class="np-cert-sign">
                    <div class="np-cert-sig-line">${escapeHtml(L.cert_signed)}</div>
                    <div class="np-cert-date">${escapeHtml(dateStr)}</div>
                  </div>
                  <div class="np-cert-seal" aria-hidden="true">★ NORTH POLE ★</div>
                </div>
              </div>
            </div>
          </div>
        `;
        certModal.querySelector("#np-cert-close").addEventListener("click", closeModals);
        certModal.querySelector("#np-cert-print").addEventListener("click", () => window.print());
        const sel = certModal.querySelector("#np-cert-kid");
        if (sel) {
          sel.addEventListener("change", e => {
            selectedIdx = Number(e.target.value) || 0;
            renderCert();
          });
        }
      };

      renderCert();
      certModal.querySelector("#np-cert-close").focus();
    }

    function updatePulseBadge(stats) {
      lastPulse = stats || null;
      const camCard = board.shadowRoot && board.shadowRoot.querySelector("nordpol-cam-card");
      const small = camCard && camCard.shadowRoot && camCard.shadowRoot.querySelector(".hd small");
      if (!small) return;

      let pill = camCard.shadowRoot.getElementById("np-pulse-badge");
      if (!stats || !Number.isFinite(stats.live) || stats.live < 2) {
        if (pill) pill.remove();
        return;
      }

      if (!pill) {
        pill = document.createElement("span");
        pill.id = "np-pulse-badge";
        pill.style.cssText = "display:inline-flex;align-items:center;gap:4px;margin-right:6px;padding:2px 8px;border-radius:999px;background:rgba(14,110,58,.62);border:1px solid rgba(126,240,168,.52);color:#fff8e7;font-weight:700;vertical-align:middle";
        small.insertBefore(pill, small.firstChild);
      }
      const flags = Array.isArray(stats.live_countries)
        ? stats.live_countries.slice(0, 4).map(c => countryFlag(c.code)).filter(Boolean).join(" ")
        : "";
      const txt = getT().pulse_watching.replace("{n}", String(stats.live));
      pill.textContent = flags ? `${txt} ${flags}` : txt;
    }

    function decorateBoard() {
      const sr = board.shadowRoot;
      if (!sr) return;
      const L = getT();

      // 1. Sleigh clickable home-city chip next to #demobtn
      const sleighCard = sr.querySelector("nordpol-sleigh-card");
      const demobar = sleighCard && sleighCard.shadowRoot && sleighCard.shadowRoot.querySelector(".demobar");
      if (demobar) {
        let chip = sleighCard.shadowRoot.getElementById("np-city-chip");
        if (!chip) {
          chip = document.createElement("button");
          chip.type = "button";
          chip.id = "np-city-chip";
          chip.className = "demobtn";
          chip.addEventListener("click", () => {
            if (onOpenLocation) onOpenLocation();
          });
          demobar.appendChild(chip);
        }
        const home = getHome();
        chip.textContent = `📍 ${home.name} ✎`;
        chip.title = L.city_chip_title;
        chip.setAttribute("aria-label", L.city_chip_title);
      }

      // 2. Nice List extra bar: Send wish + Parent Certificate / Inbox
      const niceCard = sr.querySelector("nordpol-nice-card");
      const niceBd = niceCard && niceCard.shadowRoot && niceCard.shadowRoot.getElementById("bd");
      if (niceBd) {
        let bar = niceCard.shadowRoot.getElementById("np-nice-ext");
        if (!bar) {
          bar = document.createElement("div");
          bar.id = "np-nice-ext";
          bar.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-top:8px";
          const holdpill = niceCard.shadowRoot.getElementById("holdpill");
          if (holdpill) niceBd.insertBefore(bar, holdpill);
          else niceBd.appendChild(bar);
        }
        const wishCount = loadWishes().length;
        bar.innerHTML = "";

        const wishBtn = document.createElement("button");
        wishBtn.type = "button";
        wishBtn.id = "np-wish-open";
        wishBtn.textContent = L.wish_btn;
        wishBtn.style.cssText = "font:700 13px system-ui,sans-serif;min-height:36px;min-width:0;padding:6px 12px;border-radius:999px;background:rgba(214,32,47,.42);border:1px solid rgba(255,214,120,.5);color:#fff8e7;cursor:pointer";
        wishBtn.addEventListener("click", () => openWishModal("send"));
        bar.appendChild(wishBtn);

        const certBtn = document.createElement("button");
        certBtn.type = "button";
        certBtn.id = "np-cert-open";
        certBtn.textContent = L.cert_btn;
        certBtn.style.cssText = "font:700 13px system-ui,sans-serif;min-height:36px;min-width:0;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,214,120,.4);color:#fff8e7;cursor:pointer";
        certBtn.addEventListener("click", openCertModal);
        bar.appendChild(certBtn);

        // Parent-only Inbox chip inside .tools
        const tools = niceCard.shadowRoot.querySelector(".tools");
        if (tools) {
          let inboxBtn = niceCard.shadowRoot.getElementById("np-inbox-open");
          if (!inboxBtn) {
            inboxBtn = document.createElement("button");
            inboxBtn.type = "button";
            inboxBtn.id = "np-inbox-open";
            inboxBtn.style.cssText = "grid-column:1/-1;background:#8c3a1f;border:1px solid rgba(255,214,120,.5)";
            inboxBtn.addEventListener("click", () => openWishModal("inbox"));
            tools.appendChild(inboxBtn);
          }
          inboxBtn.textContent = L.wish_inbox_btn.replace("{n}", String(wishCount));
        }
      }

      // 3. Re-apply Pulse badge after board rebuild
      if (lastPulse) updatePulseBadge(lastPulse);
    }

    return {
      decorateBoard,
      updatePulseBadge,
      openWishModal,
      openCertModal,
      closeModals
    };
  }

  window.NordpolExtras = { createExtras };
})();
