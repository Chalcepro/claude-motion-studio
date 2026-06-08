import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme, layerShadow, glass } from "../lib/design";
import { Scene, Reveal, StatusBar, HomeBar, clamp, eApple } from "../lib/primitives";

/** App-UI showcase — a device that boots, lists content, gets tapped, confirms.
 *  Demonstrates realistic chrome + layered depth + a match-cut push-in. 1080×1920 @ 30fps, 240f (8s). */
const { fontFamily } = loadFont();
const ITEMS = [
  { t: "Realistic status bar", s: "9:41 · signal · battery", c: theme.primary },
  { t: "Layered soft shadows", s: "near + far + hairline", c: theme.accent },
  { t: "Smooth Apple easing", s: "blur-in reveals", c: theme.success },
  { t: "Cinematic camera moves", s: "zoom through scenes", c: "#FFB020" },
];

const Phone: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 720, height: 1440, borderRadius: 76, background: "#fff", padding: 16, boxShadow: layerShadow("0,0,0"), border: "1px solid rgba(255,255,255,0.2)" }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 62, overflow: "hidden", background: "linear-gradient(180deg,#FFFFFF,#F4F6FB)", position: "relative" }}>{children}</div>
    <div style={{ position: "absolute", top: 32, left: "50%", transform: "translateX(-50%)", width: 150, height: 30, borderRadius: 999, background: "#111", zIndex: 5 }} />
  </div>
);

export const AppShowcase: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cur = interpolate(f, [150, 176], [0, 1], { ...clamp, easing: eApple.easing }); // cursor to button
  const press = interpolate(f, [178, 186, 196], [1, 0.9, 1], clamp);
  const done = f >= 186;
  return (
    <AbsoluteFill style={{ background: theme.grad.deep, fontFamily }}>
      <AbsoluteFill style={{ background: "radial-gradient(55% 35% at 80% 12%, rgba(91,140,255,0.2), rgba(0,0,0,0) 60%)" }} />
      <Scene a={0} b={240} enterFrom={0.8} exitTo={1} pushTo={1.06} exitDur={2} blurIn={12}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Phone>
            <StatusBar />
            <div style={{ padding: "8px 40px 18px" }}>
              <Reveal at={10}><div style={{ fontSize: 44, fontWeight: 900, color: "#111", letterSpacing: -1 }}>Build anything</div></Reveal>
              <Reveal at={18}><div style={{ fontSize: 28, color: "#8A93A6", marginTop: 4 }}>every motion style, in code</div></Reveal>
            </div>
            <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 18 }}>
              {ITEMS.map((it, i) => (
                <Reveal key={it.t} at={28 + i * 12} dy={34}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#fff", borderRadius: 26, padding: 26, boxShadow: "0 1px 3px rgba(15,18,25,0.04), 0 12px 28px rgba(15,18,25,0.08)", border: "1px solid rgba(15,18,25,0.05)" }}>
                    <div style={{ width: 66, height: 66, borderRadius: 18, background: it.c, flex: "0 0 auto", boxShadow: `0 8px 18px ${it.c}55` }} />
                    <div><div style={{ fontSize: 30, fontWeight: 800, color: "#111" }}>{it.t}</div><div style={{ fontSize: 23, color: "#8A93A6", marginTop: 3 }}>{it.s}</div></div>
                  </div>
                </Reveal>
              ))}
            </div>
            {/* CTA button + cursor tap + confirm */}
            <div style={{ position: "absolute", left: 40, right: 40, bottom: 70 }}>
              <div style={{ height: 96, borderRadius: 26, background: done ? "rgba(46,204,113,0.15)" : theme.grad.brand, color: done ? theme.success : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 34, fontWeight: 800, boxShadow: done ? "none" : "0 14px 32px rgba(91,140,255,0.5), inset 0 1px 0 rgba(255,255,255,0.4)", transform: `scale(${press})` }}>
                {done ? "Generated ✓" : "Generate"}
              </div>
            </div>
            <div style={{ position: "absolute", left: interpolate(cur, [0, 1], [560, 360], clamp), top: interpolate(cur, [0, 1], [1320, 1280], clamp), width: 54, height: 54, marginLeft: -27, marginTop: -27, borderRadius: "50%", background: "rgba(0,0,0,0.18)", border: "4px solid #111", opacity: interpolate(f, [144, 156, 206, 216], [0, 1, 1, 0], clamp), transform: `scale(${press})` }} />
            <HomeBar />
          </Phone>
        </AbsoluteFill>
      </Scene>
    </AbsoluteFill>
  );
};
