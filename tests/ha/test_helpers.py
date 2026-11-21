#!/usr/bin/env python3
"""Runs helpers/nordpol_package.yaml in a real, throw-away Home Assistant (needs `pip install homeassistant`).

Checks that the scripts write the elf log where the card reads it by default (the completed
"📜 log" to-do item), create that item only once, keep scores in range, and that the optional
input_text variant works. Usage: python3 tests/ha/test_helpers.py   (exit code 0 = pass)
"""
import json, os, urllib.error, shutil, socket, subprocess, sys, tempfile, time, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HASS = os.environ.get("HASS_BIN") or shutil.which("hass") or os.path.join(os.path.dirname(sys.executable), "hass")
LOG = "📜 log"

def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p

def setup_config(d, port):
    os.makedirs(os.path.join(d, "packages")); os.makedirs(os.path.join(d, ".storage"))
    shutil.copy(os.path.join(ROOT, "helpers", "nordpol_package.yaml"), os.path.join(d, "packages", "nordpol.yaml"))
    open(os.path.join(d, "configuration.yaml"), "w").write(f"""homeassistant:
  name: nordpol-test
  time_zone: Europe/Copenhagen
  country: DK
  latitude: 55.68
  longitude: 12.57
  elevation: 10
  unit_system: metric
  currency: DKK
  packages: !include_dir_named packages
http:
  server_host: 127.0.0.1
  server_port: {port}
api:
logger:
  default: warning
""")
    json.dump({"version": 4, "minor_version": 1, "key": "onboarding",
               "data": {"done": ["user", "core_config", "analytics", "integration"]}},
              open(os.path.join(d, ".storage", "onboarding"), "w"))
    json.dump({"version": 1, "minor_version": 1, "key": "core.config_entries", "data": {"entries": [{
        "entry_id": "nordpoltest0001", "version": 1, "minor_version": 1, "domain": "local_todo", "title": "Nordpol nice list",
        "data": {"todo_list_name": "Nordpol nice list", "storage_key": "nordpol_nice_list"}, "options": {},
        "pref_disable_new_entities": False, "pref_disable_polling": False, "source": "user", "unique_id": None, "disabled_by": None}]}},
        open(os.path.join(d, ".storage", "core.config_entries"), "w"))
    subprocess.run([HASS, "--script", "auth", "-c", d, "add", "tester", "tester-pw-1"], check=True, capture_output=True)

def http(base, path, data=None, token=None, form=False):
    h = {}
    if token: h["Authorization"] = "Bearer " + token
    body = None
    if data is not None:
        if form: body = urllib.parse.urlencode(data).encode(); h["Content-Type"] = "application/x-www-form-urlencoded"
        else: body = json.dumps(data).encode(); h["Content-Type"] = "application/json"
    with urllib.request.urlopen(urllib.request.Request(base + path, data=body, headers=h), timeout=60) as r:
        return json.loads(r.read() or b"null")

def login(base):
    cid = base + "/"
    f = http(base, "/auth/login_flow", {"client_id": cid, "handler": ["homeassistant", None], "redirect_uri": cid})
    f = http(base, f"/auth/login_flow/{f['flow_id']}", {"client_id": cid, "username": "tester", "password": "tester-pw-1"})
    return http(base, "/auth/token", {"grant_type": "authorization_code", "code": f["result"], "client_id": cid}, form=True)["access_token"]

fails, checks = [], 0
def check(name, got, want):
    global checks; checks += 1
    if got != want: fails.append(f"{name}: expected {want!r}, got {got!r}"); print("  ✗", fails[-1])
    else: print("  ✓", name)

