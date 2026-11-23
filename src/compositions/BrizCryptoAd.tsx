import React from "react";
import {
  AbsoluteFill, Audio, Img, interpolate,
  Sequence, staticFile, useCurrentFrame,
} from "remotion";
import { clamp, eApple, eSmooth, Reveal, MaskUp } from "../lib/primitives";
import { BRIZ } from "../lib/brands";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const W = 1080, H = 1920;
const OL = "#0D0D0D"; // outline
const F = BRIZ.font;  // Poppins (triggers font load)

// Room palettes — Powerpuff flat fills + outlines
const RED = { bg: "#C0392B", fl: "#A93226", dk: "#6E110A", md: "#8B1A10", sf: "#922B21", sh: "#F5EBD0" };
const GRN = { bg: "#1E8449", fl: "#17602E", dk: "#0A3A1E", md: "#0D4B28", sf: "#145A32", sh: "#D5F5E3" };
type Env = typeof RED;

const WA_BG = "#0B141A", WA_HEAD = "#1F2C34", WA_USER = "#005C4B";
const USDT_C = "#26A17B", USDT_DK = "#1B7560";

// ─── BEAT TIMINGS ────────────────────────────────────────────────────────────
const NOTIF_AT   = 80;   // phone ping
const CAM_PUSH   = 115;  // camera push plateau
const ZOOM_S     = 125;  // match-cut out starts
const ZOOM_E     = 172;  // match-cut out ends
const CHAT_S     = 158;  // chat fades in
const SENT_AT    = 230;  // chat "sent" appears
const CHAT_OUT   = 242;  // chat fades out
const SPLIT_S    = 254;  // split doors start
const WIPE_E     = 282;  // split doors fully open
const COIN_S     = 290;  // coin launches
const COIN_E     = 318;  // coin arrives
const RCV_AT     = 316;  // receive confirmation starts
const SPLIT_OUT  = 332;  // split fades out
const BRAND_S    = 338;  // brand fades in
export const BRIZ_CRYPTO_AD_FRAMES = 390;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const qb = (t: number, a: number, b: number, c: number) =>
  (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c;

// ─── SVG ROOM ELEMENTS ───────────────────────────────────────────────────────

const Sofa: React.FC<{ e: Env; x?: number }> = ({ e, x = 22 }) => (
  <g>
    <ellipse cx={x + 252} cy={1514} rx={240} ry={22} fill="rgba(0,0,0,0.3)" />
    {/* back */}
    <rect x={x} y={1216} width={486} height={106} rx={18} fill={e.sf} stroke={OL} strokeWidth={3} />
    {/* armrests */}
    <rect x={x} y={1230} width={82} height={278} rx={14} fill={e.dk} stroke={OL} strokeWidth={3} />
    <rect x={x + 426} y={1230} width={82} height={278} rx={14} fill={e.dk} stroke={OL} strokeWidth={3} />
    {/* seat */}
    <rect x={x + 50} y={1312} width={436} height={198} rx={14} fill={e.md} stroke={OL} strokeWidth={3} />
    {/* cushion dividers */}
    <line x1={x + 190} y1={1312} x2={x + 190} y2={1500} stroke={OL} strokeWidth={2.5} />
    <line x1={x + 340} y1={1312} x2={x + 340} y2={1500} stroke={OL} strokeWidth={2.5} />
    {/* highlights */}
    {[x + 56, x + 196, x + 348].map((rx2, i) => (
      <rect key={i} x={rx2} y={1320} width={126} height={26} rx={8} fill="rgba(255,255,255,0.09)" />
    ))}
  </g>
);

const Lamp: React.FC<{ e: Env; cx?: number }> = ({ e, cx = 870 }) => (
  <g>
    {/* pole (behind shade) */}
    <rect x={cx - 7} y={618} width={14} height={920} rx={7} fill="#2A2A2A" stroke={OL} strokeWidth={1.5} />
    {/* glow */}
    <ellipse cx={cx} cy={630} rx={190} ry={150} fill={`${e.sh}22`} />
    {/* shade */}
    <ellipse cx={cx} cy={618} rx={96} ry={58} fill={e.sh} stroke={OL} strokeWidth={2.5} />
    {/* underside depth */}
    <ellipse cx={cx} cy={632} rx={72} ry={28} fill={e.sf} />
    {/* inner warm light */}
    <ellipse cx={cx} cy={610} rx={54} ry={22} fill={`${e.sh}80`} />
    {/* base */}
    <ellipse cx={cx} cy={1538} rx={52} ry={18} fill={OL} />
  </g>
);

const ArtFrame: React.FC<{ e: Env }> = ({ e }) => (
  <g>
    <rect x={345} y={278} width={265} height={198} rx={10} fill={e.md} stroke={OL} strokeWidth={3.5} />
    <rect x={363} y={296} width={229} height={162} rx={6} fill={e.sf} />
    {/* abstract shapes in frame */}
    <rect x={370} y={304} width={82} height={148} rx={4} fill={e.bg} />
    <circle cx={502} cy={378} r={48} fill={e.dk} />
    <rect x={425} y={362} width={96} height={12} rx={6} fill="rgba(255,255,255,0.1)" />
    <rect x={425} y={382} width={120} height={12} rx={6} fill="rgba(255,255,255,0.08)" />
  </g>
);

const Plant: React.FC<{ e: Env; green?: boolean }> = ({ e, green }) => {
  const lf = green ? "#0A3A1E" : "#1A5C38";
  const pt = green ? "#082F17" : "#5D1E0A";
  return (
    <g>
      <path d={`M 892 1548 L 912 1430 L 982 1430 L 1002 1548 Z`} fill={pt} stroke={OL} strokeWidth={2.5} />
      <ellipse cx={947} cy={1430} rx={35} ry={12} fill="#4A1A08" stroke={OL} strokeWidth={2} />
      <line x1={947} y1={1430} x2={936} y2={1332} stroke={lf} strokeWidth={5.5} />
      <line x1={947} y1={1390} x2={965} y2={1302} stroke={lf} strokeWidth={4.5} />
      <line x1={947} y1={1365} x2={928} y2={1265} stroke={lf} strokeWidth={4} />
      <ellipse cx={935} cy={1330} rx={46} ry={29} fill={lf} stroke={OL} strokeWidth={2.5} transform="rotate(-28 935 1330)" />
      <ellipse cx={966} cy={1300} rx={44} ry={28} fill={lf} stroke={OL} strokeWidth={2.5} transform="rotate(18 966 1300)" />
      <ellipse cx={925} cy={1263} rx={42} ry={26} fill={lf} stroke={OL} strokeWidth={2.5} transform="rotate(-12 925 1263)" />
      <ellipse cx={962} cy={1240} rx={40} ry={25} fill={lf} stroke={OL} strokeWidth={2.5} transform="rotate(32 962 1240)" />
    </g>
  );
};

// Phone device + table, fully parameterised
interface PhoneProps {
  e: Env; cx?: number; f: number;
  notifAt: number;
  sentAt?: number;
  rcvAt?: number;
}
const PhoneOnTable: React.FC<PhoneProps> = ({ e, cx = 550, f, notifAt, sentAt, rcvAt }) => {
  const hW = 62, hH = 134;
  const px = cx - hW, py = 1360 - hH; // top-left of phone body

  const ng   = interpolate(f, [notifAt, notifAt + 15, notifAt + 50], [0, 1, 0], clamp);
  const scrOn = interpolate(f, [notifAt, notifAt + 10], [0, 1], eApple);
  const sentP = sentAt ? interpolate(f, [sentAt, sentAt + 22], [0, 1], eApple) : 0;
  const rcvP  = rcvAt  ? interpolate(f, [rcvAt,  rcvAt  + 22], [0, 1], eApple) : 0;

  return (
    <g>
      {/* TABLE */}
      <ellipse cx={cx} cy={1512} rx={165} ry={18} fill="rgba(0,0,0,0.26)" />
      <rect x={cx - 158} y={1480} width={316} height={52} rx={14} fill="#3D2010" stroke={OL} strokeWidth={3} />
      <rect x={cx - 145} y={1527} width={290} height={12} rx={6} fill="#2A1508" />
      <rect x={cx - 140} y={1532} width={28} height={118} rx={9} fill="#3D2010" stroke={OL} strokeWidth={2.5} />
      <rect x={cx + 112} y={1532} width={28} height={118} rx={9} fill="#3D2010" stroke={OL} strokeWidth={2.5} />

      {/* PHONE SHADOW */}
      <ellipse cx={cx} cy={1500} rx={70} ry={18} fill="rgba(0,0,0,0.44)" />

      {/* NOTIFICATION GLOW */}
      {ng > 0.01 && (
        <ellipse cx={cx} cy={py + hH} rx={105 + ng * 44} ry={170 + ng * 56}
          fill={`rgba(255,255,255,${ng * 0.14})`} />
      )}

      {/* PHONE BODY */}
      <rect x={px} y={py} width={hW * 2} height={hH * 2} rx={20}
        fill="#1A1A1A" stroke="#2C2C2C" strokeWidth={2.5} />

      {/* SCREEN */}
      <rect x={px + 7} y={py + 9} width={hW * 2 - 14} height={hH * 2 - 18} rx={13}
        fill={scrOn > 0.3 ? "#1B2733" : "#111"} />

      {/* NOTIFICATION PREVIEW */}
      {f >= notifAt && f < notifAt + 72 && (
        <g opacity={interpolate(f, [notifAt, notifAt + 8, notifAt + 52, notifAt + 72], [0, 1, 1, 0], clamp)}>
          <rect x={px + 10} y={py + 14} width={hW * 2 - 20} height={42} rx={8} fill="#25D366" />
          <text x={cx} y={py + 32} textAnchor="middle" fill="white" fontSize={11} fontWeight={700} fontFamily="system-ui">Briz</text>
          <text x={cx} y={py + 47} textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize={9} fontFamily="system-ui">Crypto sent ✓</text>
        </g>
      )}

      {/* SENT STATE */}
      {sentP > 0.01 && (
        <g opacity={sentP}>
          <rect x={cx - 48} y={py + 55} width={96} height={55} rx={10} fill="#25D366" />
          <text x={cx} y={py + 80} textAnchor="middle" fill="white" fontSize={13} fontWeight={800} fontFamily="system-ui">✓ Sent</text>
          <text x={cx} y={py + 98} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={9} fontFamily="system-ui">$10 USDT</text>
        </g>
      )}

      {/* RECEIVED STATE */}
      {rcvP > 0.01 && (
        <g opacity={rcvP}>
          <rect x={cx - 50} y={py + 38} width={100} height={84} rx={10} fill="#25D366" />
          <text x={cx} y={py + 62} textAnchor="middle" fill="white" fontSize={11} fontWeight={700} fontFamily="system-ui">Received!</text>
          <rect x={cx - 36} y={py + 70} width={72} height={18} rx={5} fill={USDT_C} />
          <text x={cx} y={py + 83} textAnchor="middle" fill="white" fontSize={9} fontWeight={700} fontFamily="system-ui">+$10 USDT</text>
          <circle cx={cx} cy={py + 108} r={12} fill="white" />
          <text x={cx} y={py + 113} textAnchor="middle" fill="#25D366" fontSize={13} fontWeight={800} fontFamily="system-ui">✓</text>
        </g>
      )}

      {/* DETAILS */}
      <circle cx={cx} cy={py + 7} r={5} fill="#111" />
      <rect x={px - 4} y={py + 55} width={4} height={35} rx={2} fill="#222" />
      <rect x={cx - 24} y={py + hH * 2 - 12} width={48} height={5} rx={3} fill="rgba(255,255,255,0.4)" />

      {/* NOTIFICATION SPARKS */}
      {f >= notifAt && f < notifAt + 28 && ([-35, -5, 25] as number[]).map((deg, i) => {
        const sp = interpolate(f, [notifAt, notifAt + 22], [0, 1], eApple);
        const rad = deg * Math.PI / 180;
        const x1 = cx + Math.sin(rad) * 15;
        const y1 = py - Math.cos(rad) * 8;
        const x2 = cx + Math.sin(rad) * (15 + sp * 55);
        const y2 = py - Math.cos(rad) * (8 + sp * 65);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="white" strokeWidth={3 - sp * 1.5} strokeLinecap="round"
            opacity={Math.max(0, 1 - sp * 1.1)} />
        );
      })}
    </g>
  );
};

