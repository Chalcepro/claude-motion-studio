import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, interpolateColors, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import { clamp, eApple, eSmooth } from "../lib/primitives";

const { fontFamily } = loadFont("normal", { weights: ["600", "800"] });

// Briz brand colours (same as the pendulum)
const CREAM = "#FDEBD0";
const INK = "#0B0F14";
const RED = "#E72E08";

// "rows" = flat bars sliding in from alternate sides (the Flex Yield reference).
// "bubbles" = the same bars shaped as WhatsApp messages: white from the left, red from the right.
export type BrizRowsProps = { look: "rows" | "bubbles" };

// One beat per feature: the centre word, and six short words on the rows around it.
const BEATS: { word: string; size: number; side: string[] }[] = [
  { word: "SNAP IT.", size: 120, side: ["Screenshot", "Bank slip", "Account no.", "Photo", "Receipt", "Sent ✓"] },
  { word: "SAY IT.", size: 120, side: ["Voice note", "Send 5k to Ade", "Pidgin works", "Hands-free", "Receipt", "Sent ✓"] },
  { word: "TYPE IT.", size: 120, side: ["2k to Mama", "₦5,000", "Ade · GTBank", "PIN ✓", "Receipt", "Instant"] },
  { word: "BIOPASS.", size: 116, side: ["No POS", "No card reader", "Any phone", "Your own PIN", "Settles instantly", "Merchants"] },
  { word: "EMERGENCY\nWALLET.", size: 92, side: ["Backup cash", "When it counts", "Always ready", "Instant", "Users", "Merchants"] },
];

const HOOK = 40; // typing dots, then the first word rolls in
const BEAT = 42; // frames per feature
const OUTRO = 120;
const END = HOOK + BEAT * BEATS.length; // outro starts
export const BRIZ_ROWS_FRAMES = END + OUTRO;

const CY = 960; // centre row
const ROW_Y = [-470, -340, -210, 210, 340, 470].map((d) => CY + d); // three above, three below, clear of the centre

// Sound cue (same helper as the pendulum)
const Sfx: React.FC<{ at: number; file: string; volume: number; len?: number }> = ({ at, file, volume, len }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={len} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={(f) => (len ? volume * interpolate(f, [len - 8, len], [1, 0], clamp) : volume)} />
  </Sequence>
);

