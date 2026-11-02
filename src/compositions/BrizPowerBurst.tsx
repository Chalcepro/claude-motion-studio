import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, eSmooth, lerp, mulberry32 } from "../lib/primitives";
import { BRIZ } from "../lib/brands";

// Flat loop v2. A Rayman-style silhouette (head, torso and hands only: no neck, arms or shoulders)
// taps his phone, startles, bursts with joy while a comic-book ray burst opens behind him at the bottom
// of the screen (yellow at its heart, red at its tips, turning slowly), then winds up and pushes the
// phone at us while pointing at it. The slogan holds for ~5 s, then everything settles back to the start.
const W = 1080, H = 1920;
const INK = BRIZ.ink, RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font;
const YELLOW = "#FFD21F", ORANGE = "#FF8A00", TEAL = "#14B8A6", BLUE = "#2563EB", BODY_HI = "#262C36";
export const BRIZ_POWER_BURST_FRAMES = 450;     // 15 s

// Beats
const WHOA = 96, POP = 116, WIND = 208, PUSH = 236, HOLD = 252, TEXT_OUT = 410, BACK = 412, END = 450;

type Pt = { x: number; y: number };
const P = (x: number, y: number): Pt => ({ x, y });
const backOut = { ...clamp, easing: Easing.out(Easing.back(2.2)) } as const;
const SRC = P(540, 1960);                       // the burst's heart, just below the frame

// Comic ray burst: long quads that get wider the further they go, a yellow-to-red ramp by distance.
const Burst: React.FC<{ f: number; grow: number }> = ({ f, grow }) => {
  if (grow <= 0) return null;
  const ray = (a: number, len: number, w0: number, w1: number) => {
    const c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c, r0 = 70;
    const p = (r: number, w: number) => `${SRC.x + c * r + nx * w},${SRC.y + s * r + ny * w}`;
    return `${p(r0, w0)} ${p(len, w1)} ${p(len, -w1)} ${p(r0, -w0)}`;
  };
  const len = 2600 * grow, spin = f * 0.0022;
  return (
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="hot" cx={SRC.x} cy={SRC.y} r={2300} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={YELLOW} /><stop offset="0.35" stopColor={ORANGE} /><stop offset="0.8" stopColor={RED} />
        </radialGradient>
        <radialGradient id="warm" cx={SRC.x} cy={SRC.y} r={2000} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF1A8" /><stop offset="0.6" stopColor={YELLOW} /><stop offset="1" stopColor={ORANGE} />
        </radialGradient>
      </defs>
      {/* back set: wide, slow, one way */}
      {Array.from({ length: 12 }, (_, i) => (
        <polygon key={i} points={ray(Math.PI + (i / 12) * Math.PI * 2 + spin, len, 18, 250)} fill="url(#hot)" />
      ))}
      {/* front set: thinner, paler, the other way, between the big ones */}
      {Array.from({ length: 12 }, (_, i) => (
        <polygon key={i} points={ray(Math.PI + ((i + 0.5) / 12) * Math.PI * 2 - spin * 0.6, len * 0.8, 10, 120)} fill="url(#warm)" opacity={0.9} />
      ))}
      <circle cx={SRC.x} cy={SRC.y} r={420 * grow} fill={YELLOW} />
      <circle cx={SRC.x} cy={SRC.y} r={260 * grow} fill="#FFF6C9" />
    </svg>
  );
};

// Flat confetti flung out of the burst on the pop.
const CONF = (() => {
  const r = mulberry32(7), cols = [TEAL, BLUE, YELLOW, RED, INK];
  return Array.from({ length: 26 }, (_, i) => ({ a: -Math.PI * (0.12 + 0.76 * r()), v: 34 + 30 * r(), spin: (r() - 0.5) * 30, c: cols[i % cols.length], s: 18 + 22 * r() }));
})();
const Confetti: React.FC<{ f: number }> = ({ f }) => {
  const t = f - POP;
  if (t < 0 || t > 110) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {CONF.map((c, i) => {
        const drag = (1 - Math.exp(-t / 14)) * 14;
        const x = SRC.x + Math.cos(c.a) * c.v * drag, y = SRC.y - 200 + Math.sin(c.a) * c.v * drag + 0.06 * t * t;
        return <rect key={i} x={-c.s / 2} y={-c.s / 4} width={c.s} height={c.s / 2} fill={c.c}
          opacity={interpolate(t, [70, 110], [1, 0], clamp)} transform={`translate(${x} ${y}) rotate(${c.spin * t})`} />;
      })}
    </svg>
  );
};

