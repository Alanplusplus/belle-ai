import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { getAllPosts } from "@/lib/blog";
import { AUTHOR, AUTHOR_PATH, authorImageUrl, authorPersonJsonLd, authorSocials } from "@/lib/author";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import { SocialIcon } from "@/components/SocialIcon";

/** 作者页上列出的最新文章数 */
const LATEST_POSTS = 8;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const a = messages.author;
  const alternates = buildAlternates(locale, AUTHOR_PATH);
  const image = authorImageUrl();
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates,
    openGraph: {
      images: image ? [{ url: image }] : OG_IMAGES,
      title: a.metaTitle,
      description: a.metaDescription,
      type: "profile",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: image ? [image] : TWITTER_IMAGES,
      card: "summary",
      title: a.metaTitle,
      description: a.metaDescription,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "author" });

  const posts = getAllPosts(locale).slice(0, LATEST_POSTS);
  const socials = authorSocials();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: AUTHOR.name, path: AUTHOR_PATH },
  ]);

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    inLanguage: locale,
    mainEntity: authorPersonJsonLd(locale, t("bio1")),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            <AuthorAvatar size={144} alt={t("avatarAlt")} priority />
            <div>
              <h1 className="font-serif text-3xl font-bold sm:text-4xl">{AUTHOR.name}</h1>
              <p className="mt-1 font-medium text-primary">{t("role")}</p>
              {socials.length > 0 && (
                <ul className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {socials.map((s) => (
                    <li key={s.platform}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="me noopener noreferrer"
                        aria-label={`${AUTHOR.name} on ${s.label}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
                      >
                        <SocialIcon platform={s.platform} />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-10 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>{t("bio1")}</p>
            <p>{t("bio2")}</p>
          </div>

          <div className="mt-10 rounded-2xl border border-gold/40 bg-white/70 p-5">
            <h2 className="text-base font-semibold">{t("aiNoteTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("aiNote")}</p>
            <Link
              href="/ai-color-analysis-accuracy"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("aiNoteLink")} →
            </Link>
          </div>

          {posts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-bold">{t("articlesTitle")}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block h-full rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold leading-snug">{post.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/blog" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
                {t("allArticles")} →
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