const SideRow: React.FC<{ text: string; k: number; local: number; look: BrizRowsProps["look"] }> = ({ text, k, local, look }) => {
  // In 2 frames apart, out 1 frame apart, each over ~12 frames.
  const inP = interpolate(local - 2 * k, [0, 12], [0, 1], eApple);
  const outP = interpolate(local - (BEAT - 12 + k), [0, 10], [0, 1], eSmooth);
  if (inP <= 0 || outP >= 1) return null;
  const y = ROW_Y[k];

  if (look === "rows") {
    const dir = k % 2 ? 1 : -1; // alternate sides; leave through the other side
    const x = (1 - inP) * dir * 1200 - outP * dir * 1200;
    return (
      <div style={{ position: "absolute", top: y - 52, width: "100%", display: "flex", justifyContent: "center", transform: `translateX(${x + (k % 3 - 1) * 60}px)` }}>
        <div style={{ background: RED, color: CREAM, fontWeight: 800, fontSize: 62, padding: "8px 40px", borderRadius: 8, whiteSpace: "nowrap" }}>{text}</div>
      </div>
    );
  }

  // Bubbles: incoming (white, left) and outgoing (red, right), each enters from its own side and pops from its tail.
  const mine = k % 2 === 1;
  const x = (1 - inP) * (mine ? 500 : -500) + outP * (mine ? 900 : -900);
  const s = 0.6 + 0.4 * inP;
  return (
    <div
      style={{
        position: "absolute", top: y - 56, [mine ? "right" : "left"]: 70, transform: `translateX(${x}px) scale(${s})`,
        transformOrigin: mine ? "right bottom" : "left bottom",
        background: mine ? RED : "#FFFFFF", color: mine ? CREAM : INK, fontWeight: 600, fontSize: 56, padding: "14px 38px",
        borderRadius: 40, [mine ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 8,
        boxShadow: "0 8px 24px rgba(11,15,20,0.12)", whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export const BrizRows: React.FC<BrizRowsProps> = ({ look }) => {
  const frame = useCurrentFrame();
  const beat = Math.min(BEATS.length - 1, Math.max(0, Math.floor((frame - HOOK) / BEAT)));
  const local = frame - HOOK - beat * BEAT;

  // Centre: pops in with typing dots, then each word rolls up like a slot reel (blurred while moving).
  const pop = interpolate(frame, [0, 12], [0, 1], eApple);
  const roll = frame < HOOK ? 0 : interpolate(local, [0, 10], [0, 1], eApple);
  const prev = frame < HOOK + BEAT ? null : BEATS[beat - 1];
  const speed = 1 - Math.abs(roll * 2 - 1);
  const flood = interpolate(frame, [END + 6, END + 30], [1, 14], eSmooth); // centre grows to fill the screen
  const endIn = (d: number) => interpolate(frame, [END + 26 + d, END + 50 + d], [0, 1], eApple);

  const centreBg = look === "rows" ? interpolateColors(frame, [END, END + 12], [INK, RED]) : RED; // both end on Briz red
  const centreText = (word: string, size: number, y: number) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${y}%)`, filter: `blur(${speed * 6}px)` }}>
      <div style={{ fontWeight: 800, fontSize: size, lineHeight: 0.95, letterSpacing: -3, textAlign: "center", whiteSpace: "pre" }}>{word}</div>
    </div>
  );
  const dots = [0, 1, 2].map((i) => 0.35 + 0.65 * Math.max(0, Math.sin((frame - i * 4) / 4)));

  return (
    <AbsoluteFill style={{ background: CREAM, fontFamily, overflow: "hidden" }}>
      <Sfx at={0} file="bed.wav" volume={0.7} />
      <Sfx at={2} file="tick.wav" volume={0.9} />
      {BEATS.map((_, i) => (
        <React.Fragment key={i}>
          <Sfx at={HOOK + i * BEAT - 6} file="whoosh.wav" volume={0.4} len={36} />
          <Sfx at={HOOK + i * BEAT + 2} file="tick.wav" volume={0.9} />
        </React.Fragment>
      ))}
      <Sfx at={END} file="flash.wav" volume={0.5} />
      <Sfx at={END + 24} file="logo-hit.wav" volume={0.6} />

      {frame >= HOOK && frame < END && BEATS[beat].side.map((t, k) => <SideRow key={`${beat}-${k}`} text={t} k={k} local={local} look={look} />)}

      {/* Centre row */}
      <div
        style={{
          position: "absolute", left: 60, right: 60, top: CY - 130, height: 260, background: centreBg, color: CREAM, overflow: "hidden",
          borderRadius: look === "rows" ? 10 : 56, ...(look === "bubbles" ? { borderBottomRightRadius: 10 } : {}),
          transform: `scale(${pop * flood})`, boxShadow: "0 20px 50px rgba(11,15,20,0.25)",
        }}
      >
        {frame < HOOK ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
            {dots.map((o, i) => <div key={i} style={{ width: 34, height: 34, borderRadius: 17, background: CREAM, opacity: o }} />)}
          </div>
        ) : (
          frame < END + 10 && (
            <>
              {prev && roll < 1 && centreText(prev.word, prev.size, -110 * roll)}
              {centreText(BEATS[beat].word, BEATS[beat].size, 110 * (1 - roll))}
            </>
          )
        )}
        {look === "bubbles" && frame >= HOOK && frame < END && (
          <div style={{ position: "absolute", right: 34, bottom: 18, fontSize: 30, fontWeight: 600, opacity: 0.8 }}>✓✓</div>
        )}
      </div>

      {/* Ending on the red flood: official cream logo, tagline, WhatsApp, url */}
      {frame >= END + 20 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: CREAM, textAlign: "center" }}>
          <Img src={staticFile("briz-logo-cream.png")} style={{ width: 195 * 2.6, opacity: endIn(0), transform: `scale(${0.85 + 0.15 * endIn(0)})`, marginTop: -160 }} />
          <div style={{ marginTop: 50, fontWeight: 800, fontSize: 76, letterSpacing: -2, opacity: endIn(10), transform: `translateY(${30 * (1 - endIn(10))}px)` }}>Pay with Zero Wahala.</div>
          <div style={{ marginTop: 22, fontWeight: 600, fontSize: 40, opacity: endIn(20) }}>on WhatsApp · paywithbriz.com</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