// A floating mitten hand. Local "up" (-y) is where the fingers point.
type Pose = "open" | "fist" | "point";
const Hand: React.FC<{ at: Pt; rot: number; pose: Pose; s?: number }> = ({ at, rot, pose, s = 1 }) => {
  const finger = (x1: number, y1: number, x2: number, y2: number, k: string) =>
    <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={30} strokeLinecap="round" />;
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${rot}) scale(${s})`}>
      <rect x={-58} y={-50} width={116} height={104} rx={46} fill={INK} />
      {pose === "open" && [-39, -13, 13, 39].map((x, i) => finger(x * 0.9, -40, x * 1.6, -118 + Math.abs(x) * 0.6, `f${i}`))}
      {pose === "open" && finger(-52, 18, -108, -26, "t")}
      {pose === "fist" && [-36, -12, 12, 36].map((x, i) => <circle key={i} cx={x} cy={-50} r={17} fill={INK} />)}
      {pose === "fist" && finger(-48, 0, 6, -12, "t")}
      {pose === "point" && [-12, 12, 36].map((x, i) => <circle key={i} cx={x} cy={-50} r={17} fill={INK} />)}
      {pose === "point" && finger(-34, -44, -34, -150, "i")}
      {pose === "point" && finger(-50, 6, 0, -8, "t")}
      <path d="M-40 -34 Q-46 10 -24 34" stroke={BODY_HI} strokeWidth={9} strokeLinecap="round" fill="none" />
    </g>
  );
};

// The phone. turn 0 = its red back to us (fingers wrap over the edges), 1 = its screen to us.
const Phone: React.FC<{ f: number; c: Pt; turn: number; scale: number; gripL: boolean }> = ({ f, c, turn, scale, gripL }) => {
  const sx = Math.max(0.03, Math.abs(Math.cos(turn * Math.PI))) * scale, front = turn > 0.5;
  const w = 210, h = 380;
  const bar = (x1: number, y: number, x2: number, k: string) =>
    <line key={k} x1={x1} y1={y} x2={x2} y2={y} stroke={INK} strokeWidth={28} strokeLinecap="round" />;
  return (
    <g transform={`translate(${c.x} ${c.y}) scale(${sx} ${scale})`}>
      {/* palms behind the phone */}
      {!front && gripL && <rect x={-w / 2 - 50} y={-10} width={100} height={130} rx={44} fill={INK} />}
      {!front && <rect x={w / 2 - 50} y={-10} width={100} height={130} rx={44} fill={INK} />}
      {front && <rect x={w / 2 - 70} y={h / 2 - 120} width={110} height={130} rx={44} fill={INK} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={front ? INK : RED} />
      {!front && <rect x={-w / 2 + 16} y={-h / 2 + 16} width={52} height={90} rx={18} fill="#B82306" />}
      {!front && <image href={staticFile(BRIZ.mark)} x={-46} y={-30} width={92} height={92} opacity={0.95} />}
      {front && (
        <g>
          <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={24} fill={CREAM} />
          <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={52} rx={24} fill={RED} />
          <rect x={-w / 2 + 12} y={-h / 2 + 40} width={w - 24} height={24} fill={RED} />
          <rect x={-84} y={-104} width={120} height={40} rx={16} fill="#fff" />
          <rect x={-36} y={-50} width={120} height={40} rx={16} fill={TEAL} />
          <rect x={-84} y={6} width={168} height={84} rx={18} fill={INK} />
          <text x={0} y={60} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={34} fill={CREAM}>$100 ✓</text>
          <rect x={-84} y={110} width={168} height={40} rx={20} fill="#fff" opacity={0.75 + 0.25 * Math.sin(f / 4)} />
        </g>
      )}
      {/* fingers over the front of what we see */}
      {!front && gripL && [10, 46, 82].map((y, i) => bar(-w / 2 - 14, y, -w / 2 + 34, `l${i}`))}
      {!front && [10, 46, 82].map((y, i) => bar(w / 2 + 14, y, w / 2 - 34, `r${i}`))}
      {front && <line x1={w / 2 + 6} y1={h / 2 - 60} x2={w / 2 - 46} y2={h / 2 - 104} stroke={INK} strokeWidth={30} strokeLinecap="round" />}
    </g>
  );
};

export const BrizPowerBurst: React.FC = () => {
  const f = useCurrentFrame();
  const k = (fr: number[], v: number[], e: object = eSmooth) => interpolate(f, fr, v, e);

  // Phases, each 0 -> 1. The pose is a chain: tapping -> celebrating -> wound up -> pushed out -> tapping.
  const whoa = k([WHOA, WHOA + 6, POP], [0, 1, 0]);
  const pop = k([POP, POP + 14], [0, 1], backOut);
  const wind = k([WIND, WIND + 24], [0, 1]);
  const push = k([PUSH, PUSH + 16], [0, 1], backOut);
  const back = k([BACK, END - 6], [0, 1]);
  const chain = (a: number, b: number, c: number, d: number) => lerp(lerp(lerp(lerp(a, b, pop), c, wind), d, push), a, back);
  const chainP = (a: Pt, b: Pt, c: Pt, d: Pt) => P(chain(a.x, b.x, c.x, d.x), chain(a.y, b.y, c.y, d.y));

  const tapping = f < WHOA || f > END - 10;
  const tap = tapping ? Math.max(0, Math.sin(f / 2.4)) * 7 : 0;
  const shake = whoa * Math.sin(f * 2.2) * 10;

  const phone = chainP(P(540, 1430), P(660, 1440), P(560, 1500), P(560, 1250));
  phone.x += shake; phone.y += tap;
  const phoneScale = chain(1, 1, 0.82, 1.9) + 0.03 * Math.sin((f - HOLD) / 9) * push * (1 - back);
  const turn = k([WIND + 4, WIND + 22], [0, 1]) * (1 - k([BACK, BACK + 18], [0, 1]));

  // Left hand: on the phone while tapping, flies up to wave, drops to a fist, then points at the phone.
  const free = pop > 0.15 && back < 0.85;
  const handL = chainP(P(phone.x - 120, 1470), P(225, 760), P(300, 1560), P(205, 1360));
  const aim = (Math.atan2(phone.y - handL.y, phone.x - handL.x) * 180) / Math.PI + 90;
  const wave = 18 * Math.sin((f - POP) / 4.5) * (1 - wind);
  const lPose: Pose = push > 0.2 ? "point" : wind > 0.5 ? "fist" : "open";
  const lRot = push > 0.2 ? lerp(-20, aim, push) : lerp(-25 + wave, 10, wind);

  // Head and torso: head dips to the phone, jerks back on the whoa, flies up on the pop.
  const bounce = Math.sin(k([POP, POP + 20], [0, Math.PI], clamp)) * 70 + Math.sin(k([PUSH, PUSH + 14], [0, Math.PI], clamp)) * 25;
  const headY = chain(1110, 1000, 1060, 1040) - 45 * whoa - bounce * 0.6;
  const headTilt = chain(6, -10 + wave * 0.3, 4, -4);
  const squash = 1 - 0.05 * whoa + 0.04 * Math.sin(k([POP, POP + 20], [0, Math.PI], clamp));
  const lean = chain(0, -2, 3, -3);

  const zoom = k([0, WHOA, POP, POP + 24, PUSH, PUSH + 10, HOLD + 40, END], [1, 1.12, 1.14, 0.97, 0.97, 1.08, 1.03, 1]);
  const grow = k([POP, POP + 26], [0, 1], backOut) * (1 - k([BACK - 6, END - 10], [0, 1]));
  const speed = k([PUSH, PUSH + 4, PUSH + 20], [0, 1, 0], clamp);
  const text = k([HOLD, HOLD + 14, TEXT_OUT - 10, TEXT_OUT + 6], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ background: "#FFFFFF" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "540px 1300px" }}>
        <Burst f={f} grow={grow} />
        <Confetti f={f} />
        <svg width={W} height={H} style={{ position: "absolute" }}>
          <defs>
            <radialGradient id="body" cx="0.35" cy="0.25" r="0.9"><stop offset="0" stopColor={BODY_HI} /><stop offset="0.6" stopColor={INK} /></radialGradient>
          </defs>
          <g transform={`translate(540 ${1920 - bounce * 0.4}) rotate(${lean}) scale(1 ${squash})`}>
            <ellipse cx={0} cy={-260} rx={235} ry={330} fill="url(#body)" />
          </g>
          <g transform={`translate(${540 + lean * 6} ${headY}) rotate(${headTilt})`}>
            <ellipse cx={0} cy={0} rx={150} ry={160} fill="url(#body)" />
          </g>
          {speed > 0 && Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + 0.3, r0 = 430, r1 = r0 + 200 * speed;
            return <line key={i} x1={phone.x + Math.cos(a) * r0} y1={phone.y + Math.sin(a) * r0} x2={phone.x + Math.cos(a) * r1} y2={phone.y + Math.sin(a) * r1}
              stroke={INK} strokeWidth={10} strokeLinecap="round" opacity={speed} />;
          })}
          <Phone f={f} c={phone} turn={turn} scale={phoneScale} gripL={!free} />
          {free && <Hand at={handL} rot={lRot} pose={lPose} s={1 + 0.25 * push * (1 - back)} />}
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 150, left: 70, width: W - 140, padding: "44px 30px 50px", boxSizing: "border-box", background: "#FFFFFF",
        borderRadius: 48, border: `8px solid ${INK}`, boxShadow: `14px 14px 0 ${INK}`, textAlign: "center", fontFamily: F, color: INK, opacity: text,
        transform: `translateY(${interpolate(text, [0, 1], [40, 0])}px) scale(${interpolate(text, [0, 1], [0.92, 1])})` }}>
        <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>So much <span style={{ color: RED }}>power</span></div>
        <div style={{ fontSize: 52, fontWeight: 700, marginTop: 18 }}>in the chat of your WhatsApp.</div>
      </div>
      <Img src={staticFile(BRIZ.logoOnBg)} style={{ position: "absolute", top: 130, left: W / 2 - 130, width: 260, opacity: 1 - text }} />
    </AbsoluteFill>
  );
};
