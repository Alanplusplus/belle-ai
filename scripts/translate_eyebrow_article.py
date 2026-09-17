#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Translate best-eyebrow-shapes-face-shape article to all 15 locales."""
import os
import re
import time
from deep_translator import GoogleTranslator

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
EN_PATH = os.path.join(BASE, "en", "best-eyebrow-shapes-face-shape.md")
SLUG = "best-eyebrow-shapes-face-shape"
IMAGE = "/images/blog/best-eyebrow-shapes-face-shape.webp"
DATE = "2026-09-17"

LOCALES = {
    "zh": "zh-CN",
    "ja": "ja",
    "ko": "ko",
    "es": "es",
    "fr": "fr",
    "de": "de",
    "pt": "pt",
    "it": "it",
    "ru": "ru",
    "ar": "ar",
    "hi": "hi",
    "th": "th",
    "vi": "vi",
    "id": "id",
    "tr": "tr",
}

META = {
    "zh": {
        "title": "各脸型最佳眉形完整指南",
        "description": "了解鹅蛋脸、圆脸、方脸、心形脸和长脸分别适合哪种眉形。读懂脸型与眉形之间的比例关系，找到最衬你的眉毛。",
        "tags": ["脸型", "眉毛", "美妆", "穿搭指南", "化妆"],
    },
    "ja": {
        "title": "顔型別・似合う眉の形完全ガイド",
        "description": "卵型、丸顔、四角型、ハート型、面長など、各顔型に似合う眉の形を解説。顔型と眉の関係を理解し、最も似合う眉を見つけましょう。",
        "tags": ["顔型", "眉毛", "ビューティー", "スタイルガイド", "メイク"],
    },
    "ko": {
        "title": "얼굴형별 어울리는 눈썹 모양 완벽 가이드",
        "description": "계란형, 둥근형, 사각형, 하트형, 긴 얼굴에 어울리는 눈썹 모양을 알아보세요. 얼굴형과 눈썹의 관계를 이해하고 가장 잘 어울리는 눈썹을 찾아보세요.",
        "tags": ["얼굴형", "눈썹", "뷰티", "스타일 가이드", "메이크업"],
    },
    "es": {
        "title": "Las mejores formas de cejas para cada forma de rostro: guía completa",
        "description": "Descubre qué formas de cejas favorecen rostros ovalados, redondos, cuadrados, en corazón y alargados. Aprende cómo la forma del rostro determina tus cejas más favorecedoras.",
        "tags": ["Forma del rostro", "Cejas", "Belleza", "Guía de estilo", "Maquillaje"],
    },
    "fr": {
        "title": "Les meilleures formes de sourcils pour chaque forme de visage : guide complet",
        "description": "Découvrez quelles formes de sourcils flattent les visages ovales, ronds, carrés, en cœur et allongés. Comprenez comment la forme du visage détermine vos sourcils les plus flatteurs.",
        "tags": ["Forme du visage", "Sourcils", "Beauté", "Guide de style", "Maquillage"],
    },
    "de": {
        "title": "Die besten Augenbrauenformen für jede Gesichtsform: Ein vollständiger Leitfaden",
        "description": "Entdecken Sie, welche Augenbrauenformen ovale, runde, eckige, herzförmige und längliche Gesichter schmeicheln. Erfahren Sie, wie die Gesichtsform Ihre vorteilhaftesten Brauen bestimmt.",
        "tags": ["Gesichtsform", "Augenbrauen", "Beauty", "Stilratgeber", "Make-up"],
    },
    "pt": {
        "title": "As melhores formas de sobrancelha para cada formato de rosto: guia completo",
        "description": "Descubra quais formas de sobrancelha favorecem rostos ovais, redondos, quadrados, em coração e alongados. Aprenda como o formato do rosto determina as suas sobrancelhas mais favorecedoras.",
        "tags": ["Formato de rosto", "Sobrancelha", "Beleza", "Guia de estilo", "Maquiagem"],
    },
    "it": {
        "title": "Le migliori forme di sopracciglia per ogni forma del viso: guida completa",
        "description": "Scopri quali forme di sopracciglia valorizzano visi ovali, rotondi, quadrati, a cuore e allungati. Capisci come la forma del viso determina le sopracciglia più favorevoli.",
        "tags": ["Forma del viso", "Sopracciglia", "Bellezza", "Guida di stile", "Trucco"],
    },
    "ru": {
        "title": "Лучшие формы бровей для каждой формы лица: полное руководство",
        "description": "Узнайте, какие формы бровей подходят овальному, круглому, квадратному, сердцевидному и вытянутому лицу. Поймите, как форма лица определяет ваши самые выигрышные брови.",
        "tags": ["Форма лица", "Брови", "Красота", "Гид по стилю", "Макияж"],
    },
    "ar": {
        "title": "أفضل أشكال الحواجب لكل شكل وجه: دليل شامل",
        "description": "اكتشفي أشكال الحواجب التي تناسب الوجه البيضاوي والمستدير والمربع والقلبي والطويل. تعرفي على كيفية تحديد شكل وجهكِ لأجمل حواجب.",
        "tags": ["شكل الوجه", "الحواجب", "الجمال", "دليل الأناقة", "المكياج"],
    },
    "hi": {
        "title": "हर चेहरे के आकार के लिए सर्वश्रेष्ठ भौंह आकार: पूर्ण गाइड",
        "description": "जानें कि अंडाकार, गोल, वर्ग, हृदयाकार और लंबे चेहरे के लिए कौन से भौंह आकार सबसे अच्छे लगते हैं। समझें कि चेहरे का आकार आपकी सबसे flattering भौंह कैसे तय करता है।",
        "tags": ["चेहरे का आकार", "भौंह", "सौंदर्य", "स्टाइल गाइड", "मेकअप"],
    },
    "th": {
        "title": "ทรงคิ้วที่เหมาะกับทุกรูปหน้า: คู่มือฉบับสมบูรณ์",
        "description": "ค้นหาว่ารูปหน้าไข่ กลม สquare หัวใจ และยาว ควรใช้ทรงคิ้วแบบไหน เรียนรู้ว่ารูปหน้ากำหนดคิ้วที่เหมาะกับคุณอย่างไร",
        "tags": ["รูปหน้า", "คิ้ว", "ความงาม", "คู่มือสไตล์", "เมคอัพ"],
    },
    "vi": {
        "title": "Dáng lông mày phù hợp nhất cho mọi khuôn mặt: Hướng dẫn đầy đủ",
        "description": "Khám phá dáng lông mày nào hợp với mặt trái xoan, tròn, vuông, trái tim và dài. Hiểu cách khuôn mặt quyết định dáng lông mày đẹp nhất cho bạn.",
        "tags": ["Dạng khuôn mặt", "Lông mày", "Làm đẹp", "Hướng dẫn phong cách", "Trang điểm"],
    },
    "id": {
        "title": "Bentuk Alis Terbaik untuk Setiap Bentuk Wajah: Panduan Lengkap",
        "description": "Temukan bentuk alis yang cocok untuk wajah oval, bulat, persegi, hati, dan panjang. Pelajari bagaimana bentuk wajah menentukan alis paling flattering untuk Anda.",
        "tags": ["Bentuk Wajah", "Alis", "Kecantikan", "Panduan Gaya", "Makeup"],
    },
    "tr": {
        "title": "Her Yüz Şekli İçin En İyi Kaş Şekilleri: Eksiksiz Rehber",
        "description": "Oval, yuvarlak, kare, kalp ve uzun yüzler için hangi kaş şekillerinin daha uygun olduğunu keşfedin. Yüz şeklinizin en flattering kaşlarınızı nasıl belirlediğini öğrenin.",
        "tags": ["Yüz Şekli", "Kaş", "Güzellik", "Stil Rehberi", "Makyaj"],
    },
}

