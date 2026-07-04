import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.blogTitle,
    description: messages.meta.blogDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = getAllPosts(locale);

  return <BlogList posts={posts} />;
}

function BlogList({
  posts,
}: {
  posts: Awaited<ReturnType<typeof getAllPosts>>;
}) {
  const t = useTranslations("blog");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">
            Coming soon...
          </p>
        ) : (
          <div className="mt-12 space-y-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <time>{post.date}</time>
                  <span>·</span>
                  <span>
                    {post.readingTime} {t("minRead")}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold group-hover:text-primary">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {post.description}
                </p>
                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-flex text-sm font-medium text-primary"
                >
                  {t("readMore")} &rarr;
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
