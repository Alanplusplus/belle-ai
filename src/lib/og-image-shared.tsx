import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export const ogBackgroundStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f5e6ff 70%, #ede9fe 100%)",
  fontFamily: "system-ui, sans-serif",
  padding: "48px",
};

export function OgBelleBrand() {
  return (
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
          fontSize: "56px",
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
          fontSize: "24px",
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "#d4a017",
        }}
      >
        AI
      </span>
    </div>
  );
}

export function OgTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "48px",
        fontWeight: 700,
        color: "#1a1a2e",
        textAlign: "center",
        maxWidth: "900px",
        margin: 0,
        lineHeight: 1.2,
      }}
    >
      {children}
    </p>
  );
}

export function OgSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "24px",
        color: "#6b7280",
        textAlign: "center",
        maxWidth: "800px",
        marginTop: "16px",
        marginBottom: 0,
      }}
    >
      {children}
    </p>
  );
}

export function OgColorSwatches({ colors }: { colors: { hex: string }[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginTop: "32px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {colors.slice(0, 6).map((color, index) => (
        <div
          key={`${color.hex}-${index}`}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            backgroundColor: color.hex,
            border: "3px solid rgba(255, 255, 255, 0.8)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
          }}
        />
      ))}
    </div>
  );
}

export function createOgImage(content: React.ReactElement) {
  return new ImageResponse(
    (
      <div style={ogBackgroundStyle}>
        <OgBelleBrand />
        {content}
      </div>
    ),
    { ...ogSize }
  );
}

export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
