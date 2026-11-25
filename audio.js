/* Zero-asset Web Audio API festive chime synthesizer for Nordpol Web.
   Muted by default until the visitor explicitly enables sound. */
(() => {
  function createAudio() {
    let enabled = false;
    let ctx = null;

    function ensureCtx() {
      if (ctx) {
        if (ctx.state === "suspended" && typeof ctx.resume === "function") {
          ctx.resume().catch(() => {});
        }
        return ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        return ctx;
      } catch {
        return null;
      }
    }

    function tone(c, freq, startOffset, dur, gainPeak = 0.08, type = "sine") {
      const t0 = c.currentTime + startOffset;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    function play(kind = "tap") {
      if (!enabled) return;
      const c = ensureCtx();
      if (!c) return;
      try {
        if (kind === "star") {
          tone(c, 659.25, 0, 0.14, 0.07, "triangle");
          tone(c, 987.77, 0.07, 0.24, 0.08, "sine");
        } else if (kind === "reveal") {
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, i * 0.055, 0.22, 0.06, "triangle"));
        } else if (kind === "sleigh") {
          [1174.66, 1479.98, 1760.0, 2349.32].forEach((f, i) => tone(c, f, i * 0.05, 0.26, 0.045, "sine"));
        } else if (kind === "stamp") {
          tone(c, 185.0, 0, 0.12, 0.09, "triangle");
          tone(c, 880.0, 0.07, 0.26, 0.065, "sine");
        } else if (kind === "toggle") {
          tone(c, 783.99, 0, 0.11, 0.055, "sine");
        } else {
          tone(c, 587.33, 0, 0.09, 0.045, "sine");
        }
      } catch {
        /* ignore audio failures */
      }
    }

    return {
      setEnabled(v) {
        enabled = Boolean(v);
        if (enabled) ensureCtx();
      },
      isEnabled: () => enabled,
      play
    };
  }

  window.NordpolWebAudio = { createAudio };
})();
