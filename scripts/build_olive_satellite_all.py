#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build all olive satellite blog translations from locale body files."""
import os
import re

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
BODIES = os.path.join(os.path.dirname(__file__), "olive_satellite_bodies")
LOCALES = ["zh", "ja", "ko", "es", "de", "pt", "ru", "tr", "id", "it"]
DATE = "2026-09-18"
IMAGE = "/images/blog/olive-undertone-guide.webp"

REL_HEADERS = {
    "zh": "## 相关文章", "ja": "## 関連記事", "ko": "## 관련 글",
    "es": "## Artículos relacionados", "de": "## Verwandte Artikel",
    "pt": "## Artigos relacionados", "ru": "## Похожие статьи",
    "tr": "## İlgili Yazılar", "id": "## Artikel Terkait", "it": "## Articoli correlati",
}

CTA = {
    "zh": ("免费体验 AI 色彩分析", "60 秒，免费，无需注册。发现你的肤色底色与最佳妆容色彩。"),
    "ja": ("無料AIカラー分析を試す", "60秒、無料、登録不要。アンダートーンとベストカラーを見つけましょう。"),
    "ko": ("AI 컬러 분석 무료로 체험하기", "60초, 무료, 가입 불필요. 언더톤과 베스트 메이크업 컬러를 확인하세요."),
    "es": ("Prueba el análisis de color con IA gratis", "60 segundos, gratis, sin registro. Descubre tu subtono y mejores colores."),
    "de": ("Kostenlose KI-Farbanalyse testen", "60 Sekunden, kostenlos, keine Anmeldung. Entdecken Sie Ihren Unterton und Ihre besten Farben."),
    "pt": ("Experimente a análise de cores com IA grátis", "60 segundos, grátis, sem cadastro. Descubra seu subtom e melhores cores."),
    "ru": ("Попробуйте бесплатный AI-анализ", "60 секунд, бесплатно, без регистрации. Узнайте свой подтон и лучшие цвета."),
    "tr": ("Ücretsiz AI renk analizini deneyin", "60 saniye, ücretsiz, kayıt gerekmez. Alt tonunuzu ve en iyi renklerinizi keşfedin."),
    "id": ("Coba analisis warna AI gratis", "60 detik, gratis, tanpa pendaftaran. Temukan undertone dan warna terbaik Anda."),
    "it": ("Prova l'analisi del colore AI gratis", "60 secondi, gratis, senza registrazione. Scopri il tuo sottotono e i colori migliori."),
}

