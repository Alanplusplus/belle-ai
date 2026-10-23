import { Children, Fragment, isValidElement } from "react";
import { ImageResponse } from "next/og";

/**
 * 社交分享图（1200×630）的共用画法，和色板卡片、站内页面保持同一套视觉：
 * 象牙白渐变底 + 金色细线框 + 衬线标题 + 四季花瓣标志，可选一条顶部色带。
 * 这些路由跑在 edge runtime：字体用 fetch(new URL(..., import.meta.url)) 读取（不能用 fs）。
 * 图上文字统一用英文，字体只带拉丁字形。
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const INK = "#2b1a35";
const MUTED = "#7a6b82";
const GOLD = "#b8924a";
const BRAND_STRIPE = ["#F2A58C", "#F4A6C4", "#B9A6DD", "#7FB2C9", "#C77A45", "#8D3F72"];

// ---------- 字体 ----------

type FontData = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" | "italic" };

let fontsPromise: Promise<FontData[]> | null = null;

function loadFonts(): Promise<FontData[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch(new URL("./card-fonts/playfair-display-latin-700-normal.woff", import.meta.url)).then((r) => r.arrayBuffer()),
      fetch(new URL("./card-fonts/playfair-display-latin-400-italic.woff", import.meta.url)).then((r) => r.arrayBuffer()),
      fetch(new URL("./card-fonts/inter-latin-600-normal.woff", import.meta.url)).then((r) => r.arrayBuffer()),
      fetch(new URL("./card-fonts/inter-latin-400-normal.woff", import.meta.url)).then((r) => r.arrayBuffer()),
    ]).then(([pf700, pfItalic, in600, in400]) => [
      { name: "Playfair", data: pf700, weight: 700, style: "normal" },
      { name: "Playfair", data: pfItalic, weight: 400, style: "italic" },
      { name: "Inter", data: in600, weight: 600, style: "normal" },
      { name: "Inter", data: in400, weight: 400, style: "normal" },
    ]);
    // 读取失败时不要把失败的 Promise 缓存住，下次请求重新来
    fontsPromise.catch(() => {
      fontsPromise = null;
    });
  }
  return fontsPromise;
}

// ---------- 组件 ----------

const PETALS = [
  { rotate: 45, fill: "#F2A58C" },
  { rotate: 135, fill: "#B9A6DD" },
  { rotate: 225, fill: "#C77A45" },
  { rotate: 315, fill: "#8D3F72" },
];

const LOGO_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">' +
    PETALS.map(
      (p) =>
        `<ellipse cx="12" cy="6.4" rx="3.5" ry="5.6" fill="${p.fill}" opacity="0.92" transform="rotate(${p.rotate} 12 12)"/>`,
    ).join("") +
    '<circle cx="12" cy="12" r="2.1" fill="#FFF9F5"/><circle cx="12" cy="12" r="1.2" fill="#A9843F"/></svg>',
)}`;

export function OgBelleBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse 里只能用原生 img */}
      <img src={LOGO_SRC} width={52} height={52} alt="" />
      <div style={{ display: "flex", alignItems: "baseline", marginLeft: 14 }}>
        <div style={{ display: "flex", fontFamily: "Playfair", fontWeight: 700, fontSize: 46, color: INK }}>Belle</div>
        <div
          style={{ display: "flex", marginLeft: 10, fontFamily: "Inter", fontWeight: 600, fontSize: 20, letterSpacing: 6, color: GOLD }}
        >
          AI
        </div>
      </div>
    </div>
  );
}

function titleSize(text: string): number {
  const n = text.length;
  if (n <= 20) return 76;
  if (n <= 28) return 64;
  if (n <= 38) return 54;
  return 46;
}

function childrenText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenText).join("");
  return "";
}

export function OgTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        fontFamily: "Playfair",
        fontWeight: 700,
        fontSize: titleSize(childrenText(children)),
        color: INK,
        textAlign: "center",
        maxWidth: 1000,
        lineHeight: 1.12,
      }}
    >
      {children}
    </div>
  );
}

export function OgSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", width: 240, marginTop: 22 }}>
        <div style={{ display: "flex", flex: 1, height: 1, background: GOLD }} />
        <div style={{ display: "flex", width: 10, height: 10, margin: "0 12px", background: GOLD, transform: "rotate(45deg)" }} />
        <div style={{ display: "flex", flex: 1, height: 1, background: GOLD }} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 20,
          fontFamily: "Playfair",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 30,
          color: MUTED,
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.3,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** 色卡册风格的小卡片：白底、圆角、带一点投影，里面是色块 */
export function OgColorSwatches({ colors }: { colors: { hex: string }[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 34 }}>
      {colors.slice(0, 6).map((color, index) => (
        <div
          key={`${color.hex}-${index}`}
          style={{
            display: "flex",
            padding: 8,
            background: "#ffffff",
            borderRadius: 22,
            boxShadow: "0 10px 24px rgba(74,40,90,0.14), 0 1px 3px rgba(74,40,90,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 84,
              height: 84,
              borderRadius: 15,
              backgroundColor: color.hex,
              border: "1px solid rgba(43,26,53,0.10)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export type OgOptions = {
  /** 顶部色带的颜色（一般是这个页面主角的色卡）；不传时用品牌的四季色 */
  stripe?: string[];
};

function unwrapFragment(node: React.ReactElement): React.ReactNode {
  if (isValidElement<{ children?: React.ReactNode }>(node) && node.type === Fragment) {
    return Children.toArray(node.props.children);
  }
  return node;
}

export async function createOgImage(content: React.ReactElement, options: OgOptions = {}) {
  const stripe = options.stripe && options.stripe.length > 0 ? Array.from(new Set(options.stripe)).slice(0, 12) : BRAND_STRIPE;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: "100%",
          height: "100%",
          fontFamily: "Inter",
          background: "linear-gradient(150deg, #fff3ee 0%, #fffaf7 45%, #fdf0f5 100%)",
        }}
      >
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 14 }}>
          {stripe.map((hex) => (
            <div key={hex} style={{ display: "flex", flex: 1, background: hex }} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 30,
            left: 26,
            right: 26,
            bottom: 26,
            borderRadius: 32,
            border: "2px solid rgba(184,146,74,0.38)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "44px 70px 70px",
          }}
        >
          <OgBelleBrand />
          {/* 调用方传进来的是 Fragment，而 Satori 会把 Fragment 当成一个默认横排的容器；这里把它拆开，直接放进竖排容器 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>{unwrapFragment(content)}</div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 46,
            left: 0,
            right: 0,
            justifyContent: "center",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: 2,
            color: MUTED,
          }}
        >
          aicoloranalysis.io
        </div>
      </div>
    ),
    { ...ogSize, fonts: await loadFonts() },
  );
}

export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