// ─── FULL ROOM (Scene 1) ──────────────────────────────────────────────────────
const FullRoom: React.FC<{ e: Env; f: number; notifAt: number; green?: boolean }> =
  ({ e, f, notifAt, green }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id={`wg${e === GRN ? "g" : "r"}`} cx="50%" cy="30%" r="75%">
        <stop offset="0%" stopColor={e.sf} />
        <stop offset="100%" stopColor={e.bg} />
      </radialGradient>
    </defs>
    {/* wall */}
    <rect width={W} height={1548} fill={`url(#wg${e === GRN ? "g" : "r"})`} />
    {/* baseboard */}
    <rect x={0} y={1538} width={W} height={16} fill={e.dk} />
    {/* floor */}
    <rect x={0} y={1548} width={W} height={H - 1548} fill={e.fl} />
    <rect x={0} y={1548} width={W} height={38} fill="rgba(0,0,0,0.12)" />
    {/* lamp wall glow */}
    <ellipse cx={860} cy={550} rx={300} ry={240} fill={`${e.sh}20`} />
    {/* room elements (back-to-front) */}
    <ArtFrame e={e} />
    <Lamp e={e} cx={870} />
    <Plant e={e} green={green} />
    <Sofa e={e} />
    <PhoneOnTable e={e} cx={550} f={f} notifAt={notifAt} />
  </svg>
);

