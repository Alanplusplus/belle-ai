import type { ReactElement } from "react";
import { SITE_URL } from "@/lib/constants";
import { Chip, FAINT, GOLD, INK, MUTED, SectionLabel, pickKeyColors, tint } from "@/lib/palette-card-render";
import {
  SHARE_CARD_SIZE,
  type FaceShape,
  type ShareCardBlock,
  type ShareCardSpec,
} from "@/lib/share-card";

/**
 * 测验分享卡（竖版 1080×1920）的画法，视觉和色板卡片一致：
 * 随结果换色调的象牙白底 + 顶部色带 + 金色细线框 + 衬线大标题 + 白底小卡片，底部是「你也来测一测」的邀请。
 * Satori：每个有多个子节点的 div 都要显式 display:flex。
 */

const PAD_X = 90;
const CONTENT_W = SHARE_CARD_SIZE.width - PAD_X * 2;

// 脸型轮廓（viewBox 200×260）。只是示意，用金色细线描边，淡粉填充
const FACE_PATHS: Record<FaceShape, string> = {
  oval: "M100 14 C145 14 172 60 172 130 C172 200 140 246 100 246 C60 246 28 200 28 130 C28 60 55 14 100 14Z",
  round: "M100 40 C152 40 184 82 184 140 C184 198 148 232 100 232 C52 232 16 198 16 140 C16 82 48 40 100 40Z",
  square: "M44 28 H156 Q176 28 176 50 V176 Q176 200 156 214 Q128 238 100 238 Q72 238 44 214 Q24 200 24 176 V50 Q24 28 44 28Z",
  heart: "M26 92 C26 42 62 16 100 16 C138 16 174 42 174 92 C174 146 138 204 100 246 C62 204 26 146 26 92Z",
  oblong: "M100 6 C142 6 160 44 160 96 L160 170 C160 220 134 254 100 254 C66 254 40 220 40 170 L40 96 C40 44 58 6 100 6Z",
  diamond: "M100 12 C118 40 176 92 176 130 C176 166 132 208 100 248 C68 208 24 166 24 130 C24 92 82 40 100 12Z",
  triangle: "M100 18 C128 18 142 50 148 92 C154 132 180 166 170 202 C160 238 130 248 100 248 C70 248 40 238 30 202 C20 166 46 132 52 92 C58 50 72 18 100 18Z",
};

function glyphSrc(shape: FaceShape): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 200 260" fill="none">` +
      `<path d="${FACE_PATHS[shape]}" fill="#fbe3ea" stroke="${GOLD}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="${FACE_PATHS[shape]}" transform="translate(100 130) scale(0.9) translate(-100 -130)" fill="none" stroke="rgba(184,146,74,0.35)" stroke-width="1.5" stroke-linejoin="round"/>` +
      `</svg>`,
  )}`;
}

const LOGO_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24">' +
    [
      { rotate: 45, fill: "#F2A58C" },
      { rotate: 135, fill: "#B9A6DD" },
      { rotate: 225, fill: "#C77A45" },
      { rotate: 315, fill: "#8D3F72" },
    ]
      .map(
        (p) =>
          `<ellipse cx="12" cy="6.4" rx="3.5" ry="5.6" fill="${p.fill}" opacity="0.92" transform="rotate(${p.rotate} 12 12)"/>`,
      )
      .join("") +
    '<circle cx="12" cy="12" r="2.1" fill="#FFF9F5"/><circle cx="12" cy="12" r="1.2" fill="#A9843F"/></svg>',
)}`;

function titleSize(title: string): number {
  const n = title.length;
  if (n <= 7) return 200;
  if (n <= 10) return 168;
  if (n <= 14) return 132;
  if (n <= 16) return 104;
  return 84;
}

