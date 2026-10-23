import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";
import { SITE_URL } from "@/lib/constants";
import { PALETTE_CARD_SIZE, isColorNote } from "@/lib/palette-card";
import type { CardChip, CardSection, CardSpec } from "@/lib/palette-card-spec";

/**
 * 色板卡片的画法（Satori：每个有多个子节点的 div 都要显式 display:flex）。
 * 设计：随季型换色调的象牙白底 + 顶部色带 + 金色细线框，衬线大标题，
 * 色卡做成「色卡册」那样的白底小卡片（上色块、下名称与色号）。
 */

export const INK = "#2b1a35";
export const MUTED = "#7a6b82";
export const FAINT = "#a198a8";
export const GOLD = "#b8924a";
const PAD_X = 74;
const CONTENT_W = PALETTE_CARD_SIZE.width - PAD_X * 2;
const GAP = 18;

// ---------- 字体（OFL 开源字体，放在 src/lib/card-fonts，Satori 不支持 woff2，所以用 woff） ----------

type FontData = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700; style: "normal" | "italic" };

let fontsPromise: Promise<FontData[]> | null = null;

export function loadCardFonts(): Promise<FontData[]> {
  if (!fontsPromise) {
    // 卡片在构建时静态生成，此时项目目录一定在；用 fs 读，比 fetch(file://) 稳
    const get = async (file: string) => {
      const buf = await readFile(path.join(process.cwd(), "src/lib/card-fonts", file));
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    };
    fontsPromise = Promise.all([
      get("playfair-display-latin-700-normal.woff"),
      get("playfair-display-latin-600-normal.woff"),
      get("playfair-display-latin-400-italic.woff"),
      get("inter-latin-400-normal.woff"),
      get("inter-latin-500-normal.woff"),
      get("inter-latin-600-normal.woff"),
    ]).then(([pf700, pf600, pfItalic, in400, in500, in600]) => [
      { name: "Playfair", data: pf700, weight: 700, style: "normal" },
      { name: "Playfair", data: pf600, weight: 600, style: "normal" },
      { name: "Playfair", data: pfItalic, weight: 400, style: "italic" },
      { name: "Inter", data: in400, weight: 400, style: "normal" },
      { name: "Inter", data: in500, weight: 500, style: "normal" },
      { name: "Inter", data: in600, weight: 600, style: "normal" },
    ]);
  }
  return fontsPromise;
}

