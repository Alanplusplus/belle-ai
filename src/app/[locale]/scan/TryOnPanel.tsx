"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createTask, uploadImage, type ScanResult } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { IMAGE_TOO_LARGE, prepareImageForUpload } from "@/lib/imageUpload";

/** 与 /try 页共用同一个键：在那边传过自拍，这里直接复用，不用再传一次 */
const LAST_PHOTO_KEY = "belle_last_photo_url";

/** 能做真人试穿的品类（和后端 tryon_prompts.TRYON_MODES 一致；包、鞋、粉底、其他效果不稳，不提供） */
const TRYON_CATEGORIES = new Set([
  "top", "bottom", "dress", "outerwear", "knitwear", "scarf", "accessory", "jewelry",
  "lipstick", "blush", "eyeshadow", "hair_color",
]);
/** 试的是「色号」而不是一件衣服：不管图案，都可以换成适配的色号 */
const SHADE_CATEGORIES = new Set(["lipstick", "blush", "eyeshadow", "hair_color"]);

export function supportsTryOn(category: string): boolean {
  return TRYON_CATEGORIES.has(category);
}

export interface TryOnColorOption {
  hex: string;
  label: string;
}

type Stage = "idle" | "uploadingPhoto" | "uploadingItem" | "starting";

function loadLastPhoto(): string | null {
  try {
    return localStorage.getItem(LAST_PHOTO_KEY);
  } catch {
    return null;
  }
}

function saveLastPhoto(url: string | null) {
  try {
    if (url) localStorage.setItem(LAST_PHOTO_KEY, url);
    else localStorage.removeItem(LAST_PHOTO_KEY);
  } catch {
    /* 隐私模式写不了就算了 */
  }
}

/**
 * 扫一扫结果里的「在我身上试试」：用本人照片 + 刚扫的单品照片生成真人试穿图（1 积分）。
 * 任务创建后跳到 /try —— 那边已经有进度、结果、打码预览、解锁 / 付费、下载的完整流程，这里不重复实现。
 */
