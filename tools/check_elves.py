#!/usr/bin/env python3
"""Asserts that the elf-of-the-day lists in dist/nordpol-card.js match tools/elves_data.py (13 languages x 30)."""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import elves_data as E
src = open(os.path.join(ROOT, "dist", "nordpol-card.js"), encoding="utf8").read()
blocks = {m.group(1): m.start() for m in re.finditer(r"^ ([a-z]{2}): \{$", src, re.M)}
bad = []
for lang in sorted(blocks):
    start = blocks[lang]; end = min([p for p in blocks.values() if p > start] + [len(src)])
    m = re.search(r"elves:(\[\[.*?\]\]),\s*$", src[start:end], re.S | re.M)
    if not m: bad.append(f"{lang}: no elves list in dist"); continue
    dist = [tuple(x) for x in json.loads(m.group(1))]
    want = getattr(E, lang.upper(), None)
    if want is None: bad.append(f"{lang}: missing in elves_data.py"); continue
    if len(dist) != 30: bad.append(f"{lang}: {len(dist)} elves in dist, expected 30")
    if [tuple(x) for x in want] != dist:
        i = next((i for i, (a, b) in enumerate(zip(want, dist)) if tuple(a) != b), min(len(want), len(dist)))
        bad.append(f"{lang}: differs from elves_data.py at #{i + 1}")
print(("FAIL " + "; ".join(bad)) if bad else f"PASS elves_data.py matches dist for {len(blocks)} languages x 30")
sys.exit(1 if bad or len(blocks) != 13 else 0)
