#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Write all olive satellite translation body files."""
import os

OUT = os.path.join(os.path.dirname(__file__), "olive_satellite_bodies")

def w(slug, loc, body):
    d = os.path.join(OUT, slug)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{loc}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(body.strip() + "\n")
    print(f"  {slug}/{loc}.md")

# Import body data from article modules
from olive_bodies import foundation, hair, lip, vs_neutral, vs_warm, jewelry, season, ethnicity

ARTICLES = {
    "olive-skin-foundation-guide": foundation.BODIES,
    "olive-skin-best-hair-colors": hair.BODIES,
    "olive-skin-lip-color-guide": lip.BODIES,
    "olive-vs-neutral-undertone": vs_neutral.BODIES,
    "olive-vs-warm-undertone": vs_warm.BODIES,
    "olive-skin-jewelry-metals": jewelry.BODIES,
    "olive-skin-color-season": season.BODIES,
    "olive-skin-by-ethnicity": ethnicity.BODIES,
}

if __name__ == "__main__":
    count = 0
    for slug, bodies in ARTICLES.items():
        for loc, body in bodies.items():
            w(slug, loc, body)
            count += 1
    print(f"\nWrote {count} body files")
