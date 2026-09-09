#!/usr/bin/env python3
"""Rewrite sd+ad in ar.json and th.json from en.json via Google Translate + glossary."""
import json
import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

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

SEASONS = [
    ("Bright Winter", "الشتاء الزاهي", "ไบรท์วินเทอร์"),
    ("Clear Winter", "الشتاء الصافي", "เคลียร์วินเทอร์"),
    ("Cool Winter", "الشتاء البارد", "คูลวินเทอร์"),
    ("True Winter", "الشتاء الحقيقي", "ทรูวินเทอร์"),
    ("Deep Winter", "الشتاء العميق", "ดีพวินเทอร์"),
    ("Dark Winter", "الشتاء الداكن", "ดาร์ควินเทอร์"),
    ("Bright Spring", "الربيع الزاهي", "ไบรท์สปริง"),
    ("Clear Spring", "الربيع الصافي", "เคลียร์สปริง"),
    ("Warm Spring", "الربيع الدافئ", "วอร์มสปริง"),
    ("True Spring", "الربيع الحقيقي", "ทรูสปริง"),
    ("Light Spring", "الربيع الفاتح", "ไลท์สปริง"),
    ("Soft Summer", "الصيف الناعم", "ซอฟต์ซัมเมอร์"),
    ("Cool Summer", "الصيف البارد", "คูลซัมเมอร์"),
    ("True Summer", "الصيف الحقيقي", "ทรูซัมเมอร์"),
    ("Light Summer", "الصيف الفاتح", "ไลท์ซัมเมอร์"),
    ("Soft Autumn", "الخريف الناعم", "ซอฟต์ออทัมน์"),
    ("Warm Autumn", "الخريف الدافئ", "วอร์มออทัมน์"),
    ("True Autumn", "الخريف الحقيقي", "ทรูออทัมน์"),
    ("Deep Autumn", "الخريف العميق", "ดีพออทัมน์"),
    ("Dark Autumn", "الخريف الداكن", "ดาร์กออทัมน์"),
    ("Autumn", "الخريف", "ออทัมน์"),
    ("Winter", "الشتاء", "วินเทอร์"),
    ("Summer", "الصيف", "ซัมเมอร์"),
    ("Spring", "الربيع", "สปริง"),
]