META = {
    "olive-skin-foundation-guide": {
        "zh": ("橄榄肤粉底指南：如何找到完美色号", "橄榄肤粉底 – 橄榄肌底色最佳色号与品牌", "橄榄肤找不到合适粉底？了解暖调冷调为何失效、哪些品牌有橄榄色号、如何按肤色深度选色。", ["橄榄底色", "粉底", "化妆", "肤色底色", "美妆技巧"], [("橄榄肤唇色指南", "olive-skin-lip-color-guide", "橄榄肌最佳口红与唇色"), ("橄榄 vs 中性底色", "olive-vs-neutral-undertone", "如何区分橄榄与中性肤色")]),
        "ja": ("オリーブ肌ファンデーションガイド：完璧な色選び", "オリーブ肌ファンデ – オリーブアンダートーン向けベストブランド", "オリーブ肌に合うファンデが見つからない？ウォーム・クールが合わない理由、オリーブ対応ブランド、深さ別の選び方。", ["オリーブアンダートーン", "ファンデーション", "メイク", "肌の undertone", "美容のコツ"], [("オリーブ肌リップカラーガイド", "olive-skin-lip-color-guide", "オリーブ肌に似合う口紅"), ("オリーブ vs ニュートラル", "olive-vs-neutral-undertone", "オリーブとニュートラルの見分け方")]),
        "ko": ("올리브톤 파운데이션 가이드: 완벽한 색상 찾는 법", "올리브톤 파운데이션 – 올리브 언더톤에 맞는 브랜드와 색상", "올리브톤 파운데이션이 잘 안 맞나요? 웜·쿨 파데가 실패하는 이유, 올리브 전용 라인 브랜드, 깊이별 색상 선택법.", ["올리브톤", "파운데이션", "메이크업", "피부 언더톤", "뷰티 팁"], [("올리브톤 립 컬러 가이드", "olive-skin-lip-color-guide", "올리브 언더톤에 어울리는 립스틱"), ("올리브 vs 뉴트럴 언더톤", "olive-vs-neutral-undertone", "올리브와 뉴트럴 피부 구별법")]),
        "es": ("Guía de base para piel oliva: cómo encontrar tu tono perfecto", "Base para piel oliva – Mejores tonos y marcas para subtono oliva", "¿No encuentras base para piel oliva? Descubre por qué fallan las fórmulas cálidas y frías, qué marcas ofrecen tonos oliva y cómo elegir por profundidad.", ["subtono oliva", "base de maquillaje", "maquillaje", "subtono de piel", "consejos de belleza"], [("Guía de color de labios para piel oliva", "olive-skin-lip-color-guide", "Mejores labiales para subtono oliva"), ("Oliva vs subtono neutro", "olive-vs-neutral-undertone", "Cómo distinguir oliva de neutro")]),
        "de": ("Foundation-Guide für Olivhaut: Den perfekten Ton finden", "Foundation Oliv-Unterton – Beste Farbtöne und Marken", "Foundation für Olivhaut schwer zu finden? Erfahren Sie, warum Warm- und Kalt-Töne scheitern, welche Marken Oliv-Töne bieten und wie Sie nach Tiefe wählen.", ["Oliv-Unterton", "Foundation", "Make-up", "Hautunterton", "Beauty-Tipps"], [("Lippenfarben-Guide für Olivhaut", "olive-skin-lip-color-guide", "Beste Lippenstifte für Oliv-Unterton"), ("Oliv vs Neutral-Unterton", "olive-vs-neutral-undertone", "Oliv von Neutral unterscheiden")]),
        "pt": ("Guia de base para pele oliva: como encontrar o tom perfeito", "Base pele oliva – Melhores tons e marcas para subtom oliva", "Dificuldade em achar base para pele oliva? Saiba por que fórmulas quentes e frias falham, quais marcas têm tons oliva e como escolher por profundidade.", ["subtom oliva", "base", "maquiagem", "subtom de pele", "dicas de beleza"], [("Guia de cor de lábios para pele oliva", "olive-skin-lip-color-guide", "Melhores batons para subtom oliva"), ("Oliva vs subtom neutro", "olive-vs-neutral-undertone", "Como distinguir oliva de neutro")]),
        "ru": ("Гид по тональному крему для оливковой кожи", "Тональный крем оливковый подтон – лучшие оттенки и бренды", "Не можете найти тональный крем для оливковой кожи? Узнайте, почему тёплые и холодные формулы не подходят, какие бренды предлагают оливковые оттенки.", ["оливковый подтон", "тональный крем", "макияж", "подтон кожи", "советы по красоте"], [("Гид по цвету губ для оливковой кожи", "olive-skin-lip-color-guide", "Лучшие помады для оливкового подтона"), ("Оливковый vs нейтральный подтон", "olive-vs-neutral-undertone", "Как отличить оливковый от нейтрального")]),
        "tr": ("Zeytin teni fondöten rehberi: mükemmel tonu bulma", "Zeytin teni fondöten – zeytin alt tonu için en iyi markalar", "Zeytin teni için fondöten bulamıyor musunuz? Sıcak ve soğuk formüllerin neden başarısız olduğunu, hangi markaların zeytin tonları sunduğunu öğrenin.", ["zeytin alt tonu", "fondöten", "makyaj", "cilt alt tonu", "güzellik ipuçları"], [("Zeytin teni ruj rehberi", "olive-skin-lip-color-guide", "Zeytin alt tonu için en iyi rujlar"), ("Zeytin vs nötr alt ton", "olive-vs-neutral-undertone", "Zeytin ve nötr teni ayırt etme")]),
        "id": ("Panduan foundation kulit zaitun: menemukan shade sempurna", "Foundation kulit zaitun – shade dan merek terbaik untuk undertone zaitun", "Kesulitan menemukan foundation untuk kulit zaitun? Pelajari mengapa formula warm dan cool gagal, merek mana yang punya shade zaitun.", ["undertone zaitun", "foundation", "makeup", "undertone kulit", "tips kecantikan"], [("Panduan warna bibir kulit zaitun", "olive-skin-lip-color-guide", "Lipstick terbaik untuk undertone zaitun"), ("Zaitun vs undertone netral", "olive-vs-neutral-undertone", "Membedakan zaitun dan netral")]),
        "it": ("Guida al fondotinta per pelle oliva: trovare la tonalità perfetta", "Fondotinta pelle oliva – migliori tonalità e brand per sottotono oliva", "Difficoltà a trovare fondotinta per pelle oliva? Scopri perché le formule calde e fredde falliscono, quali brand offrono tonalità oliva.", ["sottotono oliva", "fondotinta", "trucco", "sottotono pelle", "consigli bellezza"], [("Guida colore labbra pelle oliva", "olive-skin-lip-color-guide", "Migliori rossetti per sottotono oliva"), ("Oliva vs sottotono neutro", "olive-vs-neutral-undertone", "Distinguere oliva da neutro")]),
    },
    "olive-skin-best-hair-colors": {
        "zh": ("橄榄肤最佳发色指南", "橄榄肤发色 – 橄榄肌最佳染发色", "探索橄榄肤最佳发色：暖橄榄与冷橄榄规则、季节推荐及应避开的颜色。", ["橄榄底色", "发色", "美容", "个人色彩分析", "风格指南"], [("橄榄肤色彩季型指南", "olive-skin-color-season", "橄榄肌通常属于哪个季型"), ("橄榄肤珠宝金属指南", "olive-skin-jewelry-metals", "橄榄肌适合金还是银")]),
        "ja": ("オリーブ肌に似合うヘアカラーガイド", "オリーブ肌ヘアカラー – オリーブ肌向けベストカラー", "オリーブ肌に似合うヘアカラーを紹介。ウォーム/クールオリーブのルール、シーズン別おすすめ、避けるべき色。", ["オリーブアンダートーン", "ヘアカラー", "美容", "パーソナルカラー", "スタイルガイド"], [("オリーブ肌カラーシーズンガイド", "olive-skin-color-season", "オリーブ肌のシーズン診断"), ("オリーブ肌ジュエリーガイド", "olive-skin-jewelry-metals", "ゴールドかシルバーか")]),
        "ko": ("올리브톤에 어울리는 헤어 컬러 가이드", "올리브톤 헤어컬러 – 올리브 언더톤 베스트 쉐이드", "올리브 피부에 어울리는 헤어 컬러를 알아보세요. 웜/�쿨 올리브 규칙, 시즌별 추천, 피해야 할 색상.", ["올리브톤", "헤어 컬러", "뷰티", "퍼스널 컬러", "스타일 가이드"], [("올리브톤 컬러 시즌 가이드", "olive-skin-color-season", "올리브 피부의 시즌 타입"), ("올리브톤 주얼리 가이드", "olive-skin-jewelry-metals", "골드 vs 실버")]),
        "es": ("Mejores colores de cabello para piel oliva", "Color de cabello piel oliva – mejores tonos para subtono oliva", "Descubre los mejores colores de cabello para piel oliva: reglas warm/cool oliva, recomendaciones por estación y colores a evitar.", ["subtono oliva", "color de cabello", "belleza", "análisis de color personal", "guía de estilo"], [("Guía de estación de color para piel oliva", "olive-skin-color-season", "Qué estación corresponde a piel oliva"), ("Guía de joyas para piel oliva", "olive-skin-jewelry-metals", "¿Oro o plata para piel oliva?")]),
        "de": ("Beste Haarfarben für Olivhaut", "Haarfarbe Oliv-Unterton – beste Töne für Olivhaut", "Entdecken Sie die besten Haarfarben für Olivhaut: Warm-/Kalt-Oliv-Regeln, saisonale Empfehlungen und Farben, die Sie vermeiden sollten.", ["Oliv-Unterton", "Haarfarbe", "Schönheit", "Persönliche Farbanalyse", "Stilguide"], [("Farbsaison-Guide für Olivhaut", "olive-skin-color-season", "Welche Farbsaison für Olivhaut"), ("Schmuck-Guide für Olivhaut", "olive-skin-jewelry-metals", "Gold oder Silber für Olivhaut")]),
        "pt": ("Melhores cores de cabelo para pele oliva", "Cor de cabelo pele oliva – melhores tons para subtom oliva", "Descubra as melhores cores de cabelo para pele oliva: regras warm/cool oliva, recomendações sazonais e cores a evitar.", ["subtom oliva", "cor de cabelo", "beleza", "análise de cor pessoal", "guia de estilo"], [("Guia de estação de cor para pele oliva", "olive-skin-color-season", "Qual estação para pele oliva"), ("Guia de joias para pele oliva", "olive-skin-jewelry-metals", "Ouro ou prata para pele oliva")]),
        "ru": ("Лучшие цвета волос для оливковой кожи", "Цвет волос оливковый подтон – лучшие оттенки", "Узнайте лучшие цвета волос для оливковой кожи: правила тёплого/холодного олива, сезонные рекомендации и цвета, которых стоит избегать.", ["оливковый подтон", "цвет волос", "красота", "анализ цветотипа", "стиль"], [("Гид по цветотипу для оливковой кожи", "olive-skin-color-season", "К какому сезону относится олива"), ("Гид по украшениям для оливковой кожи", "olive-skin-jewelry-metals", "Золото или серебро для оливы")]),
        "tr": ("Zeytin teni için en iyi saç renkleri", "Zeytin teni saç rengi – zeytin alt tonu için en iyi renkler", "Zeytin teni için en iyi saç renklerini keşfedin: warm/cool zeytin kuralları, mevsimsel öneriler ve kaçınılması gereken renkler.", ["zeytin alt tonu", "saç rengi", "güzellik", "kişisel renk analizi", "stil rehberi"], [("Zeytin teni renk sezonu rehberi", "olive-skin-color-season", "Zeytin teni hangi sezona ait"), ("Zeytin teni mücevher rehberi", "olive-skin-jewelry-metals", "Zeytin teni altın mı gümüş mü")]),
        "id": ("Warna rambut terbaik untuk kulit zaitun", "Warna rambut kulit zaitun – shade terbaik untuk undertone zaitun", "Temukan warna rambut terbaik untuk kulit zaitun: aturan warm/cool zaitun, rekomendasi musiman, dan warna yang dihindari.", ["undertone zaitun", "warna rambut", "kecantikan", "analisis warna pribadi", "panduan gaya"], [("Panduan musim warna kulit zaitun", "olive-skin-color-season", "Musim warna untuk kulit zaitun"), ("Panduan perhiasan kulit zaitun", "olive-skin-jewelry-metals", "Emas atau perak untuk zaitun")]),
        "it": ("Migliori colori di capelli per pelle oliva", "Colore capelli pelle oliva – migliori tonalità per sottotono oliva", "Scopri i migliori colori di capelli per pelle oliva: regole warm/cool oliva, consigli stagionali e colori da evitare.", ["sottotono oliva", "colore capelli", "bellezza", "analisi del colore personale", "guida stile"], [("Guida stagione cromatica pelle oliva", "olive-skin-color-season", "Quale stagione per pelle oliva"), ("Guida gioielli pelle oliva", "olive-skin-jewelry-metals", "Oro o argento per pelle oliva")]),
    },
    "olive-skin-lip-color-guide": {
        "zh": ("橄榄肤唇色指南：最佳口红推荐", "橄榄肌唇色 – 橄榄底色最佳口红", "找到橄榄肤最佳唇色：为何标准红色失效、浆果/藕/砖红/暖裸色系及珊瑚色争议。", ["橄榄底色", "化妆", "唇色", "美妆技巧", "个人色彩分析"], [("橄榄肤粉底指南", "olive-skin-foundation-guide", "橄榄肌粉底完美匹配"), ("橄榄 vs 暖调底色", "olive-vs-warm-undertone", "橄榄肌并非简单暖调")]),
        "ja": ("オリーブ肌リップカラーガイド：ベスト口紅", "オリーブ肌 リップカラー – オリーブ肌向けベスト口紅", "オリーブ肌に似合うリップカラーを紹介。定番レッドが合わない理由、ベリー/モーヴ/ブリック/ヌード、コーラルの是非。", ["オリーブアンダートーン", "メイク", "リップカラー", "美容のコツ", "パーソナルカラー"], [("オリーブ肌ファンデーションガイド", "olive-skin-foundation-guide", "オリーブ肌に合うファンデ"), ("オリーブ vs ウォーム", "olive-vs-warm-undertone", "オリーブは単なるウォームではない")]),
        "ko": ("올리브톤 립 컬러 가이드: 베스트 립스틱", "올리브톤 립 컬러 – 올리브 언더톤 베스트 립스틱", "올리브 피부에 어울리는 립 컬러를 찾아보세요. 표준 레드가 실패하는 이유, 베리/모브/브릭/누드, 코랄 논쟁.", ["올리브톤", "메이크업", "립 컬러", "뷰티 팁", "퍼스널 컬러"], [("올리브톤 파운데이션 가이드", "olive-skin-foundation-guide", "올리브 피부 파데 완벽 매칭"), ("올리브 vs 웜 언더톤", "olive-vs-warm-undertone", "올리브는 단순 웜이 아님")]),
        "es": ("Guía de color de labios para piel oliva", "Color de labios piel oliva – mejores labiales para subtono oliva", "Encuentra los mejores colores de labios para piel oliva: por qué fallan los rojos estándar, familias berry/mauve/ladrillo/nude y la polémica del coral.", ["subtono oliva", "maquillaje", "color de labios", "consejos de belleza", "análisis de color personal"], [("Guía de base para piel oliva", "olive-skin-foundation-guide", "Base perfecta para piel oliva"), ("Oliva vs subtono cálido", "olive-vs-warm-undertone", "La piel oliva no es simplemente cálida")]),
        "de": ("Lippenfarben-Guide für Olivhaut", "Lippenfarbe Oliv-Unterton – beste Lippenstifte", "Finden Sie die besten Lippenfarben für Olivhaut: warum Standard-Rot scheitert, Beeren/Mauve/Ziegel/Nude und die Korallen-Debatte.", ["Oliv-Unterton", "Make-up", "Lippenfarbe", "Beauty-Tipps", "Persönliche Farbanalyse"], [("Foundation-Guide für Olivhaut", "olive-skin-foundation-guide", "Perfekte Foundation für Olivhaut"), ("Oliv vs Warm-Unterton", "olive-vs-warm-undertone", "Oliv ist nicht einfach warm")]),
        "pt": ("Guia de cor de lábios para pele oliva", "Cor de lábios pele oliva – melhores batons para subtom oliva", "Encontre as melhores cores de lábios para pele oliva: por que vermelhos padrão falham, famílias berry/mauve/tijolo/nude e a polêmica do coral.", ["subtom oliva", "maquiagem", "cor de lábios", "dicas de beleza", "análise de cor pessoal"], [("Guia de base para pele oliva", "olive-skin-foundation-guide", "Base perfeita para pele oliva"), ("Oliva vs subtom quente", "olive-vs-warm-undertone", "Pele oliva não é simplesmente quente")]),
        "ru": ("Гид по цвету губ для оливковой кожи", "Цвет губ оливковый подтон – лучшие помады", "Найдите лучшие цвета губ для оливковой кожи: почему стандартные красные не подходят, ягодные/мauve/кирпичные/нюдовые и спор о коралле.", ["оливковый подтон", "макияж", "цвет губ", "советы по красоте", "анализ цветотипа"], [("Гид по тональному крему", "olive-skin-foundation-guide", "Идеальный тональный крем"), ("Оливковый vs тёплый подтон", "olive-vs-warm-undertone", "Олива — не просто тёплый")]),
        "tr": ("Zeytin teni ruj rehberi: en iyi rujlar", "Zeytin teni ruj rengi – zeytin alt tonu için en iyi rujlar", "Zeytin teni için en iyi ruj renklerini bulun: standart kırmızılar neden başarısız, berry/mauve/tuğla/nude aileleri ve mercan tartışması.", ["zeytin alt tonu", "makyaj", "ruj rengi", "güzellik ipuçları", "kişisel renk analizi"], [("Zeytin teni fondöten rehberi", "olive-skin-foundation-guide", "Mükemmel fondöten eşleşmesi"), ("Zeytin vs sıcak alt ton", "olive-vs-warm-undertone", "Zeytin sadece sıcak değil")]),
        "id": ("Panduan warna bibir kulit zaitun", "Warna bibir kulit zaitun – lipstick terbaik untuk undertone zaitun", "Temukan warna bibir terbaik untuk kulit zaitun: mengapa merah standar gagal, keluarga berry/mauve/bata/nude dan kontroversi koral.", ["undertone zaitun", "makeup", "warna bibir", "tips kecantikan", "analisis warna pribadi"], [("Panduan foundation kulit zaitun", "olive-skin-foundation-guide", "Foundation sempurna untuk zaitun"), ("Zaitun vs undertone hangat", "olive-vs-warm-undertone", "Zaitun bukan sekadar hangat")]),
        "it": ("Guida colore labbra pelle oliva", "Colore labbra pelle oliva – migliori rossetti per sottotono oliva", "Trova i migliori colori labbra per pelle oliva: perché i rossi standard falliscono, famiglie berry/mauve/mattone/nude e la controversia del corallo.", ["sottotono oliva", "trucco", "colore labbra", "consigli bellezza", "analisi del colore personale"], [("Guida fondotinta pelle oliva", "olive-skin-foundation-guide", "Fondotinta perfetto per oliva"), ("Oliva vs sottotono caldo", "olive-vs-warm-undertone", "Oliva non è semplicemente calda")]),
    },
    "olive-vs-neutral-undertone": {
        "zh": ("橄榄 vs 中性底色：如何区分", "橄榄 vs 中性底色 – 关键区别与识别方法", "你的肤色是橄榄还是中性？了解橄榄被误判为中性的原因、绿色调和粉底匹配的关键区别。", ["橄榄底色", "中性底色", "肤色底色", "色彩分析", "美容"], [("橄榄 vs 暖调底色", "olive-vs-warm-undertone", "橄榄肌并非简单暖调"), ("如何判定肤色底色", "how-to-determine-skin-undertone", "七种底色测试方法")]),
        "ja": ("オリーブ vs ニュートラル：見分け方", "オリーブ vs ニュートラル – 違いと判別方法", "あなたの肌はオリーブ？ニュートラル？オリーブがニュートラルと誤診される理由、グリーンキャストの違いを解説。", ["オリーブアンダートーン", "ニュートラルアンダートーン", "肌の undertone", "カラー分析", "美容"], [("オリーブ vs ウォーム", "olive-vs-warm-undertone", "オリーブは単なるウォームではない"), ("肌の undertone の見分け方", "how-to-determine-skin-undertone", "7つのテスト方法")]),
        "ko": ("올리브 vs 뉴트럴 언더톤: 구별하는 법", "올리브 vs 뉴트럴 – 핵심 차이와 판별법", "올리브인가 뉴트럴인가? 올리브가 뉴트럴로 오진되는 이유, 그린 캐스트와 파데 매칭의 차이.", ["올리브톤", "뉴트럴 언더톤", "피부 언더톤", "컬러 분석", "뷰티"], [("올리브 vs 웜 언더톤", "olive-vs-warm-undertone", "올리브는 단순 웜이 아님"), ("피부 언더톤 판별법", "how-to-determine-skin-undertone", "7가지 테스트 방법")]),
        "es": ("Oliva vs subtono neutro: cómo distinguirlos", "Oliva vs neutro – diferencias clave e identificación", "¿Tu piel es oliva o neutra? Descubre por qué la oliva se confunde con neutro y las diferencias clave en el tono verde.", ["subtono oliva", "subtono neutro", "subtono de piel", "análisis de color", "belleza"], [("Oliva vs subtono cálido", "olive-vs-warm-undertone", "La piel oliva no es simplemente cálida"), ("Cómo determinar tu subtono", "how-to-determine-skin-undertone", "7 métodos de prueba")]),
        "de": ("Oliv vs Neutral-Unterton: Unterschiede erkennen", "Oliv vs Neutral – wichtige Unterschiede und Erkennung", "Ist Ihre Haut oliv oder neutral? Erfahren Sie, warum Oliv als neutral fehlidentifiziert wird und die Rolle des Grünstichs.", ["Oliv-Unterton", "Neutral-Unterton", "Hautunterton", "Farbanalyse", "Schönheit"], [("Oliv vs Warm-Unterton", "olive-vs-warm-undertone", "Oliv ist nicht einfach warm"), ("Hautunterton bestimmen", "how-to-determine-skin-undertone", "7 Testmethoden")]),
        "pt": ("Oliva vs subtom neutro: como distinguir", "Oliva vs neutro – diferenças-chave e identificação", "Sua pele é oliva ou neutra? Descubra por que oliva é confundida com neutro e as diferenças no tom esverdeado.", ["subtom oliva", "subtom neutro", "subtom de pele", "análise de cor", "beleza"], [("Oliva vs subtom quente", "olive-vs-warm-undertone", "Pele oliva não é simplesmente quente"), ("Como determinar seu subtom", "how-to-determine-skin-undertone", "7 métodos de teste")]),
        "ru": ("Оливковый vs нейтральный подтон", "Оливковый vs нейтральный – ключевые отличия", "Ваша кожа оливковая или нейтральная? Узнайте, почему оливу путают с нейтральным и роль зеленоватого оттенка.", ["оливковый подтон", "нейтральный подтон", "подтон кожи", "анализ цветотипа", "красота"], [("Оливковый vs тёплый подтон", "olive-vs-warm-undertone", "Олива — не просто тёплый"), ("Как определить подтон", "how-to-determine-skin-undertone", "7 методов тестирования")]),
        "tr": ("Zeytin vs nötr alt ton: farkları", "Zeytin vs nötr – temel farklar ve tanımlama", "Cildiniz zeytin mi nötr mü? Zeytin tenin neden nötr sanıldığını ve yeşil ton farkını öğrenin.", ["zeytin alt tonu", "nötr alt ton", "cilt alt tonu", "renk analizi", "güzellik"], [("Zeytin vs sıcak alt ton", "olive-vs-warm-undertone", "Zeytin sadece sıcak değil"), ("Alt tonunuzu belirleme", "how-to-determine-skin-undertone", "7 test yöntemi")]),
        "id": ("Zaitun vs undertone netral: perbedaannya", "Zaitun vs netral – perbedaan utama dan identifikasi", "Kulit Anda zaitun atau netral? Pelajari mengapa zaitun disalahartikan sebagai netral dan peran rona hijau.", ["undertone zaitun", "undertone netral", "undertone kulit", "analisis warna", "kecantikan"], [("Zaitun vs undertone hangat", "olive-vs-warm-undertone", "Zaitun bukan sekadar hangat"), ("Cara menentukan undertone", "how-to-determine-skin-undertone", "7 metode tes")]),
        "it": ("Oliva vs sottotono neutro: come distinguere", "Oliva vs neutro – differenze chiave e identificazione", "La tua pelle è oliva o neutra? Scopri perché l'oliva viene scambiata per neutro e il ruolo del cast verde.", ["sottotono oliva", "sottotono neutro", "sottotono pelle", "analisi del colore", "bellezza"], [("Oliva vs sottotono caldo", "olive-vs-warm-undertone", "Oliva non è semplicemente calda"), ("Come determinare il sottotono", "how-to-determine-skin-undertone", "7 metodi di test")]),
    },
    "olive-vs-warm-undertone": {
        "zh": ("橄榄 vs 暖调底色：橄榄肌并非简单暖调", "橄榄 vs 暖调 – 如何区分橄榄与暖调肌肤", "橄榄肌是暖调还是冷调？了解橄榄为何两者都不是、哪些测试结果会误导、色彩匹配差异。", ["橄榄底色", "暖调底色", "肤色底色", "色彩分析", "美容"], [("橄榄 vs 中性底色", "olive-vs-neutral-undertone", "橄榄与中性肌的区别"), ("橄榄肤色彩季型", "olive-skin-color-season", "橄榄肌属于哪个季型")]),
        "ja": ("オリーブ vs ウォーム：オリーブは単なるウォームではない", "オリーブ vs ウォーム – オリーブ肌とウォーム肌の違い", "オリーブ肌はウォーム？クール？オリーブがどちらでもない理由、誤解を招くテスト結果、色選びの違い。", ["オリーブアンダートーン", "ウォームアンダートーン", "肌の undertone", "カラー分析", "美容"], [("オリーブ vs ニュートラル", "olive-vs-neutral-undertone", "オリーブとニュートラルの違い"), ("オリーブ肌カラーシーズン", "olive-skin-color-season", "オリーブ肌のシーズン")]),
        "ko": ("올리브 vs 웜 언더톤: 올리브는 단순 웜이 아님", "올리브 vs 웜 – 올리브와 웜 피부 구별법", "올리브 피부는 웜인가요? 올리브가 웜도 쿨도 아닌 이유, 오해를 부르는 테스트, 컬러 매칭 차이.", ["올리브톤", "웜 언더톤", "피부 언더톤", "컬러 분석", "뷰티"], [("올리브 vs 뉴트럴", "olive-vs-neutral-undertone", "올리브와 뉴트럴 차이"), ("올리브톤 컬러 시즌", "olive-skin-color-season", "올리브 피부 시즌 타입")]),
        "es": ("Oliva vs subtono cálido: la piel oliva no es simplemente cálida", "Oliva vs cálido – cómo distinguir piel oliva de cálida", "¿La piel oliva es cálida o fría? Por qué la oliva no es ninguna, resultados engañosos y diferencias en combinación de colores.", ["subtono oliva", "subtono cálido", "subtono de piel", "análisis de color", "belleza"], [("Oliva vs subtono neutro", "olive-vs-neutral-undertone", "Diferencias oliva y neutro"), ("Estación de color piel oliva", "olive-skin-color-season", "Qué estación es piel oliva")]),
        "de": ("Oliv vs Warm-Unterton: Oliv ist nicht einfach warm", "Oliv vs Warm – Oliv- und Warmhaut unterscheiden", "Ist Olivhaut warm oder kühl? Warum Oliv weder noch ist, irreführende Testergebnisse und Farbabstimmungsunterschiede.", ["Oliv-Unterton", "Warm-Unterton", "Hautunterton", "Farbanalyse", "Schönheit"], [("Oliv vs Neutral", "olive-vs-neutral-undertone", "Oliv und Neutral im Vergleich"), ("Farbsaison Olivhaut", "olive-skin-color-season", "Welche Farbsaison für Olivhaut")]),
        "pt": ("Oliva vs subtom quente: pele oliva não é simplesmente quente", "Oliva vs quente – como distinguir pele oliva de quente", "Pele oliva é quente ou fria? Por que oliva não é nenhuma, resultados enganosos e diferenças na combinação de cores.", ["subtom oliva", "subtom quente", "subtom de pele", "análise de cor", "beleza"], [("Oliva vs subtom neutro", "olive-vs-neutral-undertone", "Diferenças oliva e neutro"), ("Estação de cor pele oliva", "olive-skin-color-season", "Qual estação para pele oliva")]),
        "ru": ("Оливковый vs тёплый подтон", "Оливковый vs тёплый – как отличить оливу от тёплого", "Оливковая кожа тёплая или холодная? Почему олива — ни то, ни другое, вводящие в заблуждение тесты и различия в подборе цветов.", ["оливковый подтон", "тёплый подтон", "подтон кожи", "анализ цветотипа", "красота"], [("Оливковый vs нейтральный", "olive-vs-neutral-undertone", "Олива и нейтральный"), ("Цветотип оливковой кожи", "olive-skin-color-season", "К какому сезону относится олива")]),
        "tr": ("Zeytin vs sıcak alt ton: zeytin sadece sıcak değil", "Zeytin vs sıcak – zeytin ve sıcak cildi ayırt etme", "Zeytin teni sıcak mı soğuk mu? Zeytin neden ikisi de değil, yanıltıcı test sonuçları ve renk eşleştirme farkları.", ["zeytin alt tonu", "sıcak alt ton", "cilt alt tonu", "renk analizi", "güzellik"], [("Zeytin vs nötr", "olive-vs-neutral-undertone", "Zeytin ve nötr farkları"), ("Zeytin teni renk sezonu", "olive-skin-color-season", "Zeytin teni hangi sezon")]),
        "id": ("Zaitun vs undertone hangat: zaitun bukan sekadar hangat", "Zaitun vs hangat – membedakan kulit zaitun dan hangat", "Kulit zaitun hangat atau dingin? Mengapa zaitun bukan keduanya, hasil tes menyesatkan, dan perbedaan pencocokan warna.", ["undertone zaitun", "undertone hangat", "undertone kulit", "analisis warna", "kecantikan"], [("Zaitun vs netral", "olive-vs-neutral-undertone", "Perbedaan zaitun dan netral"), ("Musim warna kulit zaitun", "olive-skin-color-season", "Musim warna untuk zaitun")]),
        "it": ("Oliva vs sottotono caldo: l'oliva non è semplicemente calda", "Oliva vs caldo – distinguere pelle oliva da calda", "La pelle oliva è calda o fredda? Perché l'oliva non è né l'una né l'altra, test fuorvianti e differenze nell'abbinamento colori.", ["sottotono oliva", "sottotono caldo", "sottotono pelle", "analisi del colore", "bellezza"], [("Oliva vs neutro", "olive-vs-neutral-undertone", "Differenze oliva e neutro"), ("Stagione cromatica pelle oliva", "olive-skin-color-season", "Quale stagione per oliva")]),
    },
    "olive-skin-jewelry-metals": {
        "zh": ("橄榄肤珠宝指南：金、银还是玫瑰金？", "橄榄肤金还是银 – 橄榄肌最佳珠宝金属", "橄榄肌该戴金还是银？了解玫瑰金为何常胜出、互补宝石色及季型影响。", ["橄榄底色", "珠宝", "配饰", "个人色彩分析", "风格指南"], [("橄榄肤最佳发色", "olive-skin-best-hair-colors", "橄榄肌染发推荐"), ("橄榄肤色彩季型", "olive-skin-color-season", "橄榄肌季型指南")]),
        "ja": ("オリーブ肌ジュエリーガイド：ゴールド、シルバー、ローズゴールド？", "オリーブ肌 ゴールドかシルバー – オリーブ肌向けジュエリー", "オリーブ肌はゴールド？シルバー？ローズゴールドが勝つ理由、宝石の色、シーズンの影響。", ["オリーブアンダートーン", "ジュエリー", "アクセサリー", "パーソナルカラー", "スタイルガイド"], [("オリーブ肌ヘアカラー", "olive-skin-best-hair-colors", "似合うヘアカラー"), ("オリーブ肌カラーシーズン", "olive-skin-color-season", "シーズン診断")]),
        "ko": ("올리브톤 주얼리 가이드: 골드, 실버, 로즈골드?", "올리브톤 골드 vs 실버 – 올리브 언더톤 주얼리", "올리브 피부에 골드? 실버? 로즈골드가 이기는 이유, 보석 색상, 시즌별 컨텍스트.", ["올리브톤", "주얼리", "액세서리", "퍼스널 컬러", "스타일 가이드"], [("올리브톤 헤어 컬러", "olive-skin-best-hair-colors", "어울리는 헤어 컬러"), ("올리브톤 컬러 시즌", "olive-skin-color-season", "시즌 타입 가이드")]),
        "es": ("Guía de joyas para piel oliva: ¿oro, plata o oro rosa?", "Piel oliva oro o plata – mejores metales para subtono oliva", "¿Oro o plata para piel oliva? Por qué el oro rosa suele ganar, gemas complementarias y contexto estacional.", ["subtono oliva", "joyas", "accesorios", "análisis de color personal", "guía de estilo"], [("Mejores colores de cabello piel oliva", "olive-skin-best-hair-colors", "Colores de cabello favorecedores"), ("Estación de color piel oliva", "olive-skin-color-season", "Guía de estación")]),
        "de": ("Schmuck-Guide für Olivhaut: Gold, Silber oder Roségold?", "Olivhaut Gold oder Silber – bester Schmuck für Oliv-Unterton", "Gold oder Silber für Olivhaut? Warum Roségold oft gewinnt, passende Edelsteine und saisonaler Kontext.", ["Oliv-Unterton", "Schmuck", "Accessoires", "Persönliche Farbanalyse", "Stilguide"], [("Beste Haarfarben Olivhaut", "olive-skin-best-hair-colors", "Schmeichelhafte Haarfarben"), ("Farbsaison Olivhaut", "olive-skin-color-season", "Farbsaison-Guide")]),
        "pt": ("Guia de joias para pele oliva: ouro, prata ou ouro rosa?", "Pele oliva ouro ou prata – melhores metais para subtom oliva", "Ouro ou prata para pele oliva? Por que ouro rosa costuma vencer, gemas complementares e contexto sazonal.", ["subtom oliva", "joias", "acessórios", "análise de cor pessoal", "guia de estilo"], [("Melhores cores de cabelo pele oliva", "olive-skin-best-hair-colors", "Cores de cabelo favorecedoras"), ("Estação de cor pele oliva", "olive-skin-color-season", "Guia de estação")]),
        "ru": ("Гид по украшениям для оливковой кожи: золото, серебро или розовое?", "Оливковая кожа золото или серебро – лучшие металлы", "Золото или серебро для оливковой кожи? Почему розовое золото часто побеждает, камни и сезонный контекст.", ["оливковый подтон", "украшения", "аксессуары", "анализ цветотипа", "стиль"], [("Лучшие цвета волос", "olive-skin-best-hair-colors", "Льстивые оттенки волос"), ("Цветотип оливковой кожи", "olive-skin-color-season", "Гид по сезону")]),
        "tr": ("Zeytin teni mücevher rehberi: altın, gümüş veya rose gold?", "Zeytin teni altın mı gümüş mü – en iyi mücevher metalleri", "Zeytin teni için altın mı gümüş mü? Rose gold neden kazanır, taş renkleri ve mevsimsel bağlam.", ["zeytin alt tonu", "mücevher", "aksesuar", "kişisel renk analizi", "stil rehberi"], [("En iyi saç renkleri", "olive-skin-best-hair-colors", "Flatter saç renkleri"), ("Zeytin teni renk sezonu", "olive-skin-color-season", "Sezon rehberi")]),
        "id": ("Panduan perhiasan kulit zaitun: emas, perak, atau rose gold?", "Kulit zaitun emas atau perak – logam perhiasan terbaik", "Emas atau perak untuk kulit zaitun? Mengapa rose gold sering menang, batu permata, dan konteks musiman.", ["undertone zaitun", "perhiasan", "aksesori", "analisis warna pribadi", "panduan gaya"], [("Warna rambut terbaik", "olive-skin-best-hair-colors", "Warna rambut yang flatters"), ("Musim warna kulit zaitun", "olive-skin-color-season", "Panduan musim")]),
        "it": ("Guida gioielli pelle oliva: oro, argento o rosa?", "Pelle oliva oro o argento – migliori metalli per sottotono oliva", "Oro o argento per pelle oliva? Perché l'oro rosa spesso vince, gemme complementari e contesto stagionale.", ["sottotono oliva", "gioielli", "accessori", "analisi del colore personale", "guida stile"], [("Migliori colori capelli", "olive-skin-best-hair-colors", "Colori di capelli lusinghieri"), ("Stagione cromatica pelle oliva", "olive-skin-color-season", "Guida alla stagione")]),
    },
    "olive-skin-color-season": {
        "zh": ("橄榄肤色彩季型：你属于哪个季型？", "橄榄肤色彩季型 – 橄榄肌属于哪个季型", "橄榄肌属于哪个色彩季型？了解 Soft Autumn、Soft Summer、Deep Autumn、Deep Winter 及 AI 分析如何精准定位。", ["橄榄底色", "色彩季型", "个人色彩分析", "季节色彩", "美容"], [("不同族裔的橄榄肤", "olive-skin-by-ethnicity", "各族群橄榄肌呈现"), ("橄榄 vs 中性底色", "olive-vs-neutral-undertone", "橄榄与中性肌区别")]),
        "ja": ("オリーブ肌カラーシーズン：あなたはどのシーズン？", "オリーブ肌 カラーシーズン – どのシーズンに該当？", "オリーブ肌はどのシーズン？Soft Autumn、Soft Summer、Deep Autumn、Deep Winter とAI分析の活用法。", ["オリーブアンダートーン", "カラーシーズン", "パーソナルカラー", "季節カラー", "美容"], [("民族別オリーブ肌", "olive-skin-by-ethnicity", "民族ごとのオリーブ肌"), ("オリーブ vs ニュートラル", "olive-vs-neutral-undertone", "オリーブとニュートラルの違い")]),
        "ko": ("올리브톤 컬러 시즌: 나는 어떤 시즌?", "올리브톤 컬러 시즌 – 올리브 피부는 어떤 시즌?", "올리브 피부는 어떤 컬러 시즌? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter과 AI 분석 활용법.", ["올리브톤", "컬러 시즌", "퍼스널 컬러", "시즌 컬러", "뷰티"], [("민족별 올리브톤", "olive-skin-by-ethnicity", "다양한 올리브 피부"), ("올리브 vs 뉴트럴", "olive-vs-neutral-undertone", "올리브와 뉴트럴 차이")]),
        "es": ("Estación de color para piel oliva: ¿cuál eres?", "Estación de color piel oliva – qué estación corresponde", "¿Qué estación de color es la piel oliva? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter y análisis con IA.", ["subtono oliva", "estación de color", "análisis de color personal", "color estacional", "belleza"], [("Piel oliva por etnia", "olive-skin-by-ethnicity", "Oliva en distintas etnias"), ("Oliva vs subtono neutro", "olive-vs-neutral-undertone", "Diferencias oliva y neutro")]),
        "de": ("Farbsaison für Olivhaut: Welche Saison sind Sie?", "Farbsaison Olivhaut – welche Saison passt", "Welche Farbsaison für Olivhaut? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter und KI-Analyse.", ["Oliv-Unterton", "Farbsaison", "Persönliche Farbanalyse", "Saisonale Farben", "Schönheit"], [("Olivhaut nach Ethnie", "olive-skin-by-ethnicity", "Oliva in verschiedenen Ethnien"), ("Oliv vs Neutral", "olive-vs-neutral-undertone", "Oliv und Neutral im Vergleich")]),
        "pt": ("Estação de cor para pele oliva: qual é a sua?", "Estação de cor pele oliva – qual estação corresponde", "Qual estação de cor para pele oliva? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter e análise com IA.", ["subtom oliva", "estação de cor", "análise de cor pessoal", "cor sazonal", "beleza"], [("Pele oliva por etnia", "olive-skin-by-ethnicity", "Oliva em diferentes etnias"), ("Oliva vs subtom neutro", "olive-vs-neutral-undertone", "Diferenças oliva e neutro")]),
        "ru": ("Цветотип оливковой кожи: какой вы сезон?", "Цветотип оливковой кожи – к какому сезону относится", "К какому цветотипу относится оливковая кожа? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter и AI-анализ.", ["оливковый подтон", "цветотип", "анализ цветотипа", "сезонные цвета", "красота"], [("Оливковая кожа по этnicity", "olive-skin-by-ethnicity", "Олива в разных этnicity"), ("Оливковый vs нейтральный", "olive-vs-neutral-undertone", "Олива и нейтральный")]),
        "tr": ("Zeytin teni renk sezonu: hangi sezonsunuz?", "Zeytin teni renk sezonu – hangi sezona ait", "Zeytin teni hangi renk sezonu? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter ve AI analizi.", ["zeytin alt tonu", "renk sezonu", "kişisel renk analizi", "mevsimsel renk", "güzellik"], [("Etnisiteye göre zeytin teni", "olive-skin-by-ethnicity", "Farklı etnisitelerde zeytin"), ("Zeytin vs nötr", "olive-vs-neutral-undertone", "Zeytin ve nötr farkları")]),
        "id": ("Musim warna kulit zaitun: musim mana Anda?", "Musim warna kulit zaitun – musim mana yang cocok", "Musim warna apa untuk kulit zaitun? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter dan analisis AI.", ["undertone zaitun", "musim warna", "analisis warna pribadi", "warna musiman", "kecantikan"], [("Kulit zaitun menurut etnis", "olive-skin-by-ethnicity", "Zaitun di berbagai etnis"), ("Zaitun vs netral", "olive-vs-neutral-undertone", "Perbedaan zaitun dan netral")]),
        "it": ("Stagione cromatica pelle oliva: quale sei?", "Stagione cromatica pelle oliva – quale stagione corrisponde", "Quale stagione cromatica per pelle oliva? Soft Autumn, Soft Summer, Deep Autumn, Deep Winter e analisi AI.", ["sottotono oliva", "stagione cromatica", "analisi del colore personale", "colore stagionale", "bellezza"], [("Pelle oliva per etnia", "olive-skin-by-ethnicity", "Oliva in diverse etnie"), ("Oliva vs neutro", "olive-vs-neutral-undertone", "Differenze oliva e neutro")]),
    },
    "olive-skin-by-ethnicity": {
        "zh": ("不同族裔的橄榄肤：橄榄底色在全球的呈现", "橄榄肤亚洲、地中海等 – 各族群橄榄肌特征", "橄榄肌出现在各族裔中——地中海、东亚、南亚、中东、拉丁裔。了解黑色素深度如何与橄榄底色互动。", ["橄榄底色", "深色肌肤", "个人色彩分析", "美容", "肤色"], [("橄榄肤色彩季型", "olive-skin-color-season", "橄榄肌季型指南"), ("橄榄 vs 暖调底色", "olive-vs-warm-undertone", "橄榄并非简单暖调")]),
        "ja": ("民族別オリーブ肌：オリーブアンダートーンの多様性", "オリーブ肌 アジア・地中海 – 民族別オリーブ肌", "オリーブ肌はあらゆる民族に存在。地中海、東アジア、南アジア、中東、ラテン系でのメラニン深度とオリーブの関係。", ["オリーブアンダートーン", "ダークスキン", "パーソナルカラー", "美容", "肌トーン"], [("オリーブ肌カラーシーズン", "olive-skin-color-season", "シーズン診断"), ("オリーブ vs ウォーム", "olive-vs-warm-undertone", "オリーブは単なるウォームではない")]),
        "ko": ("민족별 올리브톤: 다양한 문화권의 올리브 피부", "올리브톤 아시안, 지중해 – 민족별 올리브 피부", "올리브 언더톤은 모든 민족에 존재합니다. 지중해, 동아시아, 남아시아, 중동, 라틴系에서 멜라닌 깊이와 올리브의 상호작용.", ["올리브톤", "다크 스킨", "퍼스널 컬러", "뷰티", "피부톤"], [("올리브톤 컬러 시즌", "olive-skin-color-season", "시즌 타입 가이드"), ("올리브 vs 웜", "olive-vs-warm-undertone", "올리브는 단순 웜이 아님")]),
        "es": ("Piel oliva por etnia: cómo se presenta en distintas culturas", "Piel oliva asiática, mediterránea – oliva por etnia", "El subtono oliva aparece en todas las etnias. Cómo la profundidad de melanina interactúa con el subtono oliva.", ["subtono oliva", "piel oscura", "análisis de color personal", "belleza", "tono de piel"], [("Estación de color piel oliva", "olive-skin-color-season", "Guía de estación"), ("Oliva vs subtono cálido", "olive-vs-warm-undertone", "Oliva no es simplemente cálida")]),
        "de": ("Olivhaut nach Ethnie: Oliv-Unterton weltweit", "Olivhaut asiatisch, mediterran – Oliva nach Ethnie", "Oliv-Unterton tritt in allen Ethnien auf. Wie Melanintiefe mit dem Oliv-Unterton interagiert.", ["Oliv-Unterton", "dunkle Haut", "Persönliche Farbanalyse", "Schönheit", "Hautton"], [("Farbsaison Olivhaut", "olive-skin-color-season", "Farbsaison-Guide"), ("Oliv vs Warm", "olive-vs-warm-undertone", "Oliv ist nicht einfach warm")]),
        "pt": ("Pele oliva por etnia: como se apresenta em diferentes culturas", "Pele oliva asiática, mediterrânea – oliva por etnia", "Subtom oliva aparece em todas as etnias. Como a profundidade de melanina interage com o subtom oliva.", ["subtom oliva", "pele escura", "análise de cor pessoal", "beleza", "tom de pele"], [("Estação de cor pele oliva", "olive-skin-color-season", "Guia de estação"), ("Oliva vs subtom quente", "olive-vs-warm-undertone", "Oliva não é simplesmente quente")]),
        "ru": ("Оливковая кожа по этnicity: олива в разных культурах", "Оливковая кожа азиатская, средиземноморская – олива по этnicity", "Оливковый подтон встречается у всех этnicity. Как глубина меланина взаимодействует с оливковым подтоном.", ["оливковый подтон", "тёмная кожа", "анализ цветотипа", "красота", "тон кожи"], [("Цветотип оливковой кожи", "olive-skin-color-season", "Гид по сезону"), ("Оливковый vs тёплый", "olive-vs-warm-undertone", "Олива — не просто тёплый")]),
        "tr": ("Etnisiteye göre zeytin teni: kültürler arası zeytin alt tonu", "Zeytin teni Asya, Akdeniz – etnisiteye göre zeytin", "Zeytin alt tonu tüm etnisitelerde görülür. Melanin derinliğinin zeytin alt tonuyla etkileşimi.", ["zeytin alt tonu", "koyu ten", "kişisel renk analizi", "güzellik", "cilt tonu"], [("Zeytin teni renk sezonu", "olive-skin-color-season", "Sezon rehberi"), ("Zeytin vs sıcak", "olive-vs-warm-undertone", "Zeytin sadece sıcak değil")]),
        "id": ("Kulit zaitun menurut etnis: presentasi di berbagai budaya", "Kulit zaitun Asia, Mediterania – zaitun menurut etnis", "Undertone zaitun muncul di semua etnis. Bagaimana kedalaman melanin berinteraksi dengan undertone zaitun.", ["undertone zaitun", "kulit gelap", "analisis warna pribadi", "kecantikan", "warna kulit"], [("Musim warna kulit zaitun", "olive-skin-color-season", "Panduan musim"), ("Zaitun vs hangat", "olive-vs-warm-undertone", "Zaitun bukan sekadar hangat")]),
        "it": ("Pelle oliva per etnia: come si presenta nelle diverse culture", "Pelle oliva asiatica, mediterranea – oliva per etnia", "Il sottotono oliva appare in tutte le etnie. Come la profondità della melanina interagisce con il sottotono oliva.", ["sottotono oliva", "pelle scura", "analisi del colore personale", "bellezza", "tono della pelle"], [("Stagione cromatica pelle oliva", "olive-skin-color-season", "Guida alla stagione"), ("Oliva vs caldo", "olive-vs-warm-undertone", "Oliva non è semplicemente calda")]),
    },
}

