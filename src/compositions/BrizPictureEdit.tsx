import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import { clamp, eApple, eSmooth } from "../lib/primitives";
import TRACKS from "./briz-blur-tracks.json";

const { fontFamily } = loadFont("normal", { weights: ["500", "700"] });

const CREAM = "#FFF1DC";
const RED = "#E72E08";
const FPS = 30;

// The footage inside the old edit's frame (source pixels); everything outside it is ChatGPT's border.
const SRC = { x: 100, y: 215, w: 880, h: 1564 };
// Kept parts of the source, in seconds; the middle of the typing is cut.
const SEGMENTS: [number, number][] = [[0, 23], [30, 41.5]];
// Captions keyed to source time.
const STEPS: [number, string][] = [
  [0, "Snap the account details"],
  [4, "Briz reads the details"],
  [15, "Tap Send Money"],
  [19, "Type the amount"],
  [32, "Confirm the payment"],
  [36, "Enter your Briz PIN"],
];

const segFrames = SEGMENTS.map(([a, b]) => Math.round((b - a) * FPS));
const VIDEO_END = segFrames.reduce((s, n) => s + n, 0);
export const CUT = VIDEO_END;
const END_CARD = 150;
export const BRIZ_PICTURE_FRAMES = VIDEO_END + END_CARD;

// Output frame -> source seconds.
const sourceTime = (f: number) => {
  let start = 0;
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (f < start + segFrames[i] || i === SEGMENTS.length - 1) return SEGMENTS[i][0] + (f - start) / FPS;
    start += segFrames[i];
  }
  return 0;
};

// Final window the footage settles into.
const WIN = { left: 60, top: 330, width: 960, height: 1480 };
const PANEL = { width: 620, height: 150 };
const R = 44; // corner radius

// Privacy blurs over the account number, tracked with OpenCV (tools: $TEMP/bpf/trk/track.py): [frame, x, y, angle] in SRC pixels.
type Track = { w: number; h: number; keys: number[][]; show?: [number, number] };
const BLURS: Track[] = [
  ...(TRACKS as Track[]).map((t, i) => ({ ...t, show: ([[0, 99], [0, 99], [13, 99], [15.5, 99]] as [number, number][])[i] })),
  // PIN screen: the whole phone face.
  { w: 760, h: 1000, keys: [[1038, 600, 640, -32], [1245, 600, 640, -32]] },
];
const at = (t: Track, sec: number) => {
  const f = Math.round(sec * FPS), k = t.keys;
  if (t.show && (sec < t.show[0] || sec > t.show[1])) return null;
  if (f < k[0][0] || f > k[k.length - 1][0]) return null;
  const hit = k.find((r) => r[0] >= f)!;
  return { x: hit[1], y: hit[2], rot: hit[3] };
};

const Footage: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const frame = useCurrentFrame();
  const s = Math.max(w / SRC.w, h / SRC.h);
  const style: React.CSSProperties = {
    position: "absolute", width: 1080 * s, height: 1920 * s,
    left: -SRC.x * s + (w - SRC.w * s) / 2, top: -SRC.y * s + (h - SRC.h * s) / 2,
  };
  let cursor = 0;
  return (
    <>
      {SEGMENTS.map(([a], i) => {
        const from = cursor;
        cursor += segFrames[i];
        return (
          <Sequence key={i} from={from} durationInFrames={segFrames[i]}>
            <OffthreadVideo src={staticFile("briz-picture.mp4")} startFrom={Math.round(a * FPS)} style={style}
              muted />
          </Sequence>
        );
      })}
      {BLURS.map((b, i) => {
        const p = at(b, sourceTime(frame));
        if (!p) return null;
        return (
          <div key={"b" + i} style={{
            position: "absolute", width: b.w * s, height: b.h * s, borderRadius: 999,
            left: (p.x - b.w / 2) * s + (w - SRC.w * s) / 2, top: (p.y - b.h / 2) * s + (h - SRC.h * s) / 2,
            transform: `rotate(${p.rot}deg)`, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
          }} />
        );
      })}
    </>
  );
};

// Concave corner piece: red square with a transparent quarter circle, so the footage keeps a rounded corner beside the panel.
const Fillet: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", width: R, height: R, background: `radial-gradient(circle at 0 0, transparent ${R - 0.5}px, ${RED} ${R}px)`, ...style }} />
);