def main():
    d = tempfile.mkdtemp(prefix="nordpol-ha-"); port = free_port(); base = f"http://127.0.0.1:{port}"
    setup_config(d, port)
    p = subprocess.Popen([HASS, "-c", d, "--skip-pip"], stdout=open(os.path.join(d, "hass.out"), "w"), stderr=subprocess.STDOUT)
    try:
        for _ in range(240):
            try: urllib.request.urlopen(base + "/manifest.json", timeout=2); break
            except Exception: time.sleep(0.5)
        else: raise SystemExit("Home Assistant did not start; see " + d + "/hass.out")
        tok = login(base)
        for _ in range(120):
            try:
                if http(base, "/api/states/todo.nordpol_nice_list", token=tok): break
            except Exception: time.sleep(0.5)
        def svc(dom, s, data, resp=False):
            try: return http(base, f"/api/services/{dom}/{s}" + ("?return_response" if resp else ""), data, tok)
            except urllib.error.HTTPError as e:
                global checks; checks += 1; fails.append(f"{dom}.{s} {json.dumps(data, ensure_ascii=False)}: HTTP {e.code} {e.read()[:200]!r}"); print("  ✗", fails[-1])
        E = {"entity_id": "todo.nordpol_nice_list"}
        def items():
            r = svc("todo", "get_items", E, True)
            return r["service_response"]["todo.nordpol_nice_list"]["items"]
        def kid(n): return json.loads(next((i for i in items() if i["summary"] == n), {"description": "{}"})["description"]) or {}
        def logs(): return [i for i in items() if i["summary"] == LOG]
        print("HA", http(base, "/api/config", token=tok)["version"])
        svc("todo", "add_item", {**E, "item": "Emma", "description": json.dumps({"emoji": "🦊", "score": 80, "start": 75})})
        svc("todo", "add_item", {**E, "item": "Liam", "description": json.dumps({"emoji": "🐻", "score": 98, "start": 70})})
        # 1. default: log goes to the completed "📜 log" item, created once
        svc("script", "nordpol_give_points", {"child": "Emma", "points": 2, "reason": "dishes"})
        check("Emma 80+2", kid("Emma").get("score"), 82)
        check("emoji kept", kid("Emma").get("emoji"), "🦊")
        check("one log item", len(logs()), 1)
        check("log item completed", [i["status"] for i in logs()], ["completed"])
        check("log text", (logs() or [{}])[0].get("description", ""), "Emma +2: dishes")
        svc("script", "nordpol_give_points", {"child": "Liam", "points": 5})
        check("Liam clamps at 100", kid("Liam").get("score"), 100)
        check("still one log item", len(logs()), 1)
        check("newest line first", (logs() or [{}])[0].get("description", ""), "Liam +5\nEmma +2: dishes")
        svc("script", "nordpol_give_points", {"child": "Emma", "points": -3, "reason": "teasing"})
        check("Emma 82-3", kid("Emma").get("score"), 79)
        check("three lines", (logs() or [{}])[0].get("description", "").split("\n"), ["Emma -3: teasing", "Liam +5", "Emma +2: dishes"])
        svc("script", "nordpol_give_points", {"child": "Nobody", "points": 5})
        check("unknown child: no log line", len((logs() or [{}])[0].get("description", "").split("\n")), 3)
        check("input_text untouched by default", http(base, "/api/states/input_text.nordpol_elf_log", token=tok)["state"] in ("", "unknown"), True)
        # 30-line cap
        for n in range(32): svc("script", "nordpol_give_points", {"child": "Emma", "points": 1})
        check("log capped at 30 lines", len((logs() or [{}])[0].get("description", "").split("\n")), 30)
        check("Emma capped at 100", kid("Emma").get("score"), 100)
        # 2. reset
        svc("script", "nordpol_reset_nice_list", {})
        check("reset Emma to own start", kid("Emma").get("score"), 75)
        check("reset Liam to own start", kid("Liam").get("score"), 70)
        check("reset log line", (logs() or [{}])[0].get("description", ""), "Fresh start – the elves are watching! 👀")
        check("reset: still one log item", len(logs()), 1)
        svc("script", "nordpol_reset_nice_list", {"start": 50})
        check("reset with start", kid("Emma").get("score"), 50)
        # 3. input_text variant (card with log_entity)
        svc("script", "nordpol_give_points", {"child": "Liam", "points": 4, "reason": "tidy", "log_entity": "input_text.nordpol_elf_log"})
        svc("script", "nordpol_give_points", {"child": "Emma", "points": 1, "log_entity": "input_text.nordpol_elf_log"})
        check("input_text log", http(base, "/api/states/input_text.nordpol_elf_log", token=tok)["state"], "Emma +1 • Liam +4: tidy")
        check("to-do log unchanged in input_text mode", (logs() or [{}])[0].get("description", ""), "Fresh start – the elves are watching! 👀")
        svc("script", "nordpol_reset_nice_list", {"log_entity": "input_text.nordpol_elf_log"})
        check("input_text reset", http(base, "/api/states/input_text.nordpol_elf_log", token=tok)["state"], "Fresh start – the elves are watching! 👀")
        # 4. fresh list without a log item: reset creates it
        svc("todo", "remove_item", {**E, "item": LOG})
        svc("script", "nordpol_reset_nice_list", {})
        check("reset creates log item once", [(i["status"], i.get("description")) for i in logs()], [("completed", "Fresh start – the elves are watching! 👀")])
        errs = [l for l in open(os.path.join(d, "hass.out"), encoding="utf8") if "nordpol" in l.lower() and ("ERROR" in l or "WARNING" in l)]
        check("no script errors/warnings in HA log", errs, [])
    finally:
        p.terminate()
        try: p.wait(30)
        except Exception: p.kill()
    print(("PASS" if not fails else "FAIL") + f" helpers package in real Home Assistant: {checks} checks")
    if fails: sys.exit(1)
    shutil.rmtree(d, ignore_errors=True)

if __name__ == "__main__":
    main()
