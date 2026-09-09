#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate remaining blog translations for 3 articles across 15 locales."""
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "it", "ru", "ar", "hi", "th", "vi", "id", "tr"]

REL = {
    "zh": "## 相关文章", "ja": "## 関連記事", "ko": "## 관련 글",
    "es": "## Artículos relacionados", "fr": "## Articles connexes",
    "de": "## Verwandte Artikel", "pt": "## Artigos relacionados",
    "it": "## Articoli correlati", "ru": "## Похожие статьи",
    "ar": "## مقالات ذات صلة", "hi": "## संबंधित लेख",
    "th": "## บทความที่เกี่ยวข้อง", "vi": "## Bài viết liên quan",
    "id": "## Artikel Terkait", "tr": "## İlgili Yazılar",
}

def w(loc, slug, title, desc, date, tags, image, body, related):
    tags_s = ", ".join(f'"{t}"' for t in tags)
    rel = REL[loc] + "\n\n" + "\n".join(f"- [{t}](/{loc}/blog/{s}) — {d}" for t, s, d in related)
    content = f"""---
title: "{title}"
description: "{desc}"
date: "{date}"
tags: [{tags_s}]
image: "{image}"
---

{body}

{rel}"""
    path = os.path.join(BASE, loc, f"{slug}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content + "\n")
    print(f"  {loc}/{slug}")

# Import article bodies from data module
from blog_translation_data import JEWELRY, OCCASION, STYLE

def main():
    for loc in LOCALES:
        d = JEWELRY[loc]
        w(loc, "jewelry-metals-skin-tone-guide", d["title"], d["desc"], "2026-07-27",
          d["tags"], "/images/blog/jewelry-metals-skin-tone-guide.webp", d["body"], d["related"])
    for loc in LOCALES:
        d = OCCASION[loc]
        w(loc, "occasion-makeup-guide-by-event", d["title"], d["desc"], "2026-07-28",
          d["tags"], "/images/blog/occasion-makeup-guide-by-event.webp", d["body"], d["related"])
    for loc in LOCALES:
        d = STYLE[loc]
        w(loc, "style-personality-types-guide", d["title"], d["desc"], "2026-07-29",
          d["tags"], "/images/blog/style-personality-types-guide.webp", d["body"], d["related"])
    print("Done: 45 files")

if __name__ == "__main__":
    main()
