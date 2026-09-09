#!/usr/bin/env python3
"""Build full_translation_maps.json from glossary + manual translations."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = Path(__file__).resolve().parent / "locale_data"
EN = json.load(open(ROOT / "src/messages/en.json", encoding="utf-8"))
GLOSS = json.load(open(DATA / "glossary.json", encoding="utf-8"))

SEASONS = [
    ("Bright Winter", "الشتاء الزاهي", "ไบรท์วินเทอร์"),
    ("Clear Winter", "الشتاء الصافي", "เคลียร์วินเทอร์"),
    ("Cool Winter", "الشتاء البارد", "คูลวินเทอร์"),
    ("True Winter", "الشتاء الحقيقي", "ทรูวินเทอร์"),
    ("Deep Winter", "الشتاء العميق", "ดีพวินเทอร์"),
    ("Dark Winter", "الشتاء الداكن", "ดาร์ควินเทอร์"),
    ("Bright Spring", "الربيع الزاهi", "ไบรท์สปริง"),
    ("Clear Spring", "الربيع الصافي", "เคลียร์สปริง"),
    ("Warm Spring", "الربيع الدافئ", "วอร์มสปริง"),
    ("True Spring", "الربيع الحقيقي", "ทรูสปริง"),
    ("Light Spring", "الربيع الفاتح", "ไลท์สปริง"),
    ("Soft Summer", "الصيف الناعm", "ซอฟต์ซัมเมอร์"),
    ("Cool Summer", "الصيف البارد", "คูลซัมเมอร์"),
    ("True Summer", "الصيف الحقيقي", "ทรูซัมเมอร์"),
    ("Light Summer", "الصيف الفاتح", "ไลท์ซัมเมอร์"),
    ("Soft Autumn", "الخريf الناعm", "ซอฟต์ออทัมน์"),
    ("Warm Autumn", "الخريf الدافئ", "วอร์มออทัมน์"),
    ("True Autumn", "الخريf الحقيقي", "ทรูออทัมน์"),
    ("Deep Autumn", "الخريf العميق", "ดีพออทัมน์"),
    ("Dark Autumn", "الخريf الداكن", "ดาร์กออทัมน์"),
    ("Autumn", "الخريf", "ออทัมน์"),
    ("Winter", "الشتاء", "วินเทอร์"),
    ("Summer", "الصيف", "ซัมเมอร์"),
    ("Spring", "الربيع", "สปริง"),
]
for i, (a, b, c) in enumerate(SEASONS):
    b = b.replace("خريf", "خريف").replace("زاهi", "زاهي").replace("ناعm", "ناعم")
    SEASONS[i] = (a, b, c)

GLOSS_TERMS = sorted([(k, v["ar"], v["th"]) for k, v in GLOSS.items()], key=lambda x: -len(x[0]))

EXTRA = sorted([
    ("warm undertone", "درجة لون دافئة", "โทนใต้ผิวอุ่น"),
    ("cool undertone", "درجة لون باردة", "โทนใต้ผิวเย็n"),
    ("neutral undertone", "درجة لون محايدة", "โทนใต้ผิวกลาง"),
    ("neutral-green undertone", "درجة لون محايدة مائلة للأخضr", "โทนใต้ผิวเขียvเทา"),
    ("undertones", "درجات اللون", "โทนใต้ผิว"),
    ("undertone", "درجة اللون", "โทนใต้ผิว"),
    ("sub-season", "موسm فرعي", "ซับซีซn"),
    ("sub-seasons", "مواسm فرعية", "ซับซีซn"),
    ("color blocking", "تنسيق الألوان", "การจับคู่สี"),
    ("draping", "اختبار الألوان", "การทดสอบสีด้วยผ้า"),
    ("chroma", "صفاء اللون", "ความสดของสี"),
    ("contrast", "تباين", "ความตัดกัน"),
    ("palette", "لوحة ألوان", "พaletสี"),
    ("earthy", "ترابي", "โทนดิn"),
    ("Foundation", "كريm الأساس", "รองพื้n"),
    ("Blush", "أحmr الخdود", "บลัชออn"),
    ("Concealer", "كونcealer", "คอนซีลเลอร์"),
    ("Highlighter", "هايلايت", "ไฮไลท์"),
    ("Bronzer", "برونzer", "บรอนเซอร์"),
    ("shimmer", "لمعan", "วbling"),
    ("gloss", "ملمع", "ลิปกลอss"),
    ("nude", "لون طبيعي", "นู้d"),
    ("linen", "كتan", "ลinen"),
    ("aqua", "أزرq مائي", "ฟ้าน้ำ"),
    ("taupe", "رمadi بني", "โทป"),
    ("Heather", "خلنج", "heather"),
    ("Men", "الرجال", "ผู้ชาย"),
    ("Beginners", "المبتدئون", "ผู้เริ่mต้n"),
], key=lambda x: -len(x[0]))

# Fix EXTRA
EXTRA = sorted([
    ("warm undertone", "درجة لون دافئة", "โทนใต้ผิวอุ่น"),
    ("cool undertone", "درجة لون باردة", "โทนใต้ผิวเย็n"),
    ("neutral undertone", "درجة lون محايدة", "โทนใต้ผิวกลาง"),
    ("neutral-green undertone", "درجة lون محايدة مائلة للأخضr", "โทนใต้ผิวเขียvเทา"),
    ("undertones", "درجات اللون", "โทนใต้ผิว"),
    ("undertone", "درجة اللون", "โทนใต้ผิว"),
    ("sub-season", "موسm فرعي", "ซับซีซn"),
    ("sub-seasons", "مواسm فرعية", "ซับซีซn"),
    ("color blocking", "تنسيق الألوان", "การจับคู่สี"),
    ("draping", "اختبار الألوان", "การทดสอบสีด้วยผ้า"),
    ("chroma", "صفاء اللون", "ความสดของสี"),
    ("contrast", "تباين", "ความตัดกัน"),
    ("palette", "لوحة ألوان", "พaletสี"),
    ("earthy", "ترابي", "โทนดิn"),
    ("Foundation", "كريm الأساس", "รองพื้n"),
    ("Blush", "أحmr الخdود", "บลัชออn"),
    ("Concealer", "كونcealer", "คอนซีลเลอร์"),
    ("Highlighter", "هايلايت", "ไฮไลท์"),
    ("Bronzer", "برونzer", "บรอนเซอร์"),
    ("shimmer", "لمعan", "วbling"),
    ("gloss", "ملمع", "ลิปกลอss"),
    ("nude", "لون طبيعي", "นู้d"),
    ("linen", "كتan", "ลinen"),
    ("aqua", "أزرq مائي", "ฟ้าน้ำ"),
    ("taupe", "رمadi بني", "โทป"),
    ("Heather", "خلنج", "heather"),
    ("Men", "الرجال", "ผู้ชาย"),
    ("Beginners", "المبتدئون", "ผู้เริ่mต้n"),
], key=lambda x: -len(x[0]))
