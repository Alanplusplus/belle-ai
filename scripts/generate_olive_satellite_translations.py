#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate olive satellite blog translations for 10 active locales."""
import os
import re

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")
LOCALES = ["zh", "ja", "ko", "es", "de", "pt", "ru", "tr", "id", "it"]
SLUGS = [
    "olive-skin-foundation-guide",
    "olive-skin-best-hair-colors",
    "olive-skin-lip-color-guide",
    "olive-vs-neutral-undertone",
    "olive-vs-warm-undertone",
    "olive-skin-jewelry-metals",
    "olive-skin-color-season",
    "olive-skin-by-ethnicity",
]

REL_HEADING = {
    "zh": "## 相关文章",
    "ja": "## 関連記事",
    "ko": "## 관련 글",
    "es": "## Artículos relacionados",
    "de": "## Verwandte Artikel",
    "pt": "## Artigos relacionados",
    "ru": "## Похожие статьи",
    "tr": "## İlgili Yazılar",
    "id": "## Artikel Terkait",
    "it": "## Articoli correlati",
}

CTA = {
    "zh": ("免费体验 AI 色彩分析", "60 秒，免费，无需注册。发现你的肤色底色与最佳妆容色彩。"),
    "ja": ("無料AIカラー分析を試す", "60秒、無料、登録不要。アンダートーンとベストカラーを見つけましょう。"),
    "ko": ("AI 컬러 분석 무료로 체험하기", "60초, 무료, 가입 불필요. 언더톤과 베스트 메이크업 컬러를 확인하세요."),
    "es": ("Prueba el análisis de color con IA gratis", "60 segundos, gratis, sin registro. Descubre tu subtono y mejores colores."),
    "de": ("Kostenlose KI-Farbanalyse testen", "60 Sekunden, kostenlos, keine Anmeldung. Entdecken Sie Ihren Unterton und Ihre besten Farben."),
    "pt": ("Experimente a análise de cores com IA grátis", "60 segundos, grátis, sem cadastro. Descubra seu subtom e melhores cores."),
    "ru": ("Попробуйте бесплатный AI-анализ", "60 секунд, бесплатно, без регистрации. Узнайте свой подтон и лучшие цвета."),
    "tr": ("Ücretsiz AI renk analizini deneyin", "60 saniye, ücretsiz, kayıt gerekmez. Alt tonunuzu ve en iyi renklerinizi keşfedin."),
    "id": ("Coba analisis warna AI gratis", "60 detik, gratis, tanpa pendaftaran. Temukan undertone dan warna terbaik Anda."),
    "it": ("Prova l'analisi del colore AI gratis", "60 secondi, gratis, senza registrazione. Scopri il tuo sottotono e i colori migliori."),
}

PILLAR = {
    "zh": ("色彩分析完整指南", "找到最佳色彩所需的一切"),
    "ja": ("カラー分析完全ガイド", "ベストカラーを見つけるためのすべて"),
    "ko": ("퍼스널 컬러 분석 완벽 가이드", "나에게 어울리는 색을 찾는 데 필요한 모든 것"),
    "es": ("Análisis de color: la guía completa", "Todo lo que necesitas para encontrar tus mejores colores"),
    "de": ("Farbanalyse: Der komplette Leitfaden", "Alles, was Sie brauchen, um Ihre besten Farben zu finden"),
    "pt": ("Análise de cores: o guia completo", "Tudo o que você precisa para encontrar suas melhores cores"),
    "ru": ("Анализ цветотипа: полное руководство", "Всё, что нужно знать о ваших лучших цветах"),
    "tr": ("Renk analizi: eksiksiz rehber", "En iyi renklerinizi bulmak için bilmeniz gereken her şey"),
    "id": ("Analisis warna: panduan lengkap", "Semua yang perlu Anda ketahui untuk menemukan warna terbaik"),
    "it": ("Analisi del colore: guida completa", "Tutto ciò che serve per trovare i tuoi colori migliori"),
}

PARENT = {
    "zh": ("橄榄色肤色底色指南", "识别与搭配橄榄肤色的完整指南"),
    "ja": ("オリーブ肌アンダートーンガイド", "オリーブ肌の判別とスタイリング完全ガイド"),
    "ko": ("올리브톤 피부 완벽 가이드", "올리브 언더톤 판별과 스타일링 완벽 가이드"),
    "es": ("Guía de subtono oliva", "Guía completa para identificar y estilizar piel oliva"),
    "de": ("Oliv-Unterton-Leitfaden", "Kompletter Leitfaden zur Erkennung und Styling von Olivhaut"),
    "pt": ("Guia de subtom oliva", "Guia completo para identificar e estilizar pele oliva"),
    "ru": ("Гид по оливковому подтону", "Полное руководство по определению и стилю оливковой кожи"),
    "tr": ("Zeytin alt ton rehberi", "Zeytin teni tanımlama ve stil rehberi"),
    "id": ("Panduan undertone zaitun", "Panduan lengkap mengidentifikasi dan menata kulit zaitun"),
    "it": ("Guida al sottotono oliva", "Guida completa per identificare e valorizzare la pelle oliva"),
}

# Import translation bodies from data module
from olive_satellite.translations import TRANSLATIONS  # noqa: E402


def localize_links(body: str, locale: str) -> str:
    body = re.sub(r"\(/en/", f"(/{locale}/", body)
    body = re.sub(r"\(/en\)", f"(/{locale})", body)
    return body


def build_related(locale: str, related_items: list[tuple[str, str, str]]) -> str:
    lines = [REL_HEADING[locale], ""]
    pillar_title, pillar_desc = PILLAR[locale]
    lines.append(f"- [{pillar_title}]({locale}/color-analysis) — {pillar_desc}".replace(f"({locale}/", f"(/{locale}/"))
    parent_title, parent_desc = PARENT[locale]
    lines.append(f"- [{parent_title}]({locale}/blog/olive-undertone-guide) — {parent_desc}".replace(f"({locale}/", f"(/{locale}/"))
    for title, slug, desc in related_items:
        lines.append(f"- [{title}]({locale}/blog/{slug}) — {desc}".replace(f"({locale}/", f"(/{locale}/"))
    return "\n".join(lines)


def write_file(locale: str, slug: str, data: dict):
    tags_s = ", ".join(f'"{t}"' for t in data["tags"])
    cta_label, cta_sub = CTA[locale]
    body = localize_links(data["body"], locale)
    related = build_related(locale, data["related"])
    content = f"""---
title: "{data['title']}"
seoTitle: "{data['seoTitle']}"
description: "{data['description']}"
date: "2026-09-18"
tags: [{tags_s}]
image: "/images/blog/olive-undertone-guide.webp"
---

{body}

[{cta_label} →](/try)

{cta_sub}

{related}
"""
    path = os.path.join(BASE, locale, f"{slug}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  {locale}/{slug}.md")


def main():
    count = 0
    for slug in SLUGS:
        for locale in LOCALES:
            data = TRANSLATIONS[slug][locale]
            write_file(locale, slug, data)
            count += 1
    print(f"\nDone: {count} translation files")


if __name__ == "__main__":
    main()
