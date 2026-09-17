#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assemble going-blonde article files from locale body fragments + metadata."""
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
LOCALES_DIR = os.path.join(os.path.dirname(__file__), "going_blonde_locales")
SLUG = "going-blonde-best-shade-skin-tone"
DATE = "2026-09-16"
IMAGE = "/images/blog/going-blonde-best-shade-skin-tone.webp"

META = {
    "zh": ("染金发完全指南：哪种金色调最适合你的肤色", "并非所有金发都一样。了解哪种金色调——铂金、蜜糖、草莓金或灰金色——真正适合你的肤色、底调和色彩季型。", ["发色", "金发", "肤色", "色彩分析", "美容"]),
    "ja": ("ブロンド完全ガイド：あなたの肌トーンに似合うブロンドの選び方", "すべてのブロンドが同じではありません。プラチナ、ハニー、ストロベリーブロンド、アッシュ——あなたの肌トーン、アンダートーン、カラーシーズンに本当に似合うブロンドを見つけましょう。", ["ヘアカラー", "ブロンド", "肌トーン", "カラー分析", "ビューティー"]),
    "ko": ("블론드 완벽 가이드: 내 피부톤에 어울리는 블론드 쉐이드", "모든 블론드가 같은 것은 아닙니다. 플래티넘, 허니, 스트로베리, 애쉬 중 당신의 피부톤, 언더톤, 컬러 시즌에 진짜 어울리는 블론드를 알아보세요.", ["헤어 컬러", "블론드", "피부톤", "컬러 분석", "뷰티"]),
    "es": ("Guía completa para volverse rubia: qué tono rubio favorece tu tono de piel", "No todas las rubias son iguales. Descubre qué tono rubio — platino, miel, fresa o ceniza — realmente favorece TU tono de piel, subtono y estación de color.", ["color de cabello", "rubio", "tono de piel", "análisis de color", "belleza"]),
    "fr": ("Guide complet pour devenir blonde : quelle nuance de blond convient à votre teint", "Toutes les blondes ne se valent pas. Découvrez quelle nuance de blond — platine, miel, fraise ou cendré — flatte vraiment VOTRE teint, sous-ton et saison colorimétrique.", ["couleur de cheveux", "blond", "teint", "analyse colorimétrique", "beauté"]),
    "de": ("Der komplette Leitfaden zum Blondwerden: Welcher Blondton zu Ihrem Hautton passt", "Nicht alle Blondtöne sind gleich. Erfahren Sie, welcher Blondton — Platin, Honig, Erdbeerblond oder Aschblond — WIRKLICH zu Ihrem Hautton, Unterton und Ihrer Farbsaison passt.", ["Haarfarbe", "Blond", "Hautton", "Farbanalyse", "Schönheit"]),
    "pt": ("Guia completo para ficar loira: qual tom de loiro combina com seu tom de pele", "Nem todos os loiros são iguais. Descubra qual tom de loiro — platinado, mel, morango ou cinza — realmente favorece SEU tom de pele, subtom e estação de cor.", ["cor de cabelo", "loiro", "tom de pele", "análise de cor", "beleza"]),
    "it": ("Guida completa per diventare bionda: quale tonalità di biondo si adatta al tuo incarnato", "Non tutti i biondi sono uguali. Scopri quale tonalità di biondo — platino, miele, fragola o cenere — valorizza davvero il TUO incarnato, sottotono e stagione cromatica.", ["colore di capelli", "biondo", "incarnato", "analisi del colore", "bellezza"]),
    "ru": ("Полное руководство по переходу в блонд: какой оттенок подходит вашему тону кожи", "Не все блонды одинаковы. Узнайте, какой оттенок блонда — платиновый, медовый, клубничный или пепельный — действительно идёт ВАШЕМУ тону кожи, подтону и цветотипу.", ["цвет волос", "блонд", "тон кожи", "анализ цветотипа", "красота"]),
    "ar": ("الدليل الكامل للتحول إلى أشقر: أي درجة أشقر تناسب لون بشرتك", "ليست كل درجات الأشقر متشابهة. اكتشفي أي درجة — بلاتيني، عسلي، فراولة أو رمادي — تُبرز حقاً لون بشرتك ودرجة لونك الأساسية وموسم ألوانك.", ["لون الشعر", "أشقر", "لون البشرة", "تحليل الألوان", "جمال"]),
    "hi": ("ब्लonde बनने की पूरी गाइड: आपके स्किन टोन के लिए कौन सा ब्लonde शेड सही है", "सभी ब्लonde एक जैसे नहीं होते। जानें कि कौन सा ब्लonde शेड — प्लैटिनम, हनी, स्ट्रॉबेरी या ऐश — वास्तव में आपके स्किन टोन, अंडरटोन और कलर सीज़न को फ्लैटर करता है।", ["हेयर कलर", "ब्लonde", "स्किन टोन", "कलर एनालिसिस", "ब्यूटी"]),
    "th": ("คู่มือครบถ้วนสำหรับการย้อมบлонด: โทนบлонดใดเหมาะกับโทนผิวของคุณ", "บлонดไม่ได้เหมือนกันทุกแบบ เรียนรู้ว่าโทนบлонดใด — แพลทินัม ฮันนี่ สตรอว์เบอร์รี่ หรือแอช — เหมาะกับโทนผิว undertone และ Color Season ของคุณจริงๆ", ["สีผม", "บлонด", "โทนผิว", "Color Analysis", "ความงาม"]),
    "vi": ("Hướng dẫn đầy đủ để nhuộm vàng: tông vàng nào hợp với tone da của bạn", "Không phải màu vàng nào cũng giống nhau. Tìm hiểu tông vàng nào — bạch kim, mật ong, dâu hay tro — thực sự tôn tone da, undertone và mùa màu của BẠN.", ["màu tóc", "vàng", "tone da", "phân tích màu", "làm đẹp"]),
    "id": ("Panduan lengkap menjadi pirang: warna pirang mana yang cocok dengan warna kulit Anda", "Tidak semua pirang diciptakan sama. Pelajari warna pirang mana — platinum, madu, stroberi, atau abu — yang benar-benar cocok dengan warna kulit, undertone, dan musim warna ANDA.", ["warna rambut", "pirang", "warna kulit", "analisis warna", "kecantikan"]),
    "tr": ("Sarışın olma rehberi: Cilt tonunuza hangi sarı tonu yakışır", "Tüm sarı tonlar aynı değildir. Platin, bal, çilek veya kül rengi — cilt tonunuz, alt tonunuz ve renk sezonunuza GERÇEKTEN yakışan sarı tonu öğrenin.", ["saç rengi", "sarı", "cilt tonu", "renk analizi", "güzellik"]),
}

