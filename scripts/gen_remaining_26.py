#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate remaining 26 blog translation files."""
import os
BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")

def w(loc, slug, content):
    path = os.path.join(BASE, loc, f"{slug}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"OK {loc}/{slug}")

# Load from external data - run inline for pt jewelry as test
exec(open(os.path.join(os.path.dirname(__file__), "blog_translations_pt_it_ru.py"), encoding="utf-8").read())
exec(open(os.path.join(os.path.dirname(__file__), "blog_translations_ar_hi_th.py"), encoding="utf-8").read())
exec(open(os.path.join(os.path.dirname(__file__), "blog_translations_vi_id_tr.py"), encoding="utf-8").read())
exec(open(os.path.join(os.path.dirname(__file__), "blog_translations_ja_ko.py"), encoding="utf-8").read())

for loc, articles in ALL.items():
    for slug, data in articles.items():
        w(loc, slug, data)

print("Done")
