#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate going-blonde-best-shade-skin-tone translations.
Reads English source, applies locale-specific link replacement and translated content.
"""
import os
import re

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
EN_PATH = os.path.join(BASE, "en", "going-blonde-best-shade-skin-tone.md")
SLUG = "going-blonde-best-shade-skin-tone"
LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "it", "ru", "ar", "hi", "th", "vi", "id", "tr"]

# Import full translations
from going_blonde_translations import TRANSLATIONS

def localize_links(text, loc):
    text = text.replace("/en/blog/how-to-determine-skin-undertone", f"/{loc}/blog/how-to-determine-skin-undertone")
    text = text.replace("/en/color-analysis", f"/{loc}/color-analysis")
    text = text.replace("/en/blog/best-hair-color-for-color-season", f"/{loc}/blog/best-hair-color-for-color-season")
    text = text.replace("/en/blog/hair-coloring-technique-color-season", f"/{loc}/blog/hair-coloring-technique-color-season")
    text = text.replace("/en/blog/ai-hair-color-preview-guide", f"/{loc}/blog/ai-hair-color-preview-guide")
    return text

def write_locale(loc, data):
    tags = ", ".join(f'"{t}"' for t in data["tags"])
    body = localize_links(data["body"], loc)
    content = f"""---
title: "{data["title"]}"
description: "{data["description"]}"
date: "2026-09-16"
tags: [{tags}]
image: "/images/blog/going-blonde-best-shade-skin-tone.webp"
---

{body}
"""
    path = os.path.join(BASE, loc, f"{SLUG}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"OK {loc}/{SLUG}.md ({len(content)} bytes)")

if __name__ == "__main__":
    for loc in LOCALES:
        if loc not in TRANSLATIONS:
            print(f"MISSING {loc}")
            continue
        write_locale(loc, TRANSLATIONS[loc])
    print("Done!")
