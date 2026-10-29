import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, eApple, mulberry32 } from "../lib/primitives";
import { Brand, BRIZ } from "../lib/brands";
const W = 1080, H = 1920;

// Small line drawings, drawn in a 100x100 box.
const ICONS: Record<string, React.ReactNode> = {
  camera: <><rect x="10" y="30" width="80" height="55" rx="10" /><circle cx="50" cy="57" r="16" /><path d="M35 30 L42 18 H58 L65 30" /></>,
  mic: <><rect x="38" y="10" width="24" height="46" rx="12" /><path d="M26 46 Q26 72 50 72 Q74 72 74 46 M50 72 V88 M36 88 H64" /></>,
  keys: <><rect x="8" y="28" width="84" height="48" rx="8" /><path d="M20 42 H24 M34 42 H38 M48 42 H52 M62 42 H66 M76 42 H80 M20 54 H24 M76 54 H80 M32 64 H68" /></>,
  print: <><path d="M30 80 Q24 60 28 44 Q34 22 52 22 Q72 24 74 46 Q76 62 70 80" /><path d="M40 82 Q34 62 38 48 Q42 34 52 34 Q62 36 62 50 Q64 64 58 84" /><path d="M50 86 Q46 66 50 50" /></>,
  globe: <><circle cx="50" cy="50" r="38" /><path d="M12 50 H88 M50 12 Q30 50 50 88 M50 12 Q70 50 50 88" /></>,
  phone: <><rect x="30" y="8" width="40" height="84" rx="8" /><path d="M44 80 H56" /></>,
  pen: <><path d="M20 80 L30 56 L68 18 L82 32 L44 70 Z M30 56 L44 70" /><path d="M16 86 H50" /></>,
  bolt: <><path d="M56 8 L24 56 H48 L42 92 L76 40 H52 Z" /></>,
  store: <><path d="M14 36 L22 14 H78 L86 36 Z M18 36 V86 H82 V36 M40 86 V60 H60 V86" /></>,
  chart: <><path d="M14 86 H88 M24 76 V56 M42 76 V40 M60 76 V48 M78 76 V22" /></>,
  shield: <><path d="M50 10 L84 22 V48 Q84 76 50 90 Q16 76 16 48 V22 Z" /><path d="M36 50 L46 60 L66 40" /></>,
};

export type WipeBeat = { word: string; line: string; icon: string };
export type WipeProps = { brand: Brand; beats: WipeBeat[] };
export const BRIZ_WIPE: WipeBeat[] = [
  { word: "SNAP IT.", line: "Send a screenshot.", icon: "camera" },
  { word: "SAY IT.", line: "Send a voice note.", icon: "mic" },
  { word: "TYPE IT.", line: "Just text it.", icon: "keys" },
  { word: "BIOPASS.", line: "Any phone. Your own PIN.", icon: "print" },
  { word: "EMERGENCY\nWALLET.", line: "Backup cash when it counts.", icon: "shield" },
];
export const brizWipeDefaults: WipeProps = { brand: BRIZ, beats: BRIZ_WIPE };

const COVER = 10; // red closes back over the page
const STROKE = 7; // frames per wipe stroke
const STROKES = 4;
const WIPE_AT = COVER + 4;
const HOLD = 45; // page fully visible
const BEAT = WIPE_AT + STROKE * STROKES + HOLD;
export const wipeFrames = (n: number) => BEAT * n + WIPE_AT + STROKE * STROKES + 80;

// Four diagonal hand strokes (top-left to bottom-right), alternating direction, a bit wobbly. Seeded per beat.
const strokes = (seed: number) => {
  const r = mulberry32(seed);
  return [0, 1, 2, 3].map((k) => {
    const y0 = -800 + k * 700;
    const pts = [0, 1, 2, 3].map((j) => [-350 + j * 600 + r() * 60, y0 + j * 480 + r() * 90 - 45]);
    if (k % 2) pts.reverse(); // hand goes back the other way
    return "M" + pts.map((p) => p.join(" ")).join(" L");
  });
};
const LEN = 2400; // longer than any stroke, for the dash trick