REL_HEADERS = {
    "zh": "## 相关文章", "ja": "## 関連記事", "ko": "## 관련 글",
    "es": "## Artículos relacionados", "fr": "## Articles connexes",
    "de": "## Verwandte Artikel", "pt": "## Artigos relacionados",
    "it": "## Articoli correlati", "ru": "## Похожие статьи",
    "ar": "## مقالات ذات صلة", "hi": "## संबंधित लेख",
    "th": "## บทความที่เกี่ยวข้อง", "vi": "## Bài viết liên quan",
    "id": "## Artikel Terkait", "tr": "## İlgili Makaleler",
}

RELATED = {
    "zh": [
        ("7种脸型适合的发型完整对照表", "face-shape-hairstyle-guide", "完整脸型指南，含发型推荐"),
        ("如何根据脸型和个人色彩分析选眼镜：形状与颜色都要对", "glasses-face-shape-color-season", "把脸型逻辑延伸到日常镜框"),
        ("各脸型最佳耳环款式指南——图文对照详解", "best-earring-styles-face-shape", "基于同样比例原则的另一篇配饰指南"),
        ("色彩分析：完整指南", "color-analysis", "找到最适合你的颜色所需了解的一切"),
    ],
    "ja": [
        ("顔型別似合う髪型ガイド：7つの顔型に最適なヘアスタイル", "face-shape-hairstyle-guide", "ヘアスタイル推薦付きの完全顔型ガイド"),
        ("顔型とパーソナルカラーで選ぶ、本当に似合うメガネの選び方", "glasses-face-shape-color-season", "顔型ロジックを日常のフレーム選びへ"),
        ("顔型別・似合うピアススタイル完全ガイド", "best-earring-styles-face-shape", "同じ比例原則に基づくアクセサリーガイド"),
        ("カラー分析：完全ガイド", "color-analysis", "自分に似合う色を見つけるために知っておくべきこと"),
    ],
    "ko": [
        ("얼굴형별 어울리는 헤어스타일 완벽 가이드", "face-shape-hairstyle-guide", "헤어스타일 추천이 포함된 완전 얼굴형 가이드"),
        ("얼굴형과 퍼스널컬러로 고르는, 진짜 잘 어울리는 안경 선택법", "glasses-face-shape-color-season", "얼굴형 로직을 일상 안경 프레임에 적용"),
        ("얼굴형별 어울리는 귀걸이 스타일 완벽 가이드", "best-earring-styles-face-shape", "같은 비율 원칙에 기반한 액세서리 가이드"),
        ("컬러 분석: 완벽 가이드", "color-analysis", "나에게 어울리는 색을 찾기 위해 알아야 할 모든 것"),
    ],
    "es": [
        ("El mejor peinado para tu forma de rostro: 7 tipos con ejemplos visuales (2026)", "face-shape-hairstyle-guide", "La guía completa de formas de rostro con recomendaciones de peinado"),
        ("Cómo elegir gafas que favorezcan tu forma de cara Y tu estación de color", "glasses-face-shape-color-season", "Extiende la lógica de la forma del rostro a tus monturas diarias"),
        ("Los mejores pendientes para cada forma de rostro: guía visual", "best-earring-styles-face-shape", "Otra guía de accesorios basada en los mismos principios de proporción"),
        ("Análisis de color: Guía completa", "color-analysis", "Todo lo que necesitas saber para encontrar tus mejores colores"),
    ],
    "fr": [
        ("La meilleure coiffure pour votre forme de visage : 7 types avec exemples visuels (2026)", "face-shape-hairstyle-guide", "Le guide complet des formes de visage avec recommandations de coiffure"),
        ("Comment choisir des lunettes qui flattent votre forme de visage ET votre saison de couleurs", "glasses-face-shape-color-season", "Étendre la logique de la forme du visage à vos montures du quotidien"),
        ("Les meilleures boucles d'oreilles pour chaque forme de visage — guide visuel", "best-earring-styles-face-shape", "Un autre guide d'accessoires basé sur les mêmes principes de proportion"),
        ("Analyse colorimétrique : Guide complet", "color-analysis", "Tout ce qu'il faut savoir pour trouver vos meilleures couleurs"),
    ],
    "de": [
        ("Die beste Frisur für Ihre Gesichtsform: 7 Typen mit visuellen Beispielen (2026)", "face-shape-hairstyle-guide", "Der vollständige Gesichtsform-Leitfaden mit Frisurenempfehlungen"),
        ("So wählst du Brillen, die deiner Gesichtsform UND deinem Farbtyp schmeicheln", "glasses-face-shape-color-season", "Gesichtsform-Logik auf deine Alltagsbrillen anwenden"),
        ("Die besten Ohrring-Stile für jede Gesichtsform — Ein visueller Ratgeber", "best-earring-styles-face-shape", "Ein weiterer Accessoire-Ratgeber auf Basis derselben Proportionsprinzipien"),
        ("Farbanalyse: Der vollständige Leitfaden", "color-analysis", "Alles, was Sie wissen müssen, um Ihre besten Farben zu finden"),
    ],
    "pt": [
        ("Melhor Penteado para Seu Formato de Rosto: 7 Tipos com Exemplos Visuais (2026)", "face-shape-hairstyle-guide", "O guia completo de formatos de rosto com recomendações de penteado"),
        ("Como escolher óculos que favoreçam o seu formato de rosto E a sua estação de cores", "glasses-face-shape-color-season", "Estenda a lógica do formato de rosto às suas armações do dia a dia"),
        ("Os melhores estilos de brincos para cada formato de rosto — Um guia visual", "best-earring-styles-face-shape", "Outro guia de acessórios baseado nos mesmos princípios de proporção"),
        ("Análise de cor: Guia completo", "color-analysis", "Tudo o que você precisa saber para encontrar suas melhores cores"),
    ],
    "it": [
        ("L'acconciatura ideale per la tua forma del viso: 7 tipi con esempi visivi (2026)", "face-shape-hairstyle-guide", "La guida completa alle forme del viso con raccomandazioni di acconciatura"),
        ("Come scegliere occhiali che valorizzino la forma del viso E la tua stagione di colori", "glasses-face-shape-color-season", "Estendere la logica della forma del viso alle montature quotidiane"),
        ("I migliori stili di orecchini per ogni forma del viso — Una guida visiva", "best-earring-styles-face-shape", "Un'altra guida agli accessori basata sugli stessi principi di proporzione"),
        ("Analisi del colore: Guida completa", "color-analysis", "Tutto ciò che devi sapere per trovare i tuoi colori migliori"),
    ],
    "ru": [
        ("Лучшая причёска для вашей формы лица: 7 типов с визуальными примерами (2026)", "face-shape-hairstyle-guide", "Полное руководство по формам лица с рекомендациями по причёскам"),
        ("Как выбрать очки, которые подходят и форме лица, и вашему цветотипу", "glasses-face-shape-color-season", "Примените логику формы лица к повседневным оправам"),
        ("Лучшие стили серёг для каждой формы лица — визуальное руководство", "best-earring-styles-face-shape", "Ещё одно руководство по аксессуарам на тех же принципах пропорций"),
        ("Анализ цветотипа: Полное руководство", "color-analysis", "Всё, что нужно знать, чтобы найти свои лучшие цвета"),
    ],
    "ar": [
        ("أفضل تسريحة شعر لشكل وجهكِ: 7 أنواع مع أمثلة مرئية (2026)", "face-shape-hairstyle-guide", "الدليل الكامل لأشكال الوجه مع توصيات تسريحات الشعر"),
        ("كيف تختارين نظارات تناسب شكل وجهكِ وفصل ألوانكِ معاً", "glasses-face-shape-color-season", "طبّقي منطق شكل الوجه على إطاراتكِ اليومية"),
        ("أفضل أنماط الأقراط لكل شكل وجه — دليل مرئي", "best-earring-styles-face-shape", "دليل إكسسوارات آخر مبني على نفس مبادئ التناسب"),
        ("تحليل الألوان: الدليل الكامل", "color-analysis", "كل ما تحتاجين معرفته للعثور على أفضل ألوانك"),
    ],
    "hi": [
        ("आपके चेहरे के आकार के लिए सर्वोत्तम हेयरस्टाइल: 7 प्रकार विज़ुअल उदाहरण सहित (2026)", "face-shape-hairstyle-guide", "हेयरस्टाइल सिफ़ारिशों सहित पूर्ण फेस शेप गाइड"),
        ("अपने चेहरे के आकार और कलर सीज़न दोनों के अनुसार चश्मा कैसे चुनें", "glasses-face-shape-color-season", "फेस शेप लॉजिक को रोज़मर्रा के फ्रेम तक बढ़ाएँ"),
        ("हर चेहरे के आकार के लिए सर्वश्रेष्ठ झुमके — एक विज़ुअल गाइड", "best-earring-styles-face-shape", "उसी proportion सिद्धांतों पर आधारित एक और एक्सेसरी गाइड"),
        ("कलर एनालिसिस: पूरी गाइड", "color-analysis", "अपने सर्वश्रेष्ठ रंग खोजने के लिए जानने योग्य सब कुछ"),
    ],
    "th": [
        ("ทรงผมที่เหมาะกับรูปหน้า: 7 ประเภทพร้อมตัวอย่างภาพ (2026)", "face-shape-hairstyle-guide", "คู่มือรูปหน้าฉบับสมบูรณ์พร้อมคำแนะนำทรงผม"),
        ("วิธีเลือกแว่นที่เหมาะทั้งรูปหน้าและ Color Season ของคุณ", "glasses-face-shape-color-season", "ขยายตรรกะรูปหน้าไปสู่กรอบแว่นที่ใช้ทุกวัน"),
        ("ต่างหูที่เหมาะกับทุกรูปหน้า — คู่มือภาพประกอบ", "best-earring-styles-face-shape", "คู่มือแอคเซสซอรี่อีกฉบับที่ใช้หลักสัดส่วนเดียวกัน"),
        ("Color Analysis: คู่มือฉบับสมบูรณ์", "color-analysis", "ทุกสิ่งที่คุณต้องรู้เพื่อค้นหาสีที่เหมาะกับคุณที่สุด"),
    ],
    "vi": [
        ("Kiểu Tóc Phù Hợp Nhất Cho Dạng Khuôn Mặt: 7 Loại Kèm Ví Dụ Trực Quan (2026)", "face-shape-hairstyle-guide", "Hướng dẫn đầy đủ về dạng khuôn mặt kèm gợi ý kiểu tóc"),
        ("Cách chọn kính vừa khuôn mặt vừa mùa màu của bạn", "glasses-face-shape-color-season", "Mở rộng logic khuôn mặt sang gọng kính hàng ngày"),
        ("Kiểu Bông Tai Phù Hợp Nhất Cho Mọi Dạng Khuôn Mặt — Hướng Dẫn Trực Quan", "best-earring-styles-face-shape", "Một hướng dẫn phụ kiện khác dựa trên cùng nguyên tắc tỷ lệ"),
        ("Phân tích màu sắc: Hướng dẫn đầy đủ", "color-analysis", "Mọi thứ bạn cần biết để tìm màu phù hợp nhất"),
    ],
    "id": [
        ("Gaya Rambut Terbaik untuk Bentuk Wajah Anda: 7 Tipe dengan Contoh Visual (2026)", "face-shape-hairstyle-guide", "Panduan lengkap bentuk wajah dengan rekomendasi gaya rambut"),
        ("Cara Memilih Kacamata yang Cocok dengan Bentuk Wajah DAN Color Season Anda", "glasses-face-shape-color-season", "Perluas logika bentuk wajah ke bingkai kacamata sehari-hari"),
        ("Gaya Anting Terbaik untuk Setiap Bentuk Wajah — Panduan Visual", "best-earring-styles-face-shape", "Panduan aksesori lain berdasarkan prinsip proporsi yang sama"),
        ("Analisis Warna: Panduan Lengkap", "color-analysis", "Semua yang perlu Anda ketahui untuk menemukan warna terbaik"),
    ],
    "tr": [
        ("Yüz Şeklinize En Uygun Saç Modeli: 7 Tip Görsel Örneklerle (2026)", "face-shape-hairstyle-guide", "Saç modeli önerileriyle eksiksiz yüz şekli rehberi"),
        ("Yüz Şeklinize VE Renk Mevsiminize Uygun Gözlük Nasıl Seçilir", "glasses-face-shape-color-season", "Yüz şekli mantığını günlük gözlük çerçevelerinize taşıyın"),
        ("Her Yüz Şekli İçin En İyi Küpe Modelleri — Görsel Rehber", "best-earring-styles-face-shape", "Aynı orantı ilkelerine dayanan bir aksesuar rehberi daha"),
        ("Renk Analizi: Eksiksiz Rehber", "color-analysis", "En iyi renklerinizi bulmak için bilmeniz gereken her şey"),
    ],
}


