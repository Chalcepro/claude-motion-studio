import React from "react";
import { Composition } from "remotion";
import { KineticIntro } from "./compositions/KineticIntro";
import { DataReel } from "./compositions/DataReel";
import { AppShowcase } from "./compositions/AppShowcase";
import { BrizPictureEdit, BRIZ_PICTURE_FRAMES } from "./compositions/BrizPictureEdit";
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
    <Composition id="BrizPictureEdit" component={BrizPictureEdit} width={1080} height={1920} fps={30} durationInFrames={BRIZ_PICTURE_FRAMES} />
  </>
);
