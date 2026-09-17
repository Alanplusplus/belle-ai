#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Auto-translate going-blonde article to 15 locales using deep_translator."""
import os
import re
import time
from deep_translator import GoogleTranslator

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
EN_PATH = os.path.join(BASE, "en", "going-blonde-best-shade-skin-tone.md")
SLUG = "going-blonde-best-shade-skin-tone"
DATE = "2026-09-16"
IMAGE = "/images/blog/going-blonde-best-shade-skin-tone.webp"

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

RELATED_HEADERS = {
    "zh": "## 相关文章", "ja": "## 関連記事", "ko": "## 관련 글",
    "es": "## Artículos relacionados", "fr": "## Articles connexes",
    "de": "## Verwandte Artikel", "pt": "## Artigos relacionados",
    "it": "## Articoli correlati", "ru": "## Похожие статьи",
    "ar": "## مقالات ذات صلة", "hi": "## संबंधित लेख",
    "th": "## บทความที่เกี่ยวข้อง", "vi": "## Bài viết liên quan",
    "id": "## Artikel Terkait", "tr": "## İlgili Yazılar",
}

RELATED = {
    "zh": [
        ("如何根据色彩季型找到最适合你的发色", "best-hair-color-for-color-season", "按季型选择发色的完整指南"),
        ("Balayage、挑染还是全头染？如何选择", "hair-coloring-technique-color-season", "各季型染发技法对比"),
        ("AI 发色预览如何帮你避免染发翻车", "ai-hair-color-preview-guide", "为什么 AI 预览比猜测更可靠"),
        ("色彩分析：完整指南", "color-analysis", "找到最适合你的颜色所需了解的一切", True),
    ],
    "ja": [
        ("カラーシーズン別・最適なヘアカラーの見つけ方", "best-hair-color-for-color-season", "シーズン別ヘアカラー選びの完全ガイド"),
        ("バレイヤージュ、ハイライト、全体染め？選び方ガイド", "hair-coloring-technique-color-season", "シーズン別カラーリング技法の比較"),
        ("AIヘアカラープレビューで失敗染めを防ぐ方法", "ai-hair-color-preview-guide", "AIプレビューが推測より優れている理由"),
        ("カラー分析：完全ガイド", "color-analysis", "自分に似合う色を見つけるために知っておくべきこと", True),
    ],
    "ko": [
        ("컬러 시즌별 최적의 헤어 컬러 찾기", "best-hair-color-for-color-season", "시즌별 헤어 컬러 선택 완벽 가이드"),
        ("발레아쥬, 하이라이트, 전체 염색? 선택 가이드", "hair-coloring-technique-color-season", "시즌별 염색 기법 비교"),
        ("AI 헤어 컬러 미리보기로 염색 실패를 막는 법", "ai-hair-color-preview-guide", "AI 미리보기가 추측보다 나은 이유"),
        ("컬러 분석: 완벽 가이드", "color-analysis", "나에게 어울리는 색을 찾기 위해 알아야 할 모든 것", True),
    ],
    "es": [
        ("Cómo encontrar tu mejor color de cabello según tu estación de color", "best-hair-color-for-color-season", "Guía completa para elegir color de cabello por estación"),
        ("¿Balayage, mechas o color completo? Cómo elegir", "hair-coloring-technique-color-season", "Comparación de técnicas de coloración por estación"),
        ("Cómo la vista previa con IA puede evitarte un tinte desastroso", "ai-hair-color-preview-guide", "Por qué previsualizar con IA supera adivinar"),
        ("Análisis de color: Guía completa", "color-analysis", "Todo lo que necesitas saber para encontrar tus mejores colores", True),
    ],
    "fr": [
        ("Comment trouver votre meilleure couleur de cheveux selon votre saison colorimétrique", "best-hair-color-for-color-season", "Guide complet pour choisir sa couleur de cheveux par saison"),
        ("Balayage, mèches ou coloration complète ? Comment choisir", "hair-coloring-technique-color-season", "Comparaison des techniques de coloration par saison"),
        ("Comment l'aperçu IA de couleur capillaire peut vous éviter une coloration ratée", "ai-hair-color-preview-guide", "Pourquoi l'aperçu IA vaut mieux que deviner"),
        ("Analyse colorimétrique : Guide complet", "color-analysis", "Tout ce qu'il faut savoir pour trouver vos meilleures couleurs", True),
    ],
    "de": [
        ("So finden Sie Ihre beste Haarfarbe nach Ihrer Farbsaison", "best-hair-color-for-color-season", "Umfassender Leitfaden zur Haarfarbenwahl nach Saison"),
        ("Balayage, Strähnchen oder Vollcoloration? So wählen Sie", "hair-coloring-technique-color-season", "Vergleich der Färbetechniken nach Saison"),
        ("Wie KI-Haarfarben-Vorschau Sie vor einer missglückten Färbung bewahrt", "ai-hair-color-preview-guide", "Warum KI-Vorschau besser ist als Raten"),
        ("Farbanalyse: Der vollständige Leitfaden", "color-analysis", "Alles, was Sie wissen müssen, um Ihre besten Farben zu finden", True),
    ],
    "pt": [
        ("Como encontrar sua melhor cor de cabelo com base na sua estação de cor", "best-hair-color-for-color-season", "Guia completo para escolher cor de cabelo por estação"),
        ("Balayage, mechas ou coloração total? Como escolher", "hair-coloring-technique-color-season", "Comparação de técnicas de coloração por estação"),
        ("Como a pré-visualização de cor de cabelo com IA pode evitar uma tintura desastrosa", "ai-hair-color-preview-guide", "Por que pré-visualizar com IA supera adivinhar"),
        ("Análise de cor: Guia completo", "color-analysis", "Tudo o que você precisa saber para encontrar suas melhores cores", True),
    ],
    "it": [
        ("Come trovare il colore di capelli migliore in base alla tua stagione cromatica", "best-hair-color-for-color-season", "Guida completa alla scelta del colore di capelli per stagione"),
        ("Balayage, colpi di sole o colorazione totale? Come scegliere", "hair-coloring-technique-color-season", "Confronto delle tecniche di colorazione per stagione"),
        ("Come l'anteprima del colore dei capelli con IA può evitarti una tintura disastrosa", "ai-hair-color-preview-guide", "Perché l'anteprima con IA batte il tentativo a caso"),
        ("Analisi del colore: Guida completa", "color-analysis", "Tutto ciò che devi sapere per trovare i tuoi colori migliori", True),
    ],
    "ru": [
        ("Как найти лучший цвет волос по вашему цветотипу", "best-hair-color-for-color-season", "Полное руководство по выбору цвета волос по сезону"),
        ("Балаяж, мелирование или полное окрашивание? Как выбрать", "hair-coloring-technique-color-season", "Сравнение техник окрашивания для каждого сезона"),
        ("Как AI-предпросмотр цвета волос спасёт вас от неудачного окрашивания", "ai-hair-color-preview-guide", "Почему AI-предпросмотр лучше догадок"),
        ("Анализ цветотипа: Полное руководство", "color-analysis", "Всё, что нужно знать, чтобы найти свои лучшие цвета", True),
    ],
    "ar": [
        ("كيف تجدين أفضل لون شعر بناءً على موسم ألوانك", "best-hair-color-for-color-season", "دليل شامل لاختيار لون الشعر حسب الموسم"),
        ("بالياج أم خصل أم صبغة كاملة؟ كيف تختارين", "hair-coloring-technique-color-season", "مقارنة تقنيات الصبغ لكل موسم"),
        ("كيف يمكن لمعاينة لون الشعر بالذكاء الاصطناعي أن تنقذك من صبغة فاشلة", "ai-hair-color-preview-guide", "لماذا المعاينة بالذكاء الاصطناعي أفضل من التخمين"),
        ("تحليل الألوان: الدليل الكامل", "color-analysis", "كل ما تحتاجين معرفته للعثور على أفضل ألوانك", True),
    ],
    "hi": [
        ("अपने कलर सीज़न के आधार पर सबसे अच्छा हेयर कलर कैसे खोजें", "best-hair-color-for-color-season", "सीज़न के अनुसार हेयर कलर चुनने की पूरी गाइड"),
        ("Balayage, हाइलाइट्स या ऑल-ओवर कलर? कैसे चुनें", "hair-coloring-technique-color-season", "प्रत्येक सीज़न के लिए कलरिंग तकनीकों की तुलना"),
        ("AI हेयर कलर प्रीव्यू आपको बुरे डाई जॉब से कैसे बचा सकता है", "ai-hair-color-preview-guide", "AI से प्रीव्यू करना अनुमान लगाने से क्यों बेहतर है"),
        ("कलर एनालिसिस: पूरी गाइड", "color-analysis", "अपने सर्वश्रेष्ठ रंग खोजने के लिए जानने योग्य सब कुछ", True),
    ],
    "th": [
        ("วิธีหาสีผมที่เหมาะที่สุดตาม Color Season ของคุณ", "best-hair-color-for-color-season", "คู่มือครบถ้วนในการเลือกสีผมตามฤดูกาล"),
        ("Balayage ไฮไลท์ หรือย้อมทั้งหัว? เลือกอย่างไร", "hair-coloring-technique-color-season", "เปรียบเทียบเทคนิคการย้อมสำหรับแต่ละฤดูกาล"),
        ("AI Hair Color Preview ช่วยคุณหลีกเลี่ยงการย้อมที่พลาดได้อย่างไร", "ai-hair-color-preview-guide", "ทำไมการพรีวิวด้วย AI ดีกว่าการเดา"),
        ("Color Analysis: คู่มือฉบับสมบูรณ์", "color-analysis", "ทุกสิ่งที่คุณต้องรู้เพื่อค้นหาสีที่เหมาะกับคุณที่สุด", True),
    ],
    "vi": [
        ("Cách tìm màu tóc phù hợp nhất theo mùa màu của bạn", "best-hair-color-for-color-season", "Hướng dẫn toàn diện chọn màu tóc theo mùa"),
        ("Balayage, highlight hay nhuộm toàn bộ? Cách chọn", "hair-coloring-technique-color-season", "So sánh kỹ thuật nhuộm tóc cho từng mùa"),
        ("Xem trước màu tóc bằng AI giúp bạn tránh nhuộm tóc thảm họa", "ai-hair-color-preview-guide", "Tại sao xem trước bằng AI tốt hơn đoán mò"),
        ("Phân tích màu sắc: Hướng dẫn đầy đủ", "color-analysis", "Mọi thứ bạn cần biết để tìm màu phù hợp nhất", True),
    ],
    "id": [
        ("Cara menemukan warna rambut terbaik berdasarkan musim warna Anda", "best-hair-color-for-color-season", "Panduan lengkap memilih warna rambut berdasarkan musim"),
        ("Balayage, highlight, atau warna penuh? Cara memilih", "hair-coloring-technique-color-season", "Perbandingan teknik pewarnaan untuk setiap musim"),
        ("Bagaimana pratinjau warna rambut AI dapat mencegah pewarnaan yang gagal", "ai-hair-color-preview-guide", "Mengapa pratinjau dengan AI lebih baik daripada menebak"),
        ("Analisis Warna: Panduan Lengkap", "color-analysis", "Semua yang perlu Anda ketahui untuk menemukan warna terbaik", True),
    ],
    "tr": [
        ("Renk sezonunuza göre en iyi saç rengini nasıl bulursunuz", "best-hair-color-for-color-season", "Sezona göre saç rengi seçimi için kapsamlı rehber"),
        ("Balayage, röfle mi yoksa komple boya mı? Nasıl seçilir", "hair-coloring-technique-color-season", "Her sezon için boyama tekniklerinin karşılaştırması"),
        ("AI saç rengi önizlemesi sizi kötü bir boyadan nasıl kurtarır", "ai-hair-color-preview-guide", "AI ile önizlemenin tahmin etmekten neden daha iyi olduğu"),
        ("Renk Analizi: Eksiksiz Rehber", "color-analysis", "En iyi renklerinizi bulmak için bilmeniz gereken her şey", True),
    ],
}

