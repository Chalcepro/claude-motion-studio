import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, eApple, eSmooth, lerp } from "../lib/primitives";
import { BRIZ } from "../lib/brands";

// Flat-style loop (look of "The Tale of the Blue Man": bold flat shapes, few colours, a perspective grid).
// Front view: a man taps his phone (we see its back), the camera creeps in, joy hits - the grid rushes
// back, fireworks behind him, one arm up - then he turns the phone to us and points at it. Loops.
const W = 1080, H = 1920;
const INK = BRIZ.ink, RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font;
const SKIN = "#6B3E26", SKIN_HI = "#83502F", SHIRT = INK, AMBER = "#F59E0B";
const VP = { x: 540, y: 1000 };                 // vanishing point, behind his head
export const BRIZ_POWER_FLAT_FRAMES = 240;      // 8 s

// Beats
const JOY = 96, ARM_UP = 104, ARM_DOWN = 150, FLIP = 150, FLIP_BACK = 214, END = 240;

const P = (x: number, y: number) => ({ x, y });
const mix = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => P(lerp(a.x, b.x, t), lerp(a.y, b.y, t));

// Tunnel grid: squares rushing from the vanishing point outwards ("panning back" past the camera).
const Grid: React.FC<{ f: number }> = ({ f }) => {
  const rings = 9, period = 60;                 // 240 / 60: loops cleanly
  const rush = interpolate(f, [JOY - 4, JOY + 10, JOY + 50], [0.35, 1, 0.55], clamp);
  return (
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <line key={i} x1={VP.x} y1={VP.y} x2={VP.x + Math.cos(a) * 2200} y2={VP.y + Math.sin(a) * 2200}
          stroke={RED} strokeOpacity={0.22} strokeWidth={2} />;
      })}
      {Array.from({ length: rings }, (_, k) => {
        const u = ((f / period + k / rings) % 1);
        const s = 30 * Math.pow(70, u);
        return <rect key={k} x={VP.x - s * 0.56} y={VP.y - s} width={s * 1.12} height={s * 2}
          fill="none" stroke={RED} strokeOpacity={(0.12 + 0.3 * rush) * Math.min(1, u * 4)} strokeWidth={2 + u * 4} />;
      })}
    </svg>
  );
};

// Fireworks: rays and rings, flat, staggered, all gone before the loop point.
const BURSTS = [
  { x: 270, y: 640, at: JOY, r: 210, c: RED }, { x: 830, y: 560, at: JOY + 8, r: 250, c: AMBER },
  { x: 180, y: 1080, at: JOY + 18, r: 170, c: INK }, { x: 900, y: 1020, at: JOY + 26, r: 190, c: RED },
  { x: 560, y: 380, at: JOY + 36, r: 230, c: AMBER }, { x: 330, y: 430, at: JOY + 50, r: 150, c: INK },
];
const Fireworks: React.FC<{ f: number }> = ({ f }) => (
  <svg width={W} height={H} style={{ position: "absolute" }}>
    <defs>
      <radialGradient id="glow"><stop offset="0" stopColor={AMBER} stopOpacity="0.55" /><stop offset="1" stopColor={AMBER} stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx={VP.x} cy={VP.y - 60} r={interpolate(f, [JOY, JOY + 30], [0, 900], eApple)}
      fill="url(#glow)" opacity={interpolate(f, [JOY, JOY + 10, ARM_DOWN + 30, FLIP_BACK], [0, 1, 0.7, 0], clamp)} />
    {BURSTS.map((b, i) => {
      const t = interpolate(f, [b.at, b.at + 28], [0, 1], eApple), fade = interpolate(f, [b.at + 18, b.at + 46], [1, 0], clamp);
      if (t <= 0 || fade <= 0) return null;
      return (
        <g key={i} opacity={fade}>
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2 + i, r0 = b.r * t * 0.45, r1 = b.r * t;
            return <line key={k} x1={b.x + Math.cos(a) * r0} y1={b.y + Math.sin(a) * r0} x2={b.x + Math.cos(a) * r1} y2={b.y + Math.sin(a) * r1}
              stroke={b.c} strokeWidth={14 * (1 - t) + 4} strokeLinecap="round" />;
          })}
          <circle cx={b.x} cy={b.y} r={b.r * t * 1.1} fill="none" stroke={b.c} strokeWidth={6 * (1 - t) + 1} />
        </g>
      );
    })}
  </svg>
);

