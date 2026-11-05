import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { clamp, eSmooth, lerp, mulberry32 } from "../lib/primitives";
import { BRIZ } from "../lib/brands";

// Crowd loop v3 (flat colours only, no shading on the hero).
// A silhouette stands in a moving crowd, tapping his phone while "Sent / Received" alerts pop up.
// He jiggles in anticipation, then pushes the phone's screen at us and points at it. The world flips from
// dusk indigo to hot orange-red, a two-ring lightning emblem spins behind him, the crowd stops and turns
// round to look, and the slogan sits at the top. Then it all settles back to frame 0.
const W = 1080, H = 1920;
const HAND = "#3B4252", SEAM = "#1E2530", INK = BRIZ.ink, RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font;
export const SLOGAN_A = "So much power";
export const SLOGAN_B = "in the chat of your WhatsApp.";
export const BRIZ_POWER_CROWD_FRAMES = 420; // 14 s

// Beats (frames)
const ANT = 150, PUSH = 200, HOLD = 214, TEXT_OUT = 350, BACK = 352, END = 420;

type Pt = { x: number; y: number };
const P = (x: number, y: number): Pt => ({ x, y });
const backOut = { ...clamp, easing: Easing.out(Easing.back(2)) } as const;

// Two palettes: calm (dusk) and hot (the reveal). Everything is mixed between them by `hot`.
const CALM = { top: "#20224A", mid: "#2E2C62", bot: "#433879", lit: "#5E5A9A", shade: "#47437F", dots: "#0E0F2A" };
const HOT = { top: "#FFC34D", mid: "#FF7F22", bot: "#B8141A", lit: "#E2703A", shade: "#C2502A", dots: "#7A0A0A" };

// Hero geometry: head top ~ y 640, so he fills ~2/3 of the frame's height.
const HERO_X = 540, HEAD_Y = 790, HEAD_R = 128, BODY_TOP = 925, BODY_HW = 290;
// Body: rounded shoulders on top, straight sides down off the frame.
const bodyPath = (cx: number, top: number, hw: number, shoulder = 0.78) =>
  `M${cx - hw} ${H + 40} L${cx - hw} ${top + hw * shoulder} A${hw} ${hw * shoulder} 0 0 1 ${cx + hw} ${top + hw * shoulder} L${cx + hw} ${H + 40} Z`;

// ---------- crowd ----------
// Two rows walking opposite ways. Front row is 70% of the hero (30% smaller), back row smaller still.
type Walker = { row: number; slot: number; dir: 1 | -1; s: number; headY: number; phase: number };
const ROWS = [
  { n: 6, dir: 1 as const, s: 0.56, headY: 735 },
  { n: 5, dir: -1 as const, s: 0.7, headY: 800 },
];
const WALKERS: Walker[] = ROWS.flatMap((r, row) =>
  Array.from({ length: r.n }, (_, slot) => ({ row, slot, dir: r.dir, s: r.s * (0.94 + 0.12 * (((slot * 37) % 7) / 7)), headY: r.headY + ((slot * 29) % 3) * 8, phase: slot * 1.7 + row })));
const SPAN = W + 520; // wrap distance

// How far the crowd has walked by frame f, normalised so one loop = exactly one SPAN (seamless loop).
const moving = (f: number) => 1 - interpolate(f, [PUSH - 6, PUSH + 6, BACK + 14, BACK + 36], [0, 1, 1, 0], eSmooth);
const DIST = (() => {
  const a = [0];
  for (let i = 1; i <= END; i++) a.push(a[i - 1] + moving(i - 1));
  return a.map((v) => (v / a[END]) * SPAN);
})();

