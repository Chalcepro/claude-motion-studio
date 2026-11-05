import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRIZ } from "../lib/brands";
import { onTwos, boil, stickerFilter } from "../lib/sticker";
import { clamp } from "../lib/primitives";

// Step 2 (midground only): the phone sticker and its screens, telling the before-vs-Briz story.
// Shown on a plain board so it can be judged on its own; the halftone background and foreground stickers
// come in later steps. 18 s.
const W = 1080, H = 1920, INK = BRIZ.ink, RED = BRIZ.accent, CREAM = BRIZ.bg, F = BRIZ.font;
const GREEN = "#1DB45A", AMBER = "#F5A623", WA = "#1F6E5E", BUBBLE_ME = "#D3F5C6";
export const BRIZ_MID_STORY_FRAMES = 540;

// Beats
export const BEAT = { SEND_TAP: 40, PROCESS: 50, PENDING: 170, FAILED: 210, COMPLAIN: 236, FLIP: 300, TYPE: 330, TYPED: 380, ASK: 396, PIN: 420, SENT: 462, THANKS: 492 };
const TEXT = "Send 5k to Tolu";

const Spinner: React.FC<{ f: number }> = ({ f }) => (
  <svg width={120} height={120} viewBox="-60 -60 120 120">
    <circle r={44} fill="none" stroke="#E4DED5" strokeWidth={14} />
    <circle r={44} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeDasharray="70 300" transform={`rotate(${onTwos(f) * 9})`} />
  </svg>
);
const Row: React.FC<{ w: string; c?: string; h?: number }> = ({ w, c = "#E4DED5", h = 18 }) => <div style={{ width: w, height: h, borderRadius: h / 2, background: c, marginBottom: 18 }} />;

