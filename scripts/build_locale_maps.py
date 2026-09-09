#!/usr/bin/env python3
"""Build en_ar_map.json and en_th_map.json from EN source + glossaries + exact overrides."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "src/messages"
OUT = Path(__file__).resolve().parent / "locale_data"
EN = json.load(open(MESSAGES / "en.json", encoding="utf-8"))
ZH = json.load(open(MESSAGES / "zh.json", encoding="utf-8"))

# Collect all unique EN strings from sd+ad
UNIQUE = set()
KEY_PATHS = {}
for section in ("sd", "ad"):
    for cat, data in EN[section].items():
        for k, v in data.items():
            UNIQUE.add(v)
            KEY_PATHS.setdefault(v, []).append(f"{section}.{cat}.{k}")

# --- Exact EN -> AR (all 687 unique values) ---
# Using zh.json as semantic reference; translations in Modern Standard Arabic

EXACT_AR = {
    "Men": "الرجال",
    "Sand": "رملي",
    "Teal": "أزرق مخضر",
    "Sage": "ميرمية",
    "Navy": "كحلي",
    "Rust": "صدئ",
    "Cocoa": "كakaо",
    "Khaki": "كاكي",
    "Beige": "بيج",
    "Cream": "كريمي",
    "Black": "أسود",
    "Olive": "زيتوني",
    "Camel": "جملي",
    "Berry": "توت",
    "Mocha": "موكا",
    "Peach": "خوخي",
    "Poppy": "خشخاش",
    "Orange": "برتقالي",
    "Auburn": "كastanai محمر",
    "Bronze": "برونزي",
    "Salmon": "سلموني",
    "Cobalt": "كobalt",
    "Orchid": "أورchid",
    "Copper": "نحاسي",
    "Pumpkin": "قرع",
    "Heather": "خلنج",
    "Mustard": "خردل",
    "Fuchsia": "فوشيا",
    "Emerald": "زمردي",
    "Caramel": "كراميل",
    "Beginners": "المبتدئون",
    "Foundation": "كريم الأساس",
    "Blush": "أحمر الخدود",
}

# This approach needs all 687 - use zh to bootstrap remaining via comprehensive script output
# Load pre-built maps from hi translations pattern: read zh and map en->zh->manual ar

def zh_bootstrap():
    """Build initial maps from zh structure - placeholder until full EXACT dict."""
    en_to_zh = {}
    for section in ("sd", "ad"):
        for cat in EN[section]:
            for k in EN[section][cat]:
                en_v = EN[section][cat][k]
                zh_v = ZH[section][cat][k]
                en_to_zh[en_v] = zh_v
    return en_to_zh

print(f"Unique EN strings: {len(UNIQUE)}")
print(f"EXACT_AR entries so far: {len(EXACT_AR)}")
print("Need full translation dict - run full build")
