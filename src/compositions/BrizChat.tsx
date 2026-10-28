import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import { clamp, eApple, eSmooth } from "../lib/primitives";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "800"] });

const CREAM = "#FDEBD0";
const INK = "#0B0F14";
const RED = "#E72E08";

// The chat: "me" asks (red, right), Briz answers like a chill guy (white, left). Line breaks are set by hand.
const CHAT: { q: string; a: string }[] = [
  { q: "Can I just send\na screenshot?", a: "Yeah, snap it.\nI'll read the details 📸" },
  { q: "What if I can't\ntype?", a: "Send a voice note.\nPidgin dey work too 🎤" },
  { q: "And if I lose\nmy phone?", a: "BioPass. Any phone,\nyour own PIN. Relax 😌" },
  { q: "What about\nemergencies?", a: "Emergency Wallet's\ngot your back 💪" },
  { q: "So I can try all\nthis now?", a: "Yeah. Sign up at\npaywithbriz.com 😎" },
];

const STEP = 108; // frames per question + answer (3.6 s)
const TYPING = 22; // Briz "typing…" before each answer
const Q_AT = (i: number) => 20 + i * STEP;
const A_AT = (i: number) => Q_AT(i) + 14 + TYPING;
const END = A_AT(CHAT.length - 1) + 50; // read the last answer, then the outro
const OUTRO = 120;
export const BRIZ_CHAT_FRAMES = END + OUTRO;

const LINE = 66, PAD = 44, GAP = 28, BOTTOM = 1720; // bubble metrics; newest message sits at BOTTOM
const DOTS_H = 100;
const height = (text: string) => PAD + text.split("\n").length * LINE;

type Msg = { text: string; mine: boolean; at: number; typingFrom?: number };
const MSGS: Msg[] = CHAT.flatMap((c, i) => [
  { text: c.q, mine: true, at: Q_AT(i) },
  { text: c.a, mine: false, at: A_AT(i), typingFrom: A_AT(i) - TYPING },
]);

const Sfx: React.FC<{ at: number; file: string; volume: number; len?: number }> = ({ at, file, volume, len }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={len} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={(f) => (len ? volume * interpolate(f, [len - 8, len], [1, 0], clamp) : volume)} />
  </Sequence>
);

export const BrizChat: React.FC = () => {
  const frame = useCurrentFrame();

  // Every message (or its typing bubble) takes room as it appears, which scrolls the chat up smoothly.
  const layout = MSGS.map((m) => {
    const start = m.typingFrom ?? m.at;
    const typing = frame >= start && frame < m.at;
    const h = typing ? DOTS_H : height(m.text);
    const p = interpolate(frame, [start, start + 10], [0, 1], eApple);
    return { ...m, typing, h, p, shown: frame >= start };
  });
  let y = BOTTOM;
  const placed = [...layout].reverse().map((m) => {
    y -= m.h * m.p + (m.p > 0 ? GAP : 0);
    return { ...m, top: y + GAP };
  }).reverse();

  const flood = interpolate(frame, [END, END + 26], [0, 1], eSmooth);
  const endIn = (d: number) => interpolate(frame, [END + 22 + d, END + 46 + d], [0, 1], eApple);
  const dot = (i: number) => 0.3 + 0.7 * Math.max(0, Math.sin((frame - i * 4) / 3.5));

  return (
    <AbsoluteFill style={{ background: CREAM, fontFamily, overflow: "hidden" }}>
      <Sfx at={0} file="bed.wav" volume={0.7} />
      {MSGS.map((m, i) => <Sfx key={i} at={m.at} file="tick.wav" volume={m.mine ? 0.9 : 0.6} />)}
      <Sfx at={END - 4} file="whoosh.wav" volume={0.45} len={36} />
      <Sfx at={END + 20} file="logo-hit.wav" volume={0.6} />

      {placed.map((m, i) =>
        !m.shown ? null : (
          <div
            key={i}
            style={{
              position: "absolute", top: m.top, [m.mine ? "right" : "left"]: 60, maxWidth: 820,
              transform: `scale(${0.7 + 0.3 * m.p})`, opacity: m.p, transformOrigin: m.mine ? "right bottom" : "left bottom",
              background: m.mine ? RED : "#FFFFFF", color: m.mine ? CREAM : INK,
              borderRadius: 40, [m.mine ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 8,
              padding: m.typing ? "0 40px" : `${PAD / 2}px 40px`, height: m.h, boxSizing: "border-box",
              display: "flex", alignItems: "center", gap: 18, boxShadow: "0 8px 24px rgba(11,15,20,0.10)",
            }}
          >
            {m.typing ? (
              [0, 1, 2].map((d) => <div key={d} style={{ width: 22, height: 22, borderRadius: 11, background: INK, opacity: dot(d) }} />)
            ) : (
              <div style={{ fontWeight: m.mine ? 600 : 500, fontSize: 50, lineHeight: `${LINE}px`, whiteSpace: "pre" }}>
                {m.text}
                {m.mine && <span style={{ fontSize: 26, marginLeft: 14, opacity: 0.85 }}>✓✓</span>}
              </div>
            )}
          </div>
        ),
      )}

      {/* Chat header, like WhatsApp: Briz mark, name, online */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 250, background: CREAM, boxShadow: "0 4px 20px rgba(11,15,20,0.08)", display: "flex", alignItems: "flex-end", padding: "0 60px 40px", gap: 28 }}>
        <div style={{ width: 110, height: 110, borderRadius: 55, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={staticFile("briz-mark.png")} style={{ width: 70 }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 52, color: INK, lineHeight: 1.1 }}>Briz</div>
          <div style={{ fontWeight: 500, fontSize: 32, color: RED }}>{layout.some((m) => m.typing) ? "typing…" : "online"}</div>
        </div>
      </div>

      {/* Outro: red rises from the bottom with a rounded top, then the official cream logo */}
      {flood > 0 && (
        <div style={{ position: "absolute", left: -200, right: -200, bottom: 0, height: `${flood * 130}%`, background: RED, borderTopLeftRadius: "50%", borderTopRightRadius: "50%" }} />
      )}
      {frame >= END + 20 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: CREAM, textAlign: "center" }}>
          <Img src={staticFile("briz-logo-cream.png")} style={{ width: 195 * 2.6, opacity: endIn(0), transform: `scale(${0.85 + 0.15 * endIn(0)})`, marginTop: -160 }} />
          <div style={{ marginTop: 50, fontWeight: 800, fontSize: 76, letterSpacing: -2, opacity: endIn(10), transform: `translateY(${30 * (1 - endIn(10))}px)` }}>Pay with Zero Wahala.</div>
          <div style={{ marginTop: 22, fontWeight: 600, fontSize: 40, opacity: endIn(20) }}>Sign up at paywithbriz.com</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