const Person: React.FC<{ w: Walker; f: number; hot: number }> = ({ w, f, hot }) => {
  const id = `p${w.row}_${w.slot}`;
  const spacing = SPAN / ROWS[w.row].n;
  const x = ((((w.slot * spacing + w.dir * DIST[Math.min(f, END)]) % SPAN) + SPAN) % SPAN) - 260;
  // turn: 0 = side-on walking, 1 = facing us. Staggered so they don't move as one.
  const lag = ((w.slot * 5 + w.row * 3) % 9) * 2.2;
  const turn = interpolate(f, [PUSH + 4 + lag, PUSH + 18 + lag, BACK + lag * 0.6, BACK + 16 + lag * 0.6], [0, 1, 1, 0], eSmooth);
  const walk = moving(f);
  const bob = -Math.abs(Math.sin(f / 6 + w.phase)) * 9 * w.s * walk + Math.sin(f / 20 + w.phase) * 2;
  const lit = interpolateColors(hot, [0, 1], [CALM.lit, HOT.lit]);
  const shade = interpolateColors(hot, [0, 1], [CALM.shade, HOT.shade]);
  // Chalce's ProtoJam design: round head (127x135), small gap, pill body 1.39x head width with a fully
  // round top, hard light/shade split at 57% from the left. Side-on: tiny low nose. Facing us: small chin.
  const hW = HEAD_R * 2 * w.s, hH = hW * (135 / 127), bw = hW * 1.39;
  const hy = w.headY + bob, top = hy + hH * 0.6;
  const facing = w.dir * (1 - turn);
  const pill = `M${-bw / 2} ${H + 40} V${top + bw / 2} A${bw / 2} ${bw / 2} 0 0 1 ${bw / 2} ${top + bw / 2} V${H + 40} Z`;
  const splitX = -bw / 2 + bw * 0.57;
  const nx = facing * hW / 2, nTip = facing * (hW / 2 + hW * 0.16);
  return (
    <g transform={`translate(${x} 0)`}>
      <clipPath id={id}><rect x={-600} y={0} width={600 + splitX} height={H} /></clipPath>
      <path d={pill} fill={shade} />
      <ellipse cx={0} cy={hy} rx={hW / 2} ry={hH / 2} fill={shade} />
      <g clipPath={`url(#${id})`}>
        <path d={pill} fill={lit} />
        <ellipse cx={0} cy={hy} rx={hW / 2} ry={hH / 2} fill={lit} />
      </g>
      <polygon points={`${nx * 0.96},${hy - hH * 0.05} ${nTip},${hy + hH * 0.06} ${nx * 0.96},${hy + hH * 0.06}`} fill={facing < 0 ? lit : shade} opacity={Math.abs(facing)} />
      <g opacity={turn}>
        <ellipse cx={0} cy={hy + hH * 0.17} rx={hW * 0.15} ry={hH * 0.15} fill={shade} />
        <ellipse cx={hW * 0.1} cy={hy + hH * 0.17} rx={hW * 0.05} ry={hH * 0.12} fill={lit} />
      </g>
    </g>
  );
};

// ---------- Chalce's ProtoJam burst: a ball half below the frame, jagged rays fanning out of it ----------
// Ray drawn base-down from his vector (206 x 500); pivot = its base. Pale rays behind, red->orange in front.
const RAY = [[91,500],[116,417],[71,360],[131,280],[0,20],[116,0],[206,280],[131,360],[151,420],[131,480]].map(([x, y]) => `${(x - 111) * 0.9},${(y - 500) * 3.2}`).join(" ");
const Burst: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="rayHot" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FF9924" /><stop offset="1" stopColor="#FF1F1F" /></linearGradient>
    </defs>
    {Array.from({ length: 12 }, (_, i) => <polygon key={`b${i}`} points={RAY} fill="#FFAE6B" transform={`rotate(${i * 30 + 13}) translate(0 -150)`} />)}
    {Array.from({ length: 12 }, (_, i) => <polygon key={`f${i}`} points={RAY} fill="url(#rayHot)" transform={`rotate(${i * 30}) translate(0 -150)`} />)}
    <circle r={300} fill="#FF9924" />
  </g>
);

// ---------- background texture: faint, blurred four-point stars, light on dark sky, dark on light sky ----------
const STARS = (() => {
  const r = mulberry32(11);
  return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H * 0.75, s: 8 + r() * 18, a: r() * 90 }));
})();
const star = (s: number) => `M0 ${-s} Q${s * 0.18} ${-s * 0.18} ${s} 0 Q${s * 0.18} ${s * 0.18} 0 ${s} Q${-s * 0.18} ${s * 0.18} ${-s} 0 Q${-s * 0.18} ${-s * 0.18} 0 ${-s} Z`;
const Stars: React.FC<{ hot: number }> = ({ hot }) => (
  <g filter="url(#soft)">
    {STARS.map((t, i) => {
      // hot sky is light at the top and dark red low down, so the star colour flips with height
      const light = hot < 0.5 || t.y > H * 0.55;
      return <path key={i} d={star(t.s)} transform={`translate(${t.x} ${t.y}) rotate(${t.a})`} fill={light ? "#FFFFFF" : "#5A1205"} opacity={light ? 0.16 : 0.14} />;
    })}
  </g>
);