# Protect these from translation
PROTECT = [
    "Platinum blonde", "Ash blonde", "Honey blonde", "Strawberry blonde",
    "Champagne blonde", "Balayage blonde", "balayage", "bronde",
    "undertone", "undertones", "Pinterest", "AI", "aicoloranalysis.io",
    "Light Spring", "True Spring", "Bright Spring",
    "Light Summer", "True Summer", "Soft Summer",
    "Soft Autumn", "True Autumn", "Dark Autumn",
    "Dark Winter", "True Winter", "Bright Winter",
    "purple shampoo", "developer", "toner", "gloss",
    "Journal of Cosmetic Dermatology",
]

def parse_frontmatter(content):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", content, re.DOTALL)
    if not m:
        raise ValueError("No frontmatter")
    fm, body = m.group(1), m.group(2)
    title = re.search(r'title: "(.*)"', fm).group(1)
    desc = re.search(r'description: "(.*)"', fm).group(1)
    tags = re.findall(r'"([^"]+)"', re.search(r"tags: \[(.*)\]", fm).group(1))
    return title, desc, tags, body

def protect_text(text):
    placeholders = {}
    for i, term in enumerate(PROTECT):
        key = f"__PROT{i}__"
        placeholders[key] = term
        text = text.replace(term, key)
    # Protect URLs
    urls = {}
    for i, url in enumerate(set(re.findall(r'https?://[^\s\)]+', text))):
        key = f"__URL{i}__"
        urls[key] = url
        text = text.replace(url, key)
    # Protect internal links paths - keep English paths, localize later
    paths = {}
    for i, path in enumerate(set(re.findall(r'/en/(?:blog/)?[a-z0-9-]+', text))):
        key = f"__PATH{i}__"
        paths[key] = path
        text = text.replace(path, key)
    return text, placeholders, urls, paths

