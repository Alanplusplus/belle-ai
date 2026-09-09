#!/usr/bin/env python3
"""Generate blog translations for 3 articles across 15 locales."""
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "it", "ru", "ar", "hi", "th", "vi", "id", "tr"]

def fm(title, desc, date, tags, image):
    tags_str = ", ".join(f'"{t}"' for t in tags)
    return f"""---
title: "{title}"
description: "{desc}"
date: "{date}"
tags: [{tags_str}]
image: "{image}"
---"""

def write(slug, loc, content):
    path = os.path.join(BASE, loc, f"{slug}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  {loc}/{slug}.md")

# ========== ARTICLE 1: jewelry-metals-skin-tone-guide ==========
J1 = {
"zh": {
"title": "金、银还是玫瑰金？如何根据肤色选择珠宝",
"desc": "不确定哪种金属最适合你的肤色？了解你的底色如何决定黄金、白银、玫瑰金或铂金哪种最衬你——还有宝石和耳环推荐。",
"tags": ["珠宝", "肤色", "底色", "配饰", "穿搭指南"],
"related": [
("如何根据你的色彩季型选择配饰：珠宝、围巾及更多", "accessorize-by-color-season", "将金属和宝石与季型色板匹配"),
("每种脸型的最佳耳环款式——视觉指南", "best-earring-styles-face-shape", "选择最衬脸型的耳环造型"),
("冷调 vs 暖调：5 个简单测试找出你的底色（附照片）", "cool-tone-vs-warm-tone", "确认黄金还是白银更适合你"),
],
},
"ja": {
"title": "ゴールド、シルバー、ローズゴールド？肌トーンに合うジュエリーの選び方",
"desc": "どの金属が自分の肌に合うかわからない？アンダートーンからゴールド、シルバー、ローズゴールド、プラチナのどれが最も似合うかを学びましょう。宝石とイヤリングのおすすめも。",
"tags": ["ジュエリー", "肌トーン", "アンダートーン", "アクセサリー", "スタイルガイド"],
"related": [
("カラーシーズン別アクセサリーの選び方：ジュエリー、スカーフなど", "accessorize-by-color-season", "金属と宝石を季節パレットに合わせる"),
("顔型別ベストイヤリングスタイル——ビジュアルガイド", "best-earring-styles-face-shape", "顔を引き立てるイヤリングの形を選ぶ"),
("クールトーン vs ウォームトーン：アンダートーンを見つける5つの簡単テスト（写真付き）", "cool-tone-vs-warm-tone", "ゴールドとシルバーどちらが似合うか確認"),
],
},
"ko": {
"title": "골드, 실버, 로즈골드? 피부톤에 맞는 주얼리 고르는 법",
"desc": "어떤 금속이 내 피부에 어울리는지 모르겠다면? 언더톤에 따라 골드, 실버, 로즈골드, 플래티넘 중 무엇이 가장 잘 어울리는지 알아보세요. 보석과 귀걸이 추천도 함께.",
"tags": ["주얼리", "피부톤", "언더톤", "액세서리", "스타일 가이드"],
"related": [
("컬러 시즌별 액세서리 선택법: 주얼리, 스카프 등", "accessorize-by-color-season", "금속과 보석을 시즌 팔레트에 맞추기"),
("모든 얼굴형에 어울리는 최고의 귀걸이 스타일——비주얼 가이드", "best-earring-styles-face-shape", "얼굴을 돋보이게 하는 귀걸이 모양 선택"),
("쿨톤 vs 웜톤: 언더톤을 찾는 5가지 쉬운 테스트 (사진 포함)", "cool-tone-vs-warm-tone", "골드와 실버 중 무엇이 더 잘 어울리는지 확인"),
],
},
"es": {
"title": "¿Oro, plata o oro rosa? Cómo elegir joyas según tu tono de piel",
"desc": "¿No sabes qué metal te favorece? Descubre cómo tu subtono determina si el oro, la plata, el oro rosa o el platino te quedan mejor, con recomendaciones de gemas y pendientes.",
"tags": ["joyas", "tono de piel", "subtono", "accesorios", "guía de estilo"],
"related": [
("Cómo combinar accesorios según tu estación de color: joyas, bufandas y más", "accessorize-by-color-season", "Combina metales y gemas con tu paleta estacional"),
("Los mejores estilos de pendientes para cada forma de rostro — Guía visual", "best-earring-styles-face-shape", "Elige formas de pendientes que favorezcan tu rostro"),
("Tono frío vs tono cálido: 5 pruebas fáciles para encontrar tu subtono (con fotos)", "cool-tone-vs-warm-tone", "Confirma si el oro o la plata te favorecen más"),
],
},
"fr": {
"title": "Or, argent ou or rose ? Comment choisir vos bijoux selon votre teint",
"desc": "Vous ne savez pas quel métal vous va ? Découvrez comment votre sous-ton détermine si l'or, l'argent, l'or rose ou le platine vous met le plus en valeur — plus des recommandations de pierres et boucles d'oreilles.",
"tags": ["bijoux", "teint", "sous-ton", "accessoires", "guide de style"],
"related": [
("Comment choisir vos accessoires selon votre saison colorimétrique : bijoux, écharpes et plus", "accessorize-by-color-season", "Associez métaux et pierres à votre palette saisonnière"),
("Les meilleurs styles de boucles d'oreilles pour chaque forme de visage — Guide visuel", "best-earring-styles-face-shape", "Choisissez des formes de boucles qui flattent votre visage"),
("Ton froid vs ton chaud : 5 tests faciles pour trouver votre sous-ton (avec photos)", "cool-tone-vs-warm-tone", "Confirmez si l'or ou l'argent vous convient le mieux"),
],
},
"de": {
"title": "Gold, Silber oder Roségold? Schmuck passend zu Ihrem Hautton wählen",
"desc": "Unsicher, welches Metall zu Ihrer Haut passt? Erfahren Sie, wie Ihr Unterton bestimmt, ob Gold, Silber, Roségold oder Platin Ihnen am besten steht — plus Edelstein- und Ohrring-Empfehlungen.",
"tags": ["Schmuck", "Hautton", "Unterton", "Accessoires", "Stilguide"],
"related": [
("Accessoires nach Farbtyp wählen: Schmuck, Schals & mehr", "accessorize-by-color-season", "Metalle und Edelsteine an Ihre saisonale Palette anpassen"),
("Die besten Ohrring-Stile für jede Gesichtsform — Visueller Leitfaden", "best-earring-styles-face-shape", "Ohrringformen wählen, die Ihr Gesicht betonen"),
("Kalt vs. warm: 5 einfache Tests für Ihren Unterton (mit Fotos)", "cool-tone-vs-warm-tone", "Bestätigen Sie, ob Gold oder Silber besser zu Ihnen passt"),
],
},
"pt": {
"title": "Ouro, prata ou ouro rosé? Como escolher joias para o seu tom de pele",
"desc": "Não sabe qual metal combina com a sua pele? Descubra como o seu subtom determina se ouro, prata, ouro rosé ou platina favorecem mais — com recomendações de gemas e brincos.",
"tags": ["joias", "tom de pele", "subtom", "acessórios", "guia de estilo"],
"related": [
("Como combinar acessórios pela sua estação de cor: joias, lenços e mais", "accessorize-by-color-season", "Combine metais e gemas com a sua paleta sazonal"),
("Melhores estilos de brincos para cada formato de rosto — Guia visual", "best-earring-styles-face-shape", "Escolha formatos de brincos que valorizem o rosto"),
("Tom frio vs tom quente: 5 testes fáceis para descobrir o seu subtom (com fotos)", "cool-tone-vs-warm-tone", "Confirme se ouro ou prata favorecem mais"),
],
},
"it": {
"title": "Oro, argento o oro rosa? Come scegliere i gioielli in base al tono della pelle",
"desc": "Non sai quale metallo si adatta alla tua pelle? Scopri come il sottotono determina se oro, argento, oro rosa o platino ti valorizzano di più — con consigli su gemme e orecchini.",
"tags": ["gioielli", "tono della pelle", "sottotono", "accessori", "guida allo stile"],
"related": [
("Come abbinare gli accessori in base alla stagione cromatica: gioielli, sciarpe e altro", "accessorize-by-color-season", "Abbina metalli e gemme alla tua palette stagionale"),
("I migliori stili di orecchini per ogni forma del viso — Guida visiva", "best-earring-styles-face-shape", "Scegli forme di orecchini che valorizzano il viso"),
("Tono freddo vs tono caldo: 5 test facili per trovare il sottotono (con foto)", "cool-tone-vs-warm-tone", "Conferma se oro o argento ti sta meglio"),
],
},
"ru": {
"title": "Золото, серебро или розовое золото? Как выбрать украшения под тон кожи",
"desc": "Не знаете, какой металл подходит вашей коже? Узнайте, как ваш подтон определяет, что больше идёт — золото, серебро, розовое золото или платина. Плюс рекомендации по камням и серьгам.",
"tags": ["украшения", "тон кожи", "подтон", "аксессуары", "гид по стилю"],
"related": [
("Как подбирать аксессуары по цветовому типу: украшения, шарфы и другое", "accessorize-by-color-season", "Сочетайте металлы и камни с сезонной палитрой"),
("Лучшие стили серёг для каждой формы лица — Визуальный гид", "best-earring-styles-face-shape", "Выбирайте форму серёг, которая подчёркивает лицо"),
("Холодный vs тёплый тон: 5 простых тестов для определения подтона (с фото)", "cool-tone-vs-warm-tone", "Убедитесь, что вам больше идёт золото или серебро"),
],
},
"ar": {
"title": "ذهب أم فضة أم ذهب وردي؟ كيف تختارين المجوهرات حسب لون بشرتك",
"desc": "لستِ متأكدة أي معدن يناسب بشرتك؟ تعرّفي كيف يحدد لونك التحتي ما إذا كان الذهب أو الفضة أو الذهب الوردي أو البلاتين يليق بك أكثر — مع توصيات للأحجار الكريمة والأقراط.",
"tags": ["مجوهرات", "لون البشرة", "اللون التحتي", "إكسسوارات", "دليل الأناقة"],
"related": [
("كيف تختارين الإكسسوارات حسب موسم ألوانك: مجوهرات ووشاحات والمزيد", "accessorize-by-color-season", "نسّقي المعادن والأحجار مع لوحة ألوانك الموسمية"),
("أفضل أنماط الأقراط لكل شكل وجه — دليل مرئي", "best-earring-styles-face-shape", "اختاري أشكال أقراط تُبرز وجهك"),
("الدرجة الباردة مقابل الدافئة: 5 اختبارات سهلة لمعرفة لونك التحتي (مع صور)", "cool-tone-vs-warm-tone", "تأكدي هل الذهب أم الفضة يناسبك أكثر"),
],
},
"hi": {
"title": "गोल्ड, सिल्वर या रोज़ गोल्ड? अपनी स्किन टोन के हिसाब से ज्वैलरी कैसे चुनें",
"desc": "पता नहीं कौन सा मetal आपकी त्वचा पर सबसे अच्छा लगता है? जानें कि आपका अंडरटोन कैसे तय करता है कि गोल्ड, सिल्वर, रोज़ गोल्ड या प्लैटिनम आप पर सबसे ज़्यादा सूट करता है — साथ में रत्न और झुमके की सिफ़ारिशें।",
"tags": ["ज्वैलरी", "स्किन टोन", "अंडरटोन", "एक्सेसरीज़", "स्टाइल गाइड"],
"related": [
("अपने कलर सीज़न के हिसाब से एक्सेसरीज़ कैसे चुनें: ज्वैलरी, स्कार्फ और अधिक", "accessorize-by-color-season", "मेटल और रत्नों को अपनी सीज़नल पैलेट से मिलाएँ"),
("हर चेहरे के आकार के लिए बेस्ट झुमके स्टाइल — विज़ुअल गाइड", "best-earring-styles-face-shape", "ऐसे झुमके चुनें जो चेहरे को फ्लैटर करें"),
("कूल टोन vs वarm टोन: अपना अंडरटोन पता करने के 5 आसान टेस्ट (फ़ोटो सहित)", "cool-tone-vs-warm-tone", "पुष्टि करें कि गोल्ड या सिल्वर आप पर बेहतर है"),
],
},
"th": {
"title": "ทอง เงิน หรือโรสโกลด์? เลือกเครื่องประดับให้เข้ากับโทนผิวอย่างไร",
"desc": "ไม่แน่ใจว่าโลหะแบบไหนเข้ากับผิวคุณ? เรียนรู้ว่า undertone กำหนดอย่างไรว่าทอง เงิน โรสโกลด์ หรือแพลทินัม ไหนเหมาะที่สุด — พร้อมคำแนะนำอัญมณีและต่างหู",
"tags": ["เครื่องประดับ", "โทนผิว", "undertone", "แอคเซสซอรี่", "ไกด์สไตล์"],
"related": [
("เลือกแอคเซสซอรี่ตาม Color Season: เครื่องประดับ ผ้าพันคอ และอื่น ๆ", "accessorize-by-color-season", "จับคู่โลหะและอัญมณีกับพาเลตตามฤดูกาล"),
("สไตล์ต่างหูที่ดีที่สุดสำหรับทุกรูปหน้า — ไกด์ภาพ", "best-earring-styles-face-shape", "เลือกทรงต่างหูที่เสริมใบหน้า"),
("โทนเย็น vs โทนอุ่น: 5 วิธีง่าย ๆ หา undertone (พร้อมรูป)", "cool-tone-vs-warm-tone", "ยืนยันว่าทองหรือเงินเหมาะกับคุณมากกว่า"),
],
},
"vi": {
"title": "Vàng, bạc hay vàng hồng? Cách chọn trang sức theo tông da",
"desc": "Không chắc kim loại nào hợp với da bạn? Tìm hiểu undertone quyết định vàng, bạc, vàng hồng hay bạch kim đâu là lựa chọn đẹp nhất — kèm gợi ý đá quý và hoa tai.",
"tags": ["trang sức", "tông da", "undertone", "phụ kiện", "hướng dẫn phong cách"],
"related": [
("Cách phối phụ kiện theo mùa màu: trang sức, khăn quàng và hơn nữa", "accessorize-by-color-season", "Ghép kim loại và đá quý với bảng màu theo mùa"),
("Kiểu hoa tai đẹp nhất cho mọi gương mặt — Hướng dẫn trực quan", "best-earring-styles-face-shape", "Chọn kiểu hoa tai tôn gương mặt"),
("Tông lạnh vs tông ấm: 5 bài test dễ tìm undertone (có ảnh)", "cool-tone-vs-warm-tone", "Xác nhận vàng hay bạc hợp bạn hơn"),
],
},
"id": {
"title": "Emas, Perak, atau Rose Gold? Cara Memilih Perhiasan Sesuai Warna Kulit",
"desc": "Tidak yakin logam mana yang cocok dengan kulit Anda? Pelajari bagaimana undertone menentukan apakah emas, perak, rose gold, atau platinum paling mem flattering — plus rekomendasi batu permata dan anting.",
"tags": ["perhiasan", "warna kulit", "undertone", "aksesori", "panduan gaya"],
"related": [
("Cara Memilih Aksesori Berdasarkan Musim Warna: Perhiasan, Scarf & Lainnya", "accessorize-by-color-season", "Padukan logam dan batu permata dengan palet musiman"),
("Gaya Anting Terbaik untuk Setiap Bentuk Wajah — Panduan Visual", "best-earring-styles-face-shape", "Pilih bentuk anting yang mempercantik wajah"),
("Tone Dingin vs Tone Hangat: 5 Tes Mudah Temukan Undertone (dengan Foto)", "cool-tone-vs-warm-tone", "Pastikan emas atau perak yang paling cocok"),
],
},
"tr": {
"title": "Altın mı, Gümüş mü, Rose Gold mu? Ten Renginize Göre Takı Seçimi",
"desc": "Hangi metalin cildinize uyduğundan emin değil misiniz? Alt tonunuzun altın, gümüş, rose gold veya platinin hangisini daha çok yakıştırdığını öğrenin — mücevher ve küpe önerileriyle birlikte.",
"tags": ["takı", "ten rengi", "alt ton", "aksesuar", "stil rehberi"],
"related": [
("Renk Sezonunuza Göre Aksesuar Seçimi: Takılar, Atkılar ve Daha Fazlası", "accessorize-by-color-season", "Metalleri ve taşları mevsim paletinize uydurun"),
("Her Yüz Şekli İçin En İyi Küpe Stilleri — Görsel Rehber", "best-earring-styles-face-shape", "Yüzünüzü vurgulayan küpe şekilleri seçin"),
("Soğuk vs Sıcak Ton: Alt Tonunuzu Bulmak İçin 5 Kolay Test (Fotoğraflı)", "cool-tone-vs-warm-tone", "Altın mı gümüş mü size daha çok yakışıyor doğrulayın"),
],
},
}

