import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

/**
 * 全站默认分享图（src/app/opengraph-image.tsx）。
 * 页面自己写了 openGraph / twitter 时，Next 不会继承 layout 里的 images（整个对象被替换），
 * 没有 images 的页面分享到 Pinterest / X / 社媒时就没有预览图，所以必须显式带上。
 * 有自己 opengraph-image 文件的页面（season、celebrity 等）不需要用它。
 */
export const OG_IMAGES = [
  { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 },
];
export const TWITTER_IMAGES = [`${SITE_URL}/opengraph-image`];

export function canonicalUrl(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale;
  return isDefault ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

/**
 * RSS 自动发现：Next.js 里页面的 alternates 会整体覆盖 layout 的，所以必须由 buildAlternates* 统一输出，
 * 否则除了直接用 layout 的页面外，其他页面的 <head> 都不会有 RSS 链接。非英语页面指向该语种自己的博客 feed。
 */
function rssTypes(locale: string) {
  return {
    "application/rss+xml":
      locale === routing.defaultLocale ? `${SITE_URL}/feed.xml` : `${SITE_URL}/feed/blog/${locale}.xml`,
  };
}

export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] =
      l === routing.defaultLocale
        ? `${SITE_URL}${path}`
        : `${SITE_URL}/${l}${path}`;
  }
  languages["x-default"] = `${SITE_URL}${path}`;
  return {
    canonical: canonicalUrl(locale, path),
    languages,
    types: rssTypes(locale),
  };
}

/**
 * 只列出「确实存在且值得索引」的语种，而不是所有语种。
 * 博客文章不是每个语种都有，或者译文过薄被 noindex；把这些 URL 写进 hreflang 会指向 404 / noindex 页面，
 * 违反 hreflang 的互相引用规则，Google 会直接忽略整组标注。
 */
export function buildAlternatesForLocales(
  locale: string,
  path: string,
  availableLocales: readonly string[],
) {
  const languages: Record<string, string> = {};
  for (const l of availableLocales) {
    languages[l] =
      l === routing.defaultLocale
        ? `${SITE_URL}${path}`
        : `${SITE_URL}/${l}${path}`;
  }
  if (availableLocales.includes(routing.defaultLocale)) {
    languages["x-default"] = `${SITE_URL}${path}`;
  }
  return {
    canonical: canonicalUrl(locale, path),
    languages,
    types: rssTypes(locale),
  };
}

const BREADCRUMB_HOME: Record<string, string> = {
  en: "Home",
  zh: "首页",
  ja: "ホーム",
  ko: "홈",
  es: "Inicio",
  fr: "Accueil",
  de: "Startseite",
  ru: "Главная",
  tr: "Ana Sayfa",
};

const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  zh: "zh_CN",
  ja: "ja_JP",
  ko: "ko_KR",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  ru: "ru_RU",
  tr: "tr_TR",
};

export function ogLocale(locale: string): string {
  return OG_LOCALE_MAP[locale] || locale;
}