PILLAR = {
    "zh": ("色彩分析完整指南", "找到最佳色彩所需的一切"),
    "ja": ("カラー分析完全ガイド", "ベストカラーを見つけるためのすべて"),
    "ko": ("퍼스널 컬러 분석 완벽 가이드", "나에게 어울리는 색을 찾는 데 필요한 모든 것"),
    "es": ("Análisis de color: la guía completa", "Todo lo que necesitas para encontrar tus mejores colores"),
    "de": ("Farbanalyse: Der komplette Leitfaden", "Alles, was Sie brauchen, um Ihre besten Farben zu finden"),
    "pt": ("Análise de cores: o guia completo", "Tudo o que você precisa para encontrar suas melhores cores"),
    "ru": ("Анализ цветотипа: полное руководство", "Всё, что нужно знать о ваших лучших цветах"),
    "tr": ("Renk analizi: eksiksiz rehber", "En iyi renklerinizi bulmak için bilmeniz gereken her şey"),
    "id": ("Analisis warna: panduan lengkap", "Semua yang perlu Anda ketahui untuk menemukan warna terbaik"),
    "it": ("Analisi del colore: guida completa", "Tutto ciò che serve per trovare i tuoi colori migliori"),
}

PARENT = {
    "zh": ("橄榄色肤色底色指南", "识别与搭配橄榄肤色的完整指南"),
    "ja": ("オリーブ肌アンダートーンガイド", "オリーブ肌の判別とスタイリング完全ガイド"),
    "ko": ("올리브톤 피부 완벽 가이드", "올리브 언더톤 판별과 스타일링 완벽 가이드"),
    "es": ("Guía de subtono oliva", "Guía completa para identificar y estilizar piel oliva"),
    "de": ("Oliv-Unterton-Leitfaden", "Kompletter Leitfaden zur Erkennung und Styling von Olivhaut"),
    "pt": ("Guia de subtom oliva", "Guia completo para identificar e estilizar pele oliva"),
    "ru": ("Гид по оливковому подтону", "Полное руководство по определению и стилю оливковой кожи"),
    "tr": ("Zeytin alt ton rehberi", "Zeytin teni tanımlama ve stil rehberi"),
    "id": ("Panduan undertone zaitun", "Panduan lengkap mengidentifikasi dan menata kulit zaitun"),
    "it": ("Guida al sottotono oliva", "Guida completa per identificare e valorizzare la pelle oliva"),
}