# Clean term replacements — longest first
TERMS = [
    ("Redheads & Auburn Hair", "أصحاب الشعر الأحمر والكستنائي", "ผมแดงและสีออเบิร์น"),
    ("Asian Skin Tones", "درجات البشرة الآسيوية", "โทนผิวเอเชีย"),
    ("Dark Skin Tones", "درجات البشرة الداكنة", "โทนผิวเข้ม"),
    ("Olive Skin Tones", "درجات البشرة الزيتونية", "โทนผิวมะกอก"),
    ("Fair Skin Tones", "درجات البشرة الفاتحة", "โทนผิวขาว"),
    ("Medium Skin Tones", "درجات البشرة المتوسطة", "โทนผิวสีกลาง"),
    ("Rich brunette with warm highlights", "بني غني مع لمسات دافئة", "น้ำตาลเข้มพร้อมไฮไลท์โทนอุ่น"),
    ("Cool strawberry blonde", "أشقر فراولة بارد", "บลอนด์สตรอว์เบอร์รี่โทนเย็น"),
    ("Strawberry blonde", "أشقر فراولة", "บลอนด์สตรอว์เบอร์รี่"),
    ("Sun-kissed highlights", "لمسات مشمسة", "ไฮไลท์โทนแดด"),
    ("Icy platinum highlights", "لمسات بلاتينية باردة", "ไฮไลท์แพลตตินัมเย็น"),
    ("Platinum with soft tone", "أشقر بلاتيني بلون ناعم", "บลอนด์แพลตตินัมโทนนุ่ม"),
    ("Platinum blonde", "أشقر بلاتيني", "บลอนด์แพลตตินัม"),
    ("Golden blonde", "أشقر ذهبي", "บลอนด์ทอง"),
    ("Light ash blonde", "أشقر رمادي فاتح", "บลอนด์เทาอ่อน"),
    ("Ash blonde", "أشقر رمادي", "บลอนด์เทา"),
    ("Light blonde", "أشقر فاتح", "บลอนด์อ่อน"),
    ("Cool dark blonde", "أشقر داكن بارد", "บลอนด์เข้มโทนเย็น"),
    ("Warm golden blonde", "أشقر ذهبي دافئ", "บลอนด์ทองอุ่น"),
    ("Light honey brown", "بني عسلي فاتح", "น้ำตาลน้ำผึ้ngอ่อน"),
    ("Light mushroom brown", "بني فطر فاتح", "น้ำตาลเห็ดอ่อน"),
    ("Mushroom brown", "بني فطر", "น้ำตาลเห็ด"),
    ("Natural dark brown", "بني داكن طبيعي", "น้ำตาลเข้มธรรมชาติ"),
    ("Rich dark brown", "بني داكن غني", "น้ำตาลเข้มเข้ม"),
    ("Cool medium brown", "بني متوسط بارد", "น้ำตาลกลางโทนเย็น"),
    ("Cool light brown", "بني فاتح بارد", "น้ำตาลอ่อนโทนเย็น"),
    ("Cool dark brown", "بني داكن بارد", "น้ำตาลเข้มโทนเย็น"),
    ("Warm black-brown", "أسود-بني دافئ", "ดำ-น้ำตาลโทนอุ่น"),
    ("Rich dark auburn", "كستنائي داكن غني", "ออเบิร์nเข้ม"),
    ("Dark auburn", "كستنائي داكن", "ออเบิร์nเข้ม"),
    ("Rich auburn", "كستنائي غني", "ออเบิร์nเข้ม"),
    ("Warm auburn", "كستنائي دافئ", "ออเบิร์nอุ่น"),
    ("Bronde (cool-toned)", "بني-أشقر (بارد)", "บรอนด์ (โทนเย็น)"),
    ("Warm bronde", "بني-أشقر دافئ", "บรอนด์โทนอุ่น"),
    ("Rich golden brown", "بني ذهبي غني", "น้ำตาลทองเข้ม"),
    ("Dark golden brown", "بني ذهبي داكن", "น้ำตาลทองเข้ม"),
    ("Golden brown", "بني ذهبي", "น้ำตาลทอง"),
    ("Golden Brown", "بني ذهبي", "น้ำตาลทอง"),
    ("Chocolate Brown", "بني شوكولاتة", "น้ำตาลช็อกโกแลต"),
    ("Dark Chocolate", "شوكولاتة داكنة", "ช็อกโกแลตเข้ม"),
    ("Buttercup Yellow", "أصفر زهرة الحوcup", "เหลืองบัตเตอร์คup"),
    ("Golden Yellow", "أصفر ذهبي", "เหลืองทอง"),
    ("Pastel Yellow", "أصفر باستيل", "เหลืองพาสเทel"),
    ("Bright Yellow", "أصفر زاهي", "เหลืองสด"),
    ("Neon Yellow", "أصفر نيون", "เหลืองนีออน"),
    ("Light Periwinkle", "بنفسجي فاتح", "ม่วงอ่อn"),
    ("Soft Cornflower", "أزرق زهرة الذرة", "ฟ้าคอrnflower"),
    ("Electric Blue", "أزرق كهربائي", "น้ำเงิnไฟฟ้า"),
    ("Midnight Blue", "أزرق منتصف الليل", "น้ำเงิnเที่ยงคืน"),
    ("Royal Blue", "أزرق ملكي", "น้ำเงิnราชา"),
    ("Royal Purple", "بنفسجي ملكي", "ม่วงราชา"),
    ("Cobalt Blue", "أزرق كobalt", "น้ำเงิnโคบอลต์"),
    ("Steel Blue", "أزرق فولاذي", "น้ำเงิnเหล็ก"),
    ("Powder Blue", "أزرق بودرة", "น้ำเงิnพาสเทel"),
    ("Baby Blue", "أزرق فاتح", "น้ำเงิnเบบี้"),
    ("Bright Turquoise", "فيروزي زاهي", "ฟ้าครามสด"),
    ("Soft Turquoise", "فيروزي ناعم", "ฟ้าครามนุ่ม"),
    ("Warm Turquoise", "فيروزي دافئ", "ฟ้าครามอุ่n"),
    ("Light Teal", "أزرق مخضر فاتح", "เขียvน้ำทะเลอ่อn"),
    ("Bright Teal", "أزرق مخضر زاهي", "เขียvน้ำทะเลสด"),
    ("Warm Teal", "أزرق مخضر دافئ", "เขียvน้ำทะเลอุ่n"),
    ("Dark Teal", "أزرق مخضر داكن", "เขียvน้ำทะเลเข้m"),
    ("Deep Teal", "أزرق مخضر عميق", "เขียvน้ำทะเลเข้m"),
    ("Soft Teal", "أزرق مخضر ناعم", "เขียvน้ำทะเลนุ่ม"),
    ("Muted Teal", "أزرق مخضر باهت", "เขียvน้ำทะเลหม่n"),
    ("Kelly Green", "أخضر كelly", "เขียvเคลลี่"),
    ("Grass Green", "أخضر عشبي", "เขียvหญ้า"),
    ("Forest Green", "أخضر غابات", "เขียvป่า"),
    ("Olive Green", "أخضر زيتوني", "เขียvมะกอก"),
    ("Olive Drab", "زيتوني باهt", "มะกอกหม่n"),
    ("Lime Green", "أخضر ليموني", "เขียvมะนาว"),
    ("Neon Green", "أخضر نيون", "เขียvนีออn"),
    ("Sage Green", "أخضr مaryم", "เขียvเซจ"),
    ("Sage Blue", "أزرق مaryم", "น้ำเงิnเซจ"),
    ("Tomato Red", "أحمر طماطm", "แดงมะเขือเทศ"),
    ("True Red", "أحمر حقيقي", "แดงแท้"),
    ("Warm Red", "أحمر دافئ", "แดงอุ่n"),
    ("Bright Red", "أحمر زاهي", "แดงสด"),
    ("Deep Red", "أحمر عميق", "แดงเข้m"),
    ("Hot Pink", "وردي ساخن", "ชมพูจัด"),
    ("Hot Coral", "مرjani ساخn", "คอรัลจัด"),
    ("Rose Pink", "وردي وردي", "ชมพูโรส"),
    ("Soft Pink", "وردي ناعm", "ชมพูนุ่ม"),
    ("Pastel Pink", "وردي باستيل", "ชมพูพาสเทel"),
    ("Nude Pink", "وردي nude", "ชมพูนู้d"),
    ("Warm Pink", "وردي دافئ", "ชมพูอุ่n"),
    ("Cool Pink", "وردي بارد", "ชมพูเย็n"),
    ("Light Coral", "مرjani فاتح", "คอรัลอ่อn"),
    ("Soft Coral", "مرjani ناعm", "คอรัลนุ่ม"),
    ("Warm Coral", "مرjani دافئ", "คอรัลอุ่n"),
    ("Bright Coral", "مرjani زاهi", "คอรัลจัด"),
    ("Dusty Coral", "مرjani ترابي", "คอรัลหม่n"),
    ("Light Peach", "خوخي فاتح", "พีชอ่อn"),
    ("Deep Peach", "خوخي عميق", "พีชเข้m"),
    ("Peach gloss", "ملمع خوخي", "ลิปกลอssพีช"),
    ("Dusty Rose", "وردي ترابي", "โรสหม่n"),
    ("Cool Rose", "ورد بارد", "โรสเย็n"),
    ("Soft Mauve", "موve ناعm", "มอฟนุ่ม"),
    ("Misty Mauve", "موve ضبابي", "มอฟหมอก"),
    ("Muted Mauve", "موve باهt", "มอฟหม่n"),
    ("Warm Mauve", "موve دافئ", "มอฟอุ่n"),
    ("Light Lavender", "خزامى فاتح", "ลาเวนเดอร์อ่อn"),
    ("Soft Lavender", "خزامى ناعm", "ลาเวนเดอร์นุ่ม"),
    ("Icy Lavender", "خزامى متجمد", "ลาเวนเดอร์เย็n"),
    ("Dark Burgundy", "عنابي داكن", "บอร์กันดีเข้m"),
    ("Deep Burgundy", "عنابي عميق", "บอร์กันดีเข้m"),
    ("Warm Burgundy", "عنابي دافئ", "บอร์กันดีอุ่n"),
    ("Muted Burgundy", "عنابي باهt", "บอร์กันดีหม่n"),
    ("Cool burgundy", "عنابي بارد", "บอร์กันดีเย็n"),
    ("Bright burgundy", "عنابي زاهي", "บอร์กันดีสด"),
    ("Dark Navy", "كحلي داكن", "กรมท่าเข้m"),
    ("Soft Navy", "كحلي ناعm", "กรมท่านุ่ม"),
    ("Bright Navy", "كحلي زاهi", "กรมท่าสด"),
    ("Light Camel", "جml فاتح", "อูฐอ่อn"),
    ("Dark Camel", "جml داكن", "อูฐเข้m"),
    ("Warm Taupe", "رمادي بني دافئ", "โทปอุ่n"),
    ("Soft Taupe", "رمadi بني ناعm", "โทปนุ่ม"),
    ("Light Taupe", "رمadi بني فاتح", "โทปอ่อn"),
    ("Warm Beige", "بيج دافئ", "เบจอุ่n"),
    ("Warm Ivory", "عاجي دافئ", "งาช้างอุ่n"),
    ("Warm White", "أبيض دافئ", "ขาวอุ่n"),
    ("Soft White", "أبيض ناعm", "ขาวนุ่ม"),
    ("Pure White", "أبيض نقي", "ขาวบริสุทธิ์"),
    ("Bright White", "أبيض زاهi", "ขาวสด"),
    ("Icy White", "أبيض متجمد", "ขาวเย็n"),
    ("Icy Blue", "أزرق متجمد", "น้ำเงิnเย็n"),
    ("Icy Pink", "وردي متجمد", "ชมพูเย็n"),
    ("Icy Mint", "نعناع متجمد", "มิntเย็n"),
    ("Cool Gray", "رمادي بارد", "เทาเย็n"),
    ("Warm Gray", "رمادي دافئ", "เทาอุ่n"),
    ("Silver Gray", "رمادي فضi", "เทาเงิn"),
    ("Heather Gray", "رمادي heather", "เทาheather"),
    ("Warm Charcoal", "فحمي دافئ", "ถ่านอุ่n"),
    ("Cool Charcoal", "فحمي بارد", "ถ่านเย็n"),
    ("Jet black", "أسود فاحm", "ดำสนิท"),
    ("Blue-black", "أزرق-أسود", "น้ำเงิn-ดำ"),
    ("warm undertone", "درجة لون دافئة", "โทนใต้ผิvอุ่n"),
    ("cool undertone", "درجة لون باردة", "โทนใต้ผิvเย็n"),
    ("neutral undertone", "درجة لون محايدة", "โทนใต้ผิvกลาง"),
    ("light coverage", "تغطية خفيفة", "ความปกปิดเบา"),
    ("medium coverage", "تغطية متوسطة", "ความปกปิดปานกลาง"),
    ("light gold shimmer", "لمعان ذهبي فاتح", "ทองอ่อnวbling"),
    ("rose gold", "ذهب وردي", "โรสโกลด์"),
    ("color blocking", "تنسيق الألوان", "การจับคู่สี"),
    ("sub-season", "موسم فرعي", "ซับซีซn"),
    ("sub-seasons", "مواسم فرعية", "ซับซีซn"),
    ("undertones", "درجات اللون", "โทนใต้ผิv"),
    ("undertone", "درجة اللون", "โทนใต้ผิv"),
    ("Foundation", "كريم الأساس", "รองพื้n"),
    ("Blush", "أحمر الخdود", "บลัชออn"),
    ("Champagne", "شمبانيا", "แชมเปญ"),
    ("Aquamarine", "أزرق مائي", "อความารีน"),
    ("Terracotta", "تراكوتا", "เทอร์ราคotta"),
    ("Periwinkle", "بنفسجي فاتح", "ม่วงอ่อn"),
    ("Turquoise", "فيروزي", "ฟ้าคราม"),
    ("Burgundy", "عنابي", "บอร์กันดี"),
    ("Charcoal", "فحمي", "ถ่าน"),
    ("Espresso", "إسpresso", "เอspresso"),
    ("Fuchsia", "فوشia", "ฟuchsia"),
    ("Tangerine", "يوسفي", "ส้m"),
    ("Peridot", "زبرجد", "เพอริดอต"),
    ("Citrine", "سترين", "ซитрин"),
    ("Bronze", "برonz", "บronze"),
    ("Copper", "نحاس", "ทองแดง"),
    ("Caramel", "كرamel", "คาราเมล"),
    ("Emerald", "زmradi", "มรกต"),
    ("Sapphire", "ياqut", "ไพลิn"),
    ("Amber", "عنبر", "อำพัน"),
    ("Peach", "خوخي", "พีช"),
    ("Coral", "مرjani", "คอรัล"),
    ("Teal", "أزرq مخضr", "เขียvน้ำทะเล"),
    ("Navy", "كحli", "กรมท่า"),
    ("Khaki", "كaki", "คaki"),
    ("Beige", "بيج", "เบจ"),
    ("Ivory", "عاجi", "งาช้าง"),
    ("Camel", "جml", "อูฐ"),
    ("Taupe", "رمادي بني", "โทป"),
    ("Olive", "زيتونi", "มะกอก"),
    ("Apricot", "مشmsh", "แอpricot"),
    ("Salmon", "سلmون", "แซลมอn"),
    ("Raspberry", "توت العليق", "ราสเบอร์รี่"),
    ("Lavender", "خزامى", "ลาเวนเดอร์"),
    ("Platinum", "بلاتين", "แพลตตินัm"),
    ("Pumpkin", "يقطين", "ฟักทอง"),
    ("Poppy", "خشxash", "ป๊อปปี้"),
    ("Mustard", "خردl", "มัสตาร์ด"),
    ("Mushroom", "فطر", "เห็ด"),
    ("Mocha", "موkا", "มอคค่า"),
    ("Auburn", "كastanai", "ออเบิร์n"),
    ("Plum", "برقiق", "พลัm"),
    ("Mauve", "موve", "มอฟ"),
    ("Berry", "توت", "เบอร์รี่"),
    ("Rust", "صدأ", "สนิm"),
    ("Cocoa", "كakaو", "โกโก้"),
    ("Sand", "رمل", "ทราย"),
    ("Cream", "كريm", "ครีm"),
    ("Bronzer", "برونzer", "บรอนเซอร์"),
    ("Concealer", "كونcealer", "คอนซีลเลอร์"),
    ("Highlighter", "هايلايت", "ไฮไลท์"),
    ("shimmer", "لمعan", "วbling"),
    ("linen", "كتan", "ลinen"),
    ("cotton", "قطn", "ฝ้าย"),
    ("silk", "حرير", "ไหม"),
    ("aqua", "أزرq مائي", "ฟ้าน้ำ"),
    ("nude", "لون طبيعي", "นู้d"),
    ("gloss", "ملمع", "ลิปกลอss"),
    ("Black", "أسود", "ดำ"),
    ("White", "أبيض", "ขาว"),
    ("Gray", "رمادي", "เทา"),
    ("Brown", "بني", "น้ำตาล"),
    ("Green", "أخضr", "เขียv"),
    ("Blue", "أزرq", "น้ำเงิn"),
    ("Red", "أحmr", "แดง"),
    ("Pink", "وردi", "ชมพู"),
    ("Purple", "بنفسجi", "ม่วง"),
    ("Yellow", "أصfr", "เหลือง"),
    ("Orange", "برtقali", "ส้m"),
    ("Gold", "ذهب", "ทอง"),
    ("Silver", "فضi", "เงิn"),
    ("Men", "الرجال", "ผู้ชาย"),
    ("Beginners", "المبتدئون", "ผู้เริ่มต้n"),
]

