#!/usr/bin/env python3
"""Apply complete Arabic translations for sd and ad sections in ar.json."""
import json
import re
import importlib.util
from pathlib import Path

MESSAGES = Path(__file__).resolve().parent.parent / "src" / "messages"
EN = json.load(open(MESSAGES / "en.json", encoding="utf-8"))
AR = json.load(open(MESSAGES / "ar.json", encoding="utf-8"))

spec = importlib.util.spec_from_file_location(
    "build_ar_translations",
    Path(__file__).parent / "build_ar_translations.py",
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SD = mod.SD
AD = mod.AD

ALLOWED = {
    "AI", "Belle", "BB", "TikTok", "Instagram", "NARS", "MAC", "Fenty",
    "퍼스널컬러", "パーソナルカラー", "春", "夏", "秋", "冬",
}


def find_english(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]+", text)
    return [w for w in words if w not in ALLOWED and len(w) > 1]


def main():
    for section, data in [("sd", SD), ("ad", AD)]:
        for cat in EN[section]:
            missing = set(EN[section][cat].keys()) - set(data[cat].keys())
            extra = set(data[cat].keys()) - set(EN[section][cat].keys())
            if missing or extra:
                raise SystemExit(f"Key mismatch {section}.{cat}: missing={missing}, extra={extra}")

    AR["sd"] = SD
    AR["ad"] = AD

    cg_fixes = {
        "fr0": "ما هو تحليل الألوان؟ مقدمة شاملة",
        "fr1": "كيفية إجراء تحليل الألوان في المنزل",
        "fr2": "ما هو موسم ألواني؟ اكتشف الآن",
        "fr3": "الدرجة الباردة مقابل الدافئة: 5 اختبارات سهلة",
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
        "aiPro3": "موضوعي",
        "quizPro0": "بدون صورة",
        "quizPro1": "دقيقتان",
        "quizPro2": "بداية جيدة",
        "quizPro3": "مجاني",
        "proPro0": "الأكثر دقة",
        "proPro1": "خبير",
        "proPro2": "عينات ألوان",
        "proPro3": "أسئلة وأجوبة",
    }
    for k, v in cg_fixes.items():
        AR["colorGuide"][k] = v

    with open(MESSAGES / "ar.json", "w", encoding="utf-8") as f:
        json.dump(AR, f, ensure_ascii=False, indent=2)
        f.write("\n")

    json.load(open(MESSAGES / "ar.json", encoding="utf-8"))

    bad = []
    for section in ("sd", "ad"):
        for cat, data in AR[section].items():
            for k, v in data.items():
                eng = find_english(v)
                if eng:
                    bad.append(f"{section}.{cat}.{k}: {eng}")

    updated = sum(len(v) for v in SD.values()) + sum(len(v) for v in AD.values()) + len(cg_fixes)
    print(f"Updated {updated} keys")
    if bad:
        print(f"WARNING: {len(bad)} values still contain English:")
        for b in bad[:50]:
            print(f"  {b}")
        if len(bad) > 50:
            print(f"  ... and {len(bad) - 50} more")
    else:
        print("All values pass English check")


if __name__ == "__main__":
    main()
