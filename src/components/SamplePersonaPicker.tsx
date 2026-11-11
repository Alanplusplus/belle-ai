"use client";

import { DEMO_PERSONAS, personaAvatar, type DemoPersonaId } from "@/lib/demo-personas";

/**
 * 示例人物选择条：让访客挑一位「看起来像自己」的示例人物（代入感是转化的关键），
 * 同时写明这些都是 AI 生成的模特，不是真人。
 */
export function SamplePersonaPicker({
  value,
  onSelect,
  title,
  note,
  nameOf,
}: {
  value: DemoPersonaId;
  onSelect: (id: DemoPersonaId) => void;
  title: string;
  note: string;
  /** 头像的无障碍名称（这位人物的季型名） */
  nameOf: (id: DemoPersonaId) => string;
}) {
  return (
    <div className="rounded-2xl border border-gold/40 bg-card p-3 shadow-sm">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <div role="radiogroup" aria-label={title} className="mt-2 flex items-center gap-2.5 overflow-x-auto py-1">
        {DEMO_PERSONAS.map((p) => {
          const selected = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={nameOf(p.id)}
              onClick={() => onSelect(p.id)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 bg-muted transition ${
                selected ? "border-primary ring-2 ring-primary/30" : "border-white opacity-75 hover:opacity-100"
              }`}
            >
              <img src={personaAvatar(p.id)} alt="" width={96} height={96} loading="lazy" className="h-full w-full object-cover" />
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{note}</p>
    </div>
  );
}