// ---------- 颜色工具：按色卡取背景色调 ----------

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function toHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = parseHex(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

/** 把颜色按比例淡化到接近白色，做背景色调 */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const mix = (v: number) => Math.round(v * amount + 255 * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** 从色卡里挑两个「主色」给背景上色：按顺序取（靠前的最有代表性），跳过接近黑白灰的，第二个要和第一个色相不同 */
export function pickKeyColors(hexes: string[]): [string, string] {
  const usable = hexes
    .map((hex) => ({ hex, ...toHsl(hex) }))
    .filter((c) => c.s > 0.25 && c.l > 0.2 && c.l < 0.93);
  const first = usable[0]?.hex ?? hexes[0];
  const hueDist = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  const firstHue = usable[0]?.h ?? 0;
  const second = usable.find((c) => hueDist(c.h, firstHue) > 30)?.hex ?? usable[1]?.hex ?? first;
  return [first, second];
}

// ---------- 组件 ----------

/** 「避开的颜色」色块上的叉：用内联 SVG 画，不依赖 Satori 对绝对定位的处理；先描一层深色边，浅色上也看得清 */
const CROSS_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke-linecap="round">' +
    '<path d="M14 14L50 50M50 14L14 50" stroke="rgba(43,26,53,0.40)" stroke-width="10"/>' +
    '<path d="M14 14L50 50M50 14L14 50" stroke="#ffffff" stroke-width="6"/>' +
    "</svg>",
)}`;

function Cross({ size }: { size: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- ImageResponse 里只能用原生 img
  return <img src={CROSS_SRC} width={size} height={size} alt="" />;
}

export function Chip({
  chip,
  width,
  blockHeight,
  avoid,
}: {
  chip: CardChip;
  width: number;
  blockHeight: number;
  avoid?: boolean;
}) {
  const nameSize = width >= 230 ? 23 : width >= 190 ? 20 : 18;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        padding: 10,
        background: "#ffffff",
        borderRadius: 22,
        boxShadow: "0 14px 32px rgba(74,40,90,0.10), 0 1px 3px rgba(74,40,90,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: blockHeight,
          borderRadius: 14,
          background: chip.hex,
          border: "1px solid rgba(43,26,53,0.10)",
          overflow: "hidden",
        }}
      >
        {avoid ? <Cross size={Math.min(56, Math.round(blockHeight * 0.8))} /> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: "12px 4px 4px" }}>
        <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: nameSize, color: INK, lineHeight: 1.2 }}>
          {chip.name}
        </div>
        {isColorNote(chip.name) ? null : (
          <div
            style={{
              display: "flex",
              marginTop: 4,
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 16,
              letterSpacing: 1.5,
              color: MUTED,
            }}
          >
            {chip.hex.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionLabel({ text }: { text: string }) {
  const line = (dir: "left" | "right") => ({
    display: "flex",
    flex: 1,
    height: 1,
    background:
      dir === "left"
        ? `linear-gradient(90deg, rgba(184,146,74,0), ${GOLD})`
        : `linear-gradient(90deg, ${GOLD}, rgba(184,146,74,0))`,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: 22 }}>
      <div style={line("left")} />
      <div
        style={{
          display: "flex",
          margin: "0 24px",
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: GOLD,
        }}
      >
        {text}
      </div>
      <div style={line("right")} />
    </div>
  );
}

function Section({ section }: { section: CardSection }) {
  if (section.kind === "rows") {
    return (
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: "100%", marginTop: 34 }}>
        <SectionLabel text={section.label} />
        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 16 }}>
          {section.rows.map((row) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "20px 26px",
                borderRadius: 26,
                background: "rgba(255,255,255,0.78)",
                border: "1px solid rgba(184,146,74,0.35)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", width: 300 }}>
                <div style={{ display: "flex", fontFamily: "Playfair", fontWeight: 600, fontSize: 34, color: INK }}>
                  {row.name}
                </div>
                <div style={{ display: "flex", marginTop: 6, fontFamily: "Inter", fontSize: 17, color: MUTED }}>
                  {row.note}
                </div>
              </div>
              <div style={{ display: "flex", flex: 1, justifyContent: "flex-end", gap: 16 }}>
                {row.chips.map((c) => (
                  <div
                    key={c.hex + c.name}
                    style={{
                      display: "flex",
                      width: 112,
                      height: 112,
                      borderRadius: 24,
                      background: c.hex,
                      border: "5px solid #ffffff",
                      boxShadow: "0 8px 20px rgba(74,40,90,0.16)",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chipWidth = Math.floor((CONTENT_W - GAP * (section.perRow - 1)) / section.perRow);
  return (
    <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: "100%", marginTop: 34 }}>
      <SectionLabel text={section.label} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", width: "100%", gap: GAP }}>
        {section.chips.map((c) => (
          <Chip key={c.hex + c.name} chip={c} width={chipWidth} blockHeight={section.blockHeight} avoid={section.avoid} />
        ))}
      </div>
    </div>
  );
}

function titleSize(title: string): number {
  const n = title.length;
  if (n <= 12) return 108;
  if (n <= 15) return 96;
  if (n <= 18) return 86;
  if (n <= 22) return 74;
  return 62;
}

export function renderPaletteCard(spec: CardSpec): ReactElement {
  const [keyA, keyB] = pickKeyColors(spec.stripe);
  const stripe = Array.from(new Set(spec.stripe)).slice(0, 14);
  const shortUrl = `${SITE_URL.replace("https://", "")}${spec.footerPath}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: "100%",
        height: "100%",
        padding: `58px ${PAD_X}px 44px`,
        fontFamily: "Inter",
        background: `linear-gradient(165deg, ${tint(keyA, 0.2)} 0%, #fffaf7 36%, #fffaf7 64%, ${tint(keyB, 0.2)} 100%)`,
      }}
    >
      {/* 顶部色带：这张卡片的色卡一字排开 */}
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 16 }}>
        {stripe.map((hex) => (
          <div key={hex} style={{ display: "flex", flex: 1, background: hex }} />
        ))}
      </div>
      {/* 金色细线框 */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 34,
          left: 30,
          right: 30,
          bottom: 30,
          borderRadius: 38,
          border: "2px solid rgba(184,146,74,0.38)",
        }}
      />

      {/* 品牌 + 标题 */}
      <div style={{ display: "flex", alignItems: "baseline", flexShrink: 0 }}>
        <div style={{ display: "flex", fontFamily: "Playfair", fontWeight: 700, fontSize: 36, color: INK }}>Belle</div>
        <div
          style={{ display: "flex", marginLeft: 10, fontFamily: "Inter", fontWeight: 600, fontSize: 16, letterSpacing: 6, color: GOLD }}
        >
          AI
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 26,
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: 7,
          textTransform: "uppercase",
          color: GOLD,
        }}
      >
        {spec.eyebrow}
      </div>
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 12,
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: titleSize(spec.title),
          lineHeight: 1.08,
          color: INK,
          textAlign: "center",
        }}
      >
        {spec.title}
      </div>
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 12,
          fontFamily: "Playfair",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 31,
          color: MUTED,
          textAlign: "center",
        }}
      >
        {spec.subtitle}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0, marginTop: 22, width: 280 }}>
        <div style={{ display: "flex", flex: 1, height: 1, background: GOLD }} />
        <div style={{ display: "flex", width: 11, height: 11, margin: "0 14px", background: GOLD, transform: "rotate(45deg)" }} />
        <div style={{ display: "flex", flex: 1, height: 1, background: GOLD }} />
      </div>

      {spec.traits ? (
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            width: "100%",
            marginTop: 26,
            padding: "16px 0",
            borderRadius: 24,
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(184,146,74,0.35)",
          }}
        >
          {spec.traits.map((t, i) => (
            <div
              key={t.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                borderLeft: i === 0 ? "none" : "1px solid rgba(184,146,74,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: 3.5,
                  textTransform: "uppercase",
                  color: FAINT,
                }}
              >
                {t.label}
              </div>
              <div style={{ display: "flex", marginTop: 7, fontFamily: "Playfair", fontWeight: 600, fontSize: 26, color: INK }}>
                {t.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {spec.sections.map((section) => (
        <Section key={section.label} section={section} />
      ))}

      <div style={{ display: "flex", flex: 1 }} />

      {/* 页脚：出处与授权条件写在图上，被转载时署名不会丢 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "100%", marginTop: 20 }}>
        <div style={{ display: "flex", width: "100%", height: 1, background: "rgba(184,146,74,0.45)" }} />
        <div style={{ display: "flex", marginTop: 18, fontFamily: "Inter", fontWeight: 600, fontSize: 25, color: INK }}>
          {shortUrl}
        </div>
        <div style={{ display: "flex", marginTop: 6, fontFamily: "Inter", fontSize: 17, color: MUTED }}>
          {spec.footerTagline}
        </div>
        <div style={{ display: "flex", marginTop: 5, fontFamily: "Inter", fontSize: 15, color: FAINT }}>
          Free to share and print with credit to Belle AI
        </div>
      </div>
    </div>
  );
}
