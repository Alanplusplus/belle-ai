import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";
import { canonicalUrl } from "@/lib/seo";
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
      canonical: canonicalUrl(locale, "/blog"),
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
          <div className="mt-12 space-y-4">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className={`grid ${post.image ? "sm:grid-cols-[200px_1fr]" : ""}`}
                >
                  {post.image && (
                    <div className="relative hidden self-stretch overflow-hidden sm:block">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="200px"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <time>{post.date}</time>
                      <span>·</span>
                      <span>
                        {post.readingTime} {t("minRead")}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-base font-semibold leading-snug group-hover:text-primary sm:text-lg">
                      {post.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {post.description}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
