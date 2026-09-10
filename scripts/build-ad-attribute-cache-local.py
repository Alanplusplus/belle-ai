#!/usr/bin/env python3
"""Build ad-attribute-translations-cache.json from hand-written locale translations."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EN = json.load(open(ROOT / "ad-attribute-en.json", encoding="utf-8"))
OUT = ROOT / "ad-attribute-translations-cache.json"

# Import locale modules
from ad_translations import zh, ja, ko, es, fr, de, pt, it, ru, ar, hi, th, vi, id, tr

LOCALES = {
    "zh": zh.TRANSLATIONS,
    "ja": ja.TRANSLATIONS,
    "ko": ko.TRANSLATIONS,
    "es": es.TRANSLATIONS,
    "fr": fr.TRANSLATIONS,
    "de": de.TRANSLATIONS,
    "pt": pt.TRANSLATIONS,
    "it": it.TRANSLATIONS,
    "ru": ru.TRANSLATIONS,
    "ar": ar.TRANSLATIONS,
    "hi": hi.TRANSLATIONS,
    "th": th.TRANSLATIONS,
    "vi": vi.TRANSLATIONS,
    "id": id.TRANSLATIONS,
    "tr": tr.TRANSLATIONS,
}

for locale, data in LOCALES.items():
    for slug in EN:
        if slug not in data:
            raise SystemExit(f"Missing {locale}/{slug}")
        if set(data[slug].keys()) != set(EN[slug].keys()):
            missing = set(EN[slug].keys()) - set(data[slug].keys())
            extra = set(data[slug].keys()) - set(EN[slug].keys())
            raise SystemExit(f"Key mismatch {locale}/{slug}: missing={missing} extra={extra}")

json.dump(LOCALES, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"Wrote {OUT} ({len(LOCALES)} locales)")
