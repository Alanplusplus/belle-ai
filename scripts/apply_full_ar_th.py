#!/usr/bin/env python3
"""Apply complete Arabic/Thai sd+ad translations from en_ar_map.json and en_th_map.json."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "src" / "messages"
DATA = Path(__file__).resolve().parent / "locale_data"
EN = json.load(open(MESSAGES / "en.json", encoding="utf-8"))

BRANDS = {
    "AI", "Belle", "BB", "TikTok", "Instagram", "NARS", "MAC", "Fenty", "MLBB",
    "퍼스널컬러", "パーソナルカラー", "春", "夏", "秋", "冬",
}

CG_AR = {
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


def find_english(text: str) -> list[str]:
    return [w for w in re.findall(r"[A-Za-z]{2,}", text) if w not in BRANDS]


def apply(lang: str, ar_map: dict, th_map: dict, cg: dict):
    m = ar_map if lang == "ar" else th_map
    path = MESSAGES / f"{lang}.json"
    locale = json.load(open(path, encoding="utf-8"))
    missing = []
    for section in ("sd", "ad"):
        for cat, data in EN[section].items():
            locale[section][cat] = {}
            for k, v in data.items():
                if v not in m:
                    missing.append(v)
                else:
                    locale[section][cat][k] = m[v]
    if missing:
        print(f"Missing {lang} translations: {len(set(missing))}")
        for s in sorted(set(missing))[:10]:
            print(f"  {s[:80]}")
        sys.exit(1)
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
                if find_english(v):
                    bad.append(f"{section}.{cat}.{k}: {find_english(v)[:3]}")
    print(f"{lang}.json: updated, {len(bad)} english issues")
    if bad:
        for b in bad[:20]:
            print(f"  {b}")
    return len(bad)


def main():
    ar_map = json.load(open(DATA / "en_ar_map.json", encoding="utf-8"))
    th_map = json.load(open(DATA / "en_th_map.json", encoding="utf-8"))
    ba = apply("ar", ar_map, th_map, CG_AR)
    bt = apply("th", ar_map, th_map, CG_TH)
    if ba or bt:
        sys.exit(1)
    print("All translations applied successfully")


if __name__ == "__main__":
    main()