def restore_text(text, placeholders, urls, paths):
    for key, val in paths.items():
        text = text.replace(key, val)
    for key, val in urls.items():
        text = text.replace(key, val)
    for key, val in placeholders.items():
        text = text.replace(key, val)
    return text

def localize_paths(text, loc):
    text = text.replace("/en/blog/how-to-determine-skin-undertone", f"/{loc}/blog/how-to-determine-skin-undertone")
    text = text.replace("/en/color-analysis", f"/{loc}/color-analysis")
    text = text.replace("/en/blog/best-hair-color-for-color-season", f"/{loc}/blog/best-hair-color-for-color-season")
    text = text.replace("/en/blog/hair-coloring-technique-color-season", f"/{loc}/blog/hair-coloring-technique-color-season")
    text = text.replace("/en/blog/ai-hair-color-preview-guide", f"/{loc}/blog/ai-hair-color-preview-guide")
    return text

def translate_chunk(text, target):
    if not text.strip():
        return text
    protected, ph, urls, paths = protect_text(text)
    try:
        result = GoogleTranslator(source="en", target=target).translate(protected)
    except Exception as e:
        print(f"  chunk error: {e}, retrying...")
        time.sleep(2)
        result = GoogleTranslator(source="en", target=target).translate(protected)
    result = restore_text(result, ph, urls, paths)
    return result

