#!/usr/bin/env python3
"""Generate ad-attribute-translations-cache.json from English source strings."""
import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "ad-attribute-translations-cache.json"
EN_FILE = ROOT / "ad-attribute-en.json"

LOCALES = [
    "zh", "ja", "ko", "es", "fr", "de", "pt", "it", "ru", "ar", "hi", "th", "vi", "id", "tr"
]

# deep_translator target codes (cache keys stay as site locale ids)
TARGET_MAP = {
    "zh": "zh-CN",
}

BRANDS = {
    "AI", "Belle", "BB", "TikTok", "Instagram", "NARS", "MAC", "Fenty", "MLBB",
    "퍼스널컬러", "パーソナルカラー",
}

SEASONS = {
    "zh": [
        ("Bright Winter", "明亮冬型"), ("Cool Winter", "冷冬型"), ("Deep Winter", "深冬型"),
        ("Bright Spring", "明亮春型"), ("Warm Spring", "暖春型"), ("Light Spring", "浅春型"),
        ("Soft Summer", "柔夏型"), ("Cool Summer", "冷夏型"), ("Light Summer", "浅夏型"),
        ("Soft Autumn", "柔秋型"), ("Warm Autumn", "暖秋型"), ("Deep Autumn", "深秋型"),
        ("True Autumn", "真秋型"), ("True Summer", "真夏型"),
    ],
    "ja": [
        ("Bright Winter", "ブライトウィンター"), ("Cool Winter", "クールウィンター"), ("Deep Winter", "ディープウィンター"),
        ("Bright Spring", "ブライトスプリング"), ("Warm Spring", "ウォームスプリング"), ("Light Spring", "ライトスプリング"),
        ("Soft Summer", "ソフトサマー"), ("Cool Summer", "クールサマー"), ("Light Summer", "ライトサマー"),
        ("Soft Autumn", "ソフトオータム"), ("Warm Autumn", "ウォームオータム"), ("Deep Autumn", "ディープオータム"),
        ("True Autumn", "トゥルーオータム"), ("True Summer", "トゥルーサマー"),
    ],
    "ko": [
        ("Bright Winter", "브라이트 윈터"), ("Cool Winter", "쿨 윈터"), ("Deep Winter", "딥 윈터"),
        ("Bright Spring", "브라이트 스프링"), ("Warm Spring", "웜 스프링"), ("Light Spring", "라이트 스프링"),
        ("Soft Summer", "소프트 썸머"), ("Cool Summer", "쿨 썸머"), ("Light Summer", "라이트 썸머"),
        ("Soft Autumn", "소프트 오텀"), ("Warm Autumn", "웜 오텀"), ("Deep Autumn", "딥 오텀"),
        ("True Autumn", "트루 오텀"), ("True Summer", "트루 썸머"),
    ],
}


def extract_en():
    return json.load(open(EN_FILE, encoding="utf-8"))


def protect(text):
    ph = {}
    out = text
    for i, b in enumerate(sorted(BRANDS, key=len, reverse=True)):
        if b in out:
            key = f"⟦BR{i}⟧"
            ph[key] = b
            out = out.replace(b, key)
    return out, ph


def restore(text, ph):
    for k, v in ph.items():
        text = text.replace(k, v)
    return text


def post(text, locale):
    for en, loc in SEASONS.get(locale, []):
        text = text.replace(en, loc)
    return text


def translate(translator, text):
    protected, ph = protect(text)
    for attempt in range(4):
        try:
            result = translator.translate(protected)
            return restore(result or text, ph)
        except Exception as e:
            print(f"  retry {attempt+1}: {e}")
            time.sleep(1.5 * (attempt + 1))
    return text


def main():
    en = extract_en()
    cache = {}
    if CACHE.exists():
        cache = json.load(open(CACHE, encoding="utf-8"))

    for locale in LOCALES:
        cache.setdefault(locale, {})
        translator = GoogleTranslator(source="en", target=TARGET_MAP.get(locale, locale))
        for slug, keys in en.items():
            if slug in cache[locale] and len(cache[locale][slug]) == len(keys):
                print(f"skip {locale}/{slug}")
                continue
            print(f"translate {locale}/{slug}")
            cache[locale][slug] = {}
            for k, v in keys.items():
                cache[locale][slug][k] = post(translate(translator, v), locale)
                time.sleep(0.15)
            json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Wrote {CACHE}")


if __name__ == "__main__":
    main()
