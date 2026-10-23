"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; label: string };

/**
 * 长页面的章节目录条：吸顶在页眉下面，横向滚动，点一下跳到对应章节，滚动时高亮当前章节。
 * 章节从页面里 `.content-page` 的直接子 section 读取（取各自的 h2），所以各页面不需要再额外传一份目录；
 * 到「行动区块」（rounded-2xl 的 section）为止，后面的相关链接不进目录。
 * 服务端先占好 3rem 的高度，挂载后再填内容，避免页面跳动。
 */
export function SectionNav({ wide = false }: { wide?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState("");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.querySelector(".content-page");
    if (!root) return;
    const list: Item[] = [];
    const sections = Array.from(root.children).filter((el): el is HTMLElement => el.tagName === "SECTION");
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (sec.classList.contains("rounded-2xl")) break;
      const h2 = Array.from(sec.children).find((el) => el.tagName === "H2");
      const text = h2?.textContent?.split(" — ")[0].trim();
      if (!h2 || !text) continue;
      if (!sec.id) sec.id = `sec-${i}`;
      list.push({ id: sec.id, label: text });
    }
    // 目录要等页面挂载后从真实的 DOM 里读出来（章节标题由各页面自己渲染），只能在 effect 里设置
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(list);
    if (list.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-130px 0px -60% 0px" },
    );
    list.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // 当前章节的按钮滚到目录条中间，只动目录条自己，不带动整个页面
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || !active) return;
    const btn = bar.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!btn) return;
    bar.scrollTo({ left: btn.offsetLeft - (bar.clientWidth - btn.clientWidth) / 2, behavior: "smooth" });
  }, [active]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="sticky top-16 z-40 h-12 border-b border-border/60 bg-background/90 backdrop-blur-md">
      {items.length >= 4 && (
        <nav ref={barRef} aria-label="Sections" className={`no-scrollbar mx-auto flex h-full ${wide ? "max-w-5xl" : "max-w-4xl"} items-center gap-2 overflow-x-auto px-4`}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              data-id={it.id}
              onClick={() => go(it.id)}
              aria-current={active === it.id ? "true" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition ${
                active === it.id
                  ? "bg-primary font-semibold text-white shadow-sm shadow-primary/30"
                  : "border border-border bg-white/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {it.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