export const BrizPictureEdit: React.FC = () => {
  const frame = useCurrentFrame();
  const frameIn = interpolate(frame, [36, 66], [0, 1], eApple); // full-screen -> framed
  const ui = (d: number) => interpolate(frame, [60 + d, 82 + d], [0, 1], eApple);
  const out = interpolate(frame, [CUT - 12, CUT + 6], [0, 1], eSmooth);
  const card = (d: number) => interpolate(frame, [CUT + d, CUT + d + 22], [0, 1], eApple);
  const volume = (f: number) => 0.8 * interpolate(f, [0, 12, BRIZ_PICTURE_FRAMES - 45, BRIZ_PICTURE_FRAMES - 2], [0, 1, 1, 0], clamp);
  const shift = (frame * 0.6) % 64;

  const lerp = (a: number, b: number) => a + (b - a) * frameIn;
  const win = { left: lerp(0, WIN.left), top: lerp(0, WIN.top), width: lerp(1080, WIN.width), height: lerp(1920, WIN.height) };

  // Current step and how far into it we are (output frames).
  const t = sourceTime(Math.min(frame, VIDEO_END - 1));
  const si = STEPS.reduce((k, [s], i) => (t >= s ? i : k), 0);
  let stepStart = 0;
  for (let f = Math.min(frame, VIDEO_END - 1); f >= 0 && sourceTime(f) >= STEPS[si][0]; f--) stepStart = f;
  const textIn = interpolate(frame - Math.max(stepStart, 70), [0, 16], [0, 1], eApple);

  return (
    <AbsoluteFill style={{ background: RED, fontFamily }}>
      <Audio src={staticFile("briz-music.mp3")} volume={volume} />
      <AbsoluteFill style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.07) 2px, transparent 2px)",
        backgroundSize: "64px 64px", backgroundPosition: `${shift}px ${shift}px`,
      }} />

      <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 - 0.06 * out})`, filter: `blur(${12 * out}px)` }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", color: CREAM }}>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 700, fontSize: 66, letterSpacing: -1.5, transform: `translateY(${(1 - ui(0)) * 100}%)` }}>Briz picture feature</div>
          </div>
          <div style={{ overflow: "hidden", marginTop: 6 }}>
            <div style={{ fontWeight: 500, fontSize: 34, opacity: 0.85, transform: `translateY(${(1 - ui(6)) * 100}%)` }}>Send it. Explain it. Get things done.</div>
          </div>
        </div>

        {/* Footage window */}
        <div style={{ position: "absolute", ...win, borderRadius: R * frameIn, overflow: "hidden", boxShadow: `0 30px 70px rgba(0,0,0,${0.3 * frameIn})` }}>
          <Footage w={win.width} h={win.height} />
        </div>

        {/* Caption panel carved out of the footage's bottom-right corner */}
        {(() => {
          const p = ui(10);
          const pw = PANEL.width * p, ph = PANEL.height;
          const right = 1080 - (win.left + win.width), bottom = 1920 - (win.top + win.height);
          if (p <= 0) return null;
          return (
            <>
              <div style={{
                position: "absolute", right, bottom, width: pw, height: ph, background: RED,
                borderTopLeftRadius: R, overflow: "hidden",
              }}>
                <div style={{ position: "absolute", left: 40, top: 26, width: PANEL.width - 60, color: CREAM, opacity: p }}>
                  <div style={{ fontWeight: 500, fontSize: 24, letterSpacing: 4, opacity: 0.75 }}>
                    STEP {String(si + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, fontSize: 42, letterSpacing: -0.5, whiteSpace: "nowrap", transform: `translateY(${(1 - textIn) * 100}%)`, opacity: textIn }}>
                      {STEPS[si][1]}
                    </div>
                  </div>
                </div>
                {/* progress along the steps */}
                <div style={{ position: "absolute", left: 40, bottom: 0, height: 5, width: (PANEL.width - 40) * ((si + 1) / STEPS.length), background: CREAM, opacity: 0.6 }} />
              </div>
              <Fillet style={{ right, bottom: bottom + ph }} />
              <Fillet style={{ right: right + pw, bottom }} />
            </>
          );
        })()}

        <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center", color: CREAM, fontWeight: 500, fontSize: 30, opacity: 0.8 * ui(14) }}>paywithbriz.com</div>
      </AbsoluteFill>

      {frame >= CUT - 6 && (
        <AbsoluteFill style={{ opacity: interpolate(frame, [CUT - 6, CUT + 6], [0, 1], clamp) }}>
          <Img src={staticFile("briz-bg.png")} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + 0.04 * card(0)})` }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: CREAM, textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 104, lineHeight: 1.08, letterSpacing: -3 }}>
              {["Start using", "Briz today."].map((line, i) => (
                <div key={i} style={{ overflow: "hidden" }}>
                  <div style={{ transform: `translateY(${(1 - card(6 + i * 5)) * 100}%)` }}>{line}</div>
                </div>
              ))}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