// ---------- the two-ring lightning emblem (unused since v7) (spins round its own vertical axis) ----------
const BOLT = "M-60 -330 L60 -120 L-30 -90 L90 120 L0 140 L70 330 L-120 60 L-20 40 L-140 -170 L-40 -190 Z";
const Ring: React.FC<{ spin: number; r: number; op: number; col: string; bolt: string }> = ({ spin, r, op, col, bolt }) => (
  <g transform={`scale(${Math.cos(spin)} 1)`} opacity={op}>
    <circle r={r} fill="none" stroke={col} strokeWidth={r * 0.1} />
    <circle r={r * 0.84} fill="none" stroke={col} strokeWidth={r * 0.025} />
    <path d={BOLT} transform={`scale(${r / 420})`} fill={bolt} stroke={col} strokeWidth={14} strokeLinejoin="round" />
  </g>
);

// ---------- alerts ----------
const ALERTS = [
  { at: 16, kind: "Sent", amt: "₦5,000" },
  { at: 46, kind: "Received", amt: "₦10,000" },
  { at: 76, kind: "Sent", amt: "₦20,000" },
  { at: 104, kind: "Received", amt: "₦15,000" },
  { at: 128, kind: "Sent", amt: "₦50,000" },
];
const Alerts: React.FC<{ f: number }> = ({ f }) => {
  const gone = interpolate(f, [ANT + 4, ANT + 18], [1, 0], clamp);
  if (gone <= 0) return null;
  const shown = ALERTS.filter((a) => f >= a.at);
  return (
    <div style={{ position: "absolute", top: 150, left: 0, width: W, opacity: gone }}>
      {shown.slice(-3).reverse().map((a, i) => {
        const p = interpolate(f, [a.at, a.at + 12], [0, 1], backOut);
        const sent = a.kind === "Sent";
        return (
          <div key={a.at} style={{ position: "absolute", left: W / 2 - 330, width: 660, height: 118, top: i * 138, opacity: (1 - i * 0.28) * Math.min(1, p * 2),
            transform: `translateY(${(1 - p) * -40}px) scale(${lerp(0.8, 1, p) * (1 - i * 0.05)})`, background: "#FFFFFF", borderRadius: 34,
            display: "flex", alignItems: "center", padding: "0 34px", boxSizing: "border-box", fontFamily: F, color: INK, gap: 24 }}>
            <div style={{ width: 62, height: 62, borderRadius: 31, background: sent ? RED : "#16A34A", color: "#fff", fontSize: 40, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center" }}>{sent ? "↑" : "↓"}</div>
            <div style={{ fontSize: 40, fontWeight: 600, flex: 1 }}>{a.kind}</div>
            <div style={{ fontSize: 44, fontWeight: 800 }}>{a.amt}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- hands + phone ----------
// Hands are a rounded rhombus palm + pointer + a slightly bigger thumb, all drawn into one "goo" group
// (blur + alpha threshold) so they melt into each other and into the phone edge they are near.
type HandSpec = { at: Pt; rot: number; s: number; point: number; flip?: boolean };
const HAND_PTS: [number, number][] = [[94,340],[56,260],[0,176],[0,151],[22,160],[56,189],[94,240],[105,189],[114,120],[122,29],[137,0],[155,29],[155,176],[225,189],[258,260],[213,360],[155,380],[105,360]];
const HandBlobs: React.FC<{ h: HandSpec }> = ({ h }) => {
  const fold = lerp(0.3, 1, h.point); // gripping hands tuck the pointer in
  const pts = HAND_PTS.map(([x, y]) => `${(x - 160) * 0.62},${(y < 189 && x > 100 && x < 160 ? 189 - (189 - y) * fold : y) * 0.62 - 290 * 0.62}`).join(" ");
  return (
    <g transform={`translate(${h.at.x} ${h.at.y}) rotate(${h.rot}) scale(${h.flip ? -h.s : h.s} ${h.s})`}>
      <polygon points={pts} strokeLinejoin="round" stroke={HAND} strokeWidth={14} />
    </g>
  );
};

const PHW = 200, PHH = 380; // phone size at scale 1
const PhoneFace: React.FC<{ f: number; front: boolean }> = ({ f, front }) => {
  const w = PHW, h = PHH;
  if (!front) return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={RED} />
      <rect x={-w / 2 + 18} y={-h / 2 + 18} width={46} height={46} rx={14} fill="#B92408" />
      <image href={staticFile(BRIZ.logoOnFlood)} x={-70} y={40} width={140} height={68} />
    </g>
  );
  // A chat you can read as a chat, but nothing to stop and read.
  const bub = (x: number, y: number, bw: number, bh: number, me: boolean, k: number) => (
    <g key={k}>
      <rect x={x} y={y} width={bw} height={bh} rx={10} fill={me ? "#D3F5C6" : "#FFFFFF"} />
      <rect x={x + 10} y={y + 10} width={bw * 0.7} height={7} rx={3.5} fill="#9AA3AE" />
      {bh > 30 && <rect x={x + 10} y={y + 23} width={bw * 0.45} height={7} rx={3.5} fill="#B8C0C8" />}
    </g>
  );
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={INK} />
      <rect x={-w / 2 + 10} y={-h / 2 + 10} width={w - 20} height={h - 20} rx={26} fill="#EDE5DA" />
      <path d={`M${-w / 2 + 10} ${-h / 2 + 64} V${-h / 2 + 36} Q${-w / 2 + 10} ${-h / 2 + 10} ${-w / 2 + 36} ${-h / 2 + 10} H${w / 2 - 36} Q${w / 2 - 10} ${-h / 2 + 10} ${w / 2 - 10} ${-h / 2 + 36} V${-h / 2 + 64} Z`} fill="#1F6E5E" />
      <circle cx={-w / 2 + 34} cy={-h / 2 + 38} r={13} fill={CREAM} />
      <rect x={-w / 2 + 54} y={-h / 2 + 32} width={70} height={10} rx={5} fill={CREAM} />
      {bub(-80, -110, 110, 40, false, 1)}
      {bub(-10, -60, 90, 28, true, 2)}
      {bub(-80, -24, 130, 40, false, 3)}
      {bub(-30, 28, 110, 40, true, 4)}
      {bub(-80, 80, 80, 28, false, 5)}
      <rect x={-80} y={h / 2 - 66} width={128} height={34} rx={17} fill="#FFFFFF" />
      <circle cx={70} cy={h / 2 - 49} r={17} fill="#1F6E5E" opacity={0.75 + 0.25 * Math.sin(f / 4)} />
    </g>
  );
};

export const BrizPowerCrowd: React.FC = () => {
  const f = useCurrentFrame();
  const k = (fr: number[], v: number[], e: object = eSmooth) => interpolate(f, fr, v, e);

  const ant = k([ANT, ANT + 20, PUSH - 2, PUSH + 2], [0, 1, 1, 0]); // the wind-up
  const push = k([PUSH, PUSH + 14], [0, 1], backOut) * (1 - k([BACK, BACK + 30], [0, 1]));
  const hot = k([PUSH, PUSH + 6, BACK + 10, BACK + 40], [0, 1, 1, 0]);
  const tapping = f < ANT || f > BACK + 30;
  const tap = tapping ? Math.max(0, Math.sin(f / 2.4)) : 0;
  const jig = ant * (Math.sin(f * 2.1) * 9 + Math.sin(f * 3.3) * 4) * k([ANT, PUSH], [0.4, 1], clamp);

  // Hero: sinks a little in the wind-up, pops up on the push.
  const pop = Math.sin(k([PUSH, PUSH + 16], [0, Math.PI], clamp)) * 40;
  const sink = ant * 26;
  const breathe = Math.sin(f / 22) * 4;
  const heroY = sink - pop + breathe;
  const headTilt = lerp(lerp(8, 4, ant), -4, push) + jig * 0.25;
  const squash = 1 - 0.04 * ant + 0.03 * Math.sin(k([PUSH, PUSH + 16], [0, Math.PI], clamp));

  // Phone: held at the chest (back to us), pulled in on the wind-up, pushed at camera with its screen showing.
  const phone = P(lerp(lerp(560, 545, ant), 590, push) + jig, lerp(lerp(1330, 1360, ant), 1210, push) + tap * 6 + heroY * 0.6);
  const phoneS = lerp(lerp(0.82, 0.74, ant), 1.5, push) + 0.02 * Math.sin((f - HOLD) / 9) * push;
  const turn = k([PUSH - 2, PUSH + 10], [0, 1]) * (1 - k([BACK, BACK + 16], [0, 1]));
  const flip = Math.max(0.04, Math.abs(Math.cos(turn * Math.PI)));
  const front = turn > 0.5;
  const pw = (PHW / 2) * phoneS * flip, ph = (PHH / 2) * phoneS;

  // Right hand grips the phone's lower right edge throughout.
  const handR: HandSpec = { at: P(phone.x + pw - 6, phone.y + ph * 0.42), rot: lerp(-20, -10, push), s: lerp(0.9, 1.2, push), point: 0, flip: true }; // mirrored so it reads as a right hand
  // Left hand: on the lower left edge while tapping (the pointer bobs = the tap), then flies out and points at the screen.
  const free = k([PUSH - 4, PUSH + 12], [0, 1], backOut) * (1 - k([BACK + 4, BACK + 26], [0, 1]));
  const gripL = P(phone.x - pw - 14, phone.y + ph * 0.3 - tap * 10);
  const pointAt = P(150 + Math.sin((f - HOLD) / 8) * 6 * push, 1150 + Math.sin((f - HOLD) / 11) * 5);
  const handLAt = P(lerp(gripL.x, pointAt.x, free), lerp(gripL.y, pointAt.y, free));
  const aim = (Math.atan2(phone.y - handLAt.y, phone.x - pw * 0.7 - handLAt.x) * 180) / Math.PI + 90;
  const handL: HandSpec = { at: handLAt, rot: lerp(20 - tap * 8, aim, free), s: lerp(0.9, 1.25, free), point: free, flip: front && free < 0.5 }; // in front of the phone while it shows its back; flipped and behind once it turns

  const zoom = k([0, ANT, PUSH, PUSH + 8, HOLD + 30, BACK, END], [1, 1.02, 1.07, 1.13, 1.09, 1.08, 1]);
  const emblem = k([PUSH, PUSH + 18], [0, 1], backOut) * (1 - k([BACK - 4, BACK + 20], [0, 1]));
  const spin = (f - PUSH) * 0.075;
  const text = k([HOLD, HOLD + 14, TEXT_OUT - 10, TEXT_OUT + 6], [0, 1, 1, 0]);
  const col = (a: string, b: string) => interpolateColors(hot, [0, 1], [a, b]);

  return (
    <AbsoluteFill style={{ background: col(CALM.mid, HOT.mid) }}>
      <Audio src={staticFile("audio/power-crowd.wav")} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "540px 1150px" }}>
        <svg width={W} height={H} style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={col(CALM.top, HOT.top)} /><stop offset="0.5" stopColor={col(CALM.mid, HOT.mid)} /><stop offset="1" stopColor={col(CALM.bot, HOT.bot)} />
            </linearGradient>
            <pattern id="dots" width={22} height={22} patternUnits="userSpaceOnUse"><circle cx={11} cy={11} r={4} fill={col(CALM.dots, HOT.dots)} /></pattern>
            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.3" stopColor="#fff" stopOpacity={0} /><stop offset="1" stopColor="#fff" stopOpacity={1} /></linearGradient>
            <mask id="dotMask"><rect width={W} height={H} fill="url(#fade)" /></mask>
            <filter id="soft"><feGaussianBlur stdDeviation={3} /></filter>
            <filter id="goo" filterUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
              <feGaussianBlur stdDeviation={13} />
              <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -13" />
            </filter>
          </defs>
          {/* Spider-Verse-ish background: one gradient + halftone dots growing toward the bottom */}
          <rect width={W} height={H} fill="url(#sky)" />
          <rect width={W} height={H} fill="url(#dots)" mask="url(#dotMask)" opacity={0.22} />
          <Stars hot={hot} />


          {WALKERS.filter((w) => w.row === 0).map((w) => <Person key={`${w.row}${w.slot}`} w={w} f={f} hot={hot} />)}
          {WALKERS.filter((w) => w.row === 1).map((w) => <Person key={`${w.row}${w.slot}`} w={w} f={f} hot={hot} />)}

          {emblem > 0 && (
            <g transform={`translate(${HERO_X} ${H}) scale(${emblem * (1 + 0.03 * Math.sin(f / 7))}) rotate(${spin * 6})`}>
              <Burst />
            </g>
          )}
          {/* hero: flat ink, no gradients */}
          <g transform={`translate(${jig * 0.4} ${heroY}) translate(${HERO_X} ${H}) scale(1 ${squash}) translate(${-HERO_X} ${-H})`}>
            <path d={bodyPath(HERO_X, BODY_TOP, BODY_HW)} fill={INK} />
            {/* hoodie details, flat: hood rim, sleeve seams, drawstrings, front pocket */}
            <ellipse cx={HERO_X} cy={BODY_TOP + 30} rx={175} ry={72} fill={SEAM} />
            <ellipse cx={HERO_X} cy={BODY_TOP + 22} rx={128} ry={44} fill={INK} />
            <path d={`M${HERO_X - 205} ${BODY_TOP + 120} Q${HERO_X - 228} ${BODY_TOP + 330} ${HERO_X - 222} ${BODY_TOP + 620}`} stroke={SEAM} strokeWidth={10} fill="none" strokeLinecap="round" />
            <path d={`M${HERO_X + 205} ${BODY_TOP + 120} Q${HERO_X + 228} ${BODY_TOP + 330} ${HERO_X + 222} ${BODY_TOP + 620}`} stroke={SEAM} strokeWidth={10} fill="none" strokeLinecap="round" />
            {[-42, 42].map((dx) => (
              <g key={dx}>
                <path d={`M${HERO_X + dx} ${BODY_TOP + 60} Q${HERO_X + dx * 1.15} ${BODY_TOP + 130} ${HERO_X + dx * 0.9} ${BODY_TOP + 205}`} stroke={HAND} strokeWidth={9} fill="none" strokeLinecap="round" />
                <circle cx={HERO_X + dx * 0.9} cy={BODY_TOP + 212} r={10} fill={HAND} />
              </g>
            ))}
            <path d={`M${HERO_X - 190} ${BODY_TOP + 640} H${HERO_X + 190} L${HERO_X + 240} ${BODY_TOP + 880} H${HERO_X - 240} Z`} fill={SEAM} />
            <path d={`M${HERO_X - 176} ${BODY_TOP + 656} H${HERO_X + 176} L${HERO_X + 222} ${BODY_TOP + 880} H${HERO_X - 222} Z`} fill={INK} />
          </g>
          <g transform={`translate(${HERO_X + jig * 0.8} ${HEAD_Y + heroY * 1.3}) rotate(${headTilt})`}>
            <ellipse cx={0} cy={0} rx={HEAD_R * 0.95} ry={HEAD_R} fill={INK} />
          </g>

          {/* hands + a hidden phone silhouette, gooed together so the hands melt into the phone edge */}
          <g filter="url(#goo)" fill={HAND}>
            <rect x={phone.x - pw + 10} y={phone.y - ph + 10} width={Math.max(0, pw * 2 - 20)} height={ph * 2 - 20} rx={24} />
            <HandBlobs h={handR} />
            {front && free < 0.5 && <HandBlobs h={handL} />}
          </g>
          <g transform={`translate(${phone.x} ${phone.y}) scale(${phoneS * flip} ${phoneS})`}>
            <PhoneFace f={f} front={front} />
          </g>
          {/* in front of the phone while it shows its back, and once it lets go, the pointing hand is gooed on its own so it never melts into the phone */}
          {(free >= 0.5 || !front) && <g filter="url(#goo)" fill={HAND}><HandBlobs h={handL} /></g>}
        </svg>
      </AbsoluteFill>

      <Alerts f={f} />

      {/* slogan: no box, no border, centred at the top */}
      <div style={{ position: "absolute", top: 150, left: 0, width: W, textAlign: "center", fontFamily: F, color: INK, opacity: text,
        transform: `translateY(${interpolate(text, [0, 1], [30, 0])}px) scale(${interpolate(text, [0, 1], [0.94, 1])})` }}>
        <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{SLOGAN_A.split("power")[0]}<span style={{ color: "#FFFFFF" }}>power</span></div>
        <div style={{ fontSize: 54, fontWeight: 700, marginTop: 16 }}>{SLOGAN_B}</div>
      </div>
    </AbsoluteFill>
  );
};
