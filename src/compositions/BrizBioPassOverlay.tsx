import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRIZ } from "../lib/brands";

// Transparent layer that sits on the recording. One frame here = one frame of the recording.
// Top left: the Briz mark. Top right: whose side this is. Bottom right: the "you are here" step.
// Bottom edge: a bar that runs 0 to 100% across each step, so viewers can feel how long a step takes.
const RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font, ORANGE = "#FF8021";
export const BIOPASS_REC_FRAMES = 3038;
const CUT = 12; // CUT: frames for a tag to clear before the next arrives
export const LONG_STEPS: [number, string][] = [
  [0, "Open BioPass"], [8 * 30, "Set Emergency PIN"], [33 * 30, "Fund Emergency Wallet"],
  [1890, "Find customer"], [2205, "Enter amount"], [2400, "Customer authorizes"], [2745, "Payment received"], [2925, "WhatsApp receipt"],
];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eOut = { ...clamp, easing: Easing.out(Easing.cubic) }, eIn = { ...clamp, easing: Easing.in(Easing.cubic) };
const SLANT = 34; // how far the edge leans

// 0 = hidden, 1 = home. Each piece can start a little late so the tag arrives in layers.
let END = BIOPASS_REC_FRAMES;
const slide = (f: number, a: number, b: number, lag = 0) =>
  interpolate(f, [a + lag, a + lag + 14], [0, 1], eOut) * (b >= END ? 1 : interpolate(f, [b - CUT + lag, b - 2 + lag], [1, 0], eIn));

// A slanted tag that runs off the screen edge, with the orange stripe on its leading edge.
const Tag: React.FC<{ f: number; a: number; b: number; side: "left" | "right"; y: number; h: number; w: number; bg: string; children: React.ReactNode }> = ({ f, a, b, side, y, h, w, bg, children }) => {
  const off = (1 - slide(f, a, b)) * (w + 60), stripeOff = (1 - slide(f, a, b, 3)) * (w + 120);
  const right = side === "right";
  const shape = (width: number) => (right
    ? `polygon(${SLANT}px 0, 100% 0, 100% 100%, 0 100%)`
    : `polygon(0 0, 100% 0, calc(100% - ${SLANT}px) 100%, 0 100%)`);
  const pos = (extra: number) => (right ? { right: -extra } : { left: -extra });
  return (
    <>
      <div style={{ position: "absolute", top: y, height: h, width: w + 26, ...pos(stripeOff), clipPath: shape(w), background: ORANGE }} />
      <div style={{ position: "absolute", top: y, height: h, width: w, ...pos(off), clipPath: shape(w), background: bg, display: "flex", alignItems: "center", justifyContent: right ? "flex-end" : "flex-start" }}>
        {children}
      </div>
    </>
  );
};

const Label: React.FC<{ f: number; a: number; size: number; children: React.ReactNode }> = ({ f, a, size, children }) => (
  <span style={{ fontFamily: F, fontWeight: 600, fontSize: size, color: "#FFFFFF", letterSpacing: 1.5, whiteSpace: "nowrap", paddingRight: 44,
    opacity: interpolate(f, [a + 8, a + 16], [0, 1], clamp), transform: `translateX(${interpolate(f, [a + 8, a + 18], [18, 0], eOut)}px)` }}>{children}</span>
);

export type OverlayProps = { steps?: [number, string][]; split?: number; frames?: number };
export const BrizBioPassOverlay: React.FC<OverlayProps> = ({ steps: STEPS = LONG_STEPS, split: SPLIT = 1890, frames = BIOPASS_REC_FRAMES }) => {
  const f = useCurrentFrame();
  END = frames;
  const i = STEPS.reduce((n, s, k) => (f >= s[0] ? k : n), 0);
  const a = STEPS[i][0], b = i + 1 < STEPS.length ? STEPS[i + 1][0] : frames;
  const merchant = f >= SPLIT, sideA = merchant ? SPLIT : 0, sideB = merchant ? frames : SPLIT;
  const text = STEPS[i][1].toUpperCase();
  const fill = interpolate(f, [a, b], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Tag f={f} a={0} b={frames} side="left" y={44} h={92} w={190} bg={CREAM}>
        <Img src={staticFile("briz-mark.png")} style={{ height: 58, marginLeft: 44 }} />
      </Tag>
      <Tag f={f} a={sideA} b={sideB} side="right" y={44} h={92} w={merchant ? 430 : 440} bg={RED}>
        <Label f={f} a={sideA} size={36}>{merchant ? "MERCHANT SIDE" : "CUSTOMER SIDE"}</Label>
      </Tag>
      <Tag f={f} a={a} b={b} side="right" y={1782} h={92} w={110 + text.length * 25} bg={RED}>
        <Label f={f} a={a} size={36}>{text}</Label>
      </Tag>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 18, background: "rgba(255,128,33,0.22)" }}>
        <div style={{ width: "100%", height: "100%", background: ORANGE, transform: `scaleX(${fill})`, transformOrigin: "left" }} />
      </div>
    </AbsoluteFill>
  );
};
