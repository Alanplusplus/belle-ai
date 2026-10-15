import { Link } from "@/i18n/navigation";

/** 免费工具页（色彩测验 / 脸型测验 / 底调测试）共用的 SEO 区块：简介、FAQ、相关入口。文案全部由调用方传入（已本地化）。 */

export function ToolIntro({ text }: { text: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-base leading-relaxed text-muted-foreground">{text}</p>
    </section>
  );
}

export function ToolFaq({ title, faqs }: { title: string; faqs: { q: string; a: string }[] }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-12">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      <div className="space-y-6">
        {faqs.map((faq) => (
          <details key={faq.q} className="group border-b border-border pb-4">
            <summary className="cursor-pointer font-medium transition-colors group-open:text-primary">{faq.q}</summary>
            <p className="mt-3 leading-relaxed text-muted-foreground">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ToolRelated({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
