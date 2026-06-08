import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme } from "../lib/design";
import { Scene, MaskUp, clamp } from "../lib/primitives";

/** Kinetic-typography logo sting. 1080×1920 @ 30fps, 180f (6s). */
const { fontFamily } = loadFont();
const WORDS = ["DESIGN.", "ANIMATE.", "RENDER."];

export const KineticIntro: React.FC = () => {
  const f = useCurrentFrame();
  const sweep = interpolate(f, [140, 172], [-20, 130], clamp);
  return (
    <AbsoluteFill style={{ background: theme.grad.deep, fontFamily }}>
      <AbsoluteFill style={{ background: "radial-gradient(60% 40% at 50% 45%, rgba(91,140,255,0.22), rgba(0,0,0,0) 60%)" }} />

      {/* word sequence — each pushes through into the next */}
      {WORDS.map((w, i) => {
        const a = i * 40;
        return (
          <Scene key={w} a={a} b={a + 48} enterFrom={0.8} exitTo={1.5} blurIn={14} blurOut={16}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <MaskUp at={a + 2}>
                <div style={{ fontSize: 150, fontWeight: 900, color: theme.ink, letterSpacing: -4 }}>{w}</div>
              </MaskUp>
            </AbsoluteFill>
          </Scene>
        );
      })}

      {/* final lockup */}
      <Scene a={120} b={180} enterFrom={0.86} exitTo={1} blurIn={14} exitDur={2}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 96, fontWeight: 900, color: theme.ink, letterSpacing: -3, display: "flex", alignItems: "center", gap: 14 }}>
              MOTION<span style={{ color: theme.primary }}>·</span>STUDIO
            </div>
            <div style={{ position: "absolute", inset: -16, background: `linear-gradient(100deg,transparent ${sweep - 12}%, rgba(255,255,255,0.5) ${sweep}%, transparent ${sweep + 12}%)`, mixBlendMode: "overlay" }} />
          </div>
          <div style={{ marginTop: 22, fontSize: 36, fontWeight: 500, color: theme.muted, letterSpacing: 2, opacity: interpolate(f, [150, 168], [0, 1], clamp) }}>built in code</div>
        </AbsoluteFill>
      </Scene>

      <AbsoluteFill style={{ boxShadow: "inset 0 0 280px rgba(0,0,0,0.7)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
