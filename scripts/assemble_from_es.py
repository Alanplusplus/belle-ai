#!/usr/bin/env python3
"""Assemble locale files: replace ES frontmatter/related with locale metadata, translate body via chunks."""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ES = ROOT / "src/content/blog/es/best-eyebrow-shapes-face-shape.md"

META = {
    "vi": {
        "title": "Dáng lông mày phù hợp nhất cho mọi khuôn mặt: Hướng dẫn đầy đủ",
        "description": "Khám phá dáng lông mày nào hợp với mặt trái xoan, tròn, vuông, trái tim và dài. Hiểu cách khuôn mặt quyết định dáng lông mày đẹp nhất cho bạn.",
        "tags": ["Dạng khuôn mặt", "Lông mày", "Làm đẹp", "Hướng dẫn phong cách", "Trang điểm"],
        "related_header": "Bài viết liên quan",
        "related": [
            ("[Kiểu Tóc Phù Hợp Nhất Cho Dạng Khuôn Mặt: 7 Loại Kèm Ví Dụ Trực Quan (2026)](/vi/blog/face-shape-hairstyle-guide)", "Hướng dẫn đầy đủ về dạng khuôn mặt kèm gợi ý kiểu tóc"),
            ("[Cách chọn kính vừa khuôn mặt vừa mùa màu của bạn](/vi/blog/glasses-face-shape-color-season)", "Mở rộng logic khuôn mặt sang gọng kính hàng ngày"),
            ("[Kiểu Bông Tai Phù Hợp Nhất Cho Mọi Dạng Khuôn Mặt — Hướng Dẫn Trực Quan](/vi/blog/best-earring-styles-face-shape)", "Một hướng dẫn phụ kiện khác dựa trên cùng nguyên tắc tỷ lệ"),
            ("[Phân tích màu sắc: Hướng dẫn đầy đủ](/vi/color-analysis)", "Mọi thứ bạn cần biết để tìm màu phù hợp nhất"),
        ],
    },
}

def main():
    locale = sys.argv[1]
    meta = META[locale]
    es = ES.read_text(encoding="utf-8")
    body = es.split("---", 2)[2]
    body = re.sub(r"\n## Artículos relacionados[\s\S]*$", "", body).strip()
    body = body.replace("/es/", f"/{locale}/")
    tags = ", ".join(f'"{t}"' for t in meta["tags"])
    related_lines = "\n".join(f"- {a} — {d}" for a, d in meta["related"])
    out = f"""---
title: "{meta['title']}"
description: "{meta['description']}"
date: 2026-09-17
category: face_shape
tags: [{tags}]
image: "/images/blog/best-eyebrow-shapes-face-shape.webp"
---

{body}

---

## {meta['related_header']}

{related_lines}
"""
    path = ROOT / f"src/content/blog/{locale}/best-eyebrow-shapes-face-shape.md"
    path.write_text(out, encoding="utf-8")
    print(path)

if __name__ == "__main__":
    main()
