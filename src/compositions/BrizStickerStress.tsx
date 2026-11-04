import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { BRIZ } from "../lib/brands";
import { Sticker, onTwos } from "../lib/sticker";
import { mulberry32 } from "../lib/primitives";

// Sticker loop "Less stress." (10 s). On a cream board, stress stickers slap down around a phone one by one
// (scribble, alarm, bills, "!!"). A red Briz sticker slaps onto the phone and the stress stickers peel away;
// calm stickers take their place, "Less stress." lands, then everything peels off and the empty board loops.
const W = 1080, H = 1920, INK = BRIZ.ink, RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font;
const GREEN = "#1DB45A", SUN = "#FFC93C";
export const BRIZ_STICKER_STRESS_FRAMES = 300;

const BRIZ_IN = 96, STRESS_OUT = 110, WORD = 150, ALL_OUT = 252;

// Faint paper grain so the board isn't a flat fill.
const GRAIN = (() => { const r = mulberry32(5); return Array.from({ length: 140 }, () => ({ x: r() * W, y: r() * H, r: 2 + r() * 5, o: 0.04 + r() * 0.05 })); })();

const Card: React.FC<{ w: number; h: number; bg: string; r?: number; children?: React.ReactNode }> = ({ w, h, bg, r = 44, children }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, position: "relative" }}>{children}</div>
);

const Scribble = () => (
  <svg width={260} height={220} viewBox="0 0 260 220">
    <path d="M40 120 C30 40 220 30 210 110 C200 190 60 190 70 120 C80 60 190 70 180 120 C170 160 100 160 105 120 C110 95 150 100 148 122"
      fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
  </svg>
);
const Alarm = () => (
  <Card w={220} h={220} bg={SUN} r={110}>
    <svg width={220} height={220}><circle cx={110} cy={115} r={70} fill={CREAM} />
      <path d="M110 115 V72 M110 115 L142 132" stroke={INK} strokeWidth={14} strokeLinecap="round" /></svg>
  </Card>
);
const Bill = () => (
  <Card w={230} h={290} bg="#FFFFFF" r={36}>
    <div style={{ position: "absolute", top: 34, left: 34, right: 34 }}>
      {[1, 0.7, 0.85, 0.5].map((w, i) => <div key={i} style={{ height: 16, width: `${w * 100}%`, borderRadius: 8, background: "#D9D2C8", marginBottom: 20 }} />)}
    </div>
    <div style={{ position: "absolute", bottom: 26, fontSize: 64, fontWeight: 800, color: RED }}>₦₦₦</div>
  </Card>
);
const Bang = () => <Card w={190} h={190} bg={RED} r={95}><span style={{ color: CREAM, fontSize: 120, fontWeight: 800, lineHeight: 1 }}>!!</span></Card>;
const Check = () => (
  <Card w={210} h={210} bg={GREEN} r={105}>
    <svg width={120} height={120}><path d="M20 64 L50 94 L102 30" fill="none" stroke="#fff" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" /></svg>
  </Card>
);
const Chip: React.FC<{ text: string }> = ({ text }) => (
  <Card w={360} h={120} bg="#FFFFFF" r={60}><span style={{ fontSize: 50, fontWeight: 700, color: INK }}>{text}</span></Card>
);
const Coin = () => <Card w={170} h={170} bg={SUN} r={85}><span style={{ fontSize: 96, fontWeight: 800, color: INK }}>₦</span></Card>;
const Smile = () => (
  <Card w={200} h={200} bg="#FFFFFF" r={100}>
    <svg width={200} height={200}><circle cx={74} cy={84} r={12} fill={INK} /><circle cx={126} cy={84} r={12} fill={INK} />
      <path d="M62 120 Q100 160 138 120" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" /></svg>
  </Card>
);

export const BrizStickerStress: React.FC = () => {
  const f = useCurrentFrame();
  const S = (p: Omit<React.ComponentProps<typeof Sticker>, "f">) => <Sticker f={f} {...p} />;
  // the phone is the anchor; it only peels at the very end
  const shake = f < BRIZ_IN ? Math.sin(onTwos(f) * 1.7) * Math.min(1, f / 80) * 8 : 0;

  return (
    <AbsoluteFill style={{ background: CREAM, overflow: "hidden" }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {GRAIN.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#8A5A2B" opacity={g.o} />)}
      </svg>

      {S({ x: 540 + shake, y: 1000, at: 4, out: ALL_OUT + 8, dir: [0.2, 1], rot: -3, seed: 1, children: (
        <Card w={430} h={800} bg={INK} r={70}>
          <div style={{ position: "absolute", inset: 18, borderRadius: 54, background: "#2A2F38" }} />
        </Card>
      ) })}
      {S({ x: 540, y: 1000, at: BRIZ_IN, out: ALL_OUT + 4, dir: [-0.3, 1], rot: 4, seed: 9, children: (
        <Card w={330} h={330} bg={RED} r={80}><Img src={staticFile("briz-logo-cream.png")} style={{ width: 250 }} /></Card>
      ) })}

      {/* stress */}
      {S({ x: 250, y: 640, at: 20, out: STRESS_OUT, dir: [-1, -0.4], rot: -12, seed: 2, children: <Scribble /> })}
      {S({ x: 840, y: 700, at: 34, out: STRESS_OUT + 4, dir: [1, -0.5], rot: 14, seed: 3, children: <Alarm /> })}
      {S({ x: 230, y: 1380, at: 48, out: STRESS_OUT + 8, dir: [-1, 0.3], rot: 9, seed: 4, children: <Bill /> })}
      {S({ x: 860, y: 1330, at: 62, out: STRESS_OUT + 2, dir: [1, 0.4], rot: -10, seed: 5, children: <Bang /> })}
      {S({ x: 780, y: 1580, at: 74, out: STRESS_OUT + 6, dir: [0.6, 1], rot: 18, seed: 6, children: <Scribble /> })}

      {/* calm */}
      {S({ x: 830, y: 640, at: STRESS_OUT + 14, out: ALL_OUT, dir: [1, -0.6], rot: 10, seed: 7, children: <Check /> })}
      {S({ x: 290, y: 1440, at: STRESS_OUT + 22, out: ALL_OUT + 2, dir: [-1, 0.5], rot: -8, seed: 8, children: <Chip text="Sent ✓" /> })}
      {S({ x: 860, y: 1400, at: STRESS_OUT + 30, out: ALL_OUT + 6, dir: [1, 0.6], rot: 12, seed: 10, children: <Coin /> })}
      {S({ x: 240, y: 700, at: STRESS_OUT + 38, out: ALL_OUT + 2, dir: [-1, -0.5], rot: -14, seed: 11, children: <Smile /> })}

      {/* words */}
      {S({ x: 540, y: 330, at: WORD, out: ALL_OUT - 4, dir: [0, -1], rot: -4, seed: 12, children: (
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 150, color: INK, letterSpacing: -4, whiteSpace: "nowrap" }}>Less <span style={{ color: RED }}>stress.</span></div>
      ) })}
      {S({ x: 540, y: 1740, at: WORD + 24, out: ALL_OUT + 10, dir: [0, 1], rot: 2, seed: 13, children: (
        <Card w={620} h={120} bg={RED} r={60}><span style={{ fontSize: 54, fontWeight: 700, color: CREAM }}>Pay like a breeze.</span></Card>
      ) })}
    </AbsoluteFill>
  );
};
