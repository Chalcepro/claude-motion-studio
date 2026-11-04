import React from "react";
import { mulberry32 } from "./primitives";

// '90s / early-2000s sticker animation helpers: motion on twos (held frames), a little "boil" jitter per held
// frame, thick rounded white outline, one hard drop shadow. Rounded everywhere, to match the Briz logo.

export const onTwos = (f: number, n = 2) => Math.floor(f / n) * n;

// Small per-hold wobble so stickers feel hand-animated, not tweened.
export const boil = (f: number, seed: number, amt = 1) => {
  const r = mulberry32(seed * 977 + Math.floor(f / 4));
  return { dx: (r() - 0.5) * 3 * amt, dy: (r() - 0.5) * 3 * amt, rot: (r() - 0.5) * 2.4 * amt };
};

const OUT = 7;
const RING = [[OUT, 0], [-OUT, 0], [0, OUT], [0, -OUT], [5, 5], [-5, 5], [5, -5], [-5, -5]]
  .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 #FFFFFF)`).join(" ");
export const stickerFilter = (shadow = "rgba(70,25,0,0.25)") => `${RING} drop-shadow(9px 13px 0 ${shadow})`;

// Slap in: oversize -> squash -> settle, on twos. Peel out: lift, twist, fly off along `dir`.
export const slap = (f: number, at: number) => {
  const t = onTwos(f) - at;
  if (t < 0) return { s: 0, on: false };
  const s = t === 0 ? 1.38 : t === 2 ? 0.88 : t === 4 ? 1.06 : 1;
  return { s, on: true };
};
export const peel = (f: number, at: number, dir: [number, number]) => {
  const t = Math.max(0, onTwos(f) - at);
  const p = Math.min(1, t / 14);
  const e = p * p;
  return { dx: dir[0] * 1400 * e, dy: dir[1] * 1400 * e - Math.sin(p * Math.PI) * 40, rot: 40 * e * Math.sign(dir[0] || 1), s: 1 + 0.08 * Math.sin(p * Math.PI), gone: p >= 1 };
};

export const Sticker: React.FC<{
  f: number; x: number; y: number; at: number; out?: number; dir?: [number, number]; rot?: number; seed?: number;
  shadow?: string; children: React.ReactNode;
}> = ({ f, x, y, at, out, dir = [0, -1], rot = 0, seed = 1, shadow, children }) => {
  const a = slap(f, at);
  if (!a.on) return null;
  const p = out !== undefined && f >= out ? peel(f, out, dir) : { dx: 0, dy: 0, rot: 0, s: 1, gone: false };
  if (p.gone) return null;
  const b = boil(f, seed);
  return (
    <div style={{ position: "absolute", left: x + p.dx + b.dx, top: y + p.dy + b.dy, transform: `translate(-50%,-50%) rotate(${rot + p.rot + b.rot}deg) scale(${a.s * p.s})`,
      filter: stickerFilter(shadow) }}>
      {children}
    </div>
  );
};

// Comic sound-effect burst ("POW!", "TING!"): jagged star + word + action lines, slapped in on twos,
// lives ~12 frames. Meant to fire whenever a sticker lands or flies off.
const starPts = (n: number, r0: number, r1: number, seed: number) => {
  const r = mulberry32(seed);
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2, rad = i % 2 ? r0 : r1 * (0.8 + 0.35 * r());
    return `${Math.cos(a) * rad},${Math.sin(a) * rad}`;
  }).join(" ");
};
export const Pow: React.FC<{ f: number; at: number; x: number; y: number; word: string; color?: string; ink?: string; rot?: number; size?: number; seed?: number; life?: number }> =
  ({ f, at, x, y, word, color = "#FFC93C", ink = "#0B0F14", rot = -8, size = 1, seed = 3, life = 12 }) => {
  const t = onTwos(f) - at;
  if (t < 0 || t > life) return null;
  const s = (t === 0 ? 0.6 : t === 2 ? 1.2 : 1) * (t > life - 4 ? 0.85 : 1) * size;
  const lines = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + seed);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot + (t % 4 ? 2 : -2)}deg) scale(${s})`, filter: stickerFilter() }}>
      <svg width={420} height={320} viewBox="-210 -160 420 320" style={{ display: "block", overflow: "visible" }}>
        {lines.map((a, i) => <line key={i} x1={Math.cos(a) * 170} y1={Math.sin(a) * 130} x2={Math.cos(a) * (210 + t * 4)} y2={Math.sin(a) * (165 + t * 3)} stroke={ink} strokeWidth={10} strokeLinecap="round" />)}
        <polygon points={starPts(11, 95, 150, seed)} fill={color} stroke={ink} strokeWidth={10} strokeLinejoin="round" transform="scale(1 0.78)" />
        <text x={0} y={22} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight={800} fontSize={word.length > 5 ? 46 : 74} fill={ink} letterSpacing={-1}>{word}</text>
      </svg>
    </div>
  );
};
