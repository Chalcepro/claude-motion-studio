import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Syne";
import { clamp, eApple, eSmooth } from "../lib/primitives";

const { fontFamily } = loadFont("normal", { weights: ["600", "700"] });

// Colours from noirtech.digital: off-white, near-black, orange
const CREAM = "#FAFAFA";
const INK = "#0A0A0A";
const RED = "#FF6B2B";
// Both logo files have different padding; these boxes make the visible marks the same size and place.
const LOGO_BOX: Record<string, React.CSSProperties> = {
  "noir-logo.png": { top: 150, left: 540 - 190, width: 380 },
  "noir-logo-white.png": { top: 150, left: 540 - 190, width: 380 },
};
const GRID = 64; // cell size; the grid drifts diagonally

export type NoirPendulumProps = { pairs: { q: string; a: string }[]; footer: string; tagline: string; url: string };

export const noirPendulumDefaults: NoirPendulumProps = {
  pairs: [
    { q: "NEED\nBRANDING?", a: "CONSIDER\nIT DONE." },
    { q: "NEED A\nWEBSITE?", a: "BUILT TO\nCONVERT." },
    { q: "NEED A\nMOBILE APP?", a: "IN EVERY\nPOCKET." },
    { q: "NEED AI\nAUTOMATIONS?", a: "WORK WHILE\nYOU SLEEP." },
  ],
  footer: "BRANDING · WEB · MOBILE · AI",
  tagline: "We Build Digital Solutions.",
  url: "noirtech.digital",
};

// Pendulum: pivot above frame, the string is the wipe between the two planes.
const PX = 540, PY = -150, L = 1300, AMP = 32 * (Math.PI / 180);
const INTRO = 24, PERIOD = 72; // frames; one full left-right-left swing
const SETTLE = 30, OUTRO = 140;
// Official logo split into its two original pieces (mark 143px + wordmark incl. gap 234px wide, both 130px tall).
const LOGO_SCALE = 1.95;

// Lines rise in one after another from `start` (frames).
const Lines: React.FC<{ text: string; local: number; color: string }> = ({ text, local, color }) => (
  <div style={{ position: "absolute", top: 740, width: "100%", textAlign: "center", fontWeight: 700, fontSize: 82, lineHeight: 1.08, color, letterSpacing: -1 }}>
    {text.split("\n").map((line, i) => {
      const p = interpolate(local - i * 4, [0, 16], [0, 1], eApple);
      return (
        <div key={i} style={{ overflow: "hidden" }}>
          <div style={{ transform: `translateY(${(1 - p) * 70}%)`, opacity: 0.2 + 0.8 * p }}>{line}</div>
        </div>
      );
    })}
  </div>
);

// Sound cue: one file from public/sfx starting at `at` (frames), optionally cut to `len` with a short fade-out.
const Sfx: React.FC<{ at: number; file: string; volume: number; len?: number }> = ({ at, file, volume, len }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={len} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={(f) => (len ? volume * interpolate(f, [len - 8, len], [1, 0], clamp) : volume)} />
  </Sequence>
);

