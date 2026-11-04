import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { BRIZ } from "../lib/brands";
import { Sticker, onTwos, boil } from "../lib/sticker";
import { mulberry32 } from "../lib/primitives";

// Paper-cut reel "As easy as that." (12 s, has an outro). On Briz red, rounded cream paper cards drop onto a
// stack on twos, one action each: Type it. / Send it. / Done. The stack fans out, "Simple and direct." is
// stuck on top, the cards are swept away, "As easy as that." and an outro with the logo.
const W = 1080, H = 1920, INK = BRIZ.ink, RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font;
const GREEN = "#1DB45A";
export const BRIZ_PAPER_EASY_FRAMES = 360;

const CARD_AT = [10, 58, 106], FAN = 160, SIMPLE = 176, SWEEP = 232, EASY = 246, OUTRO = 292;

const GRAIN = (() => { const r = mulberry32(17); return Array.from({ length: 160 }, () => ({ x: r() * W, y: r() * H, r: 2 + r() * 6, o: 0.05 + r() * 0.06 })); })();

const Icon: React.FC<{ i: number }> = ({ i }) => {
  if (i === 0) return ( // a chat bubble being typed
    <div style={{ background: "#FFFFFF", borderRadius: 50, padding: "34px 44px", fontSize: 46, fontWeight: 600, color: INK, position: "relative" }}>
      Send ₦5,000 to Tolu<span style={{ color: RED }}>|</span>
    </div>
  );
  if (i === 1) return ( // paper plane
    <svg width={300} height={240} viewBox="0 0 300 240">
      <path d="M20 120 L280 30 L200 220 L150 150 Z" fill={RED} stroke={RED} strokeWidth={24} strokeLinejoin="round" />
      <path d="M150 150 L280 30" stroke={CREAM} strokeWidth={12} strokeLinecap="round" />
    </svg>
  );
  return (
    <div style={{ width: 280, height: 280, borderRadius: 140, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={170} height={170}><path d="M28 90 L70 132 L144 44" fill="none" stroke="#fff" strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
};
const WORDS = ["Type it.", "Send it.", "Done."];

export const BrizPaperEasy: React.FC = () => {
  const f = useCurrentFrame();
  const t = onTwos(f);

  return (
    <AbsoluteFill style={{ background: RED, overflow: "hidden", fontFamily: F }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {GRAIN.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#5A0E00" opacity={g.o} />)}
      </svg>

      {/* the card stack */}
      {f < SWEEP + 20 && WORDS.map((w, i) => {
        const at = CARD_AT[i], dt = t - at;
        if (dt < 0) return null;
        const drop = Math.max(0, 1 - dt / 10); // falls in from below over ~10 frames, on twos
        const fan = Math.min(1, Math.max(0, (t - FAN) / 12));
        const sweep = Math.max(0, (t - SWEEP) / 16);
        const baseRot = [-6, 5, -2][i];
        const fanX = [-260, 0, 260][i] * fan, fanRot = [-16, 0, 16][i] * fan;
        const b = boil(f, 30 + i, 0.8);
        const x = 540 + fanX + b.dx - sweep * sweep * 1500 * (i === 1 ? -1 : 1);
        const y = 960 + drop * drop * 1300 + b.dy + fan * Math.abs([-1, 0, 1][i]) * 60;
        const s = (1 - 0.32 * fan) * (dt === 0 ? 1.05 : 1);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${baseRot + fanRot + b.rot}deg) scale(${s})`,
            filter: "drop-shadow(10px 16px 0 rgba(70,10,0,0.35))" }}>
            <div style={{ width: 780, height: 1040, borderRadius: 96, background: CREAM, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 70 }}>
              <Icon i={i} />
              <div style={{ fontSize: 150, fontWeight: 800, color: INK, letterSpacing: -5 }}>{w}</div>
            </div>
          </div>
        );
      })}

      <Sticker f={f} x={540} y={1080} at={SIMPLE} out={SWEEP} dir={[0, 1]} rot={-4} seed={41}>
        <div style={{ background: INK, color: CREAM, borderRadius: 70, padding: "40px 70px", fontSize: 92, fontWeight: 800, letterSpacing: -2, whiteSpace: "nowrap" }}>
          Simple <span style={{ color: "#FFC93C" }}>&</span> direct.
        </div>
      </Sticker>

      {/* "As easy as that." words slapped in one by one */}
      {f < OUTRO + 6 && ["As", "easy", "as", "that."].map((w, i) => (
        <Sticker key={i} f={f} x={[220, 640, 250, 660][i]} y={[760, 760, 1030, 1030][i]} at={EASY + i * 6} out={OUTRO - 6 + i * 2} dir={[0, -1]} rot={[-6, 4, 3, -5][i]} seed={50 + i}>
          <div style={{ fontSize: 190, fontWeight: 800, color: i === 1 ? RED : INK, letterSpacing: -6, background: i === 1 ? CREAM : "transparent", borderRadius: 50, padding: i === 1 ? "0 30px" : 0 }}>{w}</div>
        </Sticker>
      ))}

      {/* outro */}
      {f >= OUTRO && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
          <Sticker f={f} x={540} y={860} at={OUTRO + 4} rot={-2} seed={60} shadow="rgba(70,10,0,0.35)">
            <div style={{ background: CREAM, borderRadius: 90, padding: "60px 80px" }}><Img src={staticFile("briz-logo.png")} style={{ width: 460, display: "block" }} /></div>
          </Sticker>
          <Sticker f={f} x={540} y={1130} at={OUTRO + 16} rot={2} seed={61}>
            <div style={{ background: CREAM, color: INK, borderRadius: 60, padding: "26px 56px", fontSize: 62, fontWeight: 700, whiteSpace: "nowrap" }}>Pay like a breeze.</div>
          </Sticker>
          <div style={{ position: "absolute", top: 1300, width: W, textAlign: "center", fontSize: 44, fontWeight: 600, color: CREAM, opacity: f >= OUTRO + 28 ? 1 : 0 }}>paywithbriz.com</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

