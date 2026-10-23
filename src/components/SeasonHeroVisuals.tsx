import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LOOKBOOK = "/images/lookbook";

/**
 * 子季型页英雄区右侧：一张面料色板平铺照（主图，微微右倾）+ 一张该季型的妆容特写（拱形框，压在左下角）。
 * 图都来自 lookbook 已有的素材，不新增图片。main / face 可以换成该季型的其他图（比如穿搭、首饰）。
 */
export function SeasonPhotoCollage({
  slug,
  faceAlt,
  main = "palette-1",
  face = "makeup-natural",
}: {
  slug: string;
  faceAlt: string;
  main?: string;
  face?: string;
}) {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-sm sm:max-w-md lg:max-w-none">
      <div className="absolute right-0 top-0 w-[70%] rotate-[2deg]">
        <div className="relative aspect-square overflow-hidden rounded-2xl border-[5px] border-white bg-card shadow-xl shadow-primary/20">
          <Image
            src={`${LOOKBOOK}/${slug}/${main}.webp`}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 270px, 60vw"
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-[44%] -rotate-[3deg]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-2xl border-[5px] border-white bg-card shadow-xl shadow-primary/20">
          <Image
            src={`${LOOKBOOK}/${slug}/${face}.webp`}
            alt={faceAlt}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 170px, 40vw"
          />
        </div>
      </div>
    </div>
  );
}

function Arch({ slug, tall, overlap }: { slug: string; tall?: boolean; overlap?: boolean }) {
  const sd = useTranslations(`sd.${slug}`);
  const ph = useTranslations("paletteHub");
  const name = sd("name");
  return (
    <Link
      href={`/color-palette/${slug}`}
      className={`group relative block w-[38%] overflow-hidden rounded-t-full rounded-b-2xl border-[4px] border-white bg-card shadow-xl shadow-primary/20 ${
        overlap ? "-ml-[7%]" : ""
      } ${tall ? "z-10 -translate-y-4 sm:-translate-y-6" : ""}`}
    >
      <div className="relative aspect-[3/4]">
        <Image
          src={`${LOOKBOOK}/${slug}/makeup-natural.webp`}
          alt={ph("photoAlt", { season: name })}
          fill
          priority
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 150px, 34vw"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 pb-2 pt-8 text-center">
          <span className="font-serif text-xs font-semibold leading-tight text-white drop-shadow sm:text-sm">{name}</span>
        </div>
      </div>
    </Link>
  );
}

/** 大类页英雄区右侧：三个子季型的妆容照，排成三个拱形（中间高一点），点哪个进哪个子季型页 */
export function ParentArchTrio({ slugs }: { slugs: string[] }) {
  const mid = Math.floor(slugs.length / 2);
  return (
    <div className="mx-auto flex w-full max-w-sm items-end justify-center pt-6 sm:max-w-md lg:max-w-none">
      {slugs.map((s, i) => (
        <Arch key={s} slug={s} tall={i === mid} overlap={i > 0} />
      ))}
    </div>
  );
}
