#!/usr/bin/env python3
"""Generate all ad-translations locale JSON files from embedded translations."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EN = json.load(open(ROOT / "ad-attribute-en.json", encoding="utf-8"))
OUT = ROOT / "ad-translations"

# Load bundled translations (generated content)
from ad_translations_bundle import LOCALE_DATA

for locale, data in LOCALE_DATA.items():
    for slug in EN:
        if slug not in data:
            raise SystemExit(f"Missing {locale}/{slug}")
        if set(data[slug].keys()) != set(EN[slug].keys()):
            raise SystemExit(f"Key mismatch {locale}/{slug}")
    path = OUT / f"{locale}.json"
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Wrote {path.name}")

print("Done")