// BREADCRUMB_LABELS_START（由 messages 的 nav / footer 派生；英文沿用页面传入的名称，不在表里）
const BREADCRUMB_LABELS: Record<string, Record<string, string>> = {
  zh: {
    "/pricing": "价格",
    "/personal-color-analysis": "色彩分析",
    "/color-analysis": "色彩分析",
    "/tools/color-quiz": "色彩测试",
    "/tools/face-shape-quiz": "脸型测试",
    "/tools/undertone-test": "肤色底调测试",
    "/blog": "博客",
    "/lookbook": "穿搭灵感",
    "/transformations": "变身对比",
    "/guides": "视觉指南",
    "/glasses-analysis": "眼镜适配",
    "/makeup-analysis": "妆容分析",
    "/jewelry-analysis": "珠宝搭配",
    "/about": "关于我们",
    "/press": "媒体资料包",
    "/celebrity-match": "明星匹配",
    "/hair-color-analysis": "发色预览",
    "/glow-up-report": "全面提升报告",
    "/occasion-makeup": "场景妆容",
    "/style-personality": "风格人格",
    "/outfit-color-analysis": "穿搭配色",
    "/face-shape-analysis": "脸型发型",
  },
  ja: {
    "/pricing": "料金",
    "/personal-color-analysis": "カラー診断",
    "/color-analysis": "カラー診断",
    "/tools/color-quiz": "カラー診断クイズ",
    "/tools/face-shape-quiz": "顔型診断クイズ",
    "/tools/undertone-test": "アンダートーン診断",
    "/blog": "ブログ",
    "/lookbook": "スタイルブック",
    "/transformations": "変身事例",
    "/guides": "ビジュアルガイド",
    "/glasses-analysis": "メガネマッチ",
    "/makeup-analysis": "メイク分析",
    "/jewelry-analysis": "ジュエリーガイド",
    "/about": "概要",
    "/press": "プレスキット",
    "/celebrity-match": "セレブマッチ",
    "/hair-color-analysis": "ヘアカラープレビュー",
    "/glow-up-report": "グローアップレポート",
    "/occasion-makeup": "シーン別メイク",
    "/style-personality": "スタイル診断",
    "/outfit-color-analysis": "コーデ配色",
    "/face-shape-analysis": "顔型・髪型",
  },
  ko: {
    "/pricing": "요금",
    "/personal-color-analysis": "컬러 진단",
    "/color-analysis": "컬러 진단",
    "/tools/color-quiz": "컬러 퀴즈",
    "/tools/face-shape-quiz": "얼굴형 퀴즈",
    "/tools/undertone-test": "언더톤 테스트",
    "/blog": "블로그",
    "/lookbook": "스타일 룩북",
    "/transformations": "변신 사례",
    "/guides": "비주얼 가이드",
    "/glasses-analysis": "안경 매칭",
    "/makeup-analysis": "메이크업 분석",
    "/jewelry-analysis": "주얼리 가이드",
    "/about": "소개",
    "/press": "프레스 키트",
    "/celebrity-match": "셀럽 매칭",
    "/hair-color-analysis": "헤어 컬러 프리뷰",
    "/glow-up-report": "글로우업 리포트",
    "/occasion-makeup": "상황별 메이크업",
    "/style-personality": "스타일 진단",
    "/outfit-color-analysis": "코디 컬러",
    "/face-shape-analysis": "얼굴형 & 헤어",
  },
  es: {
    "/pricing": "Precios",
    "/personal-color-analysis": "Análisis de color",
    "/color-analysis": "Análisis de color",
    "/tools/color-quiz": "Test de color",
    "/tools/face-shape-quiz": "Test de rostro",
    "/tools/undertone-test": "Test de subtono",
    "/blog": "Blog",
    "/lookbook": "Lookbook de Estilo",
    "/transformations": "Transformaciones",
    "/guides": "Guías Visuales",
    "/glasses-analysis": "Gafas ideales",
    "/makeup-analysis": "Análisis de maquillaje",
    "/jewelry-analysis": "Guía de joyería",
    "/about": "Acerca de",
    "/press": "Dossier de prensa",
    "/celebrity-match": "Match de celebridad",
    "/hair-color-analysis": "Vista previa de color",
    "/glow-up-report": "Informe Glow-Up",
    "/occasion-makeup": "Maquillaje por ocasión",
    "/style-personality": "Personalidad de estilo",
    "/outfit-color-analysis": "Colores de atuendo",
    "/face-shape-analysis": "Rostro y cabello",
  },
  fr: {
    "/pricing": "Tarifs",
    "/personal-color-analysis": "Analyse couleur",
    "/color-analysis": "Analyse couleur",
    "/tools/color-quiz": "Quiz couleur",
    "/tools/face-shape-quiz": "Quiz visage",
    "/tools/undertone-test": "Test de sous-ton",
    "/blog": "Blog",
    "/lookbook": "Lookbook Style",
    "/transformations": "Transformations",
    "/guides": "Guides Visuels",
    "/glasses-analysis": "Lunettes idéales",
    "/makeup-analysis": "Analyse maquillage",
    "/jewelry-analysis": "Guide bijoux",
    "/about": "À propos",
    "/press": "Dossier de presse",
    "/celebrity-match": "Match célébrité",
    "/hair-color-analysis": "Aperçu couleur cheveux",
    "/glow-up-report": "Rapport Glow-Up",
    "/occasion-makeup": "Maquillage par occasion",
    "/style-personality": "Personnalité de style",
    "/outfit-color-analysis": "Couleurs de tenue",
    "/face-shape-analysis": "Visage et cheveux",
  },
  de: {
    "/pricing": "Preise",
    "/personal-color-analysis": "Farbanalyse",
    "/color-analysis": "Farbanalyse",
    "/tools/color-quiz": "Farb-Quiz",
    "/tools/face-shape-quiz": "Gesichtsform-Quiz",
    "/tools/undertone-test": "Unterton-Test",
    "/blog": "Blog",
    "/lookbook": "Style-Lookbook",
    "/transformations": "Verwandlungen",
    "/guides": "Visuelle Guides",
    "/glasses-analysis": "Brillen-Match",
    "/makeup-analysis": "Make-up-Analyse",
    "/jewelry-analysis": "Schmuck-Guide",
    "/about": "Über uns",
    "/press": "Pressekit",
    "/celebrity-match": "Promi-Match",
    "/hair-color-analysis": "Haarfarben-Vorschau",
    "/glow-up-report": "Glow-Up-Bericht",
    "/occasion-makeup": "Anlass-Makeup",
    "/style-personality": "Stil-Persönlichkeit",
    "/outfit-color-analysis": "Outfit-Farben",
    "/face-shape-analysis": "Gesicht & Haare",
  },
  ru: {
    "/pricing": "Цены",
    "/personal-color-analysis": "Анализ цветотипа",
    "/color-analysis": "Анализ цветотипа",
    "/tools/color-quiz": "Тест цветотипа",
    "/tools/face-shape-quiz": "Тест формы лица",
    "/tools/undertone-test": "Тест на андертон",
    "/blog": "Блог",
    "/lookbook": "Стиль-лукбук",
    "/transformations": "Преображения",
    "/guides": "Визуальные гиды",
    "/glasses-analysis": "Подбор очков",
    "/makeup-analysis": "Анализ макияжа",
    "/jewelry-analysis": "Гид по украшениям",
    "/about": "О нас",
    "/press": "Пресс-кит",
    "/celebrity-match": "Матч со звездой",
    "/hair-color-analysis": "Превью цвета волос",
    "/glow-up-report": "Отчёт Glow-Up",
    "/occasion-makeup": "Макияж по случаю",
    "/style-personality": "Стиль-личность",
    "/outfit-color-analysis": "Цвета образа",
    "/face-shape-analysis": "Лицо и волосы",
  },
  tr: {
    "/pricing": "Fiyatlandırma",
    "/personal-color-analysis": "Renk Analizi",
    "/color-analysis": "Renk Analizi",
    "/tools/color-quiz": "Renk Testi",
    "/tools/face-shape-quiz": "Yüz Şekli Testi",
    "/tools/undertone-test": "Alt Ton Testi",
    "/blog": "Blog",
    "/lookbook": "Stil Lookbook",
    "/transformations": "Dönüşümler",
    "/guides": "Görsel Rehberler",
    "/glasses-analysis": "Gözlük eşleştirme",
    "/makeup-analysis": "Makyaj Analizi",
    "/jewelry-analysis": "Takı Rehberi",
    "/about": "Hakkımızda",
    "/press": "Basın kiti",
    "/celebrity-match": "Ünlü eşleştirme",
    "/hair-color-analysis": "Saç rengi önizleme",
    "/glow-up-report": "Glow-Up Raporu",
    "/occasion-makeup": "Etkinlik makyajı",
    "/style-personality": "Stil kişiliği",
    "/outfit-color-analysis": "Kıyafet renkleri",
    "/face-shape-analysis": "Yüz ve Saç",
  },
};
// BREADCRUMB_LABELS_END

export function buildBreadcrumbJsonLd(
  locale: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: BREADCRUMB_HOME[locale] || "Home",
        item: canonicalUrl(locale, ""),
      },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: BREADCRUMB_LABELS[locale]?.[it.path] ?? it.name,
        item: canonicalUrl(locale, it.path),
      })),
    ],
  };
}