def localize_body(body: str, locale: str) -> str:
    body = re.sub(r"\(/en/", f"(/{locale}/", body)
    return body


def build_related(locale: str, related_items):
    lines = [REL_HEADERS[locale], ""]
    pt, pd = PILLAR[locale]
    lines.append(f"- [{pt}](/{locale}/color-analysis) — {pd}")
    ptt, ptd = PARENT[locale]
    lines.append(f"- [{ptt}](/{locale}/blog/olive-undertone-guide) — {ptd}")
    for t, s, d in related_items:
        lines.append(f"- [{t}](/{locale}/blog/{s}) — {d}")
    return "\n".join(lines)


def main():
    count = 0
    missing = []
    for slug, locales in META.items():
        for loc in LOCALES:
            body_path = os.path.join(BODIES, slug, f"{loc}.md")
            if not os.path.exists(body_path):
                missing.append(body_path)
                continue
            with open(body_path, encoding="utf-8") as f:
                body = f.read().strip()
            title, seo, desc, tags, related = locales[loc]
            body = localize_body(body, loc)
            cta_label, cta_sub = CTA[loc]
            tags_s = ", ".join(f'"{t}"' for t in tags)
            content = f"""---
title: "{title}"
seoTitle: "{seo}"
description: "{desc}"
date: "{DATE}"
tags: [{tags_s}]
image: "{IMAGE}"
---

{body}

[{cta_label} →](/try)

{cta_sub}

{build_related(loc, related)}
"""
            out = os.path.join(BASE, loc, f"{slug}.md")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  {loc}/{slug}.md")
            count += 1
    if missing:
        print(f"\nMissing {len(missing)} body files:")
        for m in missing[:20]:
            print(f"  {m}")
        if len(missing) > 20:
            print(f"  ... and {len(missing)-20} more")
    print(f"\nBuilt {count} files")


if __name__ == "__main__":
    main()
