/**
 * Palette-agnostic design tokens. Build a `theme` per project/brand; the helpers
 * (layered shadow, glass, 8pt grid) stay the same. See the motion-design skill.
 */

export const grid = (n: number) => n * 8; // 8pt spacing scale
export const radii = { card: 32, pill: 999, thumb: 24, sheet: 44 };

// layered soft elevation (the #1 premium tell) — pass an "r,g,b" shadow color
export const layerShadow = (rgb = "15,18,25") =>
  `0 2px 8px rgba(${rgb},0.05), 0 30px 60px rgba(${rgb},0.13)`;

export const innerHi = "inset 0 1px 0 rgba(255,255,255,0.35)";

export const glass = (alpha = 0.7) => ({
  background: `rgba(255,255,255,${alpha})`,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.5)",
});

// type scale (px @ 1080w) — one family, many weights
export const type = {
  display: 108, title: 68, heading: 48, body: 36, label: 28,
};

// EXAMPLE theme — swap these per brand. Always: primary + accent + neutral scale,
// never pure black/white, depth via gradients.
export const theme = {
  bg: "#0B0D12",
  surface: "#141821",
  surfaceAlt: "#1A1F2B",
  ink: "#EAF0FA",
  muted: "#8A93A6",
  primary: "#5B8CFF",
  primaryHi: "#7BA4FF",
  accent: "#FF5C8A",
  success: "#2ECC71",
  hairline: "rgba(255,255,255,0.08)",
  grad: {
    brand: "linear-gradient(135deg,#7BA4FF,#5B8CFF)",
    deep: "radial-gradient(70% 60% at 50% 38%,#1A2740,#0B0D12)",
  },
};
export type Theme = typeof theme;