def extract_body(en_text):
    m = re.search(r"^---\n.*?\n---\n", en_text, re.DOTALL)
    return en_text[m.end():].strip() if m else en_text.strip()


def protect(text):
    placeholders = {}
    patterns = [
        (r"\[[^\]]+\]\(https?://[^)]+\)", "LINK"),
        (r"\[[^\]]+\]\(/en/[^)]+\)", "ILINK"),
        (r"\*\*[^*]+\*\*", "BOLD"),
        (r"`[^`]+`", "CODE"),
    ]
    idx = 0
    for pat, kind in patterns:
        for m in re.finditer(pat, text):
            key = f"__{kind}_{idx}__"
            placeholders[key] = m.group(0)
            text = text.replace(m.group(0), key, 1)
            idx += 1
    return text, placeholders


def restore(text, placeholders):
    for k, v in placeholders.items():
        text = text.replace(k, v)
    return text


def fix_internal_links(text, loc):
    text = text.replace("/en/blog/", f"/{loc}/blog/")
    text = text.replace("/en/color-analysis", f"/{loc}/color-analysis")
    return text


def translate_chunk(text, target):
    if not text.strip():
        return text
    text, ph = protect(text)
    # split by paragraphs to avoid length limits
    parts = text.split("\n\n")
    out = []
    for part in parts:
        if part.strip().startswith("|") or part.strip().startswith("---"):
            out.append(part)
            continue
        if re.match(r"^__\w+_\d+__$", part.strip()):
            out.append(part)
            continue
        try:
            t = GoogleTranslator(source="en", target=target).translate(part)
            out.append(t)
        except Exception as e:
            print(f"  chunk error: {e}")
            out.append(part)
        time.sleep(0.15)
    result = "\n\n".join(out)
    return restore(result, ph)


