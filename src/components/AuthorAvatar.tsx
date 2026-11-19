import Image from "next/image";
import { AUTHOR } from "@/lib/author";

/**
 * 作者头像：有图片用图片，没配置时用名字首字母占位，页面不会出现裂图。
 * 服务端组件，byline 和作者页共用。
 */
export function AuthorAvatar({
  size,
  alt,
  priority = false,
  className = "",
}: {
  size: number;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  if (AUTHOR.image) {
    return (
      <Image
        src={AUTHOR.image}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = AUTHOR.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      role="img"
      aria-label={alt}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif font-semibold text-primary ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}
