import { isColorNote } from "@/lib/palette-card";

/**
 * 颜色名 + 色值，纯文本：不画色块（色块在 PNG 卡片里），但保留可复制、可被搜索引擎读到的色值。
 * 名称过长的（其实是一句建议）只显示文字，不带占位色号。
 */
export function ColorTextList({
  colors,
  className = "mt-3",
}: {
  colors: { name: string; hex: string; /** 这一项其实是一句建议，不是具体颜色：不显示色号。不传则按名称长度判断 */ note?: boolean }[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-1.5 text-sm ${className}`}>
      {colors.map((c) => {
        const note = c.note ?? isColorNote(c.name);
        return (
        <li key={`${c.hex}-${c.name}`} className={note ? "" : "whitespace-nowrap"}>
          <span className="font-medium">{c.name}</span>
          {note ? null : (
            <>
              {" "}
              <span className="font-mono text-xs text-muted-foreground">{c.hex.toUpperCase()}</span>
            </>
          )}
        </li>
        );
      })}
    </ul>
  );
}
