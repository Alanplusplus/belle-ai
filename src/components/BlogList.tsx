import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { slugifyTag, type BlogPost } from "@/lib/blog";

/** 博客列表每页文章数：一次渲染 60+ 篇会让首页 HTML 超过 500KB、图片请求过多 */
export const BLOG_PAGE_SIZE = 12;

export function blogPagePath(page: number): "/blog" | `/blog/page/${number}` {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}

export function BlogList({
  posts,
  page,
  totalPages,
}: {
  posts: BlogPost[];
  page: number;
  totalPages: number;
}) {
  const t = useTranslations("blog");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">Coming soon...</p>
        ) : (
          <div className="mt-12 space-y-4">
            {posts.map((post, index) => (
              <article
                key={post.slug}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
              >
                <div className={`grid ${post.image ? "sm:grid-cols-[200px_1fr]" : ""}`}>
                  {post.image && (
                    <Link
                      href={`/blog/${post.slug}`}
                      className="relative hidden self-stretch overflow-hidden sm:block"
                    >
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="200px"
                        // 首屏第一张图提前加载，其余走默认懒加载
                        priority={page === 1 && index === 0}
                      />
                    </Link>
                  )}
                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                    <Link href={`/blog/${post.slug}`}>
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
                    </Link>
                    {post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.tags.map((tag: string) => (
                          <Link
                            key={tag}
                            href={`/blog/tag/${slugifyTag(tag)}`}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-3 text-sm">
            {page > 1 ? (
              <Link
                href={blogPagePath(page - 1)}
                rel="prev"
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 font-medium transition hover:border-primary/40"
              >
                &larr; {t("prevPage")}
              </Link>
            ) : (
              <span className="min-h-11 px-5" aria-hidden="true" />
            )}
            <span className="text-muted-foreground">{t("pageLabel", { page, total: totalPages })}</span>
            {page < totalPages ? (
              <Link
                href={blogPagePath(page + 1)}
                rel="next"
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-5 font-medium transition hover:border-primary/40"
              >
                {t("nextPage")} &rarr;
              </Link>
            ) : (
              <span className="min-h-11 px-5" aria-hidden="true" />
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
