import { ImageResponse } from "next/og";
import { SEASON_PALETTES } from "@/lib/color-palette-data";
import { SITE_URL } from "@/lib/constants";

/**
 * 12 季型色板的可下载 PNG（竖版 1200×1600，也适合直接发 Pinterest）。
 * 目的是给博主、色彩顾问和媒体一个可以直接引用的素材：图上自带出处和链接，被转载时署名不会丢。
 *
 * 颜色名统一用英文：ImageResponse 的默认字体没有 CJK / 西里尔字形，多语言名称会变成方框。
 */

const SIZE = { width: 1200, height: 1600 };

type Swatch = { name: string; hex: string };

function SwatchGroup({
  title,
  colors,
  swatch,
  cellWidth,
  muted,
}: {
  title: string;
  colors: Swatch[];
  swatch: number;
  cellWidth: number;
  muted?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 44 }}>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#7c3aed",
          marginBottom: 20,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", width: "100%", opacity: muted ? 0.75 : 1 }}>
        {colors.map((c) => (
          <div
            key={`${c.hex}-${c.name}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: cellWidth,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                width: swatch,
                height: swatch,
                borderRadius: swatch / 2,
                background: c.hex,
                border: "3px solid rgba(255,255,255,0.9)",
                boxShadow: "0 4px 14px rgba(26,26,46,0.18)",
              }}
            />
            <div
              style={{
                display: "flex",
                marginTop: 12,
                fontSize: 20,
                fontWeight: 600,
                color: "#1a1a2e",
                textAlign: "center",
              }}
            >
              {c.name}
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#6b7280" }}>{c.hex.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; season: string }> },
) {
  const { season } = await params;
  const data = SEASON_PALETTES[season];
  // 只有 12 个子季型有色板；春夏秋冬 4 个大类的聚合页不提供下载
  if (!data) return new Response("Not found", { status: 404 });

  const name = data.name.split(" (")[0];
  const shortUrl = `${SITE_URL.replace("https://", "")}/color-palette/${data.slug}`;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 30%, #f5e6ff 70%, #ede9fe 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "64px 64px 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#a21caf" }}>Belle</span>
          <span style={{ display: "flex", fontSize: 22, fontWeight: 600, letterSpacing: 5, color: "#d4a017", marginLeft: 8 }}>
            AI
          </span>
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 76, fontWeight: 800, color: "#1a1a2e", textAlign: "center" }}>
          {name}
        </div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 28, color: "#6b7280", textAlign: "center" }}>
          {data.tagline}
        </div>

        <SwatchGroup title="Best colors" colors={data.bestColors} swatch={104} cellWidth={214} />
        <SwatchGroup title="Neutrals" colors={data.neutrals} swatch={72} cellWidth={214} />
        <SwatchGroup title="Colors to avoid" colors={data.avoidColors} swatch={56} cellWidth={214} muted />

        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#1a1a2e" }}>{shortUrl}</div>
          <div style={{ display: "flex", marginTop: 6, fontSize: 20, color: "#6b7280" }}>
            12-season personal color analysis · Free AI color analysis from one selfie
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Content-Disposition": `attachment; filename="belle-ai-${data.slug}-color-palette.png"`,
        // 内容只随代码变化：CDN 缓存一个月，避免每次下载都重新渲染
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
      },
    },
  );

  return image;
}