// ─── HALF ROOM (Scene 4 split) — 540 px panels ───────────────────────────────
const HalfRoom: React.FC<{
  e: Env; side: "L" | "R"; f: number;
  sentAt?: number; rcvAt?: number; green?: boolean;
}> = ({ e, side, f, sentAt, rcvAt, green }) => {
  const lamp = side === "L" ? 460 : 80; // outer edge of each half
  const lf = green ? "#0A3A1E" : "#1A5C38";
  const pt = green ? "#082F17" : "#5D1E0A";
  return (
    <svg width={540} height={H} viewBox="0 0 540 1920"
      style={{ position: "absolute", top: 0, [side === "L" ? "left" : "right"]: 0, width: 540, height: H }}>
      <defs>
        <radialGradient id={`hg${side}`} cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor={e.sf} />
          <stop offset="100%" stopColor={e.bg} />
        </radialGradient>
      </defs>
      {/* wall */}
      <rect width={540} height={1548} fill={`url(#hg${side})`} />
      <rect y={1538} width={540} height={16} fill={e.dk} />
      {/* floor */}
      <rect y={1548} width={540} height={H - 1548} fill={e.fl} />
      <rect y={1548} width={540} height={38} fill="rgba(0,0,0,0.12)" />

      {/* lamp */}
      <Lamp e={e} cx={lamp} />

      {/* simple sofa (inner side) */}
      {side === "L"
        ? <Sofa e={e} x={-180} />           // sofa pokes in from left, partially clipped
        : <g transform="scale(-1,1) translate(-540,0)"><Sofa e={e} x={-180} /></g>
      }

      {/* small plant near lamp */}
      {side === "L" ? (
        <g transform="scale(0.5) translate(730,0)">
          <path d={`M 892 1548 L 912 1430 L 982 1430 L 1002 1548 Z`} fill={pt} stroke={OL} strokeWidth={4} />
          <ellipse cx={947} cy={1430} rx={35} ry={12} fill="#4A1A08" stroke={OL} strokeWidth={4} />
          <ellipse cx={935} cy={1330} rx={46} ry={29} fill={lf} stroke={OL} strokeWidth={5} transform="rotate(-28 935 1330)" />
          <ellipse cx={966} cy={1300} rx={44} ry={28} fill={lf} stroke={OL} strokeWidth={5} transform="rotate(18 966 1300)" />
          <ellipse cx={925} cy={1263} rx={42} ry={26} fill={lf} stroke={OL} strokeWidth={5} transform="rotate(-12 925 1263)" />
        </g>
      ) : (
        <g transform="scale(-0.5,0.5) translate(-730,0)">
          <path d={`M 892 1548 L 912 1430 L 982 1430 L 1002 1548 Z`} fill={pt} stroke={OL} strokeWidth={4} />
          <ellipse cx={947} cy={1430} rx={35} ry={12} fill="#4A1A08" stroke={OL} strokeWidth={4} />
          <ellipse cx={935} cy={1330} rx={46} ry={29} fill={lf} stroke={OL} strokeWidth={5} transform="rotate(-28 935 1330)" />
          <ellipse cx={966} cy={1300} rx={44} ry={28} fill={lf} stroke={OL} strokeWidth={5} transform="rotate(18 966 1300)" />
          <ellipse cx={925} cy={1263} rx={42} ry={26} fill={lf} stroke={OL} strokeWidth={5} transform="rotate(-12 925 1263)" />
        </g>
      )}

      {/* phone + table centered in panel */}
      <PhoneOnTable e={e} cx={270} f={f} notifAt={99999} sentAt={sentAt} rcvAt={rcvAt} />
    </svg>
  );
};

