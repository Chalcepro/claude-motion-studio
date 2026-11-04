import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BRIZ } from "../lib/brands";
import { mulberry32 } from "../lib/primitives";

// Step 1 of the modular rebuild: backgrounds only, each a seamless 8 s loop, for Chalce to pick from.
// Sticker reel: gradient runs bottom ORANGE -> top BRAND RED (#E72E08, never darker).
// Paper reel: layered paper looks.
const W = 1080, H = 1920, RED = BRIZ.accent, CREAM = BRIZ.bg;
const ORANGE = "#FF8A1E", ORANGE_HI = "#FFA33A";
export const BG_FRAMES = 240; // 8 s loop
const TAU = Math.PI * 2;

const Gradient: React.FC = () => <AbsoluteFill style={{ background: `linear-gradient(0deg, ${ORANGE} 0%, #F65A14 50%, ${RED} 100%)` }} />;

// Soft grain, so flat fills don't band and feel printed.
const GRAIN = (() => { const r = mulberry32(3); return Array.from({ length: 220 }, () => ({ x: r() * W, y: r() * H, r: 1.5 + r() * 3, o: 0.05 + r() * 0.06 })); })();
const Grain: React.FC<{ c?: string }> = ({ c = "#FFFFFF" }) => (
  <svg width={W} height={H} style={{ position: "absolute" }}>{GRAIN.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={g.r} fill={c} opacity={g.o} />)}</svg>
);

// A: big rounded "Briz-tile" shapes (the logo's rounded rect) drifting slowly, a shade lighter than the sky.
const TILES = (() => { const r = mulberry32(8); return Array.from({ length: 9 }, () => ({ x: r() * W, y: r() * H, s: 180 + r() * 320, rot: r() * 40 - 20, ph: r() * TAU, amp: 30 + r() * 50 })); })();
export const BgStickerTiles: React.FC = () => {
  const f = useCurrentFrame(), p = (f / BG_FRAMES) * TAU;
  return (
    <AbsoluteFill>
      <Gradient />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {TILES.map((t, i) => (
          <rect key={i} x={-t.s / 2} y={-t.s / 2} width={t.s} height={t.s} rx={t.s * 0.28} fill="#FFFFFF" opacity={0.07}
            transform={`translate(${t.x + Math.sin(p + t.ph) * t.amp} ${t.y + Math.cos(p + t.ph) * t.amp}) rotate(${t.rot + Math.sin(p + t.ph) * 6})`} />
        ))}
      </svg>
      <Grain />
    </AbsoluteFill>
  );
};

// B: slow light sweep — soft rays from the bottom glow, turning gently.
export const BgStickerRays: React.FC = () => {
  const f = useCurrentFrame(), a = Math.sin((f / BG_FRAMES) * TAU) * 6;
  return (
    <AbsoluteFill>
      <Gradient />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs><radialGradient id="glow" cx="0.5" cy="1" r="0.75"><stop offset="0" stopColor={ORANGE_HI} stopOpacity={0.9} /><stop offset="1" stopColor={ORANGE_HI} stopOpacity={0} /></radialGradient></defs>
        <g transform={`translate(540 2050) rotate(${a})`}>
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d="M0 0 L-90 -2300 L90 -2300 Z" fill="#FFFFFF" opacity={0.06} transform={`rotate(${-65 + i * 10})`} />
          ))}
        </g>
        <rect width={W} height={H} fill="url(#glow)" />
      </svg>
      <Grain />
    </AbsoluteFill>
  );
};

// C: halftone dots that grow toward the bottom and ripple slowly upward (print / comic feel, but calm).
export const BgStickerDots: React.FC = () => {
  const f = useCurrentFrame(), p = (f / BG_FRAMES) * TAU;
  const step = 54, dots: React.ReactNode[] = [];
  for (let y = 0; y < H + step; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < W + step; x += step) {
    const depth = y / H; // bigger lower down
    const r = 3 + depth * 11 + Math.sin(p - y / 260) * 2.5 * depth;
    dots.push(<circle key={`${x}_${y}`} cx={x} cy={y} r={Math.max(0, r)} fill="#FFFFFF" opacity={0.08} />);
  }
  return <AbsoluteFill><Gradient /><svg width={W} height={H} style={{ position: "absolute" }}>{dots}</svg><Grain /></AbsoluteFill>;
};

// Paper A: stacked cut-paper hills (cream to red layers) with real paper shadows, breathing slowly.
export const BgPaperLayers: React.FC = () => {
  const f = useCurrentFrame(), p = (f / BG_FRAMES) * TAU;
  const cols = ["#F2856A", "#EC5B37", "#E9441C", RED];
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {cols.map((c, i) => {
          const base = 700 + i * 300, amp = 70 - i * 8, ph = p + i * 1.3;
          let d = `M-20 ${H + 20}`;
          for (let k = 0; k <= 60; k++) {
            const x = -20 + (k / 60) * (W + 40);
            d += ` L${x} ${base + Math.sin(x / 190 + i * 1.7) * amp + Math.sin(ph + x / 300) * 14}`;
          }
          d += ` L${W + 20} ${H + 20} Z`;
          return <g key={i}><path d={d} fill="rgba(80,20,0,0.18)" transform="translate(0 -14)" /><path d={d} fill={c} /></g>;
        })}
      </svg>
      <Grain c="#7A3A10" />
    </AbsoluteFill>
  );
};

// Paper B: brand red with a few large cut-paper rounded tiles in two reds, overlapping with soft paper shadows, drifting.
export const BgPaperTiles: React.FC = () => {
  const f = useCurrentFrame(), p = (f / BG_FRAMES) * TAU;
  const tiles = [
    { x: 160, y: 300, s: 520, c: "#EF4A1E" }, { x: 930, y: 620, s: 620, c: "#D92A06" }, { x: 220, y: 1250, s: 680, c: "#D92A06" },
    { x: 950, y: 1620, s: 560, c: "#EF4A1E" }, { x: 600, y: 950, s: 380, c: "#F0582C" },
  ];
  return (
    <AbsoluteFill style={{ background: RED }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {tiles.map((t, i) => {
          const tf = `translate(${t.x + Math.sin(p + i) * 18} ${t.y + Math.cos(p + i * 2) * 18}) rotate(${-12 + i * 9 + Math.sin(p + i) * 3})`;
          return (
            <g key={i}>
              <rect x={-t.s / 2 + 12} y={-t.s / 2 + 18} width={t.s} height={t.s} rx={t.s * 0.26} fill="rgba(60,5,0,0.22)" transform={tf} />
              <rect x={-t.s / 2} y={-t.s / 2} width={t.s} height={t.s} rx={t.s * 0.26} fill={t.c} transform={tf} />
            </g>
          );
        })}
      </svg>
      <Grain c="#5A0E00" />
    </AbsoluteFill>
  );
};

export const BACKGROUNDS = { BgStickerTiles, BgStickerRays, BgStickerDots, BgPaperLayers, BgPaperTiles };
