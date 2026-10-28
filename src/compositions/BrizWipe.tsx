import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import { clamp, eApple, mulberry32 } from "../lib/primitives";

const { fontFamily } = loadFont("normal", { weights: ["600", "800"] });

const CREAM = "#FDEBD0";
const INK = "#0B0F14";
const RED = "#E72E08";
const W = 1080, H = 1920;

// Small line drawings, drawn in a 100x100 box.
const ICONS: Record<string, React.ReactNode> = {
  camera: <><rect x="10" y="30" width="80" height="55" rx="10" /><circle cx="50" cy="57" r="16" /><path d="M35 30 L42 18 H58 L65 30" /></>,
  mic: <><rect x="38" y="10" width="24" height="46" rx="12" /><path d="M26 46 Q26 72 50 72 Q74 72 74 46 M50 72 V88 M36 88 H64" /></>,
  keys: <><rect x="8" y="28" width="84" height="48" rx="8" /><path d="M20 42 H24 M34 42 H38 M48 42 H52 M62 42 H66 M76 42 H80 M20 54 H24 M76 54 H80 M32 64 H68" /></>,
  print: <><path d="M30 80 Q24 60 28 44 Q34 22 52 22 Q72 24 74 46 Q76 62 70 80" /><path d="M40 82 Q34 62 38 48 Q42 34 52 34 Q62 36 62 50 Q64 64 58 84" /><path d="M50 86 Q46 66 50 50" /></>,
  shield: <><path d="M50 10 L84 22 V48 Q84 76 50 90 Q16 76 16 48 V22 Z" /><path d="M36 50 L46 60 L66 40" /></>,
};

const BEATS = [
  { word: "SNAP IT.", line: "Send a screenshot.", icon: "camera" },
  { word: "SAY IT.", line: "Send a voice note.", icon: "mic" },
  { word: "TYPE IT.", line: "Just text it.", icon: "keys" },
  { word: "BIOPASS.", line: "Any phone. Your own PIN.", icon: "print" },
  { word: "EMERGENCY\nWALLET.", line: "Backup cash when it counts.", icon: "shield" },
];

const COVER = 10; // red closes back over the page
const STROKE = 7; // frames per wipe stroke
const STROKES = 4;
const WIPE_AT = COVER + 4;
const HOLD = 45; // page fully visible
const BEAT = WIPE_AT + STROKE * STROKES + HOLD;
const END = BEAT * BEATS.length; // final wipe to the logo
export const BRIZ_WIPE_FRAMES = END + WIPE_AT + STROKE * STROKES + 80;

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

const Page: React.FC<{ i: number }> = ({ i }) => {
  if (i >= BEATS.length)
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", color: INK }}>
        <Img src={staticFile("briz-logo.png")} style={{ width: 500 }} />
        <div style={{ marginTop: 50, fontWeight: 800, fontSize: 72, letterSpacing: -2 }}>Pay with Zero Wahala.</div>
        <div style={{ marginTop: 20, fontWeight: 600, fontSize: 40, color: RED }}>paywithbriz.com</div>
      </AbsoluteFill>
    );
  const b = BEATS[i];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", color: INK }}>
      <svg viewBox="0 0 100 100" width={260} height={260} fill="none" stroke={RED} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        {ICONS[b.icon]}
      </svg>
      <div style={{ marginTop: 40, fontWeight: 800, fontSize: i === 4 ? 110 : 140, lineHeight: 0.95, letterSpacing: -4, whiteSpace: "pre" }}>{b.word}</div>
      <div style={{ marginTop: 30, fontWeight: 600, fontSize: 46, opacity: 0.75 }}>{b.line}</div>
    </AbsoluteFill>
  );
};

export const BrizWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const i = Math.min(BEATS.length, Math.floor(frame / BEAT));
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
      {Array.from({ length: BEATS.length + 1 }, (_, b) =>
        [0, 1, 2, 3].map((k) => <Sfx key={`${b}-${k}`} at={b * BEAT + WIPE_AT + k * STROKE - 2} file="whoosh.wav" volume={0.35} len={16} />),
      )}
      <Sfx at={END + WIPE_AT + STROKE * STROKES} file="logo-hit.wav" volume={0.6} />

      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(1.03)` }}>
        <Page i={shown} />
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
