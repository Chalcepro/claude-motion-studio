import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BRIZ } from "../lib/brands";

// BioPass walkthrough cards (intro, title, section cards, outro). The recording itself is joined in by
// tools/assemble_biopass.py; Part is kept for previewing in the studio.
const RED = BRIZ.accent, CREAM = BRIZ.bg, INK = BRIZ.ink, F = BRIZ.font;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type BioPassTiming = { intro: number; title: number; card: number; outro: number; split: number; recEnd: number; src: string };
export const LONG: BioPassTiming = { intro: 80, title: 75, card: 60, outro: 110, split: 1890, recEnd: 3038, src: "biopass-blurred.mp4" };
export const SHORT: BioPassTiming = { intro: 45, title: 45, card: 36, outro: 105, split: 1083, recEnd: 2202, src: "biopass-short.mp4" };
export const layout = (t: BioPassTiming) => {
  const part1 = t.intro + t.title + t.card, part2 = part1 + t.split + t.card, outro = part2 + (t.recEnd - t.split);
  return { part1, part2, outro, total: outro + t.outro };
};
export const BRIZ_BIOPASS_FRAMES = layout(LONG).total;

const Rise: React.FC<{ d: number; children: React.ReactNode }> = ({ d, children }) => {
  const f = useCurrentFrame();
  const inn = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(f, [d - 8, d], [1, 0], clamp);
  return <div style={{ opacity: inn * out, transform: `translateY(${(1 - inn) * 24}px)` }}>{children}</div>;
};
const Card: React.FC<{ bg: string; d: number; children: React.ReactNode }> = ({ bg, d, children }) => (
  <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: F }}><Rise d={d}>{children}</Rise></AbsoluteFill>
);
const Part: React.FC<{ from: number; src: string }> = ({ from, src }) => (
  <AbsoluteFill style={{ background: "#0B0F14", alignItems: "center" }}>
    <OffthreadVideo src={staticFile(src)} startFrom={from} muted style={{ width: 864, height: 1920 }} />
  </AbsoluteFill>
);
const Section: React.FC<{ n: string; t: string; d: number }> = ({ n, t, d }) => (
  <Card bg={CREAM} d={d}>
    <div style={{ fontSize: 46, fontWeight: 600, color: RED }}>{n}</div>
    <div style={{ fontSize: 112, fontWeight: 800, color: INK, letterSpacing: -3, marginTop: 10 }}>{t}</div>
  </Card>
);

export const BrizBioPass: React.FC<{ timing?: BioPassTiming }> = ({ timing = LONG }) => {
  const t = timing, L = layout(t);
  return (
    <AbsoluteFill style={{ background: RED }}>
      <Sequence durationInFrames={t.intro}><Card bg={CREAM} d={t.intro}><Img src={staticFile("briz-logo.png")} style={{ width: 620 }} /></Card></Sequence>
      <Sequence from={t.intro} durationInFrames={t.title}>
        <Card bg={RED} d={t.title}>
          <div style={{ fontSize: 124, fontWeight: 800, color: CREAM, letterSpacing: -3, lineHeight: 1.05 }}>Briz BioPass</div>
          <div style={{ fontSize: 62, fontWeight: 600, color: CREAM, marginTop: 22 }}>Walkthrough</div>
        </Card>
      </Sequence>
      <Sequence from={t.intro + t.title} durationInFrames={t.card}><Section n="Part 1" t="Customer side" d={t.card} /></Sequence>
      <Sequence from={L.part1} durationInFrames={t.split}><Part from={0} src={t.src} /></Sequence>
      <Sequence from={L.part1 + t.split} durationInFrames={t.card}><Section n="Part 2" t="Merchant side" d={t.card} /></Sequence>
      <Sequence from={L.part2} durationInFrames={t.recEnd - t.split}><Part from={t.split} src={t.src} /></Sequence>
      <Sequence from={L.outro} durationInFrames={t.outro}>
        <AbsoluteFill style={{ background: CREAM, alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: F }}>
          <Rise d={t.outro + 12}>
            <Img src={staticFile("briz-logo.png")} style={{ width: 520 }} />
            <div style={{ fontSize: 64, fontWeight: 800, color: INK, letterSpacing: -1, lineHeight: 1.2, marginTop: 70 }}>No friction, no stress,<br />no wahala.</div>
            <div style={{ display: "inline-block", marginTop: 60, padding: "22px 54px", borderRadius: 60, background: RED, color: CREAM, fontSize: 52, fontWeight: 600 }}>paywithbriz.com</div>
          </Rise>
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/biopass-sting.wav")} />
      <Sequence from={L.outro}><Audio src={staticFile("audio/biopass-outro.wav")} /></Sequence>
    </AbsoluteFill>
  );
};
