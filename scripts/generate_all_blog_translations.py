#!/usr/bin/env python3
import os
BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "it", "ru", "ar", "hi", "th", "vi", "id", "tr"]

def write_file(loc, slug, content):
    path = os.path.join(BASE, loc, f"{slug}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

def rel(loc, links):
    lines = ["## Related Articles" if loc == "en" else {
        "zh":"## 相关文章","ja":"## 関連記事","ko":"## 관련 글","es":"## Artículos relacionados",
        "fr":"## Articles connexes","de":"## Verwandte Artikel","pt":"## Artigos relacionados",
        "it":"## Articoli correlati","ru":"## Похожие статьи","ar":"## مقالات ذات صلة",
        "hi":"## संबंधित लेख","th":"## บทความที่เกี่ยวข้อง","vi":"## Bài viết liên quan",
        "id":"## Artikel Terkait","tr":"## İlgili Yazılar"
    }.get(loc, "## Related Articles"), ""]
    for title, slug2, desc in links:
        lines.append(f"- [{title}](/{loc}/blog/{slug2}) — {desc}")
    return "\n".join(lines)

# Import article data from separate modules would be ideal, but inline for single script