RELATED = {
    "zh": [("如何根据色彩季型找到最适合你的发色", "best-hair-color-for-color-season", "按季型选择发色的完整指南"), ("Balayage、挑染还是全头染？如何选择", "hair-coloring-technique-color-season", "各季型染发技法对比"), ("AI 发色预览如何帮你避免染发翻车", "ai-hair-color-preview-guide", "为什么 AI 预览比猜测更可靠"), ("色彩分析：完整指南", "color-analysis", "找到最适合你的颜色所需了解的一切", True)],
    "ja": [("カラーシーズン別・最適なヘアカラーの見つけ方", "best-hair-color-for-color-season", "シーズン別ヘアカラー選びの完全ガイド"), ("バレイヤージュ、ハイライト、全体染め？選び方ガイド", "hair-coloring-technique-color-season", "シーズン別カラーリング技法の比較"), ("AIヘアカラープレビューで失敗染めを防ぐ方法", "ai-hair-color-preview-guide", "AIプレビューが推測より優れている理由"), ("カラー分析：完全ガイド", "color-analysis", "自分に似合う色を見つけるために知っておくべきこと", True)],
    "ko": [("컬러 시즌별 최적의 헤어 컬러 찾기", "best-hair-color-for-color-season", "시즌별 헤어 컬러 선택 완벽 가이드"), ("발레아쥬, 하이라이트, 전체 염색? 선택 가이드", "hair-coloring-technique-color-season", "시즌별 염색 기법 비교"), ("AI 헤어 컬러 미리보기로 염색 실패를 막는 법", "ai-hair-color-preview-guide", "AI 미리보기가 추측보다 나은 이유"), ("컬러 분석: 완벽 가이드", "color-analysis", "나에게 어울리는 색을 찾기 위해 알아야 할 모든 것", True)],
    "es": [("Cómo encontrar tu mejor color de cabello según tu estación de color", "best-hair-color-for-color-season", "Guía completa para elegir color de cabello por estación"), ("¿Balayage, mechas o color completo? Cómo elegir", "hair-coloring-technique-color-season", "Comparación de técnicas de coloración por estación"), ("Cómo la vista previa con IA puede evitarte un tinte desastroso", "ai-hair-color-preview-guide", "Por qué previsualizar con IA supera adivinar"), ("Análisis de color: Guía completa", "color-analysis", "Todo lo que necesitas saber para encontrar tus mejores colores", True)],
    "fr": [("Comment trouver votre meilleure couleur de cheveux selon votre saison colorimétrique", "best-hair-color-for-color-season", "Guide complet pour choisir sa couleur de cheveux par saison"), ("Balayage, mèches ou coloration complète ? Comment choisir", "hair-coloring-technique-color-season", "Comparaison des techniques de coloration par saison"), ("Comment l'aperçu IA de couleur capillaire peut vous éviter une coloration ratée", "ai-hair-color-preview-guide", "Pourquoi l'aperçu IA vaut mieux que deviner"), ("Analyse colorimétrique : Guide complet", "color-analysis", "Tout ce qu'il faut savoir pour trouver vos meilleures couleurs", True)],
    "de": [("So finden Sie Ihre beste Haarfarbe nach Ihrer Farbsaison", "best-hair-color-for-color-season", "Umfassender Leitfaden zur Haarfarbenwahl nach Saison"), ("Balayage, Strähnchen oder Vollcoloration? So wählen Sie", "hair-coloring-technique-color-season", "Vergleich der Färbetechniken nach Saison"), ("Wie KI-Haarfarben-Vorschau Sie vor einer missglückten Färbung bewahrt", "ai-hair-color-preview-guide", "Warum KI-Vorschau besser ist als Raten"), ("Farbanalyse: Der vollständige Leitfaden", "color-analysis", "Alles, was Sie wissen müssen, um Ihre besten Farben zu finden", True)],
    "pt": [("Como encontrar sua melhor cor de cabelo com base na sua estação de cor", "best-hair-color-for-color-season", "Guia completo para escolher cor de cabelo por estação"), ("Balayage, mechas ou coloração total? Como escolher", "hair-coloring-technique-color-season", "Comparação de técnicas de coloração por estação"), ("Como a pré-visualização de cor de cabelo com IA pode evitar uma tintura desastrosa", "ai-hair-color-preview-guide", "Por que pré-visualizar com IA supera adivinhar"), ("Análise de cor: Guia completo", "color-analysis", "Tudo o que você precisa saber para encontrar suas melhores cores", True)],
    "it": [("Come trovare il colore di capelli migliore in base alla tua stagione cromatica", "best-hair-color-for-color-season", "Guida completa alla scelta del colore di capelli per stagione"), ("Balayage, colpi di sole o colorazione totale? Come scegliere", "hair-coloring-technique-color-season", "Confronto delle tecniche di colorazione per stagione"), ("Come l'anteprima del colore dei capelli con IA può evitarti una tintura disastrosa", "ai-hair-color-preview-guide", "Perché l'anteprima con IA batte il tentativo a caso"), ("Analisi del colore: Guida completa", "color-analysis", "Tutto ciò che devi sapere per trovare i tuoi colori migliori", True)],
    "ru": [("Как найти лучший цвет волос по вашему цветотипу", "best-hair-color-for-color-season", "Полное руководство по выбору цвета волос по сезону"), ("Балаяж, мелирование или полное окрашивание? Как выбрать", "hair-coloring-technique-color-season", "Сравнение техник окрашивания для каждого сезона"), ("Как AI-предпросмотр цвета волос спасёт вас от неудачного окрашивания", "ai-hair-color-preview-guide", "Почему AI-предпросмотр лучше догадок"), ("Анализ цветотипа: Полное руководство", "color-analysis", "Всё, что нужно знать, чтобы найти свои лучшие цвета", True)],
    "ar": [("كيف تجدين أفضل لون شعر بناءً على موسم ألوانك", "best-hair-color-for-color-season", "دليل شامل لاختيار لون الشعر حسب الموسم"), ("بالياج أم خصل أم صبغة كاملة؟ كيف تختارين", "hair-coloring-technique-color-season", "مقارنة تقنيات الصبغ لكل موسم"), ("كيف يمكن لمعاينة لون الشعر بالذكاء الاصطناعي أن تنقذك من صبغة فاشلة", "ai-hair-color-preview-guide", "لماذا المعاينة بالذكاء الاصطناعي أفضل من التخمين"), ("تحليل الألوان: الدليل الكامل", "color-analysis", "كل ما تحتاجين معرفته للعثور على أفضل ألوانك", True)],
    "hi": [("अपने कलर सीज़न के आधार पर सबसे अच्छा हेयर कलर कैसे खोजें", "best-hair-color-for-color-season", "सीज़न के अनुसार हेयर कलर चुनने की पूरी गाइड"), ("Balayage, हाइलाइट्स या ऑल-ओवर कलर? कैसे चुनें", "hair-coloring-technique-color-season", "प्रत्येक सीज़न के लिए कलरिंग तकनीकों की तुलना"), ("AI हेयर कलर प्रीव्यू आपको बुरे डाई जॉब से कैसे बचा सकता है", "ai-hair-color-preview-guide", "AI से प्रीव्यू करना अनुमान लगाने से क्यों बेहतर है"), ("कलर एनालिसिस: पूरी गाइड", "color-analysis", "अपने सर्वश्रेष्ठ रंग खोजने के लिए जानने योग्य सब कुछ", True)],
    "th": [("วิธีหาสีผมที่เหมาะที่สุดตาม Color Season ของคุณ", "best-hair-color-for-color-season", "คู่มือครบถ้วนในการเลือกสีผมตามฤดูกาล"), ("Balayage ไฮไลท์ หรือย้อมทั้งหัว? เลือกอย่างไร", "hair-coloring-technique-color-season", "เปรียบเทียบเทคนิคการย้อมสำหรับแต่ละฤดูกาล"), ("AI Hair Color Preview ช่วยคุณหลีกเลี่ยงการย้อมที่พลาดได้อย่างไร", "ai-hair-color-preview-guide", "ทำไมการพรีวิวด้วย AI ดีกว่าการเดา"), ("Color Analysis: คู่มือฉบับสมบูรณ์", "color-analysis", "ทุกสิ่งที่คุณต้องรู้เพื่อค้นหาสีที่เหมาะกับคุณที่สุด", True)],
    "vi": [("Cách tìm màu tóc phù hợp nhất theo mùa màu của bạn", "best-hair-color-for-color-season", "Hướng dẫn toàn diện chọn màu tóc theo mùa"), ("Balayage, highlight hay nhuộm toàn bộ? Cách chọn", "hair-coloring-technique-color-season", "So sánh kỹ thuật nhuộm tóc cho từng mùa"), ("Xem trước màu tóc bằng AI giúp bạn tránh nhuộm tóc thảm họa", "ai-hair-color-preview-guide", "Tại sao xem trước bằng AI tốt hơn đoán mò"), ("Phân tích màu sắc: Hướng dẫn đầy đủ", "color-analysis", "Mọi thứ bạn cần biết để tìm màu phù hợp nhất", True)],
    "id": [("Cara menemukan warna rambut terbaik berdasarkan musim warna Anda", "best-hair-color-for-color-season", "Panduan lengkap memilih warna rambut berdasarkan musim"), ("Balayage, highlight, atau warna penuh? Cara memilih", "hair-coloring-technique-color-season", "Perbandingan teknik pewarnaan untuk setiap musim"), ("Bagaimana pratinjau warna rambut AI dapat mencegah pewarnaan yang gagal", "ai-hair-color-preview-guide", "Mengapa pratinjau dengan AI lebih baik daripada menebak"), ("Analisis Warna: Panduan Lengkap", "color-analysis", "Semua yang perlu Anda ketahui untuk menemukan warna terbaik", True)],
    "tr": [("Renk sezonunuza göre en iyi saç rengini nasıl bulursunuz", "best-hair-color-for-color-season", "Sezona göre saç rengi seçimi için kapsamlı rehber"), ("Balayage, röfle mi yoksa komple boya mı? Nasıl seçilir", "hair-coloring-technique-color-season", "Her sezon için boyama tekniklerinin karşılaştırması"), ("AI saç rengi önizlemesi sizi kötü bir boyadan nasıl kurtarır", "ai-hair-color-preview-guide", "AI ile önizlemenin tahmin etmekten neden daha iyi olduğu"), ("Renk Analizi: Eksiksiz Rehber", "color-analysis", "En iyi renklerinizi bulmak için bilmeniz gereken her şey", True)],
}

