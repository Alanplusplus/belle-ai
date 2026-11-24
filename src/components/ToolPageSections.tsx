import { Link } from "@/i18n/navigation";

/** 免费工具页（色彩测验 / 脸型测验 / 底调测试）共用的 SEO 区块：FAQ、相关入口（简介见 ClampedIntro）。文案全部由调用方传入（已本地化）。 */

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

/** 工具页 / 功能页的"答案块"：步骤、对照表、短段落。文案全部由调用方传入（已本地化），表格第一列可带站内链接。 */
export type GuideBlock =
  | { type: "text"; paragraphs: string[]; link?: { href: string; label: string } }
  | { type: "steps"; items: string[] }
  | { type: "table"; head: string[]; rows: { cells: string[]; href?: string }[]; note?: string };

export function ToolGuide({ sections }: { sections: { title: string; blocks: GuideBlock[] }[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="mx-auto max-w-3xl px-4 pb-10">
          <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
          <div className="space-y-4 leading-relaxed text-muted-foreground">
            {section.blocks.map((block, bi) => {
              if (block.type === "steps") {
                return (
                  <ol key={bi} className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-foreground">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                );
              }
              if (block.type === "table") {
                return (
                  <div key={bi}>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                        <thead className="bg-muted/40 text-foreground">
                          <tr>
                            {block.head.map((h) => (
                              <th key={h} className="px-3 py-2 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row) => (
                            <tr key={row.cells[0]} className="border-t border-border align-top">
                              {row.cells.map((cell, ci) => (
                                <td key={ci} className={ci === 0 ? "px-3 py-2 font-medium text-foreground" : "px-3 py-2"}>
                                  {ci === 0 && row.href ? (
                                    <Link href={row.href} className="text-primary underline-offset-4 hover:underline">
                                      {cell}
                                    </Link>
                                  ) : (
                                    cell
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {block.note && <p className="mt-3 text-sm">{block.note}</p>}
                  </div>
                );
              }
              return (
                <div key={bi} className="space-y-3">
                  {block.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {block.link && (
                    <p>
                      <Link href={block.link.href} className="font-medium text-primary underline-offset-4 hover:underline">
                        {block.link.label}
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
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
