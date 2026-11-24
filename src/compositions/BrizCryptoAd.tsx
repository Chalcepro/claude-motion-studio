import React from "react";
import {
  AbsoluteFill, Audio, Img, interpolate,
  OffthreadVideo, Sequence, staticFile, useCurrentFrame,
} from "remotion";
import { clamp, eApple, eSmooth, Reveal } from "../lib/primitives";
import { BRIZ } from "../lib/brands";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const W = 1080, H = 1920;
const F = BRIZ.font;
const USDT_C = "#26A17B", USDT_DK = "#1B7560";

// ─── BEAT TIMINGS ────────────────────────────────────────────────────────────
const SLIDE_IN  = 20;   // panels finish sliding in
const COIN_S    = 85;   // coin launches from red phone
const COIN_E    = 145;  // coin arrives at green phone
const RCV_S     = 150;  // "received" label appears
const SPLIT_OUT = 180;  // panels slide back out
const END_S     = 200;  // ending video starts
const LOGO_IN   = 282;  // Briz logo fades in (video frame 82 → screen glowing)
const LOGO_FULL = 308;
export const BRIZ_CRYPTO_AD_FRAMES = 340;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const qb = (t: number, a: number, b: number, c: number) =>
  (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c;

// Phone screen pixel positions in the 1080×960 Blender stills
// (measured from 40%-scale test renders, scaled up 2.5×)
const RED_SC = { cx: 207, cy: 672 };
const GRN_SC = { cx: 147, cy: 664 };

// ─── USDT COIN ────────────────────────────────────────────────────────────────
// Travels from red screen (top panel) → down arc → green screen (bottom panel)
const USDTCoin: React.FC<{ f: number }> = ({ f }) => {
  if (f < COIN_S - 2 || f > COIN_E + 32) return null;
  const t  = interpolate(f, [COIN_S, COIN_E], [0, 1], eApple);
  const sx = RED_SC.cx,       sy = RED_SC.cy;
  const ex = GRN_SC.cx,       ey = 960 + GRN_SC.cy;
  const mx = 580,              my = (sy + ey) / 2 - 80;   // arc curves right
  const cx = qb(t, sx, mx, ex);
  const cy = qb(t, sy, my, ey);
  const op   = interpolate(f, [COIN_S, COIN_S + 6, COIN_E - 4, COIN_E + 2], [0, 1, 1, 0], clamp);
  const spin = interpolate(f, [COIN_S, COIN_E], [0, 360], clamp);
  const R = 48;

  return (
    <g opacity={op}>
      {([0.1, 0.22, 0.36] as number[]).map((off, i) => {
        const tT = Math.max(0, t - off);
        return (
          <circle key={i}
            cx={qb(tT, sx, mx, ex)} cy={qb(tT, sy, my, ey)}
            r={R * (1 - i * 0.15)} fill={USDT_C}
            opacity={(1 - i * 0.3) * 0.22 * (t > off ? 1 : 0)} />
        );
      })}
      <circle cx={cx} cy={cy + 10} r={R} fill={USDT_DK} opacity={0.9} />
      <circle cx={cx} cy={cy}      r={R} fill={USDT_C} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
      <g transform={`rotate(${spin}, ${cx}, ${cy})`}>
        <rect x={cx - 26} y={cy - 23} width={52} height={8} rx={4} fill="white" />
        <rect x={cx - 18} y={cy -  7} width={36} height={6} rx={3} fill="white" />
        <rect x={cx -  4} y={cy - 15} width={ 9} height={42} rx={4} fill="white" />
      </g>
      <ellipse cx={cx - 14} cy={cy - 18} rx={16} ry={9}
        fill="rgba(255,255,255,0.28)" transform={`rotate(-22, ${cx - 14}, ${cy - 18})`} />
    </g>
  );
};

// ─── MAIN COMPOSITION ─────────────────────────────────────────────────────────
export const BrizCryptoAd: React.FC = () => {
  const f = useCurrentFrame();

  // Split panel y-positions
  const slideP    = interpolate(f, [0, SLIDE_IN],           [0, 1], eApple);
  const slideOutP = interpolate(f, [SPLIT_OUT, SPLIT_OUT + 20], [0, 1], eApple);
  const redY = -960 * (1 - slideP) - 960 * slideOutP;      // top panel: drops in, lifts out
  const grnY =  960 + 960 * (1 - slideP) + 960 * slideOutP; // bottom: rises in, falls out

  const sentAlpha = interpolate(f,
    [COIN_S - 5, COIN_S + 15, SPLIT_OUT, SPLIT_OUT + 10], [0, 1, 1, 0], clamp);
  const rcvAlpha  = interpolate(f,
    [RCV_S, RCV_S + 12, SPLIT_OUT, SPLIT_OUT + 10], [0, 1, 1, 0], clamp);

  // Ending
  const endAlpha = interpolate(f, [END_S, END_S + 20],  [0, 1], eApple);
  const logoOp   = interpolate(f, [LOGO_IN, LOGO_FULL], [0, 1], eApple);
  const logoTY   = interpolate(f, [LOGO_IN, LOGO_FULL], [60, 0], eApple);
  const urlOp    = interpolate(f, [LOGO_FULL, LOGO_FULL + 20], [0, 1], eApple);

  return (
    <AbsoluteFill style={{ background: "#0D0D0D", overflow: "hidden" }}>

      {/* ── SOUND ── */}
      <Audio src={staticFile("sfx/bed.wav")} endAt={LOGO_FULL + 20} volume={0.15} loop />
      <Sequence from={COIN_S}>
        <Audio src={staticFile("sfx/spin.wav")} endAt={COIN_E - COIN_S + 10} volume={0.55} />
      </Sequence>
      <Sequence from={RCV_S}>
        <Audio src={staticFile("sfx/flash.wav")} endAt={25} volume={0.85} />
      </Sequence>
      <Sequence from={LOGO_IN}>
        <Audio src={staticFile("sfx/logo-hit.wav")} endAt={40} volume={0.9} />
      </Sequence>

      {/* ── SCENE 1: TOP / BOTTOM SPLIT ── */}
      {f < SPLIT_OUT + 25 && (
        <AbsoluteFill style={{ overflow: "hidden" }}>

          {/* TOP panel — red room */}
          <div style={{
            position: "absolute", top: redY, left: 0,
            width: W, height: 960, overflow: "hidden",
          }}>
            <Img src={staticFile("blender/red_split.png")}
              style={{ width: W, height: 960, display: "block" }} />

            {/* "Sent" chip near phone screen */}
            {sentAlpha > 0.01 && (
              <div style={{
                position: "absolute",
                left: RED_SC.cx - 65, top: RED_SC.cy - 26,
                opacity: sentAlpha, fontFamily: F, pointerEvents: "none",
              }}>
                <div style={{
                  background: "#25D366", color: "white",
                  fontSize: 22, fontWeight: 800,
                  padding: "5px 18px", borderRadius: 999, whiteSpace: "nowrap" as const,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}>✓ Sent  50 USDT</div>
              </div>
            )}
          </div>

          {/* BOTTOM panel — green room */}
          <div style={{
            position: "absolute", top: grnY, left: 0,
            width: W, height: 960, overflow: "hidden",
          }}>
            <Img src={staticFile("blender/grn_split.png")}
              style={{ width: W, height: 960, display: "block" }} />

            {/* "Received" chip near phone screen */}
            {rcvAlpha > 0.01 && (
              <div style={{
                position: "absolute",
                left: GRN_SC.cx - 65, top: GRN_SC.cy - 26,
                opacity: rcvAlpha, fontFamily: F, pointerEvents: "none",
              }}>
                <div style={{
                  background: "#1A5C32", color: "white",
                  fontSize: 22, fontWeight: 800,
                  padding: "5px 18px", borderRadius: 999, whiteSpace: "nowrap" as const,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}>+ 50 USDT  Received!</div>
              </div>
            )}
          </div>

          {/* horizontal divider */}
          <div style={{
            position: "absolute", top: 960, left: 0,
            width: W, height: 4, background: "#0D0D0D",
            opacity: slideP * (1 - slideOutP),
          }} />

          {/* coin travels top → bottom */}
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <USDTCoin f={f} />
          </svg>
        </AbsoluteFill>
      )}

      {/* ── SCENE 2: ENDING ── */}
      {f >= END_S - 5 && (
        <AbsoluteFill style={{ opacity: endAlpha, background: "#0D0D0D" }}>

          {/* ending.mp4 is 1080×960 — center it vertically with cinematic bars */}
          <Sequence from={END_S} durationInFrames={125}>
            <OffthreadVideo
              src={staticFile("blender/ending.mp4")}
              style={{
                position: "absolute",
                top: (H - 960) / 2,
                left: 0, width: W, height: 960,
                display: "block",
              }}
            />
          </Sequence>

          {/* Briz logo + URL — slides up and fades in */}
          {logoOp > 0.01 && (
            <div style={{
              position: "absolute", bottom: 100, left: 0, width: W,
              display: "flex", flexDirection: "column" as const,
              alignItems: "center", gap: 28,
              opacity: logoOp,
              transform: `translateY(${logoTY}px)`,
            }}>
              <Img src={staticFile("briz-logo-cream.png")}
                style={{ width: 460, objectFit: "contain" }} />
              <div style={{
                color: "rgba(255,255,255,0.65)", fontSize: 30,
                fontFamily: F, fontWeight: 500, letterSpacing: 3,
                opacity: urlOp,
              }}>paywithbriz.com</div>
            </div>
          )}
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