// ─── USDT COIN ────────────────────────────────────────────────────────────────
// Travels from left phone (x=270 full canvas) → arc up → right phone (x=810 full canvas)
const USDTCoin: React.FC<{ f: number }> = ({ f }) => {
  if (f < COIN_S - 2 || f > COIN_E + 32) return null;
  const t = interpolate(f, [COIN_S, COIN_E], [0, 1], eApple);
  const sx = 270, sy = 1360, mx = 540, my = 1050, ex = 810, ey = 1360;
  const cx = qb(t, sx, mx, ex);
  const cy = qb(t, sy, my, ey);
  const op = interpolate(f, [COIN_S, COIN_S + 6, COIN_E - 4, COIN_E + 2], [0, 1, 1, 0], clamp);
  const spin = interpolate(f, [COIN_S, COIN_E], [0, 360], clamp);
  const R = 54;

  return (
    <g opacity={op}>
      {/* motion trail */}
      {([0.1, 0.22, 0.36] as number[]).map((off, i) => {
        const tT = Math.max(0, t - off);
        const tx = qb(tT, sx, mx, ex);
        const ty = qb(tT, sy, my, ey);
        return (
          <circle key={i} cx={tx} cy={ty} r={R * (1 - i * 0.15)}
            fill={USDT_C} opacity={(1 - i * 0.3) * 0.22 * (t > off ? 1 : 0)} />
        );
      })}
      {/* depth shadow */}
      <circle cx={cx} cy={cy + 10} r={R} fill={USDT_DK} opacity={0.9} />
      {/* face */}
      <circle cx={cx} cy={cy} r={R} fill={USDT_C} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
      {/* Tether T logo */}
      <g transform={`rotate(${spin}, ${cx}, ${cy})`}>
        <rect x={cx - 29} y={cy - 26} width={58} height={9} rx={4.5} fill="white" />
        <rect x={cx - 20} y={cy - 8} width={40} height={7} rx={3.5} fill="white" />
        <rect x={cx - 5} y={cy - 17} width={10} height={48} rx={5} fill="white" />
      </g>
      {/* specular highlight */}
      <ellipse cx={cx - 16} cy={cy - 20} rx={18} ry={10}
        fill="rgba(255,255,255,0.28)" transform={`rotate(-22, ${cx - 16}, ${cy - 20})`} />
    </g>
  );
};