def build_related(loc):
    lines = [REL_HEADERS[loc], ""]
    for title, slug, desc in RELATED[loc]:
        if slug == "color-analysis":
            lines.append(f"- [{title}](/{loc}/{slug}) — {desc}")
        else:
            lines.append(f"- [{title}](/{loc}/blog/{slug}) — {desc}")
    return "\n".join(lines)


def write_locale(loc, body):
    m = META[loc]
    tags_s = ", ".join(f'"{t}"' for t in m["tags"])
    related = build_related(loc)
    content = f"""---
title: "{m['title']}"
description: "{m['description']}"
date: {DATE}
category: face_shape
tags: [{tags_s}]
image: "{IMAGE}"
---

{body}

{related}
"""
    path = os.path.join(BASE, loc, f"{SLUG}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote {path}")


def main():
    with open(EN_PATH, encoding="utf-8") as f:
        en = f.read()
    body_en = extract_body(en)
    # Remove Related Articles from body - we'll add localized version
    body_en = re.split(r"\n## Related Articles\n", body_en)[0].strip()

    for loc, target in LOCALES.items():
        print(f"Translating {loc}...")
        if loc in ("es", "fr", "de", "pt", "it") and os.path.exists(os.path.join(BASE, loc, f"{SLUG}.md")):
            # keep hand-written EU files if they look complete
            with open(os.path.join(BASE, loc, f"{SLUG}.md"), encoding="utf-8") as f:
                existing = f.read()
            if "## " in existing and len(existing) > 8000:
                print(f"  skip {loc} (existing complete)")
                continue
        translated = translate_chunk(body_en, target)
        translated = fix_internal_links(translated, loc)
        write_locale(loc, translated)

    print("Done!")


if __name__ == "__main__":
    main()
