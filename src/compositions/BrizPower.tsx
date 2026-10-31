import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, eApple, eSmooth } from "../lib/primitives";
import { BRIZ } from "../lib/brands";

// Looping reel: a man on his red phone, the slogan, a warp pull-back,
// then a dive into the phone that becomes a WhatsApp-status run of features.
const W = 1080, H = 1920;
const INK = BRIZ.ink, RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font;
const PX = 700, PY = 1010; // phone centre: the zoom aims here

// Timeline (frames at 30 fps)
const PULL = 105, PUSH = 150, STATUS = 205, SLIDE = 34, LOGO = 341;
export const STATUS_SLIDES = [
  { big: "Virtual cards.", small: "Make one in a chat." },
  { big: "₦ → $ £ €", small: "Convert your naira in seconds." },
  { big: "Pay in WhatsApp.", small: "No app switching. No bank queue." },
  { big: "So much power.", small: "In the chat of your WhatsApp." },
];
export const BRIZ_POWER_FRAMES = LOGO + 54;

// The man: black shapes on white, head bent to the phone.
const Man: React.FC<{ f: number; dark: boolean }> = ({ f, dark }) => {
  const body = dark ? CREAM : INK;
  const bob = Math.sin(f / 9) * 4, tap = Math.max(0, Math.sin(f / 3.2)) * 10;
  return (
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <g fill={body}>
        <path d="M330 1900 Q320 1300 420 1120 Q520 1020 640 1060 Q760 1110 780 1300 L800 1900 Z" />
        <g transform={`translate(0 ${bob}) rotate(24 500 760)`}>
          <circle cx="500" cy="720" r="120" />
          <path d="M440 830 L470 920 L560 920 L560 830 Z" />
        </g>
        {/* arm up to the phone */}
        <path d="M790 1220 Q820 1120 750 1060" stroke={body} strokeWidth="70" strokeLinecap="round" fill="none" />
        <path d="M470 1180 Q540 1080 640 1050" stroke={body} strokeWidth="70" strokeLinecap="round" fill="none" />
      </g>
      <g transform={`rotate(-12 ${PX} ${PY})`}>
        <rect x={PX - 70} y={PY - 130} width="140" height="260" rx="22" fill={RED} />
        <rect x={PX - 58} y={PY - 112} width="116" height="210" rx="12" fill={dark ? INK : CREAM} />
        <circle cx={PX + 30} cy={PY + 70 - tap} r="20" fill={body} />
      </g>
    </svg>
  );
};

// Original sticker that pops out of the chat: a round face going "WHOA".
const Whoa: React.FC<{ f: number }> = ({ f }) => {
  const s = interpolate(f, [40, 52], [0, 1], eApple);
  const out = interpolate(f, [90, 100], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 720, top: 520, transform: `scale(${s * out}) rotate(${8 + Math.sin(f / 5) * 4}deg)` }}>
      <svg width="240" height="240" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill={CREAM} stroke={INK} strokeWidth="5" />
        <circle cx="34" cy="42" r="10" fill="#fff" stroke={INK} strokeWidth="4" /><circle cx="34" cy="42" r="4" fill={INK} />
        <circle cx="66" cy="42" r="10" fill="#fff" stroke={INK} strokeWidth="4" /><circle cx="66" cy="42" r="4" fill={INK} />
        <ellipse cx="50" cy="70" rx="9" ry="12" fill={INK} />
      </svg>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 64, color: RED, textAlign: "center", marginTop: -20 }}>WHOA!</div>
    </div>
  );
};

const Slogan: React.FC<{ f: number }> = ({ f }) => {
  const line = (at: number) => ({
    opacity: interpolate(f, [at, at + 14], [0, 1], clamp) * interpolate(f, [PULL - 10, PULL + 10], [1, 0], clamp),
    transform: `translateY(${interpolate(f, [at, at + 18], [40, 0], eApple)}px)`,
  });
  return (
    <div style={{ position: "absolute", top: 170, width: W, textAlign: "center", fontFamily: F, color: INK }}>
      <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3, ...line(12) }}>So much power</div>
      <div style={{ fontSize: 58, fontWeight: 600, ...line(26) }}>
        in the chat of your <span style={{ color: RED }}>WhatsApp.</span>
      </div>
    </div>
  );
};