// ─── CHAT SCENE (Scene 3) ─────────────────────────────────────────────────────
const ChatScene: React.FC<{ f: number }> = ({ f }) => {
  const loc = f - CHAT_S;
  return (
    <AbsoluteFill style={{ background: WA_BG, fontFamily: F }}>
      {/* WhatsApp header */}
      <div style={{ background: WA_HEAD, padding: "52px 24px 20px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: BRIZ.accent,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Img src={staticFile("briz-mark.png")} style={{ width: 44, height: 44, objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ color: "white", fontSize: 36, fontWeight: 700 }}>Briz</div>
          <div style={{ color: "#25D366", fontSize: 26, marginTop: 2 }}>● online</div>
        </div>
      </div>

      {/* chat body */}
      <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* user message */}
        {loc >= 18 && (
          <Reveal at={CHAT_S + 18} dur={18}>
            <div style={{ alignSelf: "flex-end",
              background: WA_USER, borderRadius: "18px 4px 18px 18px",
              padding: "22px 28px", maxWidth: 580 }}>
              <div style={{ color: "white", fontSize: 32, fontWeight: 500 }}>
                Send $10 USDT to Tunde
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 24, marginTop: 8, textAlign: "right" }}>
                10:53 AM ✓✓
              </div>
            </div>
          </Reveal>
        )}

        {/* crypto card response */}
        {loc >= 42 && (
          <Reveal at={CHAT_S + 42} dur={22}>
            <div style={{ background: WA_HEAD, borderRadius: "4px 18px 18px 18px",
              overflow: "hidden", maxWidth: 620 }}>
              {/* red card */}
              <div style={{ background: `linear-gradient(135deg, ${BRIZ.accent} 0%, #9B2219 100%)`,
                padding: "28px 32px 22px" }}>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 22, fontWeight: 600,
                  letterSpacing: 2, textTransform: "uppercase" as const }}>Crypto Wallet</div>
                <div style={{ color: "white", fontSize: 68, fontWeight: 800,
                  margin: "6px 0 6px", letterSpacing: -2 }}>$10.00</div>
                <div style={{ background: USDT_C, color: "white", fontSize: 22, fontWeight: 700,
                  padding: "4px 14px", borderRadius: 999, display: "inline-block" }}>USDT</div>
              </div>
              <div style={{ padding: "18px 32px 22px", color: "rgba(255,255,255,0.65)", fontSize: 28 }}>
                {f < SENT_AT ? "Sending to Tunde…" : "Sent to Tunde ✓"}
              </div>
            </div>
          </Reveal>
        )}

        {/* sent confirmation bubble */}
        {f >= SENT_AT && (
          <Reveal at={SENT_AT} dur={18}>
            <div style={{ alignSelf: "flex-end" }}>
              <div style={{ background: "#25D366", borderRadius: "18px 4px 18px 18px",
                padding: "22px 36px" }}>
                <div style={{ color: "white", fontSize: 36, fontWeight: 800 }}>✓ Done</div>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── MAIN COMPOSITION ─────────────────────────────────────────────────────────
export const BrizCryptoAd: React.FC = () => {
  const f = useCurrentFrame();

  // ── scene opacities ──
  const roomOp   = interpolate(f, [ZOOM_S + 10, ZOOM_E], [1, 0], clamp);
  const chatOp   = interpolate(f, [CHAT_S, CHAT_S + 20, CHAT_OUT, CHAT_OUT + 18], [0, 1, 1, 0], clamp);
  const splitOp  = interpolate(f, [SPLIT_S, SPLIT_S + 20, SPLIT_OUT, SPLIT_OUT + 18], [0, 1, 1, 0], clamp);
  const brandOp  = interpolate(f, [BRAND_S, BRAND_S + 25], [0, 1], eApple);

  // ── room camera ──
  // slow push (1.0 → 1.07), then match-cut zoom out (→ 3.8)
  const camS = f < ZOOM_S
    ? interpolate(f, [0, CAM_PUSH], [1, 1.07], eSmooth)
    : interpolate(f, [ZOOM_S, ZOOM_E], [1.07, 3.8], eSmooth);
  const camBlur = interpolate(f, [ZOOM_S, ZOOM_E], [0, 20], clamp);

  // ── split doors ──
  const doorP = interpolate(f, [SPLIT_S, WIPE_E], [0, 1], eApple);
  const leftTX  = -540 * (1 - doorP);
  const rightTX =  540 * (1 - doorP);

  return (
    <AbsoluteFill style={{ background: "#0D0D0D", overflow: "hidden" }}>

      {/* ── SOUND ── */}
      <Audio src={staticFile("sfx/bed.wav")} endAt={BRAND_S} volume={0.18} loop />
      <Sequence from={NOTIF_AT}>
        <Audio src={staticFile("sfx/tick.wav")} endAt={25} volume={0.9} />
      </Sequence>
      <Sequence from={ZOOM_S}>
        <Audio src={staticFile("sfx/whoosh.wav")} endAt={25} volume={0.6} />
      </Sequence>
      <Sequence from={SPLIT_S}>
        <Audio src={staticFile("sfx/slide.wav")} endAt={28} volume={0.7} />
      </Sequence>
      <Sequence from={COIN_S}>
        <Audio src={staticFile("sfx/spin.wav")} endAt={COIN_E - COIN_S + 10} volume={0.55} />
      </Sequence>
      <Sequence from={RCV_AT}>
        <Audio src={staticFile("sfx/flash.wav")} endAt={25} volume={0.85} />
      </Sequence>
      <Sequence from={BRAND_S}>
        <Audio src={staticFile("sfx/logo-hit.wav")} endAt={40} volume={0.9} />
      </Sequence>

      {/* ── SCENE 1+2: flat 2D red room, camera push → match-cut ── */}
      {f < ZOOM_E + 5 && (
        <AbsoluteFill style={{ opacity: roomOp }}>
          <div style={{
            width: W, height: H, position: "absolute",
            transform: `scale(${camS})`,
            transformOrigin: "50% 70%",
            filter: camBlur > 0.5 ? `blur(${camBlur}px)` : undefined,
          }}>
            {/* room fade-in */}
            <div style={{ opacity: interpolate(f, [0, 10], [0, 1], eApple) }}>
              <FullRoom e={RED} f={f} notifAt={NOTIF_AT} />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ── SCENE 3: WhatsApp chat ── */}
      {chatOp > 0.01 && (
        <AbsoluteFill style={{ opacity: chatOp }}>
          <ChatScene f={f} />
        </AbsoluteFill>
      )}

      {/* ── SCENE 4: split screen ── */}
      {splitOp > 0.01 && (
        <AbsoluteFill style={{ opacity: splitOp, overflow: "hidden" }}>
          {/* left (red, sender) slides in from left */}
          <div style={{
            position: "absolute", left: 0, top: 0, width: 540, height: H, overflow: "hidden",
            transform: `translateX(${leftTX}px)`,
          }}>
            <HalfRoom e={RED} side="L" f={f} sentAt={COIN_S} />
          </div>

          {/* right (green, receiver) slides in from right */}
          <div style={{
            position: "absolute", right: 0, top: 0, width: 540, height: H, overflow: "hidden",
            transform: `translateX(${rightTX}px)`,
          }}>
            <HalfRoom e={GRN} side="R" f={f} rcvAt={RCV_AT} green />
          </div>

          {/* center divider */}
          <div style={{
            position: "absolute", left: 538, top: 0, width: 4, height: H,
            background: OL, opacity: 0.5 * doorP,
          }} />

          {/* coin overlay (full canvas SVG) */}
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <USDTCoin f={f} />
          </svg>

          {/* labels */}
          <div style={{
            position: "absolute", left: 0, width: 540, top: 60,
            display: "flex", justifyContent: "center",
            opacity: doorP,
          }}>
            <div style={{ background: "rgba(0,0,0,0.5)", color: "white", fontSize: 26, fontWeight: 700,
              fontFamily: F, padding: "8px 24px", borderRadius: 999, letterSpacing: 2 }}>SENDING</div>
          </div>
          <div style={{
            position: "absolute", right: 0, width: 540, top: 60,
            display: "flex", justifyContent: "center",
            opacity: interpolate(f, [COIN_E, COIN_E + 10], [0, 1], eApple),
          }}>
            <div style={{ background: "#25D366", color: "white", fontSize: 26, fontWeight: 700,
              fontFamily: F, padding: "8px 24px", borderRadius: 999, letterSpacing: 2 }}>RECEIVED</div>
          </div>
        </AbsoluteFill>
      )}

      {/* ── SCENE 5: brand reveal ── */}
      {brandOp > 0.01 && (
        <AbsoluteFill style={{
          opacity: brandOp,
          background: "#0D0D0D",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Reveal at={BRAND_S + 12} dur={30}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
              <Img src={staticFile("briz-logo-cream.png")}
                style={{ width: 540, objectFit: "contain" }} />
              <MaskUp at={BRAND_S + 32} dur={24}>
                <div style={{
                  color: "#FDEBD0", fontSize: 40, fontWeight: 500, fontFamily: F,
                  opacity: 0.72, textAlign: "center",
                }}>
                  No friction. No stress. No wahala.
                </div>
              </MaskUp>
            </div>
          </Reveal>
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
