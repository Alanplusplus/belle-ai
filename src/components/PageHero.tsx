import type { ReactNode } from "react";

/**
 * 内页的英雄区。有 visual（照片/卡片拼贴）时左文右图，手机上文字在前；没有时居中，标题下带金色装饰线。
 * 背景是淡粉到淡金的渐变，加两团柔和的光晕。
 */
export function PageHero({
  crumb,
  title,
  subtitle,
  description,
  actions,
  visual,
  wide = false,
}: {
  crumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  visual?: ReactNode;
  /** 内容区是 max-w-5xl 的页面（lookbook）用 true，让英雄区和正文左右对齐 */
  wide?: boolean;
}) {
  const centered = !visual;
  const maxW = wide ? "max-w-5xl" : "max-w-4xl";

  const text = (
    <div className={centered ? "text-center" : "text-center lg:text-left"}>
      {crumb && <p className="text-sm font-medium text-primary">{crumb}</p>}
      <h1 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
      {centered && (
        <div className="section-ornament" aria-hidden="true">
          <span />
        </div>
      )}
      {subtitle && <p className="mt-3 text-lg font-medium text-primary">{subtitle}</p>}
      {description && (
        <p className={`mt-4 max-w-2xl leading-relaxed text-muted-foreground ${centered ? "mx-auto" : "mx-auto lg:mx-0"}`}>
          {description}
        </p>
      )}
      {actions && (
        <div className={`mt-6 flex flex-col items-center gap-3 sm:flex-row ${centered ? "sm:justify-center" : "sm:justify-center lg:justify-start"}`}>
          {actions}
        </div>
      )}
    </div>
  );

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-gold/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-4 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
      {centered ? (
        <div className={`relative mx-auto ${maxW} px-4 py-16 sm:py-20`}>{text}</div>
      ) : (
        <div className={`relative mx-auto grid ${maxW} items-center gap-10 px-4 py-12 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8`}>
          {text}
          <div>{visual}</div>
        </div>
      )}
    </section>
  );
}
