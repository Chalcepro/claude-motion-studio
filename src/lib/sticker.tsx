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
