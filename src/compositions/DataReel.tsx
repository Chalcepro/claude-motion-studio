import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme, layerShadow } from "../lib/design";
import { Scene, Reveal, MaskUp, useCount, clamp, eApple, lerp } from "../lib/primitives";

/** Data-driven stat reel — hook → stats → outro. 1080×1920 @ 30fps, 300f (10s). */
const { fontFamily } = loadFont();
const STATS = [
  { label: "Faster to produce", value: 10, suffix: "×", color: theme.primary },
  { label: "Lines of timeline scrubbing", value: 0, suffix: "", color: theme.accent },
  { label: "Re-render in seconds", value: 100, suffix: "%", color: theme.success },
];

const Bar: React.FC<{ at: number; frac: number; color: string }> = ({ at, frac, color }) => {
  const f = useCurrentFrame();
  const w = interpolate(f, [at, at + 24], [0, frac], eApple);
  return <div style={{ height: 16, borderRadius: 999, background: theme.hairline, overflow: "hidden" }}><div style={{ width: `${w * 100}%`, height: "100%", borderRadius: 999, background: color }} /></div>;
};

export const DataReel: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: theme.bg, fontFamily }}>
      <AbsoluteFill style={{ background: "radial-gradient(60% 38% at 50% 0%, rgba(91,140,255,0.16), rgba(0,0,0,0) 60%)" }} />

      {/* hook */}
      <Scene a={0} b={96} enterFrom={1.4} exitTo={0.86} blurIn={14}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 80 }}>
          <Reveal at={8}><div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, color: theme.primary, textTransform: "uppercase" }}>Did you know?</div></Reveal>
          <MaskUp at={26}><div style={{ fontSize: 96, fontWeight: 900, color: theme.ink, letterSpacing: -3, textAlign: "center", lineHeight: 1.05, marginTop: 16 }}>Motion graphics,<br />written in code.</div></MaskUp>
        </AbsoluteFill>
      </Scene>

      {/* stat cards */}
      <Scene a={84} b={228} enterFrom={0.82} exitTo={1.18} blurIn={12}>
        <AbsoluteFill style={{ justifyContent: "center", padding: 70, gap: 28 }}>
          {STATS.map((s, i) => {
            const at = 96 + i * 16;
            const v = useCount(s.value, at + 4, 28);
            return (
              <Reveal key={s.label} at={at} dy={40}>
                <div style={{ background: theme.surface, borderRadius: 32, padding: 44, border: `1px solid ${theme.hairline}`, boxShadow: layerShadow("0,0,0") }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 110, fontWeight: 900, color: s.color, letterSpacing: -4, lineHeight: 1 }}>{v}{s.suffix}</span>
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 600, color: theme.muted, margin: "10px 0 20px" }}>{s.label}</div>
                  <Bar at={at + 6} frac={lerp(0.35, 1, i / (STATS.length - 1))} color={s.color} />
                </div>
              </Reveal>
            );
          })}
        </AbsoluteFill>
      </Scene>

      {/* outro */}
      <Scene a={216} b={300} enterFrom={0.86} exitTo={1} exitDur={2} blurIn={12}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <MaskUp at={224}><div style={{ fontSize: 84, fontWeight: 900, color: theme.ink, letterSpacing: -2 }}>Just describe it.</div></MaskUp>
          <Reveal at={244} style={{ marginTop: 22 }}><div style={{ padding: "22px 44px", borderRadius: 999, background: theme.grad.brand, color: "#fff", fontSize: 38, fontWeight: 800, boxShadow: "0 16px 36px rgba(91,140,255,0.5)" }}>follow for more →</div></Reveal>
        </AbsoluteFill>
      </Scene>
    </AbsoluteFill>
  );
};
