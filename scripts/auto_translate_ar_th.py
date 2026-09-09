#!/usr/bin/env python3
"""Auto-translate sd+ad EN strings to AR/TH via Google Translate + clean glossary."""
import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

MESSAGES = Path(__file__).resolve().parent.parent / "src/messages"
DATA = Path(__file__).resolve().parent / "locale_data"
EN = json.load(open(MESSAGES / "en.json", encoding="utf-8"))

BRANDS = {
    "AI", "Belle", "BB", "TikTok", "Instagram", "NARS", "MAC", "Fenty", "MLBB",
    "퍼스널컬러", "パーソナルカラー", "春", "夏", "秋", "冬",
}

def load_glossary(path: Path, lang_key: str) -> list[tuple[str, str]]:
    if not path.exists():
        return []
    data = json.load(open(path, encoding="utf-8"))
    items = [(k, v[lang_key]) for k, v in data.items()]
    items.sort(key=lambda x: -len(x[0]))
    return items

SEASONS_AR = [
    ("Bright Winter", "الشتاء الزاهي"), ("Clear Winter", "الشتاء الصافي"),
    ("Cool Winter", "الشتاء البارد"), ("True Winter", "الشتاء الحقيقي"),
    ("Deep Winter", "الشتاء العميق"), ("Dark Winter", "الشتاء الداكن"),
    ("Bright Spring", "الربيع الزاهي"), ("Clear Spring", "الربيع الصافي"),
    ("Warm Spring", "الربيع الدافئ"), ("True Spring", "الربيع الحقيقي"),
    ("Light Spring", "الربيع الفاتح"),
    ("Soft Summer", "الصيف الناعم"), ("Cool Summer", "الصيف البارد"),
    ("True Summer", "الصيف الحقيقي"), ("Light Summer", "الصيف الفاتح"),
    ("Soft Autumn", "الخريف الناعم"), ("Warm Autumn", "الخريف الدافئ"),
    ("True Autumn", "الخريف الحقيقي"), ("Deep Autumn", "الخريف العميق"),
    ("Dark Autumn", "الخريف الداكن"),
    ("Autumn", "الخريف"), ("Winter", "الشتاء"), ("Summer", "الصيف"), ("Spring", "الربيع"),
]
SEASONS_TH = [
    ("Bright Winter", "ไบรท์วินเทอร์"), ("Clear Winter", "เคลียร์วินเทอร์"),
    ("Cool Winter", "คูลวินเทอร์"), ("True Winter", "ทรูวินเทอร์"),
    ("Deep Winter", "ดีพวินเทอร์"), ("Dark Winter", "ดาร์ควินเทอร์"),
    ("Bright Spring", "ไบรท์สปริง"), ("Clear Spring", "เคลียร์สปริง"),
    ("Warm Spring", "วอร์มสปริง"), ("True Spring", "ทรูสปริง"),
    ("Light Spring", "ไลท์สปริง"),
    ("Soft Summer", "ซอฟต์ซัมเมอร์"), ("Cool Summer", "คูลซัมเมอร์"),
    ("True Summer", "ทรูซัมเมอร์"), ("Light Summer", "ไลท์ซัมเมอร์"),
    ("Soft Autumn", "ซอฟต์ออทัมน์"), ("Warm Autumn", "วอร์มออทัมน์"),
    ("True Autumn", "ทรูออทัมน์"), ("Deep Autumn", "ดีพออทัมน์"), ("Dark Autumn", "ดาร์กออทัมน์"),
    ("Autumn", "ออทัมน์"), ("Winter", "วินเทอร์"), ("Summer", "ซัมเมอร์"), ("Spring", "สปริง"),
]

_gloss = load_glossary(DATA / "glossary.json", "ar") if (DATA / "glossary.json").exists() else []
GLOSSARY_AR = _gloss
GLOSSARY_TH = [(k, v["th"]) for k, v in json.load(open(DATA / "glossary.json", encoding="utf-8")).items()] if (DATA / "glossary.json").exists() else []


def protect_brands(text: str) -> tuple[str, dict]:
    placeholders = {}
    out = text
    for i, b in enumerate(sorted(BRANDS, key=len, reverse=True)):
        if b in out:
            key = f"⟦BR{i}⟧"
            placeholders[key] = b
            out = out.replace(b, key)
    return out, placeholders


def restore_brands(text: str, placeholders: dict) -> str:
    for k, v in placeholders.items():
        text = text.replace(k, v)
    return text


def post_process(text: str, lang: str) -> str:
    items = (SEASONS_AR + GLOSSARY_AR) if lang == "ar" else (SEASONS_TH + GLOSSARY_TH)
    for en, loc in items:
        if en in text:
            text = text.replace(en, loc)
    return text


def find_english(text: str) -> list[str]:
    return [w for w in re.findall(r"[A-Za-z]{3,}", text) if w not in BRANDS]


def translate_one(translator, text: str) -> str:
    protected, ph = protect_brands(text)
    for attempt in range(4):
        try:
            result = translator.translate(protected)
            return restore_brands(result or text, ph)
        except Exception as e:
            print(f"    retry {attempt+1}: {e}")
            time.sleep(1.5 * (attempt + 1))
    return text


def main():
    unique = sorted(set(
        v for sec in ("sd", "ad") for cat in EN[sec].values() for v in cat.values()
    ))
    print(f"Translating {len(unique)} strings...")
    ar_trans = GoogleTranslator(source="en", target="ar")
    th_trans = GoogleTranslator(source="en", target="th")
    ar_map, th_map = {}, {}
    for i, en in enumerate(unique):
        if i % 25 == 0:
            print(f"  {i}/{len(unique)}...")
        ar_map[en] = post_process(translate_one(ar_trans, en), "ar")
        th_map[en] = post_process(translate_one(th_trans, en), "th")
        time.sleep(0.12)
    json.dump(ar_map, open(DATA / "en_ar_map.json", "w"), ensure_ascii=False, indent=2)
    json.dump(th_map, open(DATA / "en_th_map.json", "w"), ensure_ascii=False, indent=2)
    for lang, m in [("ar", ar_map), ("th", th_map)]:
        bad = sum(1 for v in m.values() if find_english(v))
        print(f"{lang}: {bad}/{len(m)} with english remaining")


if __name__ == "__main__":
    main()