// --- Old way: a generic bank app ---
const BankScreen: React.FC<{ f: number }> = ({ f }) => {
  const pressed = f >= BEAT.SEND_TAP && f < BEAT.SEND_TAP + 6;
  const waiting = f >= BEAT.PROCESS && f < BEAT.PENDING;
  const mins = Math.min(9, 1 + Math.floor((f - BEAT.PROCESS) / 24));
  const failed = f >= BEAT.FAILED, pending = f >= BEAT.PENDING && !failed;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F7F4EF", fontFamily: F, color: INK, padding: "90px 46px", boxSizing: "border-box" }}>
      <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 40 }}>Transfer</div>
      <div style={{ fontSize: 26, color: "#8A8F96" }}>To</div>
      <div style={{ fontSize: 38, fontWeight: 600, marginBottom: 28 }}>Tolu A.</div>
      <div style={{ fontSize: 26, color: "#8A8F96" }}>Amount</div>
      <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, marginBottom: 30 }}>5,000</div>
      <Row w="80%" /><Row w="55%" />
      {f < BEAT.PROCESS && (
        <div style={{ marginTop: 40, height: 100, borderRadius: 50, background: pressed ? "#3A3F48" : INK, color: CREAM, fontSize: 40, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pressed ? 0.95 : 1})` }}>Send</div>
      )}
      {waiting && (
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Spinner f={f} />
          <div style={{ fontSize: 36, fontWeight: 600 }}>Processing…</div>
          <div style={{ fontSize: 28, color: "#8A8F96" }}>{mins} min</div>
        </div>
      )}
      {(pending || failed) && (
        <div style={{ marginTop: 40, borderRadius: 34, padding: "30px 34px", background: failed ? "#FDE3DE" : "#FFF1D6", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: failed ? RED : AMBER, color: "#fff", fontSize: 46, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{failed ? "×" : "!"}</div>
          <div>
            <div style={{ fontSize: 38, fontWeight: 800 }}>{failed ? "Transfer failed" : "Pending"}</div>
            <div style={{ fontSize: 26, color: "#6B7078" }}>{failed ? "Money may be reversed in 24 hrs" : "Please check back later"}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// A message notification dropping in at the top of the screen.
const Notice: React.FC<{ f: number; at: number; name: string; text: string; good?: boolean }> = ({ f, at, name, text, good }) => {
  const t = onTwos(f) - at;
  if (t < 0) return null;
  const y = interpolate(t, [0, 6, 8], [-180, 14, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 22, right: 22, top: 40 + y, borderRadius: 34, background: "#FFFFFF", padding: "22px 26px", display: "flex", gap: 20,
      alignItems: "center", fontFamily: F, boxShadow: "0 6px 0 rgba(0,0,0,0.12)" }}>
      <div style={{ width: 70, height: 70, borderRadius: 35, background: good ? GREEN : "#9AA3AE", color: "#fff", fontSize: 34, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{name[0]}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>{name}</div>
        <div style={{ fontSize: 30, color: "#3A3F48" }}>{text}</div>
      </div>
    </div>
  );
};

// --- Briz way: a WhatsApp-style chat with Briz ---
const Bubble: React.FC<{ me?: boolean; children: React.ReactNode; show: boolean }> = ({ me, children, show }) =>
  show ? <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "82%", background: me ? BUBBLE_ME : "#FFFFFF", borderRadius: 30, padding: "20px 26px", fontSize: 32, color: INK, marginBottom: 18, lineHeight: 1.3 }}>{children}</div> : null;
const ChatScreen: React.FC<{ f: number }> = ({ f }) => {
  const chars = Math.floor(interpolate(f, [BEAT.TYPE, BEAT.TYPED], [0, TEXT.length], clamp));
  const sentMine = f >= BEAT.TYPED + 6;
  const pinDots = Math.floor(interpolate(f, [BEAT.PIN, BEAT.PIN + 30], [0, 4], clamp));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#EDE5DA", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <div style={{ background: WA, height: 150, display: "flex", alignItems: "flex-end", padding: "0 30px 24px", gap: 20 }}>
        <div style={{ width: 70, height: 70, borderRadius: 22, background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={staticFile("briz-logo-cream.png")} style={{ width: 58 }} />
        </div>
        <div style={{ color: "#fff", fontSize: 36, fontWeight: 700, paddingBottom: 10 }}>Briz</div>
      </div>
      <div style={{ flex: 1, padding: "30px 26px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <Bubble me show={sentMine}>{TEXT}</Bubble>
        <Bubble show={f >= BEAT.ASK}>Send <b>5,000</b> to <b>Tolu A.</b>?<br />Enter your PIN</Bubble>
        {f >= BEAT.PIN && f < BEAT.SENT && (
          <div style={{ alignSelf: "flex-end", display: "flex", gap: 18, background: BUBBLE_ME, borderRadius: 30, padding: "24px 30px", marginBottom: 18 }}>
            {[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 26, height: 26, borderRadius: 13, background: i < pinDots ? INK : "#A9C9A0" }} />)}
          </div>
        )}
        <Bubble show={f >= BEAT.SENT}><span style={{ color: GREEN, fontWeight: 800 }}>Sent ✓</span> 5,000 to Tolu A.<br /><span style={{ fontSize: 24, color: "#6B7078" }}>in 3 seconds</span></Bubble>
      </div>
      <div style={{ margin: "0 22px 30px", height: 96, borderRadius: 48, background: "#fff", display: "flex", alignItems: "center", padding: "0 30px", fontSize: 32, color: chars ? INK : "#9AA3AE" }}>
        {sentMine ? "Message" : chars ? TEXT.slice(0, chars) : "Message"}{!sentMine && f >= BEAT.TYPE && Math.floor(f / 8) % 2 ? <span style={{ color: WA }}>|</span> : null}
      </div>
    </div>
  );
};

// The phone sticker: flips (on twos) from the bank app to the Briz chat.
export const StoryPhone: React.FC<{ f: number; x?: number; y?: number; scale?: number }> = ({ f, x = 540, y = 980, scale = 1 }) => {
  const flip = interpolate(onTwos(f), [BEAT.FLIP - 8, BEAT.FLIP, BEAT.FLIP + 8], [1, 0, 1], clamp);
  const chat = f >= BEAT.FLIP;
  const b = boil(f, 70, 0.6);
  // the failed moment slumps the phone; the Briz moment lifts it
  const slump = interpolate(f, [BEAT.FAILED, BEAT.FAILED + 10, BEAT.FLIP - 10, BEAT.FLIP], [0, 1, 1, 0], clamp);
  const lift = interpolate(f, [BEAT.SENT, BEAT.SENT + 8, BEAT.SENT + 20], [0, 1, 0.6], clamp);
  return (
    <div style={{ position: "absolute", left: x + b.dx, top: y + b.dy + slump * 30 - lift * 30, transform: `translate(-50%,-50%) rotate(${b.rot - slump * 5 + lift * 3}deg) scale(${scale * Math.max(0.02, flip)}, ${scale})`, filter: stickerFilter("rgba(70,25,0,0.3)") }}>
      <div style={{ width: 620, height: 1240, borderRadius: 86, background: INK, padding: 22, boxSizing: "border-box" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 66, overflow: "hidden" }}>
          {chat ? <ChatScreen f={f} /> : <BankScreen f={f} />}
          {!chat && <Notice f={f} at={BEAT.COMPLAIN} name="Tolu" text="I haven't received it o" />}
          {chat && <Notice f={f} at={BEAT.THANKS} name="Tolu" text="Got it, thanks!" good />}
        </div>
      </div>
    </div>
  );
};

export const BrizMidStory: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#CFC8BE" }}><StoryPhone f={f} /></AbsoluteFill>;
};
