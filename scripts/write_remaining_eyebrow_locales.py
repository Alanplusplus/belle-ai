#!/usr/bin/env python3
"""Write remaining eyebrow locale files with pre-translated bodies."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src/content/blog"

COMMON = {
    "date": "2026-09-17",
    "category": "face_shape",
    "image": "/images/blog/best-eyebrow-shapes-face-shape.webp",
}

LOCALES = {
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
}


def assemble(locale: str, meta: dict, body_path: Path) -> str:
    body = body_path.read_text(encoding="utf-8").strip()
    tags = ", ".join(f'"{t}"' for t in meta["tags"])
    related = "\n".join(f"- {a} — {d}" for a, d in meta["related"])
    return f"""---
title: "{meta['title']}"
description: "{meta['description']}"
date: {COMMON['date']}
category: {COMMON['category']}
tags: [{tags}]
image: "{COMMON['image']}"
---

{body}

---

## {meta['related_header']}

{related}
"""


def main():
    bodies_dir = Path(__file__).parent / "eyebrow_bodies"
    for locale, meta in LOCALES.items():
        body_file = bodies_dir / f"{locale}.md"
        if not body_file.exists():
            print(f"MISSING body: {body_file}")
            continue
        out = ROOT / locale / "best-eyebrow-shapes-face-shape.md"
        out.write_text(assemble(locale, meta, body_file), encoding="utf-8")
        print(f"Wrote {out}")


if __name__ == "__main__":
    main()
