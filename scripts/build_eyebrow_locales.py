#!/usr/bin/env python3
"""Build localized eyebrow article files from English source."""

import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src/content/blog/en/best-eyebrow-shapes-face-shape.md"
OUT_DIR = ROOT / "src/content/blog"

LOCALES = {
    "ja": {
        "title": "顔型別・似合う眉の形完全ガイド",
        "description": "卵型、丸顔、四角型、ハート型、面長など、各顔型に似合う眉の形を解説。顔型と眉の関係を理解し、最も似合う眉を見つけましょう。",
        "tags": ["顔型", "眉毛", "ビューティー", "スタイルガイド", "メイク"],
        "related_header": "関連記事",
        "related": [
            ("[顔型別似合う髪型ガイド：7つの顔型に最適なヘアスタイル](/ja/blog/face-shape-hairstyle-guide)", "ヘアスタイル推薦付きの完全顔型ガイド"),
            ("[顔型とパーソナルカラーで選ぶ、本当に似合うメガネの選び方](/ja/blog/glasses-face-shape-color-season)", "顔型ロジックを日常のフレーム選びへ"),
            ("[顔型別・似合うピアススタイル完全ガイド](/ja/blog/best-earring-styles-face-shape)", "同じ比例原則に基づくアクセサリーガイド"),
            ("[カラー分析：完全ガイド](/ja/color-analysis)", "自分に似合う色を見つけるために知っておくべきこと"),
        ],
    },
    "ru": {
        "title": "Лучшие формы бровей для каждой формы лица: полное руководство",
        "description": "Узнайте, какие формы бровей подходят овальному, круглому, квадратному, сердцевидному и вытянутому лицу. Поймите, как форма лица определяет ваши самые выигрышные брови.",
        "tags": ["Форма лица", "Брови", "Красота", "Гид по стилю", "Макияж"],
        "related_header": "Похожие статьи",
        "related": [
            ("[Лучшая причёска для вашей формы лица: 7 типов с визуальными примерами (2026)](/ru/blog/face-shape-hairstyle-guide)", "Полное руководство по формам лица с рекомендациями по причёскам"),
            ("[Как выбрать очки, которые подходят и форме лица, и вашему цветотипу](/ru/blog/glasses-face-shape-color-season)", "Примените логику формы лица к повседневным оправам"),
            ("[Лучшие стили серёг для каждой формы лица — визуальное руководство](/ru/blog/best-earring-styles-face-shape)", "Ещё одно руководство по аксессуарам на тех же принципах пропорций"),
            ("[Анализ цветотипа: Полное руководство](/ru/color-analysis)", "Всё, что нужно знать, чтобы найти свои лучшие цвета"),
        ],
    },
    "ar": {
        "title": "أفضل أشكال الحواجب لكل شكل وجه: دليل شامل",
        "description": "اكتشفي أشكال الحواجب التي تناسب الوجه البيضاوي والمستدير والمربع والقلبي والطويل. تعرفي على كيفية تحديد شكل وجهكِ لأجمل حواجب.",
        "tags": ["شكل الوجه", "الحواجب", "الجمال", "دليل الأناقة", "المكياج"],
        "related_header": "مقالات ذات صلة",
        "related": [
            ("[أفضل تسريحة شعر لشكل وجهكِ: 7 أنواع مع أمثلة مرئية (2026)](/ar/blog/face-shape-hairstyle-guide)", "الدليل الكامل لأشكال الوجه مع توصيات تسريحات الشعر"),
            ("[كيف تختارين نظارات تناسب شكل وجهكِ وفصل ألوانكِ معاً](/ar/blog/glasses-face-shape-color-season)", "طبّقي منطق شكل الوجه على إطاراتكِ اليومية"),
            ("[أفضل أنماط الأقراط لكل شكل وجه — دليل مرئي](/ar/blog/best-earring-styles-face-shape)", "دليل إكسسوارات آخر مبني على نفس مبادئ التناسب"),
            ("[تحليل الألوان: الدليل الكامل](/ar/color-analysis)", "كل ما تحتاجين معرفته للعثور على أفضل ألوانك"),
        ],
    },
    "hi": {
        "title": "हर चेहरे के आकार के लिए सर्वश्रेष्ठ भौंह आकार: पूर्ण गाइड",
        "description": "जानें कि अंडाकार, गोल, वर्ग, हृदयाकार और लंबे चेहरे के लिए कौन से भौंह आकार सबसे अच्छे लगते हैं। समझें कि चेहरे का आकार आपकी सबसे अच्छी भौंह कैसे तय करता है।",
        "tags": ["चेहरे का आकार", "भौंह", "सौंदर्य", "स्टाइल गाइड", "मेकअप"],
        "related_header": "संबंधित लेख",
        "related": [
            ("[आपके चेहरे के आकार के लिए सर्वोत्तम हेयरस्टाइल: 7 प्रकार विज़ुअल उदाहरण सहित (2026)](/hi/blog/face-shape-hairstyle-guide)", "हेयरस्टाइल सिफ़ारिशों सहित पूर्ण फेस शेप गाइड"),
            ("[अपने चेहरे के आकार और कलर सीज़न दोनों के अनुसार चश्मा कैसे चुनें](/hi/blog/glasses-face-shape-color-season)", "फेस शेप लॉजिक को रोज़मर्रा के फ्रेम तक बढ़ाएँ"),
            ("[हर चेहरे के आकार के लिए सर्वश्रेष्ठ झुमके — एक विज़ुअल गाइड](/hi/blog/best-earring-styles-face-shape)", "उसी proportion सिद्धांतों पर आधारित एक और एक्सेसरी गाइड"),
            ("[कलर एनालिसिस: पूरी गाइड](/hi/color-analysis)", "अपने सर्वश्रेष्ठ रंग खोजने के लिए जानने योग्य सब कुछ"),
        ],
    },
    "th": {
        "title": "ทรงคิ้วที่เหมาะกับทุกรูปหน้า: คู่มือฉบับสมบูรณ์",
        "description": "ค้นหาว่ารูปหน้าไข่ กลม สquare หัวใจ และยาว ควรใช้ทรงคิ้วแบบไหน เรียนรู้ว่ารูปหน้ากำหนดคิ้วที่เหมาะกับคุณอย่างไร",
        "tags": ["รูปหน้า", "คิ้ว", "ความงาม", "คู่มือสไตล์", "เมคอัพ"],
        "related_header": "บทความที่เกี่ยวข้อง",
        "related": [
            ("[ทรงผมที่เหมาะกับรูปหน้า: 7 ประเภทพร้อมตัวอย่างภาพ (2026)](/th/blog/face-shape-hairstyle-guide)", "คู่มือรูปหน้าฉบับสมบูรณ์พร้อมคำแนะนำทรงผม"),
            ("[วิธีเลือกแว่นที่เหมาะทั้งรูปหน้าและ Color Season ของคุณ](/th/blog/glasses-face-shape-color-season)", "ขยายตรรกะรูปหน้าไปสู่กรอบแว่นที่ใช้ทุกวัน"),
            ("[ต่างหูที่เหมาะกับทุกรูปหน้า — คู่มือภาพประกอบ](/th/blog/best-earring-styles-face-shape)", "คู่มือแอคเซสซอรี่อีกฉบับที่ใช้หลักสัดส่วนเดียวกัน"),
            ("[Color Analysis: คู่มือฉบับสมบูรณ์](/th/color-analysis)", "ทุกสิ่งที่คุณต้องรู้เพื่อค้นหาสีที่เหมาะกับคุณที่สุด"),
        ],
    },
    "vi": {
        "title": "Dáng lông mày phù hợp nhất cho mọi khuôn mặt: Hướng dẫn đầy đủ",
        "description": "Khám phá dáng lông mày nào hợp với mặt trái xoan, tròn, vuông, trái tim và dài. Hiểu cách khuôn mặt quyết định dáng lông mày đẹp nhất cho bạn.",
        "tags": ["Dạng khuôn mặt", "Lông mày", "Làm đẹp", "Hướng dẫn phong cách", "Trang điểm"],
        "related_header": "Bài viết liên quan",
        "related": [
            ("[Kiểu Tóc Phù Hợp Nhất Cho Dạng Khuôn Mặt: 7 Loại Kèm Ví Dụ Trực Quan (2026)](/vi/blog/face-shape-hairstyle-guide)", "Hướng dẫn đầy đủ về dạng khuôn mặt kèm gợi ý kiểu tóc"),
            ("[Cách chọn kính vừa khuôn mặt vừa mùa màu của bạn](/vi/blog/glasses-face-shape-color-season)", "Mở rộng logic khuôn mặt sang gọng kính hàng ngày"),
            ("[Kiểu Bông Tai Phù Hợp Nhất Cho Mọi Dạng Khuôn Mặt — Hướng Dẫn Trực Quan](/vi/blog/best-earring-styles-face-shape)", "Một hướng dẫn phụ kiện khác dựa trên cùng nguyên tắc tỷ lệ"),
            ("[Phân tích màu sắc: Hướng dẫn đầy đủ](/vi/color-analysis)", "Mọi thứ bạn cần biết để tìm màu phù hợp nhất"),
        ],
    },
    "id": {
        "title": "Bentuk Alis Terbaik untuk Setiap Bentuk Wajah: Panduan Lengkap",
        "description": "Temukan bentuk alis yang cocok untuk wajah oval, bulat, persegi, hati, dan panjang. Pelajari bagaimana bentuk wajah menentukan alis paling cocok untuk Anda.",
        "tags": ["Bentuk Wajah", "Alis", "Kecantikan", "Panduan Gaya", "Makeup"],
        "related_header": "Artikel Terkait",
        "related": [
            ("[Gaya Rambut Terbaik untuk Bentuk Wajah Anda: 7 Tipe dengan Contoh Visual (2026)](/id/blog/face-shape-hairstyle-guide)", "Panduan lengkap bentuk wajah dengan rekomendasi gaya rambut"),
            ("[Cara Memilih Kacamata yang Cocok dengan Bentuk Wajah DAN Color Season Anda](/id/blog/glasses-face-shape-color-season)", "Perluas logika bentuk wajah ke bingkai kacamata sehari-hari"),
            ("[Gaya Anting Terbaik untuk Setiap Bentuk Wajah — Panduan Visual](/id/blog/best-earring-styles-face-shape)", "Panduan aksesori lain berdasarkan prinsip proporsi yang sama"),
            ("[Analisis Warna: Panduan Lengkap](/id/color-analysis)", "Semua yang perlu Anda ketahui untuk menemukan warna terbaik"),
        ],
    },
    "tr": {
        "title": "Her Yüz Şekli İçin En İyi Kaş Şekilleri: Eksiksiz Rehber",
        "description": "Oval, yuvarlak, kare, kalp ve uzun yüzler için hangi kaş şekillerinin daha uygun olduğunu keşfedin. Yüz şeklinizin en uygun kaşlarını nasıl belirlediğini öğrenin.",
        "tags": ["Yüz Şekli", "Kaş", "Güzellik", "Stil Rehberi", "Makyaj"],
        "related_header": "İlgili Makaleler",
        "related": [
            ("[Yüz Şeklinize En Uygun Saç Modeli: 7 Tip Görsel Örneklerle (2026)](/tr/blog/face-shape-hairstyle-guide)", "Saç modeli önerileriyle eksiksiz yüz şekli rehberi"),
            ("[Yüz Şeklinize VE Renk Mevsiminize Uygun Gözlük Nasıl Seçilir](/tr/blog/glasses-face-shape-color-season)", "Yüz şekli mantığını günlük gözlük çerçevelerinize taşıyın"),
            ("[Her Yüz Şekli İçin En İyi Küpe Modelleri — Görsel Rehber](/tr/blog/best-earring-styles-face-shape)", "Aynı orantı ilkelerine dayanan bir aksesuar rehberi daha"),
            ("[Renk Analizi: Eksiksiz Rehber](/tr/color-analysis)", "En iyi renklerinizi bulmak için bilmeniz gereken her şey"),
        ],
    },
}

