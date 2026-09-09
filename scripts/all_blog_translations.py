#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate all blog translations for 3 articles x 15 locales."""
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")

def w(loc, slug, content):
    path = os.path.join(BASE, loc, f"{slug}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"OK {loc}/{slug}")

def rel_header(loc):
    return {
        "zh": "## 相关文章", "ja": "## 関連記事", "ko": "## 관련 글",
        "es": "## Artículos relacionados", "fr": "## Articles connexes",
        "de": "## Verwandte Artikel", "pt": "## Artigos relacionados",
        "it": "## Articoli correlati", "ru": "## Похожие статьи",
        "ar": "## مقالات ذات صلة", "hi": "## संबंधित लेख",
        "th": "## บทความที่เกี่ยวข้อง", "vi": "## Bài viết liên quan",
        "id": "## Artikel Terkait", "tr": "## İlgili Yazılar",
    }[loc]

def rel(loc, items):
    return rel_header(loc) + "\n\n" + "\n".join(
        f"- [{t}](/{loc}/blog/{s}) — {d}" for t, s, d in items
    )

# Load translations from data file
exec(open(os.path.join(os.path.dirname(__file__), "translation_data.py"), encoding="utf-8").read())

if __name__ == "__main__":
    for slug, meta in ARTICLES.items():
        for loc in LOCALES:
            d = meta["locales"][loc]
            tags = ", ".join(f'"{t}"' for t in d["tags"])
            body = f"""---
title: "{d["title"]}"
description: "{d["desc"]}"
date: "{meta["date"]}"
tags: [{tags}]
image: "{meta["image"]}"
---

{d["body"]}

{rel(loc, d["related"])}"""
            w(loc, slug, body)
    print("Done!")