def translate_body(body, target):
    # Split by sections to avoid API limits; keep ## headers with content
    parts = re.split(r'(?=^## )', body, flags=re.MULTILINE)
    translated = []
    for i, part in enumerate(parts):
        if not part.strip():
            continue
        # Further split long sections by paragraphs
        if len(part) > 4500:
            paras = part.split("\n\n")
            chunk = ""
            chunk_out = []
            for para in paras:
                if len(chunk) + len(para) > 4000:
                    if chunk:
                        chunk_out.append(translate_chunk(chunk, target))
                        time.sleep(0.3)
                    chunk = para
                else:
                    chunk = chunk + "\n\n" + para if chunk else para
            if chunk:
                chunk_out.append(translate_chunk(chunk, target))
                time.sleep(0.3)
            translated.append("\n\n".join(chunk_out))
        else:
            translated.append(translate_chunk(part, target))
            time.sleep(0.3)
        print(f"    section {i+1}/{len(parts)} done")
    return "".join(translated)

def related_section(loc):
    lines = [RELATED_HEADERS[loc], ""]
    for item in RELATED[loc]:
        title, slug, desc = item[0], item[1], item[2]
        is_color = len(item) > 3 and item[3]
        path = f"/{loc}/color-analysis" if is_color else f"/{loc}/blog/{slug}"
        lines.append(f"- [{title}]({path}) — {desc}")
    return "\n".join(lines)

def write_file(loc, title, desc, tags, body):
    tags_str = ", ".join(f'"{t}"' for t in tags)
    # Remove English Related Articles section if present
    body = re.sub(r"\n---\n\n## Related Articles.*", "", body, flags=re.DOTALL)
    body = body.rstrip() + "\n\n---\n\n" + related_section(loc) + "\n"
    content = f"""---
title: "{title.replace('"', '\\"')}"
description: "{desc.replace('"', '\\"')}"
date: "{DATE}"
tags: [{tags_str}]
image: "{IMAGE}"
---

{body.strip()}
"""
    path = os.path.join(BASE, loc, f"{SLUG}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Wrote {loc}/{SLUG}.md ({len(content)} bytes)")

def main():
    with open(EN_PATH, encoding="utf-8") as f:
        en_content = f.read()
    title, desc, tags, body = parse_frontmatter(en_content)
    # body without related articles
    body = re.sub(r"\n---\n\n## Related Articles.*", "", body, flags=re.DOTALL).strip()

    for loc, target in LOCALES.items():
        print(f"\nTranslating {loc} ({target})...")
        t_title = translate_chunk(title, target)
        time.sleep(0.3)
        t_desc = translate_chunk(desc, target)
        time.sleep(0.3)
        t_tags = [translate_chunk(t, target) for t in tags]
        time.sleep(0.3)
        t_body = translate_body(body, target)
        t_body = localize_paths(t_body, loc)
        write_file(loc, t_title, t_desc, t_tags, t_body)

    print("\nAll done!")

if __name__ == "__main__":
    main()
