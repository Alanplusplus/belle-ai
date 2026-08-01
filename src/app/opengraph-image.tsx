import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Belle AI – Free AI Color Analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f5e6ff 70%, #ede9fe 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: 700,
              background: "linear-gradient(90deg, #c026d3, #a855f7, #d4a017)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Belle
          </span>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: "#d4a017",
            }}
          >
            AI
          </span>
        </div>
        <p
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: "#1a1a2e",
            textAlign: "center",
            maxWidth: "800px",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Free AI Color Analysis
        </p>
        <p
          style={{
            fontSize: "22px",
            color: "#6b7280",
            textAlign: "center",
            maxWidth: "700px",
            marginTop: "16px",
          }}
        >
          Find your best colors for makeup, fashion & hair in 60 seconds
        </p>
      </div>
    ),
    { ...size }
  );
}