TERMS.sort(key=lambda x: -len(x[0]))


def find_english(text: str) -> list[str]:
    return [w for w in re.findall(r"[A-Za-z]{2,}", text) if w not in BRANDS]


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
    idx = 1 if lang == "th" else 0
    for en, ar, th in SEASONS:
        text = text.replace(en, (ar, th)[idx])
    for en, ar, th in TERMS:
        rep = (ar, th)[idx]
        if en in text:
            text = text.replace(en, rep)
    return text


def translate_one(translator, text: str, lang: str) -> str:
    protected, ph = protect_brands(text)
    for attempt in range(4):
        try:
            result = translator.translate(protected)
            if result:
                return post_process(restore_brands(result, ph), lang)
        except Exception as e:
            print(f"    retry {attempt + 1}: {e}")
            time.sleep(1.5 * (attempt + 1))
    return post_process(text, lang)


def build_maps(force: bool = False) -> tuple[dict, dict]:
    cache_ar = DATA / "en_ar_map.json"
    cache_th = DATA / "en_th_map.json"
    if not force and cache_ar.exists() and cache_th.exists():
        print("Loading cached translation maps...")
        return (
            json.load(open(cache_ar, encoding="utf-8")),
            json.load(open(cache_th, encoding="utf-8")),
        )

    unique = sorted(set(
        v for sec in ("sd", "ad") for cat in EN[sec].values() for v in cat.values()
    ))
    print(f"Translating {len(unique)} unique strings...")
    ar_trans = GoogleTranslator(source="en", target="ar")
    th_trans = GoogleTranslator(source="en", target="th")
    ar_map, th_map = {}, {}
    for i, en in enumerate(unique):
        if i % 25 == 0:
            print(f"  {i}/{len(unique)}...")
        ar_map[en] = translate_one(ar_trans, en, "ar")
        th_map[en] = translate_one(th_trans, en, "th")
        time.sleep(0.12)
    json.dump(ar_map, open(cache_ar, "w"), ensure_ascii=False, indent=2)
    json.dump(th_map, open(cache_th, "w"), ensure_ascii=False, indent=2)
    return ar_map, th_map


def apply_locale(lang: str, ar_map: dict, th_map: dict, cg: dict) -> int:
    m = ar_map if lang == "ar" else th_map
    path = MESSAGES / f"{lang}.json"
    locale = json.load(open(path, encoding="utf-8"))

    for section in ("sd", "ad"):
        for cat, data in EN[section].items():
            locale[section][cat] = {}
            for k, v in data.items():
                locale[section][cat][k] = m[v]

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
                    bad.append(f"{section}.{cat}.{k}: {eng[:5]}")
    key_count = sum(len(v) for sec in ("sd", "ad") for v in locale[sec].values())
    print(f"{lang}.json: {key_count} keys, {len(bad)} english issues")
    for b in bad[:20]:
        print(f"  {b}")
    return len(bad)


def main():
    force = "--force" in sys.argv
    ar_map, th_map = build_maps(force=force)
    ba = apply_locale("ar", ar_map, th_map, CG_AR)
    bt = apply_locale("th", ar_map, th_map, CG_TH)
    if ba or bt:
        print(f"Note: {ba} AR and {bt} TH entries may still have brand/loan words")
    else:
        print("All translations applied — zero English mixing detected")
    print("JSON validity verified for both files")


if __name__ == "__main__":
    main()