export function TryOnPanel({
  result,
  itemImage,
  reportLang,
  altOptions,
  ensureReady,
}: {
  result: ScanResult;
  /** 刚扫的单品照片（data URL） */
  itemImage: string;
  reportLang: string;
  /** 不太合适时可以换着试的适配色 */
  altOptions: TryOnColorOption[];
  /** 账号初始化完成（匿名访客靠指纹建号） */
  ensureReady: () => Promise<unknown>;
}) {
  const t = useTranslations("scan");
  // 「上传即表示您确认照片为本人或已获得当事人许可」：和 /try 页同一句话，Waffo 的 AIGC 审核要求真人照片上传处有素材来源声明
  const tTry = useTranslations("tryPage");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const itemUrlRef = useRef<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [noCredits, setNoCredits] = useState(false);

  useEffect(() => {
    // localStorage 只能在水合之后读
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotoUrl(loadLastPhoto());
  }, []);

  const category = result.item.category;
  const shade = SHADE_CATEGORIES.has(category);
  const canRecolor = shade || result.item.pattern === "solid";
  const options = canRecolor ? altOptions : [];
  const mainColor = result.item.colors[0]?.hex;
  const busy = stage !== "idle";

  async function run(file?: File) {
    setErrorKey(null);
    setNoCredits(false);
    let leaving = false;
    try {
      let person = photoUrl;
      if (file) {
        setStage("uploadingPhoto");
        const dataUrl = await prepareImageForUpload(file);
        const up = await uploadImage(dataUrl);
        if (up.code !== 200 || !up.data?.url) {
          setErrorKey(up.code === 413 ? "tryOnErrTooLarge" : "tryOnErrUpload");
          return;
        }
        person = up.data.url;
        setPhotoUrl(person);
        saveLastPhoto(person);
      }
      if (!person) return;

      if (!itemUrlRef.current) {
        setStage("uploadingItem");
        const up = await uploadImage(itemImage);
        if (up.code !== 200 || !up.data?.url) {
          setErrorKey("tryOnErrUpload");
          return;
        }
        itemUrlRef.current = up.data.url;
      }

      setStage("starting");
      await ensureReady();
      const res = await createTask(person, "scan_tryon", reportLang, {
        resolution: "2K",
        itemImageUrl: itemUrlRef.current,
        tryon: {
          category,
          pattern: result.item.pattern,
          finish: result.item.finish,
          ...(mainColor ? { hex: mainColor } : {}),
          ...(target ? { target_hex: target } : {}),
        },
      });
      if (res.code === 200 && res.data?.task_id) {
        trackEvent("scan_tryon_started", { category, recolor: Boolean(target), tier: result.tier });
        leaving = true; // 页面跳转中：保持忙碌状态，避免重复点击再扣一次积分
        router.push("/try");
        return;
      }
      if (res.code === 429) {
        setNoCredits(true);
        trackEvent("scan_tryon_no_credits", { category });
      } else {
        setErrorKey("tryOnErrFailed");
      }
    } catch (err) {
      setErrorKey(err instanceof Error && err.message === IMAGE_TOO_LARGE ? "tryOnErrTooLarge" : "tryOnErrFailed");
    } finally {
      if (!leaving) setStage("idle");
    }
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 清空 value：同一张照片连续选两次也能再次触发 change
    e.target.value = "";
    if (file) void run(file);
  }

  function onCta() {
    if (busy) return;
    if (photoUrl) void run();
    else fileRef.current?.click();
  }

  function dropBrokenPhoto() {
    // 记住的照片已经打不开（被清理 / 过期）：丢掉，让用户重新选一张
    setPhotoUrl(null);
    saveLastPhoto(null);
  }

  const stageText = stage === "uploadingPhoto" ? t("tryOnUploading") : stage === "starting" || stage === "uploadingItem" ? t("tryOnStarting") : null;

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
      <p className="rp-label">{t("tryOnTitle")}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{shade ? t("tryOnDescShade") : t("tryOnDescWear")}</p>

      {options.length > 0 && (
        <div className="mt-3.5">
          <p className="text-xs text-muted-foreground">{t("tryOnPickColor")}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {mainColor && (
              <li>
                <ColorChip hex={mainColor} label={t("tryOnOriginal")} selected={target === null} disabled={busy} onClick={() => setTarget(null)} />
              </li>
            )}
            {options.map((opt) => (
              <li key={opt.hex}>
                <ColorChip hex={opt.hex} label={opt.label} selected={target === opt.hex} disabled={busy} onClick={() => setTarget(opt.hex)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {photoUrl && (
        <div className="mt-3.5 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt=""
            onError={dropBrokenPhoto}
            className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{t("tryOnPhotoUsing")}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
          >
            {t("tryOnPhotoChange")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onCta}
        disabled={busy}
        className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-70"
      >
        {stageText ?? (photoUrl ? t("tryOnCta") : t("tryOnCtaPickPhoto"))}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">{t("tryOnCost")}</p>
      <p className="mt-1 text-center text-[11px] leading-relaxed text-muted-foreground">{tTry("uploadConsent")}</p>

      {errorKey && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-900" role="alert">
          {t(errorKey)}
        </p>
      )}
      {noCredits && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-center text-xs leading-relaxed text-amber-900" role="alert">
          <p>{t("tryOnNoCredits")}</p>
          <Link href="/pricing" className="mt-1.5 inline-block font-semibold text-primary underline-offset-2 hover:underline">
            {t("tryOnNoCreditsCta")}
          </Link>
        </div>
      )}

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">{t("tryOnNote")}</p>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
    </div>
  );
}

function ColorChip({
  hex,
  label,
  selected,
  disabled,
  onClick,
}: {
  hex: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 text-xs transition disabled:opacity-60 ${
        selected ? "border-primary text-primary ring-1 ring-primary/40" : "border-border text-foreground/80 hover:border-primary/50"
      }`}
    >
      <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: hex }} aria-hidden />
      <span className="max-w-[7rem] truncate">{label}</span>
    </button>
  );
}