LANG_MAP = {
    "ja": "ja",
    "ru": "ru",
    "ar": "ar",
    "hi": "hi",
    "th": "th",
    "vi": "vi",
    "id": "id",
    "tr": "tr",
}


def extract_body(text: str) -> str:
    return text.split("---", 2)[2].lstrip("\n")


def protect(text: str) -> tuple[str, list[tuple[str, str]]]:
    patterns = [
        (r"\[[^\]]+\]\([^\)]+\)", "LINK"),
        (r"https?://[^\s\)]+", "URL"),
        (r"\*\*[^*]+\*\*", "BOLD"),
        (r"\|[^\n]+\|", "TABLE"),
        (r"^#{1,3} .+$", "HEAD"),
        (r"^---$", "HR"),
    ]
    tokens: list[tuple[str, str]] = []
    out = text

    def repl(kind):
        def _r(m):
            key = f"__{kind}_{len(tokens)}__"
            tokens.append((key, m.group(0)))
            return key

        return _r

    for pat, kind in patterns:
        out = re.sub(pat, repl(kind), out, flags=re.MULTILINE)

    return out, tokens


def restore(text: str, tokens: list[tuple[str, str]]) -> str:
    for key, val in tokens:
        text = text.replace(key, val)
    return text


def translate_chunk(text: str, target: str) -> str:
    if not text.strip():
        return text
    translator = GoogleTranslator(source="en", target=target)
    # Split by paragraphs to avoid length limits
    parts = text.split("\n\n")
    out = []
    for part in parts:
        if not part.strip():
            out.append(part)
            continue
        protected, tokens = protect(part)
        try:
            translated = translator.translate(protected)
        except Exception:
            time.sleep(1)
            translated = translator.translate(protected)
        out.append(restore(translated, tokens))
        time.sleep(0.15)
    return "\n\n".join(out)


