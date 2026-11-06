import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BRIZ } from "../lib/brands";

// BioPass walkthrough: light edit of a phone recording (blurs are baked in by tools/biopass_blur.py).
// Voiceover and music are separate lists below: add a file here and it plays, nothing else changes.
const RED = BRIZ.accent, CREAM = BRIZ.bg, INK = BRIZ.ink, F = BRIZ.font;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const INTRO = 80, TITLE = 75, CARD = 60, OUTRO = 110;
const SPLIT = 63 * 30, REC_END = 3038; // the phone changes at exactly 1:03.0
const PART1_AT = INTRO + TITLE + CARD;
const PART2_AT = PART1_AT + SPLIT + CARD;
const OUTRO_AT = PART2_AT + (REC_END - SPLIT);
export const BRIZ_BIOPASS_FRAMES = OUTRO_AT + OUTRO;

// recording time (s) -> video frame, so voiceover lines can be dropped in by the times in the script
export const recFrame = (s: number) => Math.round(s * 30) + (s < 63 ? PART1_AT : PART2_AT - SPLIT);
// e.g. { file: "audio/biopass/vo-01.mp3", at: 0 }; empty until the voice is generated
const VOICEOVER: { file: string; at: number }[] = [];
const MUSIC: string | null = null;

// A soft rise in, and a soft fade to the next section. No more animation than that.
const Rise: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const f = useCurrentFrame();
  const inn = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(f, [d - 8, d], [1, 0], clamp);
  return <div style={{ opacity: inn * out, transform: `translateY(${(1 - inn) * 24}px)` }}>{children}</div>;
};
const Card: React.FC<{ bg: string; d: number; children: React.ReactNode }> = ({ bg, d, children }) => (
  <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: F }}><Rise d={d}>{children}</Rise></AbsoluteFill>
);

const Part: React.FC<{ from: number; label: string }> = ({ from, label }) => (
  <AbsoluteFill style={{ background: RED, fontFamily: F }}>
    <div style={{ position: "absolute", left: 40, top: 40, padding: "14px 34px", borderRadius: 40, background: CREAM, color: INK, fontSize: 38, fontWeight: 600 }}>{label}</div>
    <div style={{ position: "absolute", left: (1080 - 765) / 2, top: 150, width: 765, height: 1700, borderRadius: 54, overflow: "hidden", background: INK }}>
      <OffthreadVideo src={staticFile("biopass-blurred.mp4")} startFrom={from} muted style={{ width: "100%", height: "100%" }} />
    </div>
  </AbsoluteFill>
);

const Section: React.FC<{ n: string; t: string }> = ({ n, t }) => (
  <Card bg={CREAM} d={CARD}>
    <div style={{ fontSize: 46, fontWeight: 600, color: RED }}>{n}</div>
    <div style={{ fontSize: 112, fontWeight: 800, color: INK, letterSpacing: -3, marginTop: 10 }}>{t}</div>
  </Card>
);

export const BrizBioPass: React.FC = () => (
  <AbsoluteFill style={{ background: RED }}>
    <Sequence durationInFrames={INTRO}><Card bg={CREAM} d={INTRO}><Img src={staticFile("briz-logo.png")} style={{ width: 620 }} /></Card></Sequence>
    <Sequence from={INTRO} durationInFrames={TITLE}>
      <Card bg={RED} d={TITLE}>
        <div style={{ fontSize: 124, fontWeight: 800, color: CREAM, letterSpacing: -3, lineHeight: 1.05 }}>Briz BioPass</div>
        <div style={{ fontSize: 62, fontWeight: 600, color: CREAM, marginTop: 22 }}>Walkthrough</div>
      </Card>
    </Sequence>
    <Sequence from={INTRO + TITLE} durationInFrames={CARD}><Section n="Part 1" t="Customer side" /></Sequence>
    <Sequence from={PART1_AT} durationInFrames={SPLIT}><Part from={0} label="Customer side" /></Sequence>
    <Sequence from={PART1_AT + SPLIT} durationInFrames={CARD}><Section n="Part 2" t="Merchant side" /></Sequence>
    <Sequence from={PART2_AT} durationInFrames={REC_END - SPLIT}><Part from={SPLIT} label="Merchant side" /></Sequence>
    <Sequence from={OUTRO_AT} durationInFrames={OUTRO}>
      <AbsoluteFill style={{ background: CREAM, alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: F }}>
        <Rise d={OUTRO + 12}>
          <Img src={staticFile("briz-logo.png")} style={{ width: 520 }} />
          <div style={{ fontSize: 64, fontWeight: 800, color: INK, letterSpacing: -1, lineHeight: 1.2, marginTop: 70 }}>No friction, no stress,<br />no wahala.</div>
          <div style={{ display: "inline-block", marginTop: 60, padding: "22px 54px", borderRadius: 60, background: RED, color: CREAM, fontSize: 52, fontWeight: 600 }}>paywithbriz.com</div>
        </Rise>
      </AbsoluteFill>
    </Sequence>

    {/* audio stays on separate tracks */}
    <Audio src={staticFile("audio/biopass-sting.wav")} />
    <Sequence from={OUTRO_AT}><Audio src={staticFile("audio/biopass-outro.wav")} /></Sequence>
    {VOICEOVER.map((v) => <Sequence key={v.file} from={recFrame(v.at)}><Audio src={staticFile(v.file)} /></Sequence>)}
    {MUSIC && <Audio src={staticFile(MUSIC)} volume={0.15} />}
  </AbsoluteFill>
);
