import React from "react";
import { Composition } from "remotion";
import { KineticIntro } from "./compositions/KineticIntro";
import { DataReel } from "./compositions/DataReel";
import { AppShowcase } from "./compositions/AppShowcase";
import { BrizPictureEdit, BRIZ_PICTURE_FRAMES } from "./compositions/BrizPictureEdit";
import { BrizChat, brizChatDefaults, chatFrames } from "./compositions/BrizChat";
import { BrizWipe, brizWipeDefaults, wipeFrames } from "./compositions/BrizWipe";
import { chats, wipes, pendulums } from "./compositions/library";
import { BrizRows, BRIZ_ROWS_FRAMES } from "./compositions/BrizRows";
import { NoirPendulum, noirPendulumDefaults, noirPendulumDuration } from "./compositions/NoirPendulum";
import { BrizPendulum, brizPendulumDefaults, brizPendulumDuration } from "./compositions/BrizPendulum";

/**
 * Register every composition here. Render by id:
 *   npx remotion render KineticIntro out/intro.mp4
 *   npx remotion still  DataReel     out/frame.png --frame=120
 *
 * Common formats: 1080×1920 (9:16 reel) · 1080×1350 (4:5 feed) · 1080×1080 (1:1) · 1920×1080 (16:9).
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="KineticIntro" component={KineticIntro} width={1080} height={1920} fps={30} durationInFrames={180} />
    <Composition id="DataReel" component={DataReel} width={1080} height={1920} fps={30} durationInFrames={300} />
    <Composition id="AppShowcase" component={AppShowcase} width={1080} height={1920} fps={30} durationInFrames={240} />
    <Composition id="BrizPendulum" component={BrizPendulum} width={1080} height={1920} fps={30}
      durationInFrames={brizPendulumDuration(brizPendulumDefaults.pairs.length)} defaultProps={brizPendulumDefaults} />
    <Composition id="NoirPendulum" component={NoirPendulum} width={1080} height={1920} fps={30}
      durationInFrames={noirPendulumDuration(noirPendulumDefaults.pairs.length)} defaultProps={noirPendulumDefaults} />
    <Composition id="BrizRowsA" component={BrizRows} width={1080} height={1920} fps={30} durationInFrames={BRIZ_ROWS_FRAMES} defaultProps={{ look: "rows" as const }} />
    <Composition id="BrizRowsC" component={BrizRows} width={1080} height={1920} fps={30} durationInFrames={BRIZ_ROWS_FRAMES} defaultProps={{ look: "bubbles" as const }} />
    <Composition id="BrizChat" component={BrizChat} width={1080} height={1920} fps={30} durationInFrames={chatFrames(brizChatDefaults.chat.length)} defaultProps={brizChatDefaults} />
    <Composition id="BrizWipe" component={BrizWipe} width={1080} height={1920} fps={30} durationInFrames={wipeFrames(brizWipeDefaults.beats.length)} defaultProps={brizWipeDefaults} />
    {Object.entries(chats).map(([id, p]) => (
      <Composition key={id} id={id} component={BrizChat} width={1080} height={1920} fps={30} durationInFrames={chatFrames(p.chat.length)} defaultProps={p} />
    ))}
    {Object.entries(wipes).map(([id, p]) => (
      <Composition key={id} id={id} component={BrizWipe} width={1080} height={1920} fps={30} durationInFrames={wipeFrames(p.beats.length)} defaultProps={p} />
    ))}
    {Object.entries(pendulums).map(([id, p]) => (
      <Composition key={id} id={id} component={id.startsWith("Noir") ? NoirPendulum : BrizPendulum} width={1080} height={1920} fps={30}
        durationInFrames={(id.startsWith("Noir") ? noirPendulumDuration : brizPendulumDuration)(p.pairs.length)} defaultProps={p} />
    ))}
    <Composition id="BrizPictureEdit" component={BrizPictureEdit} width={1080} height={1920} fps={30} durationInFrames={BRIZ_PICTURE_FRAMES} />
  </>
);
