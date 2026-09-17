#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assemble eyebrow article files from FR body + locale-specific frontmatter/related."""
import os
import re

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
SLUG = "best-eyebrow-shapes-face-shape"
FR_PATH = os.path.join(BASE, "fr", f"{SLUG}.md")

# Import translated bodies for locales that differ from FR
from eyebrow_locale_bodies import BODIES, META, RELATED, REL_HEADERS  # noqa: E402

IMAGE = "/images/blog/best-eyebrow-shapes-face-shape.webp"
DATE = "2026-09-17"


def extract_body(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"^---\n.*?\n---\n", text, re.DOTALL)
    body = text[m.end():] if m else text
    return re.split(r"\n## (?:Articles connexes|Artículos relacionados|Related)", body)[0].strip()


def build_related(loc):
    lines = [REL_HEADERS[loc], ""]
    for title, slug, desc in RELATED[loc]:
        prefix = f"/{loc}/" if slug == "color-analysis" else f"/{loc}/blog/"
        lines.append(f"- [{title}]({prefix}{slug}) — {desc}")
    return "\n".join(lines)


def write_loc(loc, body):
    m = META[loc]
    tags = ", ".join(f'"{t}"' for t in m["tags"])
    content = f"""---
title: "{m['title']}"
description: "{m['description']}"
date: {DATE}
category: face_shape
tags: [{tags}]
image: "{IMAGE}"
---

{body}

{build_related(loc)}
"""
    path = os.path.join(BASE, loc, f"{SLUG}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"OK {loc}")


def main():
    fr_body = extract_body(FR_PATH)
    for loc in BODIES:
        write_loc(loc, BODIES[loc])
    print("Done")


if __name__ == "__main__":
    main()
