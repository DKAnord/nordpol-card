import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(TESTS_DIR, "..");
const CARD_JS_PATH = path.join(ROOT_DIR, "dist", "nordpol-card.js");

const BEH = r => `${r.count} checks (${r.groups})`;
const SUITES = [
  { file: "escaping.html", expr: "window.__runTests()", report: r => `${r.suiteA.length} suiteA + ${r.suiteB.length} suiteB checks` },
  { file: "editors.html", expr: "window.__runEditorTests()", report: r => `${r.count} checks` },
  /* behaviour suites: fake hass + fake clock; the runner emulates time zone, viewport and media features per run */
  { file: "behavior.html?groups=all", tz: "Europe/Copenhagen", width: 1280, expr: "window.__runBehaviorTests()", report: BEH },
  { file: "behavior.html?groups=dst,dates", tz: "America/New_York", width: 1280, expr: "window.__runBehaviorTests()", report: BEH },
  { file: "behavior.html?groups=dst,dates", tz: "Australia/Sydney", width: 1280, expr: "window.__runBehaviorTests()", report: BEH },
  { file: "behavior.html?groups=width", tz: "Europe/Copenhagen", width: 320, expr: "window.__runBehaviorTests()", report: BEH },
  { file: "behavior.html?groups=motion", tz: "Europe/Copenhagen", width: 1280, reducedMotion: true, expr: "window.__runBehaviorTests()", report: BEH }
];

function findBrowser() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const candidates = [
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ];
  for (const c of candidates) {
    if (c.startsWith("/")) {
      if (fs.existsSync(c)) return c;
    } else {
      const r = spawnSync("which", [c], { encoding: "utf8" });
      if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
    }
  }
  throw new Error("No Chrome/Chromium binary found (set CHROME_BIN)");
}

function startServer() {
  const routes = new Map([
    ["/nordpol-card.js", { file: CARD_JS_PATH, type: "application/javascript; charset=utf-8" }],
    ["/escaping.html", { file: path.join(TESTS_DIR, "escaping.html"), type: "text/html; charset=utf-8" }],
    ["/editors.html", { file: path.join(TESTS_DIR, "editors.html"), type: "text/html; charset=utf-8" }],
    ["/behavior.html", { file: path.join(TESTS_DIR, "behavior.html"), type: "text/html; charset=utf-8" }]
  ]);
  const TINY = { file: path.join(TESTS_DIR, "fixtures", "tiny.mp4"), type: "video/mp4" };
  const reqlog = [];
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://127.0.0.1");
    /* request log for the behaviour suite (probe counting) */
    if (u.pathname === "/__reqlog") {
      const body = JSON.stringify(reqlog);
      if (u.searchParams.get("reset")) reqlog.length = 0;
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(body); return;
    }
    if (u.pathname.startsWith("/local/") || u.pathname.startsWith("/remote/")) reqlog.push({ m: req.method, p: u.pathname });
    /* fake media: /local/present/* and /remote/* exist, everything else under /local/ is a 404 */
    let entry = routes.get(u.pathname);
    if (!entry && (u.pathname.startsWith("/local/present/") || u.pathname.startsWith("/remote/")) && u.pathname.endsWith(".mp4")) entry = TINY;
    if (!entry) { res.writeHead(404); res.end(); return; }
    const buf = fs.readFileSync(entry.file);
    res.writeHead(200, { "Content-Type": entry.type, "Content-Length": buf.length });
    res.end(buf);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

async function launchBrowser(bin, userDataDir) {
  const proc = spawn(bin, [
    "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--remote-debugging-port=0", `--user-data-dir=${userDataDir}`, "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  const wsUrl = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Browser launch timeout:\n" + stderr)), 15000);
    proc.stderr.on("data", chunk => {
      stderr += chunk.toString();
      const m = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); resolve(m[1]); }
    });
    proc.on("exit", code => { clearTimeout(t); reject(new Error(`Browser exited (${code}):\n${stderr}`)); });
  });
  return { proc, wsUrl };
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener("open", res, { once: true });
      this.ws.addEventListener("error", rej, { once: true });
    });
    this.ws.addEventListener("message", ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
      } else if (m.method && this.events.has(m.method)) {
        for (const fn of this.events.get(m.method).slice()) fn(m.params);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  once(method, ms = 10000) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("Timeout waiting for " + method)), ms);
      const fn = p => {
        clearTimeout(t);
        this.events.set(method, (this.events.get(method) || []).filter(x => x !== fn));
        res(p);
      };
      const arr = this.events.get(method) || [];
      arr.push(fn);
      this.events.set(method, arr);
    });
  }
  close() { this.ws.close(); }
}

async function main() {
  const bin = findBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "nordpol-test-"));
  const { server, port } = await startServer();
  let proc = null, cdp = null;
  try {
    const launched = await launchBrowser(bin, userDataDir);
    proc = launched.proc;
    const origin = new URL(launched.wsUrl);
    const targets = await (await fetch(`http://127.0.0.1:${origin.port}/json/list`)).json();
    const page = targets.find(t => t.type === "page") || targets[0];
    cdp = new CDP(page.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    let failed = 0;
    for (const suite of SUITES) {
      await cdp.send("Emulation.setTimezoneOverride", { timezoneId: suite.tz || "" });
      if (suite.width) await cdp.send("Emulation.setDeviceMetricsOverride", { width: suite.width, height: 900, deviceScaleFactor: 1, mobile: false });
      else await cdp.send("Emulation.clearDeviceMetricsOverride");
      await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: suite.reducedMotion ? "reduce" : "no-preference" }] });
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/${suite.file}` });
      await loaded;

      const res = await cdp.send("Runtime.evaluate", {
        expression: suite.expr,
        awaitPromise: true,
        returnByValue: true
      });
      const label = suite.file + (suite.tz ? ` [${suite.tz}${suite.width ? ", " + suite.width + "px" : ""}${suite.reducedMotion ? ", reduced-motion" : ""}]` : "");
      if (res.exceptionDetails) {
        const ex = res.exceptionDetails.exception;
        console.log(`FAIL ${label}: ${(ex && ex.description) || JSON.stringify(res.exceptionDetails, null, 2)}`);
        failed++;
        continue;
      }
      console.log(`PASS ${label}: ${suite.report(res.result.value)}`);
    }
    if (failed) throw new Error(`${failed} suite(s) failed`);
  } finally {
    if (cdp) try { cdp.close(); } catch {}
    if (proc) {
      await new Promise(resolve => {
        const tm = setTimeout(resolve, 1000);
        proc.once("exit", () => { clearTimeout(tm); resolve(); });
        try { proc.kill("SIGKILL"); } catch { clearTimeout(tm); resolve(); }
      });
    }
    server.close();
    server.closeAllConnections();
    try { fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); } catch {}
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