// Speed lines during the warp.
const Warp: React.FC<{ f: number }> = ({ f }) => {
  const o = interpolate(f, [PULL, PULL + 10, PUSH + 30, STATUS], [0, 1, 1, 0], clamp);
  const dark = f > PUSH + 20;
  return (
    <svg width={W} height={H} style={{ position: "absolute", opacity: o }}>
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2 + i * 0.37, r0 = 260 + ((f * 38 + i * 97) % 900);
        return <line key={i} x1={W / 2 + Math.cos(a) * r0} y1={H / 2 + Math.sin(a) * r0}
          x2={W / 2 + Math.cos(a) * (r0 + 160)} y2={H / 2 + Math.sin(a) * (r0 + 160)}
          stroke={dark ? RED : INK} strokeWidth={i % 3 ? 3 : 6} strokeLinecap="round" />;
      })}
    </svg>
  );
};

const Status: React.FC<{ f: number }> = ({ f }) => {
  const t = f - STATUS;
  const i = Math.max(0, Math.min(STATUS_SLIDES.length - 1, Math.floor(t / SLIDE))), local = t - i * SLIDE;
  const s = STATUS_SLIDES[i];
  return (
    <AbsoluteFill style={{ background: INK, fontFamily: F, opacity: interpolate(f, [STATUS - 8, STATUS], [0, 1], clamp) }}>
      <div style={{ position: "absolute", top: 80, left: 40, right: 40, display: "flex", gap: 10 }}>
        {STATUS_SLIDES.map((_, k) => (
          <div key={k} style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(253,235,208,0.25)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: CREAM, width: `${k < i ? 100 : k > i ? 0 : interpolate(local, [0, SLIDE], [0, 100], clamp)}%` }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 120, left: 40, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: RED, display: "grid", placeItems: "center" }}>
          <Img src={staticFile(BRIZ.mark)} style={{ width: 56 }} />
        </div>
        <div style={{ color: CREAM, fontSize: 40, fontWeight: 600 }}>Briz<div style={{ fontSize: 28, opacity: 0.6, fontWeight: 500 }}>just now</div></div>
      </div>
      <div style={{ position: "absolute", top: 760, width: W, textAlign: "center",
        opacity: interpolate(local, [0, 8], [0, 1], clamp), transform: `scale(${interpolate(local, [0, 14], [1.15, 1], eApple)})` }}>
        <div style={{ color: i === 1 ? RED : CREAM, fontSize: 120, fontWeight: 800, letterSpacing: -3 }}>{s.big}</div>
        <div style={{ color: CREAM, opacity: 0.75, fontSize: 50, fontWeight: 500, marginTop: 24 }}>{s.small}</div>
      </div>
    </AbsoluteFill>
  );
};

export const BrizPower: React.FC = () => {
  const f = useCurrentFrame();
  // Camera: pull back (shrink), then dive into the phone screen.
  const back = interpolate(f, [PULL, PUSH], [1, 0.22], eSmooth);
  const dive = interpolate(f, [PUSH, STATUS], [1, 40], { ...clamp, easing: (x) => x * x * x });
  const scale = back * dive;
  const bg = f < PUSH + 20 ? "#FFFFFF" : INK;
  return (
    <AbsoluteFill style={{ background: bg }}>
      {f < STATUS && (
        <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${PX}px ${PY}px`}}>
          <Man f={f} dark={f > PUSH + 20} />
          <Whoa f={f} />
        </AbsoluteFill>
      )}
      <Slogan f={f} />
      <Warp f={f} />
      {f >= STATUS - 8 && f < LOGO && <Status f={f} />}
      {f >= LOGO && (
        <AbsoluteFill style={{ background: RED, alignItems: "center", justifyContent: "center",
          opacity: interpolate(f, [LOGO, LOGO + 6, BRIZ_POWER_FRAMES - 8, BRIZ_POWER_FRAMES], [0, 1, 1, 0], clamp) }}>
          <Img src={staticFile(BRIZ.logoOnFlood)} style={{ width: BRIZ.logoW, transform: `scale(${interpolate(f, [LOGO, LOGO + 18], [0.85, 1], eApple)})` }} />
          <div style={{ fontFamily: F, color: CREAM, fontSize: 44, fontWeight: 600, marginTop: 40 }}>{BRIZ.url}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
