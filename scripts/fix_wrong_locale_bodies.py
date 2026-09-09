#!/usr/bin/env python3
"""Fix blog posts with wrong-language bodies."""
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "blog")

def w(loc, slug, content):
    path = os.path.join(BASE, loc, f"{slug}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print("Wrote", path)

# ID occasion - from es template, Indonesian
w("id", "occasion-makeup-guide-by-event", """---
title: "Panduan Makeup per Acara: Look Tepat untuk Setiap Event"
description: "Dari kencan malam hingga wawancara kerja dan pernikahan — pelajari cara menyesuaikan makeup untuk setiap acara berdasarkan warna kulit dan fitur wajah. Plus bagaimana AI menghasilkan look personal instan."
date: "2026-07-28"
tags: ["makeup", "makeup acara", "kecantikan", "panduan gaya", "kecantikan AI"]
image: "/images/blog/occasion-makeup-guide-by-event.webp"
---

## Satu Wajah, Banyak Acara

Lipstik merah yang sama yang menarik perhatian di pesta koktail bisa terasa sangat tidak pada tempatnya di wawancara kerja. «No-makeup makeup» segar untuk brunch bisa membuatmu terlihat kurang rapi di gala black-tie. Konteks penting — dan menyesuaikan makeup dengan acara adalah keterampilan yang layak dikembangkan.

Tapi inilah tantangannya: kebanyakan panduan memberi saran generik («natural siang hari, bold malam hari») tanpa mempertimbangkan fitur individu, warna kulit, atau undertone. Look «natural» di satu wajah membutuhkan produk dan teknik yang sama sekali berbeda di wajah lain.

---

## Spektrum Acara

Bayangkan acara pada spektrum dari minimal hingga maksimal:

```
Minimal ←→ Maksimal

Kantor → Brunch → Kencan → Tamu Pernikahan → Gala Malam → Festival
```

Setiap level naik memungkinkan lebih banyak warna, shimmer, drama — tapi selalu difilter melalui apa yang benar-benar flattering wajahMU.

---

## Rincian per Acara

### Kantor / Profesional
**Tujuan:** Rapi, teratur, tidak mengalihkan perhatian
**Prinsip:** Hanya finish matte atau satin. Warna dekat tone natural. Definisi tanpa drama.
**Fokus:** Kulit rata, alis rapi, definisi halus (maskara, lip nude, contour ringan)
**Hindari:** Shimmer, lip bold, eye makeup berat, glitter

### Brunch / Sosial Casual
**Tujuan:** Segar, dewy, effortless
**Prinsip:** Look skin-forward. Sedikit produk, glow maksimal.
**Fokus:** Kulit bercahaya, cream blush, tinted lip, alis fluffy
**Hindari:** Foundation full coverage, contour dramatis, look terstruktur

### Kencan Malam
**Tujuan:** Versi paling menarik — lembut, alluring, inviting
**Prinsip:** Tonjolkan mata ATAU bibir (bukan keduanya). Cahaya hangat flattering tone hangat.
**Fokus:** Satu standout (smoky eye atau lip bold), kulit luminous, highlight strategis
**Hindari:** Bedak berat, look eksperimental trendy

### Wawancara Kerja
**Tujuan:** Percaya diri, kompeten, approachable
**Prinsip:** Ingin mereka ingat jawabanmu, bukan makeup. Rapi tapi invisible.
**Fokus:** Base flawless, alis natural, lip MLBB, bulu mata halus
**Hindari:** Apa pun yang kontroversial atau mengalihkan perhatian

### Tamu Pernikahan
**Tujuan:** Elegan, photogenic, tahan lama
**Prinsip:** Kamu akan difoto. Flash memudar warna. Panas dan dansa butuh daya tahan.
**Fokus:** Coverage buildable, setting spray, maskara waterproof, warna photogenic
**Hindari:** SPF (flashback), produk lip transfer

### Gala Malam / Black Tie
**Tujuan:** Glamour, impact, red-carpet-ready
**Prinsip:** Go big or go home. Full glam diharapkan.
**Fokus:** Mata dramatis ATAU lip bold, contour sculpted, bulu mata statement
**Hindari:** Terlalu subtle, semua matte

### Festival / Pesta
**Tujuan:** Kreatif, ekspresif, fun
**Prinsip:** Aturan tidak berlaku. Glitter, warna, graphic liner. Semua waterproof.
**Fokus:** Ekspresi kreatif, warna bold, glitter/batu
**Hindari:** Membosankan, produk non-waterproof

---

## Faktor Warna Kulit

Saran generik gagal karena mengabaikan undertone. Cara menyesuaikan:

**Undertone hangat:** «Neutral» bukan abu-cokelat — nude hangat. «Bold» bukan merah biru — tomato atau brick red.

**Undertone dingin:** «Neutral» lebih rose-toned. «Bold» berry, wine, atau blue-red.

**Undertone netral:** Fleksibilitas kedua arah. Pilih warna sesuai energi event.

---

## Cara Kerja AI Makeup Acara

AI membuat look makeup khusus untuk:
- Bentuk wajah (blush placement, contour strategy)
- Warna kulit (shade yang benar-benar work)
- Fitur (teknik shadow per bentuk mata)
- Acara (level drama yang tepat)

Kamu melihat DIRIMU dengan look — bukan model generik.

---

## Coba AI Makeup Acara

Pilih acara, upload foto, dapatkan look makeup personal lengkap dengan rekomendasi produk — untuk fitur dan coloring spesifikmu.

## Artikel Terkait

- [Warna makeup terbaik untuk setiap color season](/id/blog/best-makeup-colors-color-season)
- [Cara menemukan lipstik merah sempurna untuk warna kulit (2026)](/id/blog/perfect-red-lipstick-skin-tone)
- [Mengapa foundation tidak pernah cocok: undertone deep dive](/id/blog/foundation-undertone-guide)
""")

print("Done partial - run remaining writes")