function Block({ block }: { block: ShareCardBlock }) {
  if (block.kind === "chips") {
    const gap = 22;
    const width = Math.floor((CONTENT_W - gap * (block.perRow - 1)) / block.perRow);
    return (
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: "100%", marginTop: 56 }}>
        <SectionLabel text={block.label} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", width: "100%", gap }}>
          {block.chips.map((c) => (
            <Chip key={c.hex + c.name} chip={c} width={width} blockHeight={block.blockHeight} />
          ))}
        </div>
      </div>
    );
  }

  if (block.kind === "swatches") {
    const gap = 24;
    const size = Math.floor((CONTENT_W - gap * 2) / 3);
    return (
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: "100%", marginTop: 56 }}>
        <SectionLabel text={block.label} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", width: "100%", gap }}>
          {block.hexes.map((hex) => (
            <div
              key={hex}
              style={{
                display: "flex",
                padding: 12,
                background: "#ffffff",
                borderRadius: 30,
                boxShadow: "0 14px 32px rgba(74,40,90,0.10), 0 1px 3px rgba(74,40,90,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: size - 24,
                  height: Math.round((size - 24) * 0.62),
                  borderRadius: 20,
                  background: hex,
                  border: "1px solid rgba(43,26,53,0.10)",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.kind === "pills") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "100%", marginTop: 48 }}>
        <SectionLabel text={block.label} />
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
          {block.items.map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                padding: "12px 28px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.85)",
                border: "1.5px solid rgba(184,146,74,0.5)",
                fontFamily: "Playfair",
                fontWeight: 600,
                fontSize: 32,
                color: INK,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.kind === "glyph") {
    return (
      <div style={{ display: "flex", justifyContent: "center", flexShrink: 0, width: "100%", marginTop: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse 里只能用原生 img */}
        <img src={glyphSrc(block.shape)} width={260} height={338} alt="" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: "100%", marginTop: 40, gap: 20 }}>
      {block.notes.map((note) => (
        <div
          key={note.label}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            padding: "26px 36px",
            borderRadius: 30,
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(184,146,74,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: GOLD,
            }}
          >
            {note.label}
          </div>
          <div style={{ display: "flex", marginTop: 10, fontFamily: "Inter", fontWeight: 500, fontSize: 34, lineHeight: 1.3, color: INK }}>
            {note.text}
          </div>
        </div>
      ))}
    </div>
  );
}

export function renderShareCard(spec: ShareCardSpec): ReactElement {
  const [keyA, keyB] = pickKeyColors(spec.stripe);
  const stripe = Array.from(new Set(spec.stripe)).slice(0, 14);
  const shortUrl = `${SITE_URL.replace("https://", "")}${spec.quizPath}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: "100%",
        height: "100%",
        padding: `100px ${PAD_X}px 80px`,
        fontFamily: "Inter",
        background: `linear-gradient(170deg, ${tint(keyA, 0.24)} 0%, #fffaf7 38%, #fffaf7 62%, ${tint(keyB, 0.24)} 100%)`,
      }}
    >
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 22 }}>
        {stripe.map((hex) => (
          <div key={hex} style={{ display: "flex", flex: 1, background: hex }} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 48,
          left: 40,
          right: 40,
          bottom: 40,
          borderRadius: 52,
          border: "3px solid rgba(184,146,74,0.38)",
        }}
      />

      {/* 品牌 */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse 里只能用原生 img */}
        <img src={LOGO_SRC} width={64} height={64} alt="" />
        <div style={{ display: "flex", alignItems: "baseline", marginLeft: 16 }}>
          <div style={{ display: "flex", fontFamily: "Playfair", fontWeight: 700, fontSize: 56, color: INK }}>Belle</div>
          <div
            style={{ display: "flex", marginLeft: 12, fontFamily: "Inter", fontWeight: 600, fontSize: 24, letterSpacing: 8, color: GOLD }}
          >
            AI
          </div>
        </div>
      </div>

      {/* 标题区 */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          marginTop: 64,
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: 10,
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
          justifyContent: "center",
          marginTop: 14,
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: titleSize(spec.title),
          lineHeight: 1.05,
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
          justifyContent: "center",
          marginTop: 18,
          fontFamily: "Playfair",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 44,
          color: MUTED,
          textAlign: "center",
        }}
      >
        {spec.tagline}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0, marginTop: 34, width: 340 }}>
        <div style={{ display: "flex", flex: 1, height: 2, background: GOLD }} />
        <div style={{ display: "flex", width: 14, height: 14, margin: "0 18px", background: GOLD, transform: "rotate(45deg)" }} />
        <div style={{ display: "flex", flex: 1, height: 2, background: GOLD }} />
      </div>

      {spec.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}

      <div style={{ display: "flex", flex: 1 }} />

      {/* 邀请：朋友看到这张图，知道去哪儿自己测 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: "100%",
          padding: "36px 20px 34px",
          borderRadius: 40,
          background: "#ffffff",
          border: "2px solid rgba(184,146,74,0.45)",
          boxShadow: "0 18px 40px rgba(74,40,90,0.10)",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Playfair", fontWeight: 700, fontSize: 52, color: INK }}>
          What&apos;s your result?
        </div>
        <div style={{ display: "flex", marginTop: 10, fontFamily: "Inter", fontWeight: 400, fontSize: 28, color: MUTED }}>
          Free quiz · about 1 minute · no sign-up
        </div>
        <div style={{ display: "flex", marginTop: 20, fontFamily: "Inter", fontWeight: 600, fontSize: 34, color: "#B0517C" }}>
          {shortUrl}
        </div>
      </div>
      <div style={{ display: "flex", flexShrink: 0, marginTop: 22, fontFamily: "Inter", fontSize: 20, color: FAINT }}>
        A quick quiz is a rough guide · for precise results try a photo analysis
      </div>
    </div>
  );
}