const Sfx: React.FC<{ at: number; file: string; volume: number; len?: number }> = ({ at, file, volume, len }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={len} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={(f) => (len ? volume * interpolate(f, [len - 6, len], [1, 0], clamp) : volume)} />
  </Sequence>
);

const Page: React.FC<{ i: number; brand: Brand; beats: WipeBeat[] }> = ({ i, brand, beats }) => {
  const { ink: INK, accent: RED } = brand;
  if (i >= beats.length)
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", color: INK }}>
        <Img src={staticFile(brand.logoOnBg)} style={{ width: brand.logoW }} />
        <div style={{ marginTop: 50, fontWeight: 800, fontSize: 72 * brand.wordScale, letterSpacing: -2 }}>{brand.tagline}</div>
        <div style={{ marginTop: 20, fontWeight: 600, fontSize: 40, color: RED }}>{brand.url}</div>
      </AbsoluteFill>
    );
  const b = beats[i];
  const long = Math.max(...b.word.split(/\n/).map((l) => l.length));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", color: INK }}>
      <svg viewBox="0 0 100 100" width={260} height={260} fill="none" stroke={RED} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        {ICONS[b.icon]}
      </svg>
      <div style={{ marginTop: 40, fontWeight: 800, fontSize: (long > 9 ? 110 : 140) * brand.wordScale, lineHeight: 0.95, letterSpacing: -4, whiteSpace: "pre" }}>{b.word}</div>
      <div style={{ marginTop: 30, fontWeight: 600, fontSize: 46, opacity: 0.75 }}>{b.line}</div>
    </AbsoluteFill>
  );
};

export const BrizWipe: React.FC<WipeProps> = ({ brand, beats }) => {
  const frame = useCurrentFrame();
  const { bg: CREAM, accent: RED, font: fontFamily } = brand;
  const END = BEAT * beats.length; // final wipe to the logo
  const i = Math.min(beats.length, Math.floor(frame / BEAT));
  const t = frame - i * BEAT;

  // Red comes back over the old page first, then the new page is under it.
  const cover = i === 0 ? 1 : interpolate(t, [0, COVER], [0, 1], eApple);
  const shown = t < COVER && i > 0 ? i - 1 : i;
  const paths = strokes(i + 7);
  const wiped = (k: number) => interpolate(t, [WIPE_AT + k * STROKE, WIPE_AT + (k + 1) * STROKE], [0, 1], clamp);

  // Handheld feel: a slow, small drift on everything.
  const sx = Math.sin(frame / 11) * 6 + Math.sin(frame / 4.3) * 2;
  const sy = Math.cos(frame / 13) * 6 + Math.sin(frame / 5.1) * 2;
  const rot = Math.sin(frame / 17) * 0.4;

  return (
    <AbsoluteFill style={{ background: CREAM, fontFamily, overflow: "hidden" }}>
      <Sfx at={0} file="bed.wav" volume={0.7} />
      {Array.from({ length: beats.length + 1 }, (_, b) =>
        [0, 1, 2, 3].map((k) => <Sfx key={`${b}-${k}`} at={b * BEAT + WIPE_AT + k * STROKE - 2} file="whoosh.wav" volume={0.35} len={16} />),
      )}
      <Sfx at={END + WIPE_AT + STROKE * STROKES} file="logo-hit.wav" volume={0.6} />

      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(1.03)` }}>
        <Page i={shown} brand={brand} beats={beats} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="rough">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={i} />
              <feDisplacementMap in="SourceGraphic" scale={70} />
            </filter>
            <mask id="wipe">
              <rect width={W} height={H} fill="white" />
              {t >= WIPE_AT && (
                <g filter="url(#rough)">
                  {paths.map((d, k) => (
                    <path key={k} d={d} fill="none" stroke="black" strokeWidth={760} strokeLinecap="round" strokeDasharray={LEN * 2} strokeDashoffset={LEN * 2 * (1 - wiped(k))} />
                  ))}
                </g>
              )}
            </mask>
          </defs>
          <rect width={W} height={H} fill={RED} opacity={cover} mask="url(#wipe)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
