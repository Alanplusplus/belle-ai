import { Link } from "@/i18n/navigation";

// 四片花瓣对应春夏秋冬四个季型（珊瑚、薰衣草、赤陶、浆果），中间一点金色
const PETALS = [
  { rotate: 45, fill: "#F2A58C" },
  { rotate: 135, fill: "#B9A6DD" },
  { rotate: 225, fill: "#C77A45" },
  { rotate: 315, fill: "#8D3F72" },
];

/** 图形标志 + 字标，页眉和页脚共用 */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Belle AI">
      <svg className="h-8 w-8 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        {PETALS.map((p) => (
          <ellipse
            key={p.rotate}
            cx="12"
            cy="6.4"
            rx="3.5"
            ry="5.6"
            fill={p.fill}
            opacity="0.92"
            transform={`rotate(${p.rotate} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="2.1" fill="#FFF9F5" />
        <circle cx="12" cy="12" r="1.2" fill="#A9843F" />
      </svg>
      <span className="flex items-baseline gap-1.5">
        <span className="font-serif text-2xl font-bold leading-none tracking-tight bg-gradient-to-r from-primary-dark via-primary to-gold-deep bg-clip-text text-transparent">
          Belle
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep">AI</span>
      </span>
    </Link>
  );
}
