import { Link } from "@/i18n/navigation";

export interface SkinToneChartRow {
  name: string;
  hex: string;
  undertone: string;
  seasons: { slug: string; name: string }[];
}

/**
 * 肤色色卡表：用真正的 <table>（搜索引擎和 AI 摘要都能直接读出「肤色 / 色值 / 底调 / 季型」四列），
 * 色块只是装饰，色值和名称都是纯文本，可复制。手机上横向滚动，不挤压列。
 */
export function SkinToneChart({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: { shade: string; hex: string; undertone: string; seasons: string };
  rows: SkinToneChartRow[];
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">{headers.shade}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{headers.hex}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{headers.undertone}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{headers.seasons}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.hex} className="border-t border-border">
              <th scope="row" className="px-4 py-3 font-medium">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-block h-7 w-7 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: row.hex }}
                  />
                  {row.name}
                </span>
              </th>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.hex.toUpperCase()}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.undertone}</td>
              <td className="px-4 py-3">
                {row.seasons.map((s, i) => (
                  <span key={s.slug}>
                    {i > 0 ? ", " : ""}
                    <Link href={`/color-palette/${s.slug}`} className="text-primary hover:underline">
                      {s.name}
                    </Link>
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
