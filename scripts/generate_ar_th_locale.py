#!/usr/bin/env python3
"""Generate and apply complete Arabic/Thai sd+ad translations from EN with glossaries."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "src/messages"
EN = json.load(open(MESSAGES / "en.json", encoding="utf-8"))

BRANDS = {
    "Belle", "AI", "NARS", "MAC", "Fenty", "TikTok", "Instagram", "BB", "MLBB",
    "퍼스널컬러", "パーソナルカラー", "春", "夏", "秋", "冬", "K", "J",
}

# --- Season / alt name phrases (longest first) ---
SEASON_AR = [
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
    ("Spring", "الربيع"), ("Summer", "الصيف"), ("Autumn", "الخريف"), ("Winter", "الشتاء"),
]

SEASON_TH = [
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
    ("Spring", "สปริง"), ("Summer", "ซัมเมอร์"), ("Autumn", "ออทัมน์"), ("Winter", "วินเทอร์"),
]

# Exact EN -> AR for all unique strings (populated below from hand translations + rules)
# Load external maps if present
MAP_DIR = Path(__file__).resolve().parent / "locale_data"

def find_english(text: str) -> list[str]:
    return [w for w in re.findall(r"[A-Za-z]{2,}", text) if w not in BRANDS]


def apply_season_phrases(text: str, season_map: list[tuple[str, str]]) -> str:
    for en, loc in season_map:
        text = re.sub(re.escape(en), loc, text, flags=re.IGNORECASE)
    return text


# Hand-crafted exact translations for every unique EN value
# Generated from en.json sd+ad unique set — see locale_data/en_unique.txt

def load_or_build_maps():
    ar_path = MAP_DIR / "en_ar_map.json"
    th_path = MAP_DIR / "en_th_map.json"
    if ar_path.exists() and th_path.exists():
        return json.load(open(ar_path, encoding="utf-8")), json.load(open(th_path, encoding="utf-8"))
    raise SystemExit(
        "Missing en_ar_map.json / en_th_map.json — run build_locale_maps.py first"
    )


def apply_maps(locale: dict, ar_map: dict, th_map: dict, lang: str):
    m = ar_map if lang == "ar" else th_map
    for section in ("sd", "ad"):
        for cat, data in EN[section].items():
            locale[section][cat] = {}
            for k, v in data.items():
                if v not in m:
                    raise KeyError(f"Missing {lang} translation for: {v[:80]!r}")
                locale[section][cat][k] = m[v]


CG_AR = {
    "fr0": "ما هو تحليل الألوان؟ مقدمة شاملة",
    "fr1": "كيفية إجراء تحليل الألوان في المنزل",
    "fr2": "ما هو موسم ألواني؟ اكتشف الآن",
    "fr3": "الدرجة الباردة مقابل الدافئة: 5 اختبارات س easy",
    "fr4": "العلم وراء تحليل الألوان الشخصية",
    "fr5": "الذكاء الاصطناعي مقابل التحليل الاحترافي للألوان",
    "fr6": "لماذا اختبارات تحليل الألوان خاطئة",
    "fr7": "كيفية تحديد درجة لون بشرتك",
    "methodProTitle": "اختبار الألوان الاحترافي",
    "methodProDesc": "استشارة شخصية يقوم فيها خبير ألوان مدرب بوضع قماش ملون قرب وجهك ومراقبة تأثير كل لون على بشرتك. المعيار الذهبي للدقة، خاصة في الحالات الغامضة.",
    "aiVsPro": "الذكاء الاصطناعي مقابل الاحترافي",
    "aiPro0": "مجاني/بأسعار معقولة",
    "aiPro1": "فوري (60 ثانية)",
    "aiPro2": "على مدار الساعة",
    "aiPro3": "موbjective",
    "quizPro0": "بدون صورة",
    "quizPro1": "دقيقتان",
    "quizPro2": "بداية جيدة",
    "quizPro3": "مجاني",
    "proPro0": "الأكثر دقة",
    "proPro1": "خبير",
    "proPro2": "عينات ألوان",
    "proPro3": "أسئلة وأجوبة",
}

CG_TH = {
    "fr0": "การวิเคราะห์สีคืออะไร? คู่มือแนะนำฉบับสมบูรณ์",
    "fr1": "วิธีวิเคราะห์สีที่บ้าน",
    "fr2": "ฉันเป็นฤดูสีอะไร? ค้นหาเลย",
    "fr3": "โทนเย็น กับ โทนอุ่น: 5 วิธีทดสอบง่ายๆ",
    "fr4": "วิทยาศาสตร์เบื้องหลังการวิเคราะห์สีส่วนบุคคล",
    "fr5": "การวิเคราะห์สีด้วย AI กับผู้เชี่ยวชาญ",
    "fr6": "ทำไมแบบทดสอบการวิเคราะห์สีถึงผิด",
    "fr7": "วิธีหาโทนใต้ผิวของคุณ",
    "methodProTitle": "การทดสอบสีโดยผู้เชี่ยวชาญ",
    "methodProDesc": "การปรึกษาแบบตัวต่อตัว ผู้เชี่ยวชาญสีจะถือผ้าสีต่างๆ ไว้ใกล้ใบหน้าและสังเกตว่าแต่ละสีส่งผลต่อผิวอย่างไร มาตรฐานทองคำด้านความแม่นยำ โดยเฉพาะกรณีที่กำหนดยาก",
    "aiVsPro": "AI กับผู้เชี่ยวชาญ",
    "aiPro0": "ฟรี/ราคาไม่แพง",
    "aiPro1": "ทันที (60 วินาที)",
    "aiPro2": "ตลอดเวลา",
    "aiPro3": "เป็นกลาง",
    "quizPro0": "ไม่ต้องใช้รูป",
    "quizPro1": "2 นาที",
    "quizPro2": "จุดเริ่มต้นที่ดี",
    "quizPro3": "ฟรี",
    "proPro0": "แม่นยำที่สุด",
    "proPro1": "ผู้เชี่ยวชาญ",
    "proPro2": "ตัวอย่างสี",
    "proPro3": "ถาม-ตอบ",
}


def main():
    ar_map, th_map = load_or_build_maps()
    for lang, cg in [("ar", CG_AR), ("th", CG_TH)]:
        path = MESSAGES / f"{lang}.json"
        locale = json.load(open(path, encoding="utf-8"))
        apply_maps(locale, ar_map, th_map, lang)
        for k, v in cg.items():
            locale["colorGuide"][k] = v
        with open(path, "w", encoding="utf-8") as f:
            json.dump(locale, f, ensure_ascii=False, indent=2)
            f.write("\n")
        json.load(open(path, encoding="utf-8"))
        bad = []
        for section in ("sd", "ad"):
            for cat, data in locale[section].items():
                for k, v in data.items():
                    eng = find_english(v)
                    if eng:
                        bad.append(f"{section}.{cat}.{k}: {eng[:3]}")
        print(f"{lang}.json: updated sd+ad+cg, {len(bad)} english issues")
        if bad:
            for b in bad[:15]:
                print(f"  {b}")


if __name__ == "__main__":
    main()