const Plane: React.FC<{ bg: string; fg: string; accent: string; line: string; logo: string; text: string; local: number; footer: string; url: string; clip: string; hideLogo?: boolean }> = ({ bg, fg, accent, line, logo, text, local, footer, url, clip, hideLogo }) => {
  const shift = (useCurrentFrame() * 0.6) % GRID;
  return (
  <AbsoluteFill style={{ background: bg, clipPath: clip, fontFamily }}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`,
        backgroundSize: `${GRID}px ${GRID}px`, backgroundPosition: `${shift}px ${shift}px`,
      }}
    />
    {!hideLogo && <Img src={staticFile(logo)} style={{ position: "absolute", ...LOGO_BOX[logo] }} />}
    <Lines text={text} local={local} color={fg} />
    <div style={{ position: "absolute", bottom: 190, width: "100%", textAlign: "center", fontWeight: 600, fontSize: 30, letterSpacing: 6, color: fg }}>{footer}</div>
    <div style={{ position: "absolute", bottom: 140, width: "100%", textAlign: "center", fontWeight: 600, fontSize: 34, color: accent }}>{url}</div>
  </AbsoluteFill>
  );
};

const angleAt = (frame: number, swingEnd: number) => {
  if (frame < INTRO) return interpolate(frame, [0, INTRO], [AMP * 1.9, AMP], eSmooth);
  if (frame < swingEnd) return AMP * Math.cos((2 * Math.PI * (frame - INTRO)) / PERIOD);
  // Outro: the swing slows and settles straight down.
  return interpolate(frame, [swingEnd, swingEnd + SETTLE], [-AMP, 0], eSmooth);
};

export const NoirPendulum: React.FC<NoirPendulumProps> = ({ pairs, footer, tagline, url }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const swingEnd = INTRO + PERIOD * pairs.length - PERIOD / 2; // last answer fully shown
  const t = frame - INTRO;
  const theta = angleAt(frame, swingEnd);

  const sx = Math.sin(theta), cy = Math.cos(theta);
  const xAt = (y: number) => PX + ((y - PY) / cy) * sx; // string line extended past the frame
  const top = -400, bot = height + 400;
  const leftClip = `polygon(-2000px ${top}px, ${xAt(top)}px ${top}px, ${xAt(bot)}px ${bot}px, -2000px ${bot}px)`;
  const rightClip = `polygon(${xAt(top)}px ${top}px, ${width + 2000}px ${top}px, ${width + 2000}px ${bot}px, ${xAt(bot)}px ${bot}px)`;

  // Text swaps while hidden; each one rises in as the string passes the centre.
  const qi = Math.min(pairs.length - 1, Math.max(0, Math.floor((t + PERIOD / 2) / PERIOD)));
  const ai = Math.min(pairs.length - 1, Math.max(0, Math.floor(t / PERIOD)));
  const qLocal = qi === 0 ? frame : t - (qi * PERIOD - PERIOD / 4);
  const aLocal = t - (ai * PERIOD + PERIOD / 4) + 6;

  const wx = PX + L * sx, wy = PY + L * cy;
  const S = swingEnd + SETTLE; // pendulum at rest
  const stringOut = interpolate(frame, [S - 4, S + 8], [1, 0], clamp);
  // The mark leaves its tile, travels to the centre and grows, turns once, then slides left as the wordmark arrives.
  const go = interpolate(frame, [S, S + 24], [0, 1], eApple);
  const turn = interpolate(frame, [S + 10, S + 38], [0, 1], eApple);
  const slide = interpolate(frame, [S + 36, S + 60], [0, 1], eApple);
  const tileFade = interpolate(frame, [S, S + 5], [1, 0], clamp);
  const flood = interpolate(frame, [S - 8, S + 4], [0, 1], eSmooth);
  const markW = 143 * LOGO_SCALE, wordW = 234 * LOGO_SCALE, logoH = 130 * LOGO_SCALE;
  const restX = wx + 45 * sx, restY = wy + 45 * cy; // tile centre, swung with the tile
  const markSize = interpolate(go, [0, 1], [120, markW]);
  const finalMarkX = 540 - (markW + wordW) / 2 + markW / 2;
  const mx = interpolate(go, [0, 1], [restX, 540]) + (finalMarkX - 540) * slide;
  const my = interpolate(go, [0, 1], [restY, 860]);
  // The mark gives a gentle glow at the ends of each swing, where the pendulum hangs for a moment.
  const glow = 0.35 + 0.65 * Math.abs(Math.cos((2 * Math.PI * Math.max(0, t)) / PERIOD)) * (frame < swingEnd ? 1 : 0);

  const echoes = [2].map((lag) => {
    const th = angleAt(frame - lag, swingEnd);
    return { x: PX + L * Math.sin(th), y: PY + L * Math.cos(th), o: 0.12 };
  });

  const endIn = (d: number) => interpolate(frame, [S + 56 + d, S + 80 + d], [0, 1], eApple);

  return (
    <AbsoluteFill style={{ background: CREAM }}>
      {/* Sound: whoosh as the string crosses the centre, tick as each line rises, then the outro cues */}
      <Sfx at={0} file="bed.wav" volume={0.7} />
      {Array.from({ length: pairs.length * 2 - 1 }, (_, k) => (
        <Sfx key={`w${k}`} at={INTRO + PERIOD / 4 + (k * PERIOD) / 2 - 10} file="whoosh.wav" volume={0.45} len={40} />
      ))}
      {pairs.flatMap((_, i) => [i === 0 ? 2 : INTRO + i * PERIOD - PERIOD / 4, INTRO + i * PERIOD + PERIOD / 4 - 6]).map((at, k) => (
        <Sfx key={`t${k}`} at={at} file="tick.wav" volume={0.9} />
      ))}
      <Sfx at={swingEnd} file="settle.wav" volume={1} len={SETTLE + 10} />
      <Sfx at={S - 10} file="flash.wav" volume={0.5} />
      <Sfx at={S + 8} file="spin.wav" volume={0.5} />
      <Sfx at={S + 34} file="slide.wav" volume={0.45} />
      <Sfx at={S + 54} file="logo-hit.wav" volume={0.6} />
      <Plane bg={CREAM} fg={INK} accent={RED} line="rgba(11,15,20,0.06)" logo="noir-logo.png" text={pairs[qi].q} local={qLocal} footer={footer} url={url} clip={leftClip} />
      <Plane bg={INK} fg={CREAM} accent={RED} line="rgba(255,255,255,0.06)" logo="noir-logo-white.png" text={pairs[ai].a} local={aLocal} footer={footer} url={url} clip={rightClip} />

      {/* Cream floods in under the settled pendulum */}
      {flood > 0 && (
        <AbsoluteFill style={{ opacity: flood }}>
          <Plane bg={CREAM} fg={INK} accent={RED} line="rgba(11,15,20,0.06)" logo="noir-logo.png" text="" local={0} footer="" url="" clip="none" hideLogo />
        </AbsoluteFill>
      )}

      <svg width={width} height={height} style={{ position: "absolute", opacity: stringOut }}>
        {echoes.map((e, i) => (
          <line key={i} x1={PX} y1={PY} x2={e.x} y2={e.y} stroke={INK} strokeOpacity={e.o} strokeWidth={7} strokeLinecap="round" />
        ))}
        <line x1={PX} y1={PY} x2={wx} y2={wy} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: "absolute", left: wx - 85, top: wy - 40, width: 170, height: 170, borderRadius: 40,
          background: "#FFFFFF", transform: `rotate(${-theta}rad)`, transformOrigin: "85px 40px", opacity: tileFade,
          boxShadow: `0 30px 60px rgba(0,0,0,0.30), 0 0 ${40 + 50 * glow}px rgba(255,107,43,${0.55 * glow})`,
        }}
      />
      {/* The wordmark slides in from the right, unveiled from behind the mark */}
      <div style={{ position: "absolute", left: finalMarkX + markW / 2, top: 860 - logoH / 2, width: wordW, height: logoH, overflow: "hidden" }}>
        <Img src={staticFile("noir-wordmark.png")} style={{ width: wordW, transform: `translateX(${(1 - slide) * -wordW}px)`, opacity: slide }} />
      </div>
      <Img
        src={staticFile("noir-mark.png")}
        style={{
          position: "absolute", width: markSize, left: mx - markSize / 2, top: my - markSize * (596 / 655) / 2,
          transform: `rotate(${frame < S ? (-theta * 180) / Math.PI : turn * 360}deg)`,
        }}
      />

      <div style={{ position: "absolute", top: 1030, width: "100%", textAlign: "center", fontFamily }}>
        <div style={{ fontWeight: 700, fontSize: 56, letterSpacing: -1, color: INK, opacity: endIn(0), transform: `translateY(${30 * (1 - endIn(0))}px)` }}>{tagline}</div>
        <div style={{ marginTop: 22, fontWeight: 600, fontSize: 38, color: RED, opacity: endIn(10) }}>{url}</div>
      </div>
    </AbsoluteFill>
  );
};

export const noirPendulumDuration = (n: number) => INTRO + PERIOD * n - PERIOD / 2 + SETTLE + OUTRO;
