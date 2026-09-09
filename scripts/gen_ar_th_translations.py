#!/usr/bin/env python3
"""Generate build_ar/th_translations.py and locale maps from EN + glossaries + exact overrides."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES = ROOT / "src" / "messages"
SCRIPTS = Path(__file__).resolve().parent
DATA = SCRIPTS / "locale_data"

EN = json.load(open(MESSAGES / "en.json", encoding="utf-8"))

# --- Season names (longest first) ---
SEASONS = [
    ("Bright Winter", ("الشتاء الزاهي", "ไบรท์วินเทอร์")),
    ("Clear Winter", ("الشتاء الصافي", "เคลียร์วินเทอร์")),
    ("Cool Winter", ("الشتاء البارد", "คูลวินเทอร์")),
    ("True Winter", ("الشتاء الحقيقي", "ทรูวินเทอร์")),
    ("Deep Winter", ("الشتاء العميق", "ดีพวินเทอร์")),
    ("Dark Winter", ("الشتاء الداكن", "ดาร์ควินเทอร์")),
    ("Bright Spring", ("الربيع الزاهي", "ไบรท์สปริง")),
    ("Clear Spring", ("الربيع الصافي", "เคลียร์สปริง")),
    ("Warm Spring", ("الربيع الدافئ", "วอร์มสปริง")),
    ("True Spring", ("الربيع الحقيقي", "ทรูสปริง")),
    ("Light Spring", ("الربيع الفاتح", "ไลท์สปริง")),
    ("Soft Summer", ("الصيف الناعم", "ซอฟต์ซัมเมอร์")),
    ("Cool Summer", ("الصيف البارد", "คูลซัมเมอร์")),
    ("True Summer", ("الصيف الحقيقي", "ทรูซัมเมอร์")),
    ("Light Summer", ("الصيف الفاتح", "ไลท์ซัมเมอร์")),
    ("Soft Autumn", ("الخريف الناعم", "ซอฟต์ออทัมน์")),
    ("Warm Autumn", ("الخريف الدافئ", "วอร์มออทัมน์")),
    ("True Autumn", ("الخريف الحقيقي", "ทรูออทัมน์")),
    ("Deep Autumn", ("الخريف العميق", "ดีพออทัมน์")),
    ("Dark Autumn", ("الخريف الداكن", "ดาร์กออทัมน์")),
    ("Autumn", ("الخريف", "ออทัมน์")),
    ("Winter", ("الشتاء", "วินเทอร์")),
    ("Summer", ("الصيف", "ซัมเมอร์")),
    ("Spring", ("الربيع", "สปริง")),
]

# --- Color & term glossary (longest first) ---
GLOSSARY = [
    ("Asian Skin Tones", ("درجات البشرة الآسيوية", "โทนผิวเอเชีย")),
    ("Dark Skin Tones", ("درجات البشرة الداكنة", "โทนผิวเข้ม")),
    ("Olive Skin Tones", ("درجات البشرة الزيتونية", "โทนผิวมะกอก")),
    ("Fair Skin Tones", ("درجات البشرة الفاتحة", "โทนผิวขาว")),
    ("Medium Skin Tones", ("درجات البشرة المتوسطة", "โทนผิวสีกลาง")),
    ("Redheads & Auburn Hair", ("أصحاب الشعر الأحمر والكستنائي", "ผมแดงและผมออเบิร์น")),
    ("Washed-out Pastels", ("ألوان باستيل باهتة", "พาสเทลจางๆ")),
    ("Neon Colors", ("ألوان نيون", "สีนีออน")),
    ("Muted colors", ("ألوان هادئة", "สีหม่น")),
    ("Ashy tones", ("درجات رمادية", "โทนเทา")),
    ("Ash tones", ("درجات رمادية", "โทนเทา")),
    ("Muted ash tones", ("درجات رمادية هادئة", "โทนเทาหม่น")),
    ("Cool ash tones", ("درجات رمادية باردة", "โทนเทาเย็น")),
    ("Sun-kissed highlights", ("لمسات شمسية", "ไฮไลต์โดนแดด")),
    ("Golden highlights", ("لمسات ذهبية", "ไฮไลต์สีทอง")),
    ("Caramel highlights", ("لمسات كaramel", "ไฮไลต์คาราเมล")),
    ("Cinnamon highlights", ("لمسات قرفة", "ไฮไลต์อบเชย")),
    ("Deep copper highlights", ("لمسات نحاسية عميقة", "ไฮไลต์ทองแดงเข้ม")),
    ("Dark cherry highlights", ("لمسات كرز داكنة", "ไฮไลต์เชอร์รี่เข้ม")),
    ("Cool burgundy highlights", ("لمسات عنابي باردة", "ไฮไลต์บורกันดีเย็น")),
    ("Soft auburn highlights", ("لمسات كastanai ناعمة", "ไฮไลต์ออเบิร์นอ่อน")),
    ("Icy platinum highlights", ("لمسات بلاتينية جليدية", "ไฮไลต์แพลทินัมเย็น")),
    ("Platinum with soft tone", ("بلاتيني بنغمة ناعمة", "แพลทินัมโทนอ่อน")),
    ("Light colors overall", ("ألوان فاتحة بشكل عام", "โทนสีอ่อนโดยรวม")),
    ("Bronde (cool-toned)", ("بlonde باردة", "บlondeโทนเย็น")),
    ("Warm golden blonde", ("أشقر ذهبي دافئ", "บลอนด์ทองอุ่น")),
    ("Warm golden tones", ("درجات ذهبية دافئة", "โทนทองอุ่น")),
    ("Light honey brown", ("بني عسلي فاتح", "น้ำตาลน้ำผึ้งอ่อน")),
    ("Light ash blonde", ("أشقر رمادي فاتح", "บลอนด์เทาอ่อน")),
    ("Cool strawberry blonde", ("أشقر فراولة بارد", "บลอนด์สตรอว์เบอร์รี่เย็น")),
    ("Strawberry blonde", ("أشقر فراولة", "บลอนด์สตรอว์เบอร์รี่")),
    ("Platinum blonde", ("أشقر بلاتيني", "บลอนด์แพลทินัม")),
    ("Golden blonde", ("أشقر ذهبي", "บลอนด์ทอง")),
    ("Light blonde", ("أشقر فاتح", "บlอนด์อ่อน")),
    ("Ash blonde", ("أشقر رمادي", "บลอนด์เทา")),
    ("Ash brunette", ("بrunette رمادية", "บrunetteเทา")),
    ("Rich brunette with warm highlights", ("بrunette غنية بلمسات دافئة", "บrunetteเข้มไฮไลต์อุ่น")),
    ("Light mushroom brown", ("بني فطر فاتح", "น้ำตาลเห็ดอ่อน")),
    ("Mushroom brown", ("بني فطر", "น้ำตาลเห็ด")),
    ("Soft ash brown", ("بني رمادي ناعم", "น้ำตาลเทาอ่อน")),
    ("Muted rose brown", ("بني وردي هادئ", "น้ำตาลโรสหม่น")),
    ("Rich dark brown", ("بني داكن غني", "น้ำตาลเข้มเข้ม")),
    ("Natural dark brown", ("بني داكن طبيعي", "น้ำตาลเข้มธรรมชาติ")),
    ("Cool medium brown", ("بني متوسط بارد", "น้ำตาลกลางเย็น")),
    ("Cool light brown", ("بني فاتح بارد", "น้ำตาลอ่อนเย็น")),
    ("Cool dark brown", ("بني داكن بارد", "น้ำตาลเข้มเย็น")),
    ("Cool dark blonde", ("أشقر داكن بارد", "บลอนด์เข้มเย็น")),
    ("Warm black-brown", ("أسود-بني دافئ", "ดำ-น้ำตาลอุ่น")),
    ("Rich dark auburn", ("كastanai داكن غني", "ออเบิร์นเข้มเข้ม")),
    ("Rich auburn", ("كastanai غني", "ออเบิร์nเข้ม")),
    ("Dark auburn", ("كastanai داكن", "ออเบิร์nเข้ม")),
    ("Warm auburn", ("كastanai دافئ", "ออเบิร์nอุ่น")),
    ("Warm bronde", ("بlonde دافئة", "บlondeอุ่น")),
    ("Warm copper", ("نحاسي دافئ", "ทองแดงอุ่น")),
    ("Bright copper", ("نحاسي زاهي", "ทองแดงสด")),
    ("Warm chestnut", ("كastana دافئة", "เกาลัดอุ่น")),
    ("Warm caramel", ("كراميل دافئ", "คาราเมลอุ่น")),
    ("Soft caramel", ("كراميل ناعم", "คาราเมลอ่อน")),
    ("Warm chocolate", ("شوكolade دافئ", "ช็อกโกแลตอุ่น")),
    ("Dark Chocolate", ("شوكolade داكن", "ช็อกโกแลตเข้ม")),
    ("Chocolate Brown", ("بني شوكolade", "น้ำตาลช็อกโกแลต")),
    ("Golden Brown", ("بني ذهبي", "น้ำตาลทอง")),
    ("Golden brown", ("بني ذهبي", "น้ำตาลทอง")),
    ("Rich golden brown", ("بني ذهبي غني", "น้ำตาลทองเข้ม")),
    ("Dark golden brown", ("بني ذهبي داكن", "น้ำตาลทองเข้ม")),
    ("Light Periwinkle", ("بنفسجي فاتح", "ม่วงอ่อน")),
    ("Buttercup Yellow", ("أصفر زهرة الحوcup", "เหลือง buttercup")),
    ("Soft Cornflower", ("أزرق زهرة الذرة", "คอrnflowerอ่อน")),
    ("Light Periwinkle", ("بنفسجي فاتح", "ม่วงอ่อน")),
    ("Heather Gray", ("رمادي خلنج", "เทา heather")),
    ("Dove Gray", ("رمادي فاتح", "เทาอ่อน")),
    ("Steel Blue", ("أزرق فولاذي", "น้ำเงินเหล็ก")),
    ("Royal Blue", ("أزرق ملكي", "น้ำเงินรอยัล")),
    ("Royal Purple", ("بنفسجي ملكي", "ม่วงรอยัล")),
    ("Midnight Blue", ("أزرق منتصف الليل", "น้ำเงินเที่ยงคืน")),
    ("Cobalt Blue", ("أزرق كobalt", "น้ำเงินโคบอลต์")),
    ("Powder Blue", ("أزرق بودرة", "น้ำเงินพาสเทล")),
    ("Baby Blue", ("أزرق فاتح", "ฟ้าอ่อน")),
    ("Electric Blue", ("أزرق كهربائي", "น้ำเงินไฟฟ้า")),
    ("Bright Aqua", ("أزرق مائي زاهي", "ฟ้าสด")),
    ("Icy Blue", ("أزرق جليدي", "น้ำเงินเย็น")),
    ("Icy Mint", ("نعناع جليدي", "มิntเย็น")),
    ("Icy Pink", ("وردي جليدي", "ชมพูเย็น")),
    ("Icy White", ("أبيض جليدي", "ขาวเย็น")),
    ("Icy Lavender", ("لavender جليدي", "ม่วงลาเวนเดอร์เย็น")),
    ("Hot Pink", ("وردي ساخن", "ชมพูสด")),
    ("Hot Coral", ("مرجاني ساخن", "คอรัลสด")),
    ("Rose Pink", ("وردي وردي", "ชมพูโรส")),
    ("Soft Pink", ("وردي ناعم", "ชมพูอ่อน")),
    ("Pastel Pink", ("وردي باستيل", "ชมพูพาสเทล")),
    ("Nude Pink", ("وردي nude", "ชมพูนู้ด")),
    ("Warm Pink", ("وردي دافئ", "ชมพูอุ่น")),
    ("Cool Pink", ("وردي بارد", "ชมพูเย็น")),
    ("Light Coral", ("مرجاني فاتح", "คอรัลอ่อน")),
    ("Soft Coral", ("مرجاني ناعم", "คอรัลอ่อน")),
    ("Warm Coral", ("مرجاني دافئ", "คอรัลอุ่น")),
    ("Dusty Coral", ("مرجاني هادئ", "คอรัลหม่น")),
    ("Bright Coral", ("مرجاني زاهي", "คอรัลสด")),
    ("Light Peach", ("خوخي فاتح", "พีชอ่อน")),
    ("Deep Peach", ("خوخي عميق", "พีชเข้ม")),
    ("Light Yellow", ("أصفر فاتح", "เหลืองอ่อน")),
    ("Pastel Yellow", ("أصفر بастel", "เหลืองพาสเทล")),
    ("Golden Yellow", ("أصفر ذهبي", "เหลืองทอง")),
    ("Neon Yellow", ("أصفر نيون", "เหลืองนีออน")),
    ("Bright Yellow", ("أصفر زاهي", "เหลืองสด")),
    ("Warm Yellow", ("أصفر دافئ", "เหลืองอุ่น")),
    ("Kelly Green", ("أخضر kelly", "เขียv kelly")),
    ("Grass Green", ("أخضr عشb", "เขียvหญ้า")),
    ("Lime Green", ("أخضr ليمون", "เขียvมะนาว")),
    ("Sage Green", ("أخضr مeremية", "เขียvเ�sage")),
    ("Forest Green", ("أخضr غابة", "เขียvป่า")),
    ("Olive Green", ("أخضr زيتون", "เขียvมะกอก")),
    ("Olive Drab", ("زيتوني باهt", "olive drab")),
    ("Deep Forest", ("غابة عميقة", "ป่าเข้ม")),
    ("Neon Green", ("أخضr نيون", "เขียvนีออน")),
    ("Bright Teal", ("أزرق مخضr زاهي", "tealสด")),
    ("Dark Teal", ("أزرق مخضr داكن", "tealเข้ม")),
    ("Warm Teal", ("أزرق مخضr دافئ", "tealอุ่น")),
    ("Muted Teal", ("أزرق مخضr هادئ", "tealหม่น")),
    ("Soft Teal", ("أزرq مخضr ناعm", "tealอ่อน")),
    ("Soft Turquoise", ("فيروزي ناعm", "เทอร์คoiseอ่อน")),
    ("Warm Turquoise", ("فيروزي دافئ", "เทอร์คoiseอุ่น")),
    ("Bright Turquoise", ("فيروزي زاهي", "เทอร์คoiseสด")),
    ("Soft Aqua", ("أزرq مائي ناعm", "aquaอ่อน")),
    ("Soft Jade", ("يشb ناعm", "jadeอ่อน")),
    ("Burnt Orange", ("برتقali محroq", "ส้มเผา")),
    ("Burnt Sienna", ("sienna محroq", "siennaเผา")),
    ("Tomato Red", ("أحmر طماطm", "แดงมะเขือเทศ")),
    ("True Red", ("أحmر حقيقي", "แดงแท้")),
    ("Warm Red", ("أحmر دافئ", "แดงอุ่น")),
    ("Deep Red", ("أحmr عميق", "แดงเข้ม")),
    ("Bright Red", ("أحmr زاهي", "แดงสด")),
    ("Vivid red", ("أحmr حي", "แดงสดใส")),
    ("Dark Burgundy", ("عنابي داكن", "บurgundyเข้ม")),
    ("Deep Burgundy", ("عنابi عميق", "บurgundyเข้ม")),
    ("Muted Burgundy", ("عنابi هادئ", "บurgundyหม่น")),
    ("Warm Burgundy", ("عنابi دافئ", "บurgundyอุ่น")),
    ("Bright burgundy", ("عنابi زاهي", "บurgundyสด")),
    ("Cool burgundy", ("عنابi بارد", "บurgundyเย็น")),
    ("Deep Plum", ("برقiق عميق", "พลัมเข้ม")),
    ("Rich Plum", ("برقiق غني", "พลัมเข้ม")),
    ("Soft Plum", ("برقiق ناعm", "พลัมอ่อน")),
    ("Cool Plum", ("برقiق بارد", "พลัมเย็น")),
    ("Warm Plum", ("برقiق دافئ", "พลัมอุ่น")),
    ("Dusty Plum", ("برقiق هادئ", "พลัมหม่น")),
    ("Deep Rust", ("صدأ عميق", "สนิมเข้ม")),
    ("Dusty Rose", ("وردi هادئ", "โรสหม่น")),
    ("Dusty Gold", ("ذهبi هادئ", "ทองหม่น")),
    ("Dusty Blue", ("أزرq هادئ", "น้ำเงินหม่น")),
    ("Dusty Charcoal", ("فحمi هادئ", "ถ่านหม่น")),
    ("Soft Mauve", ("موve ناعm", "mauveอ่อน")),
    ("Misty Mauve", ("موve ضبابي", "mauveหมอก")),
    ("Muted Mauve", ("موve هادئ", "mauveหม่น")),
    ("Warm Mauve", ("موve دافئ", "mauveอุ่น")),
    ("Soft Lavender", ("لavender ناعm", "ม่วงลาเวนเดอร์อ่อน")),
    ("Light Lavender", ("لavender فاتح", "ม่วงลาเวนเดอร์อ่อน")),
    ("Soft Terracotta", ("terracotta ناعm", "เทอrracottaอ่อน")),
    ("Warm Mushroom", ("فطر دافئ", "เห็ดอุ่น")),
    ("Warm Taupe", ("taupe دافئ", "taupeอุ่น")),
    ("Soft Taupe", ("taupe ناعm", "taupeอ่อน")),
    ("Light Taupe", ("taupe فاتح", "taupeอ่อน")),
    ("Warm Beige", ("بيج دافئ", "เบจอุ่น")),
    ("Warm Ivory", ("عاجi دافئ", "ivoryอุ่น")),
    ("Warm White", ("أبيض دافئ", "ขาวอุ่น")),
    ("Soft White", ("أبيض ناعm", "ขาวอ่อน")),
    ("Pure White", ("أبيض نقي", "ขาวบริสุทธิ์")),
    ("Bright White", ("أبيض زاهي", "ขาวสด")),
    ("Warm Black", ("أسود دافئ", "ดำอุ่น")),
    ("Pure Black", ("أسود نقي", "ดำบริสุทธิ์")),
    ("Jet black", ("أسود jet", "ดำjet")),
    ("Harsh Black", ("أسود قاسi", "ดำเข้m")),
    ("Cool black", ("أسود بارد", "ดำเย็น")),
    ("Blue-black", ("أسود مزرq", "ดำน้ำเงิน")),
    ("Warm Gray", ("رمadi دافئ", "เทาอุ่น")),
    ("Cool Gray", ("رمadi بارد", "เทาเย็น")),
    ("Muted Gray", ("رمadi هادئ", "เทาหม่น")),
    ("Blue-Gray", ("رمadi مزرq", "เทาน้ำเงิน")),
    ("Silver Gray", ("رمadi فضi", "เทาเงิน")),
    ("Heather", ("خلnج", "heather")),
    ("Warm Khaki", ("كaki دافئ", "khakiอุ่น")),
    ("Soft Khaki", ("كaki ناعm", "khakiอ่อน")),
    ("Dark Camel", ("جml داكن", "camelเข้ม")),
    ("Light Camel", ("جml فاتح", "camelอ่อน")),
    ("Dark Navy", ("كحli داكن", "navyเข้m")),
    ("Soft Navy", ("كحli ناعm", "navyอ่อน")),
    ("Bright Navy", ("كحli زاهi", "navyสด")),
    ("Dark Olive", ("زيتونi داكن", "oliveเข้m")),
    ("Warm Olive", ("زيتونi دافئ", "oliveอุ่น")),
    ("Deep Olive", ("زيتونi عميق", "oliveเข้m")),
    ("Dark Espresso", ("إسpresso داكن", "espressoเข้m")),
    ("Cool espresso", ("إسpresso بارد", "espressoเย็น")),
    ("Rich espresso", ("إسpresso غني", "espressoเข้m")),
    ("Cool platinum", ("بلاتينi بارد", "แพลทินัมเย็น")),
    ("Rich Gold", ("ذهبi غني", "ทองเข้m")),
    ("Rich Purple", ("بنفسجi غني", "ม่วงเข้m")),
    ("Vivid Purple", ("بنفسجi حi", "ม่วงสด")),
    ("Dark Purple", ("بنفسجi داكن", "ม่วงเข้m")),
    ("Warm Purple", ("بنفسجi دافئ", "ม่วงอุ่น")),
    ("Cool Purple", ("بنفسجi بارد", "ม่วงเย็n")),
    ("Medium Blue", ("أزرq متوسط", "น้ำเงินกลาง")),
    ("Bright Orange", ("برتقali زاهi", "ส้มสด")),
    ("Cool Charcoal", ("فحمi بارد", "ถ่านเย็n")),
    ("Warm Charcoal", ("فحمi دافئ", "ถ่านอุ่น")),
    ("Dark Chocolate", ("شokolade داكن", "ช็อกโกแลตเข้m")),
    ("Mousy brown", ("بني باهt", "น้ำตาลจืด")),
    ("Light brown", ("بni فاتح", "น้ำตาลอ่อน")),
    ("Warm brown", ("بni دافئ", "น้ำตาลอุ่น")),
    ("Cool brown", ("بni بارد", "น้ำตาลเย็n")),
    ("Peach", ("خوخi", "พีช")),
    ("Coral", ("مرjani", "คอรัล")),
    ("Teal", ("أزرq مخضr", "teal")),
    ("Sage", ("مeremية", "sage")),
    ("Navy", ("كحli", "navy")),
    ("Rust", ("صدأ", "สนิม")),
    ("Cocoa", ("كakao", "โกโก้")),
    ("Khaki", ("كaki", "khaki")),
    ("Beige", ("بيج", "เบจ")),
    ("Cream", ("كريmي", "ครีม")),
    ("Black", ("أسود", "ดำ")),
    ("Olive", ("زيتونi", "olive")),
    ("Camel", ("جmli", "camel")),
    ("Berry", ("توت", "berry")),
    ("Mocha", ("موkا", "mocha")),
    ("Poppy", ("خشxاش", "poppy")),
    ("Orange", ("برتقali", "ส้ม")),
    ("Auburn", ("كastanai", "ออเบิร์n")),
    ("Bronze", ("برonzي", "บronze")),
    ("Salmon", ("سلmونi", "salmon")),
    ("Cobalt", ("كobalt", "โคบอลต์")),
    ("Orchid", ("أورchid", "orchid")),
    ("Copper", ("نحاسi", "ทองแดง")),
    ("Pumpkin", ("قرع", "ฟักทอง")),
    ("Mustard", ("خردl", "mustard")),
    ("Fuchsia", ("فوشia", "fuchsia")),
    ("Emerald", ("زmradi", "มรกต")),
    ("Caramel", ("كرamel", "คาราเมล")),
    ("Sand", ("رملi", "ทราย")),
    ("Men", ("الرجال", "ผู้ชาย")),
    ("Beginners", ("المبتدئون", "ผู้เริ่มต้น")),
    ("Foundation", ("كريm الأساس", "รองพื้น")),
    ("Blush", ("أحmر الخdود", "บลัชออน")),
]

# Load exact overrides if present
EXACT_AR_PATH = DATA / "exact_ar.json"
EXACT_TH_PATH = DATA / "exact_th.json"
EXACT_AR = json.load(open(EXACT_AR_PATH, encoding="utf-8")) if EXACT_AR_PATH.exists() else {}
EXACT_TH = json.load(open(EXACT_TH_PATH, encoding="utf-8")) if EXACT_TH_PATH.exists() else {}


def apply_glossary(text: str, lang: str) -> str:
    exact = EXACT_AR if lang == "ar" else EXACT_TH
    if text in exact:
        return exact[text]
    result = text
    for en, (ar, th) in SEASONS + GLOSSARY:
        rep = ar if lang == "ar" else th
        result = result.replace(en, rep)
    return result


def build_section(lang: str) -> tuple[dict, dict]:
    sd, ad = {}, {}
    missing = []
    for section, out in [("sd", sd), ("ad", ad)]:
        for cat, data in EN[section].items():
            out[cat] = {}
            for k, v in data.items():
                t = apply_glossary(v, lang)
                if re.search(r"[a-zA-Z]{3,}", t) and not all(
                    w in {"AI", "Belle", "NARS", "MAC", "Fenty", "TikTok", "Instagram", "BB", "MLBB", "퍼스널컬러", "パーソナルカラー", "春", "夏", "秋", "冬"}
                    for w in re.findall(r"[a-zA-Z]+", t)
                ):
                    missing.append(v)
                out[cat][k] = t
    return sd, ad, missing


def write_build_file(path: Path, lang: str, sd: dict, ad: dict):
    label = "Arabic" if lang == "ar" else "Thai"
    with open(path, "w", encoding="utf-8") as f:
        f.write(f'#!/usr/bin/env python3\n"""Complete {label} translations for sd and ad sections."""\n\n')
        f.write("SD = ")
        json.dump(sd, f, ensure_ascii=False, indent=4)
        f.write("\n\nAD = ")
        json.dump(ad, f, ensure_ascii=False, indent=4)
        f.write("\n")


def main():
    for lang in ("ar", "th"):
        sd, ad, missing = build_section(lang)
        unique_missing = sorted(set(missing))
        print(f"{lang}: {len(unique_missing)} strings still have English")
        path = SCRIPTS / f"build_{lang}_translations.py"
        write_build_file(path, lang, sd, ad)
        (DATA / f"missing_{lang}.txt").write_text("\n".join(unique_missing), encoding="utf-8")
    print("Wrote build_ar_translations.py and build_th_translations.py")


if __name__ == "__main__":
    main()