def fix_internal_links(body: str, locale: str) -> str:
    body = body.replace("/en/blog/", f"/{locale}/blog/")
    body = body.replace("/en/color-analysis", f"/{locale}/color-analysis")
    return body


def build_related(meta: dict) -> str:
    lines = [f"## {meta['related_header']}", ""]
    for link, desc in meta["related"]:
        lines.append(f"- {link} — {desc}")
    return "\n".join(lines)


def assemble(locale: str, meta: dict, body: str) -> str:
    tags = ", ".join(f'"{t}"' for t in meta["tags"])
    # Remove old related section if present
    body = re.sub(r"\n## Related Articles[\s\S]*$", "", body)
    body = re.sub(r"\n## 関連記事[\s\S]*$", "", body)
    body = fix_internal_links(body.rstrip(), locale)
    related = build_related(meta)
    front = f"""---
title: "{meta['title']}"
description: "{meta['description']}"
date: 2026-09-17
category: face_shape
tags: [{tags}]
image: "/images/blog/best-eyebrow-shapes-face-shape.webp"
---

"""
    return front + body + "\n\n---\n\n" + related + "\n"


def main():
    src_text = SRC.read_text(encoding="utf-8")
    body = extract_body(src_text)
    # Remove English related section
    body = re.sub(r"\n## Related Articles[\s\S]*$", "", body).rstrip()

    for locale, meta in LOCALES.items():
        print(f"Translating {locale}...")
        translated = translate_chunk(body, LANG_MAP[locale])
        out = assemble(locale, meta, translated)
        path = OUT_DIR / locale / "best-eyebrow-shapes-face-shape.md"
        path.write_text(out, encoding="utf-8")
        print(f"  wrote {path}")


if __name__ == "__main__":
    main()
