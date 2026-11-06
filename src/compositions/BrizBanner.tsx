import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { APPLE, SMOOTH, mulberry32 } from "../lib/primitives";
import { BRIZ } from "../lib/brands";

// Looping logo banner. Starts and ends on plain white. Everything that matters stays in a
// short centre band, so the same film survives a wide crop, a tall crop or a square one.
export const BRIZ_BANNER_FRAMES = 240;

const RED = BRIZ.accent, INK = BRIZ.ink, WHITE = "#FFFFFF";
const SLANT = -26; // the lean of the two logo cards
const LAND = 24, FLOOD = 84, STRESS = 118, WAHALA = 152, CARD = 192, OUT = 222;
const WORDS: { at: number; end: number; bg: string; ink: string; text: string }[] = [
  { at: FLOOD, end: STRESS, bg: RED, ink: WHITE, text: "No friction." },
  { at: STRESS, end: WAHALA, bg: INK, ink: WHITE, text: "No stress." },
  { at: WAHALA, end: CARD, bg: WHITE, ink: RED, text: "No wahala." },
];

const r = mulberry32(23);
const STREAKS = Array.from({ length: 16 }, () => ({ y: (() => { const v = r(); return v < 0.5 ? 0.14 + v * 0.44 : 0.64 + (v - 0.5) * 0.44; })(), len: 180 + r() * 420, delay: r() * 34, fat: 6 + r() * 12, red: r() > 0.55 }));

const ease = (f: number, a: number, b: number, e = APPLE) =>
  interpolate(f, [a, b], [0, 1], { easing: e, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// A slanted panel that crosses the frame and leaves the new colour behind it.
const Wipe: React.FC<{ f: number; at: number; color: string; d?: number }> = ({ f, at, color, d = 12 }) => {
  const { width } = useVideoConfig();
  const p = ease(f, at - d, at, SMOOTH);
  if (p <= 0 || f >= at) return null;
  const span = width * 2.2;
  return <div style={{ position: "absolute", top: "-20%", bottom: "-20%", left: span * (p - 1) - width * 0.6, width: span, background: color, transform: `skewX(${SLANT}deg)` }} />;
};

const Streaks: React.FC<{ f: number; from: number; to: number; u: number; onDark?: boolean }> = ({ f, from, to, u, onDark }) => {
  const { width, height } = useVideoConfig();
  if (f < from || f > to) return null;
  return <>{STREAKS.map((s, i) => {
    const p = ease(f, from + s.delay, from + s.delay + 22, SMOOTH);
    if (p <= 0 || p >= 1) return null;
    const len = s.len * u * Math.sin(p * Math.PI);
    return <div key={i} style={{ position: "absolute", top: s.y * height, left: -s.len * u + p * (width + s.len * u * 2), width: len, height: s.fat * u, borderRadius: 99, background: onDark ? "rgba(255,255,255,.28)" : s.red ? RED : INK, opacity: 0.85 }} />;
  })}</>;
};

export const BrizBanner: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;

  // the two cards fly in along their own lean and lock together
  const fly = ease(f, 4, LAND, Easing.bezier(0.5, 0, 0.15, 1));
  const dx = (1 - fly) * width * 0.34, dy = (1 - fly) * height * 0.8;
  const hit = ease(f, LAND, LAND + 14);
  const pop = 1 + 0.22 * (1 - hit) * (f >= LAND ? 1 : 0);
  const open = ease(f, LAND + 3, LAND + 22);
  const logoH = 190 * u, markW = logoH * (135 / 130), wordW = logoH * (255 / 130), total = markW + wordW;
  const cardW = logoH * 0.56, cardH = logoH * 0.74;
  const logoLive = f >= LAND && f < FLOOD;
  const drift = interpolate(f, [LAND, FLOOD], [1, 1.05]);

  const word = WORDS.find((w) => f >= w.at && f < w.end);
  const cardIn = ease(f, CARD, CARD + 14);

  return (
    <AbsoluteFill style={{ background: WHITE, overflow: "hidden", fontFamily: BRIZ.font }}>
      <Audio src={staticFile("audio/briz-banner.wav")} />
      <Streaks f={f} from={0} to={40} u={u} />

      {f < LAND && <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: cardW, height: cardH, borderRadius: 16 * u, background: RED, transform: `translate(${-dx + cardW * 0.22 * fly}px, ${dy + cardH * 0.17 * fly}px) skewX(${SLANT}deg)` }} />
        <div style={{ position: "absolute", width: cardW, height: cardH, borderRadius: 16 * u, background: INK, transform: `translate(${dx - cardW * 0.22 * fly}px, ${-dy - cardH * 0.17 * fly}px) skewX(${SLANT}deg)` }} />
      </AbsoluteFill>}

      {logoLive && <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: total, height: logoH, transform: `scale(${pop * drift})` }}>
          <div style={{ position: "absolute", left: markW, top: 0, width: wordW * open, height: logoH, overflow: "hidden" }}>
            <Img src={staticFile("briz-wordmark.png")} style={{ position: "absolute", height: logoH, left: -(1 - open) * wordW * 0.6, top: 0, maxWidth: "none" }} />
          </div>
          <Img src={staticFile("briz-mark.png")} style={{ position: "absolute", height: logoH, left: (total - markW) / 2 * (1 - open), top: 0 }} />
        </div>
      </AbsoluteFill>}
      <Streaks f={f} from={LAND + 4} to={FLOOD} u={u} />

      {word && <AbsoluteFill style={{ background: word.bg, alignItems: "center", justifyContent: "center" }}>
        <Streaks f={f} from={word.at - 4} to={word.end} u={u} onDark={word.bg !== WHITE} />
        {(() => {
          const t = ease(f, word.at, word.at + 12);
          return <div style={{ overflow: "hidden", padding: `${24 * u}px ${30 * u}px` }}>
            <div style={{ fontSize: 142 * u, fontWeight: 800, letterSpacing: -3 * u, lineHeight: 1.1, whiteSpace: "nowrap", color: word.ink, transform: `translateY(${(1 - t) * 190 * u}px) skewX(${(1 - t) * SLANT}deg) scale(${interpolate(f, [word.at, word.end], [1, 1.05])})` }}>{word.text}</div>
          </div>;
        })()}
      </AbsoluteFill>}

      {f >= CARD && <AbsoluteFill style={{ background: WHITE, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34 * u }}>
        <Img src={staticFile("briz-logo.png")} style={{ height: 150 * u, transform: `scale(${1.14 - 0.14 * cardIn})` }} />
        <div style={{ fontSize: 52 * u, fontWeight: 600, color: INK, whiteSpace: "nowrap", opacity: ease(f, CARD + 6, CARD + 16), transform: `translateY(${(1 - ease(f, CARD + 6, CARD + 18)) * 26 * u}px)` }}>
          No friction. No stress. <span style={{ color: RED }}>No wahala.</span>
        </div>
      </AbsoluteFill>}

      {WORDS.map((w) => <Wipe key={w.at} f={f} at={w.at} color={w.bg} />)}
      <Wipe f={f} at={CARD} color={WHITE} />
      {f >= OUT && <>
        <Wipe f={f} at={OUT + 8} color={RED} d={10} />
        <Wipe f={f} at={OUT + 12} color={INK} d={10} />
        <Wipe f={f} at={BRIZ_BANNER_FRAMES} color={WHITE} d={12} />
      </>}
    </AbsoluteFill>
  );
};