J1_BODY = {
"zh": """## 金属选择难题

这是最常见的穿搭困惑之一：该戴金还是银？答案不在于个人喜好或流行趋势——而在于哪种金属让你的肤色看起来最好。

适合你的"正确"金属，是与你的肤色底色和谐统一的那一种。当你佩戴合适的金属靠近面部时，肤色会更清透，五官更立体，整体形象更精致。选错金属则可能让你看起来偏黄、偏灰，或者有一种说不清道不明的"不对劲"。

---

## 理解底色

你肤色的底色（表面之下的色调）决定了与哪种金属最相配：

**暖底色：** 皮肤带有金色、桃色或橄榄色基调。血管呈绿色。黄金珠宝看起来自然且衬肤色。

**冷底色：** 皮肤带有粉色、蓝色或红色基调。血管呈蓝紫色。白银和铂金看起来自然且衬肤色。

**中性底色：** 冷暖特征兼有。黄金和白银都适合——你很幸运。

---

## 按底色推荐金属

### 暖底色
- **最佳：** 黄金、黄铜、铜、青铜、暖调玫瑰金
- **不错：** 香槟金、做旧金属、暖调钛
- **避免：** 亮银色、冷调铂金、白金（可能显得生硬）

### 冷底色
- **最佳：** 白银、铂金、白金、不锈钢
- **不错：** 冷调玫瑰金、枪色金属、铑镀
- **避免：** 黄金、黄铜、铜（可能加重蜡黄感）

### 中性底色
- **最佳：** 玫瑰金（最完美的中性金属）、双色混搭
- **不错：** 都可以——黄金、白银、铂金都合适
- **小贴士：** 根据场合选择金属，不必只戴一种

---

## 不止金属：宝石搭配

宝石也会与你的肤色产生互动。原则很简单：与你底色同色系宝石，会与肤色更和谐。

**暖底色适合：** 黄水晶、琥珀、石榴石、珊瑚、绿松石、暖调蓝宝石、红玉髓、日光石、暖调珍珠（奶油/香槟色）

**冷底色适合：** 钻石、蓝宝石（蓝色）、紫水晶、海蓝宝石、月光石、红宝石（蓝红调）、祖母绿（蓝绿调）、冷调珍珠（白/银色）

**中性底色适合：** 都可以，但尤其推荐：蛋白石、变石、珍珠（任何色调）、透明钻石、粉晶

---

## 按脸型选耳环款式

除了金属颜色，耳环的**形状**也很重要：

**圆脸：** 长款耳坠、棱角/几何造型、纵向线条拉长脸型
**椭圆脸：** 几乎百搭——耳钉、耳环、耳坠、吊灯式耳环
**方脸：** 圆形耳环、弧形耳坠、泪滴形，柔化棱角
**心形脸：** 吊灯式或下重上轻的款，在下颌处增加宽度
**菱形脸：** 耳钉、短耳坠或扇形耳环，不与颧骨抢风头
**长脸：** 宽耳钉、纽扣式耳环、短圆形耳环，增加横向宽度

---

## 项链长度指南

项链长度会影响颈部和面部视觉效果：

- **颈链（14-16英寸）：** 适合长颈。视觉上缩短颈部。
- **公主链（17-19英寸）：** 百搭之选。最实用的长度。
- **日装链（20-24英寸）：** 拉长躯干。适合商务休闲。
- **歌剧链（28-36英寸）：** 创造纵向线条。适合较短躯干。

---

## 完整珠宝搭配公式

你的理想珠宝组合：
1. **金属色调** 匹配你的底色
2. **耳环形状** 匹配你的脸型
3. **宝石颜色** 来自你的个人色彩色板
4. **尺寸比例** 匹配你的身材框架（娇小选精致款，骨架大可选夸张款）

---

## 试试 AI 珠宝分析

我们的 AI 会分析你的肤色底色、脸型和整体色调，生成完整的珠宝推荐方案——包括金属色调、耳环款式、项链长度和宝石搭配。在你的真实照片上预览不同珠宝的效果。""",
}

# For brevity in script - other locales use a template approach with translated sections
# We'll generate remaining locale bodies programmatically from English structure

print("Script part 1 loaded - run full generation separately")