REL_HEADERS = {
    "zh": "## 相关文章", "ja": "## 関連記事", "ko": "## 관련 글", "es": "## Artículos relacionados",
    "fr": "## Articles connexes", "de": "## Verwandte Artikel", "pt": "## Artigos relacionados",
    "it": "## Articoli correlati", "ru": "## Похожие статьи", "ar": "## مقالات ذات صلة",
    "hi": "## संबंधित लेख", "th": "## บทความที่เกี่ยวข้อง", "vi": "## Bài viết liên quan",
    "id": "## Artikel Terkait", "tr": "## İlgili Yazılar",
}

def related(loc):
    lines = [REL_HEADERS[loc], ""]
    for item in RELATED[loc]:
        t, s, d = item[0], item[1], item[2]
        path = f"/{loc}/color-analysis" if len(item) > 3 else f"/{loc}/blog/{s}"
        lines.append(f"- [{t}]({path}) — {d}")
    return "\n".join(lines)

def build(loc):
    body_path = os.path.join(LOCALES_DIR, f"{loc}.md")
    if not os.path.exists(body_path):
        return False, f"missing body {loc}.md"
    with open(body_path, encoding="utf-8") as f:
        body = f.read().strip()
    title, desc, tags = META[loc]
    tags_str = ", ".join(f'"{t}"' for t in tags)
    content = f"""---
title: "{title}"
description: "{desc}"
date: "{DATE}"
tags: [{tags_str}]
image: "{IMAGE}"
---

{body}

---

{related(loc)}
"""
    out = os.path.join(BASE, loc, f"{SLUG}.md")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(content)
    return True, out

if __name__ == "__main__":
    ok, fail = [], []
    for loc in META:
        success, msg = build(loc)
        (ok if success else fail).append((loc, msg))
    print("Created:", ", ".join(l for l,_ in ok))
    if fail:
        print("Failed:", fail)