// An arm: shoulder -> elbow -> hand, a sleeve and a flat hand.
const Arm: React.FC<{ s: { x: number; y: number }; e: { x: number; y: number }; h: { x: number; y: number }; fist?: number; point?: number }> = ({ s, e, h, fist = 0, point = 0 }) => {
  const dir = Math.atan2(h.y - e.y, h.x - e.x);
  return (
    <g>
      <path d={`M${s.x} ${s.y} L${e.x} ${e.y} L${h.x} ${h.y}`} stroke={SHIRT} strokeWidth={104} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={h.x} cy={h.y} r={50 + 6 * fist} fill={SKIN} />
      {fist > 0 && <path d={`M${h.x - 34} ${h.y - 18} h68 M${h.x - 34} ${h.y + 2} h68`} stroke={SKIN_HI} strokeWidth={8 * fist} strokeLinecap="round" />}
      {point > 0 && <line x1={h.x} y1={h.y} x2={h.x + Math.cos(dir) * 95 * point} y2={h.y + Math.sin(dir) * 95 * point}
        stroke={SKIN} strokeWidth={30} strokeLinecap="round" />}
    </g>
  );
};

const Phone: React.FC<{ f: number; c: { x: number; y: number }; turn: number; scale: number }> = ({ f, c, turn, scale }) => {
  // turn 0 = its back to us, 1 = its screen to us; the flip squeezes it edge-on in between
  const sx = Math.abs(Math.cos(turn * Math.PI)) * scale, front = turn > 0.5;
  const w = 210, h = 380;
  return (
    <g transform={`translate(${c.x} ${c.y}) scale(${Math.max(0.02, sx)} ${scale})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={front ? INK : RED} />
      {!front && <image href={staticFile(BRIZ.mark)} x={-46} y={-46} width={92} height={92} opacity={0.9} />}
      {front && (
        <g>
          <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} rx={22} fill={CREAM} />
          <rect x={-80} y={-130} width={120} height={46} rx={18} fill="#fff" />
          <rect x={-40} y={-66} width={120} height={46} rx={18} fill={RED} />
          <rect x={-80} y={-2} width={150} height={78} rx={18} fill={INK} />
          <text x={-5} y={48} textAnchor="middle" fontFamily={F} fontWeight={800} fontSize={34} fill={CREAM}>$100 ✓</text>
          <rect x={-80} y={100} width={160} height={40} rx={20} fill="#fff" opacity={0.8 + 0.2 * Math.sin(f / 4)} />
        </g>
      )}
    </g>
  );
};

export const BrizPowerFlat: React.FC = () => {
  const f = useCurrentFrame();

  // Camera: slow creep in, a kick on the joy, eases back out to the start for the loop.
  const zoom = interpolate(f, [0, JOY, JOY + 12, FLIP + 20, END], [1, 1.3, 1.36, 1.3, 1], eSmooth);

  // Joy: he bounces up and his head lifts from the phone.
  const lift = interpolate(f, [JOY - 4, JOY + 8, ARM_DOWN + 40, FLIP_BACK + 10], [0, 1, 1, 0], eSmooth);
  const bounce = Math.sin(interpolate(f, [JOY, JOY + 16], [0, Math.PI], clamp)) * 40;
  const tap = f < JOY - 4 || f > FLIP_BACK ? Math.max(0, Math.sin(f / 2.6)) * 8 : 0;

  // Arms (screen-left is his right arm)
  const up = interpolate(f, [ARM_UP, ARM_UP + 14, ARM_DOWN, ARM_DOWN + 14], [0, 1, 1, 0], eApple);
  const flip = interpolate(f, [FLIP, FLIP + 16, FLIP_BACK - 8, FLIP_BACK + 8], [0, 1, 1, 0], eSmooth);
  const point = interpolate(f, [FLIP + 10, FLIP + 26, FLIP_BACK - 14, FLIP_BACK], [0, 1, 1, 0], eApple);

  const sL = P(355, 1390), sR = P(725, 1390);
  const holdL = { e: P(290, 1820), h: P(445, 1520 + tap) }, holdR = { e: P(790, 1820), h: P(635, 1520) };
  const raiseL = { e: P(190, 1120), h: P(250, 790) };
  const pointL = { e: P(250, 1760), h: P(440, 1520) };
  const phoneHold = P(540, 1480), phoneShow = P(680, 1420);
  const Lpose = point > 0 ? { e: mix(holdL.e, pointL.e, point), h: mix(holdL.h, pointL.h, point) }
    : { e: mix(holdL.e, raiseL.e, up), h: mix(holdL.h, raiseL.h, up) };
  const phoneC = mix(phoneHold, phoneShow, flip);
  const Rh = mix(holdR.h, P(phoneShow.x + 70, phoneShow.y + 120), flip);
  const Re = mix(holdR.e, P(860, 1800), flip);

  const headY = 1015 + 26 * (1 - lift) - 34 * lift;
  const headTilt = -5 * lift;
  const text = interpolate(f, [FLIP + 12, FLIP + 28, FLIP_BACK - 6, FLIP_BACK + 6], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 45%, #FFF4E4 0%, ${CREAM} 55%, #F5D7B4 100%)` }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${VP.x}px ${VP.y + 150}px` }}>
        <Grid f={f} />
        <Fireworks f={f} />
        <svg width={W} height={H} style={{ position: "absolute", transform: `translateY(${-bounce}px)` }}>
          <defs>
            <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A2029" /><stop offset="1" stopColor={INK} /></linearGradient>
          </defs>
          {/* body */}
          <path d="M150 1920 Q160 1420 360 1360 L720 1360 Q920 1420 930 1920 Z" fill="url(#shirt)" />
          <rect x={485} y={1150} width={110} height={230} rx={40} fill={SKIN} />
          {/* head: no face, like the reference; it dips to the phone and lifts on the joy */}
          <g transform={`translate(540 ${headY}) rotate(${headTilt})`}>
            <ellipse cx={0} cy={0} rx={150} ry={175} fill={SKIN} />
            <path d={`M-150 ${-20 + 30 * (1 - lift)} Q-150 -190 0 -192 Q150 -190 150 ${-20 + 30 * (1 - lift)} Q80 ${-110 + 40 * (1 - lift)} 0 ${-112 + 40 * (1 - lift)} Q-80 ${-110 + 40 * (1 - lift)} -150 ${-20 + 30 * (1 - lift)} Z`} fill={INK} />
            <ellipse cx={-152} cy={10} rx={22} ry={40} fill={SKIN} /><ellipse cx={152} cy={10} rx={22} ry={40} fill={SKIN} />
            <ellipse cx={-40} cy={60} rx={60} ry={40} fill={SKIN_HI} opacity={0.35} />
          </g>
          {/* phone between his hands, then turned to us */}
          {flip <= 0.5 && <Phone f={f} c={phoneC} turn={flip} scale={1 + 0.15 * flip} />}
          <Arm s={sR} e={Re} h={Rh} />
          {flip > 0.5 && <Phone f={f} c={phoneC} turn={flip} scale={1 + 0.15 * flip} />}
          {flip > 0.5 && <circle cx={Rh.x} cy={Rh.y} r={50} fill={SKIN} />}
          <Arm s={sL} e={Lpose.e} h={Lpose.h} fist={up} point={point} />
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 150, width: W, textAlign: "center", fontFamily: F, color: INK, opacity: text,
        transform: `translateY(${interpolate(text, [0, 1], [30, 0])}px)` }}>
        <div style={{ fontSize: 108, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>So much power</div>
        <div style={{ fontSize: 56, fontWeight: 600, marginTop: 18 }}>in the chat of your <span style={{ color: RED }}>WhatsApp.</span></div>
      </div>
      <Img src={staticFile(BRIZ.logoOnBg)} style={{ position: "absolute", top: 120, left: W / 2 - 130, width: 260, opacity: 1 - text }} />
    </AbsoluteFill>
  );
};
