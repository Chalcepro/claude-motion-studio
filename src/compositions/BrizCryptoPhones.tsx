import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

// The two phone screens of the Briz crypto ad, rendered as image sequences on the FILM's clock
// (frame N here = frame N in crypto_03_final.blend) and mapped onto the 3D phones.
const F = loadFont("normal", { weights: ["500", "600", "700", "800"] }).fontFamily;
export const PH_W = 900, PH_H = 1925, BRIZ_CRYPTO_PHONES_FRAMES = 1672;
const C = { bg: "#0C1412", panel: "#18211E", line: "#26322E", ink: "#F6F3EA", dim: "#8FA39B", green: "#25C05A", me: "#0F5A3C", them: "#1D2825", red: "#E72E08", cream: "#FDEBD0", teal: "#26A17B", key: "#39433F", kb: "#141B19" };

// ---- beats (film frames) ----
export const B = {
  NOTIF: 34, OPEN: 128, M2: 178, M3: 222, T1: 266, SEND1: 326, BACK: 368, TAP_BRIZ: 412, TMENU: 450, SENDM: 476, REPLY: 500, CHOOSE: 552,
  CRYPTO: 602, TOWALLET: 654, CONT: 684, NET: 734, TRON: 784, PASTE: 832, A1: 870, A2: 882, REVIEW: 922, TOPIN: 990, PIN: [1030, 1043, 1060, 1073], SENT: 1091,
  ARRIVE: 1127, G_OPEN: 1196, G_TYPE: 1234, G_SEND: 1290, R_CHAT: 1250, R_GOT: 1312, R_TYPE: 1362, R_SEND: 1414, G_GOT: 1434, SLEEP: 1508,
};
const TXT = { reply: "Say less. Sending now", menu: "Menu", wow: "Whoa, that was fast!", thanks: "All thanks to Briz" };
const RATE = 2;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (f: number, a: number, d = 9) => interpolate(f, [a, a + d], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
const back = (f: number, a: number, d = 11) => interpolate(f, [a, a + d], [0, 1], { ...cl, easing: Easing.out(Easing.back(1.7)) });
const typed = (t: string, a: number, f: number) => t.slice(0, Math.max(0, Math.floor((f - a) / RATE)));
const keyAt = (t: string, a: number, f: number) => { const i = Math.floor((f - a) / RATE) - 1; return i >= 0 && i < t.length ? t[i].toUpperCase() : ""; };
const box = (s: React.CSSProperties): React.CSSProperties => ({ position: "absolute", boxSizing: "border-box", ...s });

const Tap: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const f = useCurrentFrame(); if (f < at - 4 || f > at + 9) return null;
  const p = interpolate(f, [at - 4, at, at + 9], [0.4, 1, 1.7], cl);
  return <div style={box({ left: x - 62, top: y - 62, width: 124, height: 124, borderRadius: 62, background: f < at + 3 ? "rgba(253,235,208,.55)" : "transparent", border: `9px solid ${C.cream}`, transform: `scale(${p})`, opacity: interpolate(f, [at + 2, at + 9], [1, 0], cl), zIndex: 50 })} />;
};
const Status: React.FC<{ t: string }> = ({ t }) => (
  <div style={box({ left: 64, right: 60, top: 34, height: 60, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 40, fontWeight: 700, color: C.ink, zIndex: 40 })}>
    <span>{t}</span>
    <svg width={92} height={36} viewBox="0 0 92 36"><rect x={2} y={22} width={8} height={12} rx={2} fill={C.ink} /><rect x={14} y={14} width={8} height={20} rx={2} fill={C.ink} /><rect x={26} y={6} width={8} height={28} rx={2} fill={C.ink} /><rect x={46} y={6} width={42} height={26} rx={8} fill="none" stroke={C.ink} strokeWidth={4} /><rect x={51} y={11} width={26} height={16} rx={4} fill={C.ink} /></svg>
  </div>
);
const Avatar: React.FC<{ who: string; s?: number }> = ({ who, s = 92 }) => who === "Briz"
  ? <div style={{ width: s, height: s, borderRadius: s, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Img src={staticFile("briz-mark.png")} style={{ width: s * 0.62 }} /></div>
  : <div style={{ width: s, height: s, borderRadius: s, background: who === "Tunde" ? "#36CB6C" : "#F5283A", color: "#12070A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: s * 0.46, fontWeight: 800, flexShrink: 0 }}>{who[0]}</div>;
const ChatIcon: React.FC<{ s?: number }> = ({ s = 92 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><rect width={100} height={100} rx={26} fill={C.green} /><path d="M50 22c17 0 30 11 30 27S67 76 50 76c-5 0-9-1-13-2l-16 6 5-14c-4-5-6-10-6-17 0-16 13-27 30-27z" fill="#fff" /></svg>
);
const Head: React.FC<{ who: string; sub: string; tick?: boolean }> = ({ who, sub, tick }) => (
  <div style={box({ left: 0, right: 0, top: 0, height: 262, background: C.panel, borderBottom: `4px solid ${C.line}`, display: "flex", alignItems: "flex-end", gap: 26, padding: "0 36px 24px", zIndex: 10 })}>
    <svg width={44} height={92} viewBox="0 0 44 92"><path d="M34 22 12 46l22 24" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /></svg>
    <Avatar who={who} s={104} />
    <div><div style={{ fontSize: 50, fontWeight: 700, color: C.ink, display: "flex", gap: 14, alignItems: "center" }}>{who}{tick && <svg width={42} height={42} viewBox="0 0 42 42"><circle cx={21} cy={21} r={20} fill="#2E8BFF" /><path d="m12 22 6 6 12-13" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}</div><div style={{ fontSize: 34, fontWeight: 500, color: C.dim }}>{sub}</div></div>
  </div>
);

type Msg = { at: number; me?: boolean; t: string; mono?: boolean; node?: React.ReactNode };
const Bubbles: React.FC<{ msgs: Msg[]; bottom: number }> = ({ msgs, bottom }) => {
  const f = useCurrentFrame();
  return (
    <div style={box({ left: 0, right: 0, top: 262, bottom, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 34px 26px", overflow: "hidden" })}>
      {msgs.filter((m) => f >= m.at).map((m, i) => {
        const p = back(f, m.at);
        return <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", transformOrigin: m.me ? "100% 100%" : "0 100%", transform: `scale(${0.6 + 0.4 * p})`, maxHeight: 900 * ease(f, m.at, 7), marginTop: 22 * ease(f, m.at, 7), maxWidth: 730, flexShrink: 0 }}>
          <div style={{ background: m.me ? C.me : C.them, color: C.ink, fontSize: m.mono ? 46 : 54, fontWeight: 600, lineHeight: 1.22, borderRadius: 40, borderBottomRightRadius: m.me ? 8 : 40, borderBottomLeftRadius: m.me ? 40 : 8, padding: m.node ? 0 : "26px 38px", overflow: "hidden" }}>{m.node ?? m.t}</div>
        </div>;
      })}
    </div>
  );
};
const Input: React.FC<{ text: string; bottom: number; press?: boolean }> = ({ text, bottom, press }) => {
  const f = useCurrentFrame();
  return <div style={box({ left: 0, right: 0, bottom, height: 132, background: C.bg, display: "flex", alignItems: "center", gap: 22, padding: "0 30px" })}>
    <div style={{ flex: 1, height: 98, borderRadius: 49, background: C.panel, border: `4px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 36px", fontSize: 48, fontWeight: 600, color: text ? C.ink : C.dim, whiteSpace: "pre" }}>{text || "Message"}{bottom > 100 && <span style={{ width: 5, height: 54, background: C.green, marginLeft: 4, opacity: f % 20 < 12 ? 1 : 0 }} />}</div>
    <div style={{ width: 100, height: 100, borderRadius: 50, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press ? 0.8 : 1})` }}><svg width={56} height={56} viewBox="0 0 56 56"><path d="M10 8 50 28 10 48l5-17 19-3-19-3z" fill="#06140C" /></svg></div>
  </div>;
};
const KB_H = 640;
const Keyboard: React.FC<{ k: string; y: number }> = ({ k, y }) => (
  <div style={box({ left: 0, right: 0, bottom: -y, height: KB_H, background: C.kb, padding: "22px 12px" })}>
    {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((r, i) => (
      <div key={r} style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 18 }}>
        {r.split("").map((c) => <div key={c} style={{ width: 78, height: 116, borderRadius: 18, background: k === c ? C.cream : C.key, color: k === c ? "#12070A" : C.ink, fontSize: 48, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", transform: k === c ? "translateY(-16px) scale(1.22)" : "none", zIndex: k === c ? 5 : 1 }}>{c}</div>)}
      </div>))}
    <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
      <div style={{ width: 170, height: 112, borderRadius: 18, background: C.key, color: C.ink, fontSize: 40, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>123</div>
      <div style={{ width: 470, height: 112, borderRadius: 18, background: k === " " ? C.cream : C.key }} />
      <div style={{ width: 170, height: 112, borderRadius: 18, background: C.key }} />
    </div>
  </div>
);
/** Page that slides in from the right at `at` and stays. */
const Page: React.FC<{ at: number; children: React.ReactNode; bg?: string; up?: boolean }> = ({ at, children, bg = C.bg, up }) => {
  const f = useCurrentFrame(); if (f < at) return null; const p = 1 - ease(f, at, 9);
  return <div style={box({ inset: 0, background: bg, overflow: "hidden", transform: up ? `translateY(${p * 100}%)` : `translateX(${p * 100}%)` })}>{children}</div>;
};
const Wall: React.FC<{ c: string[] }> = ({ c }) => (
  <svg style={box({ inset: 0 })} width={PH_W} height={PH_H} viewBox={`0 0 ${PH_W} ${PH_H}`}><rect width={PH_W} height={PH_H} fill={c[0]} /><path d={`M${PH_W} 0V${PH_H}H520L-80 ${PH_H}L760 0z`} fill={c[1]} /><path d={`M${PH_W} 500V${PH_H}H300z`} fill={c[2]} /></svg>
);
const Lock: React.FC<{ time: string; c: string[]; at: number; icon: React.ReactNode; title: string; body: string; from: string }> = ({ time, c, at, icon, title, body, from }) => {
  const f = useCurrentFrame(), p = back(f, at, 13);
  return <div style={box({ inset: 0 })}><Wall c={c} />
    <div style={box({ left: 0, right: 0, top: 230, textAlign: "center", color: C.cream, fontWeight: 800, fontSize: 250, letterSpacing: -10 })}>{time}</div>
    <div style={box({ left: 0, right: 0, top: 180, textAlign: "center", color: C.cream, fontWeight: 600, fontSize: 46 })}>Monday, 23 November</div>
    {f >= at && <div style={box({ left: 34, right: 34, top: 700, background: C.bg, borderRadius: 60, padding: "40px 42px", display: "flex", gap: 34, transform: `translateY(${(1 - p) * -180}px) scale(${0.6 + 0.4 * p})`, opacity: ease(f, at, 4) })}>
      {icon}<div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 38, color: C.dim, fontWeight: 600 }}><span>{from}</span><span>now</span></div><div style={{ fontSize: 58, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>{title}</div><div style={{ fontSize: 50, fontWeight: 600, color: C.ink, lineHeight: 1.25 }}>{body}</div></div>
    </div>}
  </div>;
};

// ---- Briz sheet, same order and wording as the product walkthrough ----
const Sheet: React.FC<{ title: string; prog: number; children: React.ReactNode; btn?: string; on?: boolean; press?: boolean; cancel?: boolean }> = ({ title, prog, children, btn, on, press, cancel }) => (
  <div style={box({ inset: 0, background: C.bg })}>
    <div style={box({ left: 0, right: 0, top: 130, bottom: 0, background: "#111917", borderTopLeftRadius: 50, borderTopRightRadius: 50 })}>
      <div style={box({ left: 400, top: 18, width: 100, height: 10, borderRadius: 5, background: C.key })} />
      <div style={box({ left: 44, right: 44, top: 52, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 46, fontWeight: 700, color: C.ink })}><span style={{ color: cancel ? C.green : C.ink, fontWeight: 600, minWidth: 130 }}>{cancel ? "Cancel" : "‹"}</span><span>{title}</span><span style={{ minWidth: 130, textAlign: "right", color: C.green }}>•••</span></div>
      <div style={box({ left: 44, right: 44, top: 132, height: 8, borderRadius: 4, background: C.line })}><div style={{ width: `${prog}%`, height: 8, borderRadius: 4, background: C.green }} /></div>
      <div style={box({ left: 44, right: 44, top: 172, bottom: 250 })}>{children}</div>
      {btn && <div style={box({ left: 44, right: 44, bottom: 118, height: 116, borderRadius: 36, background: on ? C.green : "#1C2522", color: on ? "#06140C" : "#4C5A55", fontSize: 48, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press ? 0.95 : 1})` })}>{btn}</div>}
      <div style={box({ left: 0, right: 0, bottom: 46, textAlign: "center", fontSize: 32, color: C.dim, fontWeight: 500 })}>Managed by Briz by Noirtech. <span style={{ color: C.green }}>Learn more</span></div>
    </div>
  </div>
);
const Row: React.FC<{ t: string; s?: string; c?: string; g?: string; hot?: boolean; check?: boolean; h?: number }> = ({ t, s, c, g, hot, check, h = 146 }) => (
  <div style={{ height: h, display: "flex", alignItems: "center", gap: 30, padding: "0 32px", background: hot ? "#2A3833" : "transparent", borderBottom: `3px solid ${C.line}` }}>
    {c && <div style={{ width: 88, height: 88, borderRadius: 24, background: c, color: "#fff", fontSize: 52, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{g}</div>}
    <div style={{ flex: 1 }}><div style={{ fontSize: 46, fontWeight: 700, color: C.ink }}>{t}</div>{s && <div style={{ fontSize: 34, fontWeight: 500, color: C.dim }}>{s}</div>}</div>
    {check && <div style={{ width: 54, height: 54, borderRadius: 27, background: C.green, color: "#06140C", fontSize: 38, fontWeight: 800, textAlign: "center", lineHeight: "54px" }}>✓</div>}
  </div>
);
const Card: React.FC = () => (
  <div style={{ position: "relative", height: 430, borderRadius: 40, background: C.red, overflow: "hidden", color: C.cream }}>
    <svg style={box({ inset: 0 })} width={812} height={430}><path d="M470 0H812V430H230z" fill="#FF5A2A" /><path d="M640 0H812V430H400z" fill="#FF7A3C" /></svg>
    <Img src={staticFile("briz-logo-cream.png")} style={box({ left: 24, top: 18, width: 225 })} />
    <div style={box({ left: 46, top: 168, fontSize: 38, fontWeight: 600 })}>Dollar wallet</div>
    <div style={box({ left: 44, top: 208, fontSize: 124, fontWeight: 800, letterSpacing: -3 })}>$120.00</div>
    <div style={box({ right: 40, bottom: 36, fontSize: 36, fontWeight: 800, border: `5px solid ${C.cream}`, borderRadius: 40, padding: "6px 28px" })}>USDT</div>
  </div>
);
const Field: React.FC<{ l: string; v: string; hot?: boolean }> = ({ l, v, hot }) => (
  <div style={{ background: C.panel, border: `4px solid ${hot ? C.green : C.panel}`, borderRadius: 34, padding: "30px 36px", marginTop: 26, display: "flex", gap: 24, alignItems: "center", minHeight: 124, boxSizing: "border-box" }}>
    <div style={{ width: 270, fontSize: 42, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>{l}</div><div style={{ fontSize: 46, fontWeight: 600, color: C.ink }}>{v}</div>
  </div>
);
const TITLE: React.CSSProperties = { fontSize: 66, fontWeight: 800, color: C.ink, lineHeight: 1.15 };

const BrizFlow: React.FC = () => {
  const f = useCurrentFrame(); const pr = (a: number) => f >= a && f < a + 6;
  const amt = f >= B.A2 ? "20" : f >= B.A1 ? "2" : ""; const ready = f >= B.A2;
  const pins = B.PIN.filter((x) => f >= x).length;
  return <>
    <Page at={B.CHOOSE + 4} up><Sheet title="Briz" prog={12} cancel><div style={{ background: C.panel, borderRadius: 36, overflow: "hidden" }}>
      <Row t="Balance" s="View your wallet" c="#F08A1D" g="▣" /><Row t="Add Funds" s="Top up your wallet" c="#128C7E" g="+" /><Row t="Send Money" s="To any bank account" c="#DE5324" g="⇄" />
      <Row t="Crypto" s="Dollar wallet, USDT" c="#F2B21B" g="₿" hot={f >= B.CRYPTO - 3} /><Row t="Briz BioPass" s="Emergency Wallet" c="#20264F" g="◉" /><Row t="Profile & Settings" s="Account & settings" c="#7A6F66" g="●" /><Row t="Ajo" s="Rotating savings" c="#B8609A" g="⚇" /><Row t="Help & Support" s="Talk to our team" c="#4B8B74" g="?" />
    </div></Sheet></Page>
    <Page at={B.CRYPTO + 4}><Sheet title="Crypto" prog={38} btn="Continue" on={f >= B.TOWALLET} press={pr(B.CONT)}><Card /><div style={{ ...TITLE, marginTop: 34 }}>Dollar wallet</div><div style={{ fontSize: 42, fontWeight: 700, color: C.ink, margin: "26px 0 18px" }}>What would you like to do?</div>
      <div style={{ background: C.panel, borderRadius: 36, overflow: "hidden" }}><Row t="Send to a wallet" s="Choose the network" hot={f >= B.TOWALLET} check={f >= B.TOWALLET} h={136} /><Row t="Sell dollars for naira" s="Naira goes to your Briz wallet" h={136} /><Row t="Add money with naira" s="Auto-converted to USDT" h={136} /><Row t="Receive USDT" s="Choose a network, get your address" h={136} /></div></Sheet></Page>
    <Page at={B.CONT + 4}><Sheet title="Send Crypto" prog={52} btn="Review transfer" on={ready} press={pr(B.REVIEW)}><div style={TITLE}>Send Crypto</div><div style={{ fontSize: 42, color: C.ink, fontWeight: 500, marginTop: 8 }}>Send USDT to an external wallet.</div><div style={{ fontSize: 36, color: C.dim, fontWeight: 600, marginTop: 24 }}>Available balance</div><div style={{ fontSize: 60, color: C.ink, fontWeight: 800 }}>$120.00 USDT</div>
      <Field l="Network" v={f >= B.TRON + 4 ? "Tron (TRC-20)" : ""} hot={pr(B.NET)} /><Field l="Recipient wallet..." v={f >= B.PASTE ? "TQ7x…9fKd" : ""} hot={f >= B.PASTE - 6 && f < B.A1 - 16} /><Field l="Amount to send..." v={amt ? "$" + amt : ""} hot={f >= B.A1 - 16 && f < B.REVIEW} />
      <div style={{ fontSize: 34, color: C.dim, fontWeight: 500, marginTop: 30, lineHeight: 1.35 }}>Network fee $1.00 + Briz fee 1% (min $0.25, max $5.00).</div></Sheet></Page>
    {f < B.TRON + 14 && <div style={box({ inset: 0, transform: `translateX(${ease(f, B.TRON + 4, 9) * 100}%)` })}><Page at={B.NET + 4}><Sheet title="Network" prog={52}><div style={{ background: C.panel, borderRadius: 36, overflow: "hidden" }}><Row t="Tron (TRC-20) (min $10)" c="#E0263C" g="T" hot={f >= B.TRON - 3} /><Row t="Solana (min $1)" c="#1B1530" g="S" /><Row t="BSC (BEP-20) (min $1)" c="#E3A812" g="B" /><Row t="Polygon (min $1)" c="#6A2BE0" g="P" /><Row t="Ethereum (min $1)" c="#5B6A88" g="E" /><Row t="Arbitrum (min $1)" c="#2B6FC0" g="A" /><Row t="Optimism (min $1)" c="#F0142F" g="O" /></div></Sheet></Page></div>}
    <Page at={B.REVIEW + 4}><Sheet title="Confirm" prog={70} btn="Continue to PIN" on press={pr(B.TOPIN)}><div style={TITLE}>Review and confirm</div>
      <div style={{ background: C.panel, borderRadius: 40, padding: "20px 40px", marginTop: 40 }}>{[["Send", "$20.00 USDT"], ["To", "TQ7x…9fKd"], ["Network", "Tron (TRC-20)"], ["Network fee", "$1.00"], ["Briz fee", "$0.25"]].map(([a, b]) => <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 46, padding: "26px 0", color: C.ink, fontWeight: 700 }}><span style={{ color: C.dim, fontWeight: 600 }}>{a}</span><span>{b}</span></div>)}</div></Sheet></Page>
    {f >= B.TOPIN + 4 && <div style={box({ inset: 0, background: `rgba(0,0,0,${0.6 * ease(f, B.TOPIN + 4)})` })}><div style={box({ left: 0, right: 0, bottom: 0, height: 1350, background: "#111917", borderTopLeftRadius: 60, borderTopRightRadius: 60, transform: `translateY(${(1 - ease(f, B.TOPIN + 4, 11)) * 100}%)`, textAlign: "center", paddingTop: 70 })}>
      <div style={TITLE}>Enter your PIN</div><div style={{ fontSize: 42, color: C.dim, fontWeight: 600, marginTop: 10 }}>Sending $20.00 USDT</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 46, margin: "60px 0 70px" }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 66, height: 66, borderRadius: 33, border: `7px solid ${i < pins ? C.green : C.key}`, background: i < pins ? C.green : "transparent", transform: `scale(${i < pins ? 0.7 + 0.3 * back(f, B.PIN[i], 8) : 1})` }} />)}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: "0 50px" }}>{["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => { const hot = ["3", "7", "1", "9"].some((d, j) => d === k && pr(B.PIN[j])); return <div key={i} style={{ width: 253, height: 160, borderRadius: 34, background: k ? (hot ? C.cream : C.key) : "transparent", color: hot ? "#12070A" : C.ink, fontSize: 70, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transform: hot ? "scale(.94)" : "none" }}>{k}</div>; })}</div>
    </div></div>}
    {f >= B.SENT && <div style={box({ inset: 0, background: C.red, clipPath: `circle(${ease(f, B.SENT, 12) * 130}% at 50% 50%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.cream })}>
      <div style={{ width: 330, height: 330, borderRadius: 165, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${back(f, B.SENT + 2, 14)})` }}><svg width={220} height={220} viewBox="0 0 100 100"><path d="m20 52 20 20 40-44" fill="none" stroke={C.red} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset={100 - 100 * ease(f, B.SENT + 5, 10)} /></svg></div>
      <div style={{ fontSize: 170, fontWeight: 800, letterSpacing: -5, marginTop: 50 }}>Sent</div><div style={{ fontSize: 76, fontWeight: 700 }}>$20.00 USDT</div>
    </div>}
  </>;
};

const ASK = "Hey bro, you fit send me crypto?", WHERE = "I'm all the way in Canada", ADDR = "TQ7x…9fKd";
const RedPhone: React.FC = () => {
  const f = useCurrentFrame();
  if (f < B.NOTIF - 2 || f >= B.SLEEP + 6) return <AbsoluteFill style={{ background: "#2A060C" }} />;
  const kb1 = f < B.SEND1 + 8 ? ease(f, B.T1 - 10) : 1 - ease(f, B.SEND1 + 8);
  const kbM = f < B.SENDM + 2 ? ease(f, B.TMENU - 10) : 1 - ease(f, B.SENDM + 2);
  const kb2 = f < B.R_SEND + 10 ? ease(f, B.R_TYPE - 12) : 1 - ease(f, B.R_SEND + 10);
  const before: Msg[] = [{ at: 0, t: ASK }, { at: B.M2, t: WHERE }, { at: B.M3, t: ADDR, mono: true, node: <div style={{ padding: "26px 38px", fontSize: 46 }}><div style={{ fontSize: 36, color: C.dim }}>USDT · Tron</div>{ADDR}</div> }, { at: B.SEND1, me: true, t: TXT.reply }];
  return <AbsoluteFill style={{ background: C.bg, fontFamily: F, overflow: "hidden" }}>
    <Lock time="7:12" c={["#8F0A18", "#B80F1E", "#DB1726"]} at={B.NOTIF} icon={<ChatIcon s={120} />} from="WhatsApp" title="Tunde" body={ASK} />
    <Page at={B.OPEN + 4}><Head who="Tunde" sub="online" /><Bubbles msgs={before} bottom={132 + KB_H * kb1} /><Input text={f < B.SEND1 ? typed(TXT.reply, B.T1, f) : ""} bottom={KB_H * kb1} press={f >= B.SEND1 - 3 && f < B.SEND1 + 3} /><Keyboard k={keyAt(TXT.reply, B.T1, f)} y={KB_H * (1 - kb1)} /></Page>
    <Page at={B.BACK + 2}><div style={box({ left: 44, top: 150, fontSize: 96, fontWeight: 800, color: C.ink })}>Chats</div>
      <div style={box({ left: 0, right: 0, top: 310 })}>{([["Tunde", "You: " + TXT.reply], ["Briz", "What would you like to do today?"], ["Family", "Mum: Have you eaten?"], ["Gym guys", "Leg day tomorrow"]] as const).map(([a, b], i) => <div key={a} style={{ display: "flex", gap: 32, alignItems: "center", height: 200, padding: "0 44px", background: i === 1 && f >= B.TAP_BRIZ - 3 ? "#22302B" : "transparent", borderBottom: `3px solid ${C.line}` }}><Avatar who={a} s={124} /><div><div style={{ fontSize: 52, fontWeight: 700, color: C.ink }}>{a}</div><div style={{ fontSize: 40, fontWeight: 500, color: C.dim }}>{b}</div></div></div>)}</div></Page>
    <Page at={B.TAP_BRIZ + 4}><Head who="Briz" sub="Briz by Noirtech" tick /><Bubbles bottom={132 + KB_H * kbM} msgs={[{ at: B.SENDM, me: true, t: "Menu" }, { at: B.REPLY, t: "", node: <div style={{ width: 720 }}><div style={{ background: C.cream, color: "#12070A", padding: "36px 40px", fontSize: 74, fontWeight: 700, lineHeight: 1.1 }}>You're Here.<br />Welcome to <span style={{ color: C.red }}>Briz</span></div><div style={{ padding: "28px 40px", fontSize: 44 }}>Balance: $120.00 USDT<br /><br />What would you like to do today?</div><div style={{ borderTop: `4px solid ${C.line}`, textAlign: "center", padding: "28px 0", color: C.green, fontSize: 48, fontWeight: 700 }}>Choose Action</div></div> }]} />
      <Input text={f < B.SENDM ? typed(TXT.menu, B.TMENU, f) : ""} bottom={KB_H * kbM} press={f >= B.SENDM - 3 && f < B.SENDM + 3} /><Keyboard k={keyAt(TXT.menu, B.TMENU, f)} y={KB_H * (1 - kbM)} /></Page>
    <BrizFlow />
    <Page at={B.R_CHAT}><Head who="Tunde" sub={f > B.G_TYPE && f < B.R_GOT ? "typing…" : "online"} /><Bubbles msgs={[...before, { at: B.R_GOT, t: TXT.wow }, { at: B.R_SEND, me: true, t: TXT.thanks }]} bottom={132 + KB_H * kb2} /><Input text={f < B.R_SEND ? typed(TXT.thanks, B.R_TYPE, f) : ""} bottom={KB_H * kb2} press={f >= B.R_SEND - 3 && f < B.R_SEND + 3} /><Keyboard k={keyAt(TXT.thanks, B.R_TYPE, f)} y={KB_H * (1 - kb2)} /></Page>
    <Status t="7:12" />
    <Tap x={450} y={830} at={B.OPEN} /><Tap x={380} y={1860} at={B.T1 - 13} /><Tap x={838} y={1218} at={B.SEND1} /><Tap x={60} y={200} at={B.BACK} /><Tap x={380} y={1860} at={B.TMENU - 13} /><Tap x={838} y={1218} at={B.SENDM} /><Tap x={380} y={1860} at={B.R_TYPE - 15} /><Tap x={838} y={1218} at={B.R_SEND} /><Tap x={450} y={610} at={B.TAP_BRIZ} /><Tap x={394} y={1700} at={B.CHOOSE} />
    <Tap x={450} y={813} at={B.CRYPTO} /><Tap x={450} y={1090} at={B.TOWALLET} /><Tap x={450} y={1749} at={B.CONT} /><Tap x={500} y={660} at={B.NET} /><Tap x={450} y={375} at={B.TRON} /><Tap x={600} y={835} at={B.PASTE - 4} /><Tap x={600} y={1020} at={B.A1 - 16} /><Tap x={450} y={1749} at={B.REVIEW} /><Tap x={450} y={1749} at={B.TOPIN} />
    {f >= B.SLEEP && <AbsoluteFill style={{ background: "#2A060C", opacity: ease(f, B.SLEEP, 6), zIndex: 99 }} />}
  </AbsoluteFill>;
};
const GreenPhone: React.FC = () => {
  const f = useCurrentFrame();
  const kb = f < B.G_SEND + 10 ? ease(f, B.G_TYPE - 12) : 1 - ease(f, B.G_SEND + 10);
  return <AbsoluteFill style={{ background: C.bg, fontFamily: F, overflow: "hidden" }}>
    <Lock time="1:12" c={["#0F6A35", "#168A46", "#22AB58"]} at={B.ARRIVE} icon={<Avatar who="Briz" s={120} />} from="Briz" title="USDT received" body="+$20.00 USDT" />
    <Page at={B.G_OPEN}><Head who="Emeka" sub="online" /><Bubbles msgs={[{ at: 0, me: true, t: ASK }, { at: 0, me: true, t: WHERE }, { at: 0, me: true, t: ADDR, mono: true }, { at: 0, t: TXT.reply }, { at: B.G_SEND, me: true, t: TXT.wow }, { at: B.G_GOT, t: TXT.thanks }]} bottom={132 + KB_H * kb} /><Input text={f < B.G_SEND ? typed(TXT.wow, B.G_TYPE, f) : ""} bottom={KB_H * kb} press={f >= B.G_SEND - 3 && f < B.G_SEND + 3} /><Keyboard k={keyAt(TXT.wow, B.G_TYPE, f)} y={KB_H * (1 - kb)} /></Page>
    <Status t="1:12" /><Tap x={450} y={800} at={B.G_OPEN - 3} /><Tap x={380} y={1860} at={B.G_TYPE - 15} /><Tap x={838} y={1218} at={B.G_SEND} />
  </AbsoluteFill>;
};
export const BrizCryptoPhones: React.FC<{ side: "R" | "G" }> = ({ side }) => (side === "R" ? <RedPhone /> : <GreenPhone />);
