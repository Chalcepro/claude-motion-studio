import React from "react";
import { Composition } from "remotion";
import { KineticIntro } from "./compositions/KineticIntro";
import { DataReel } from "./compositions/DataReel";
import { AppShowcase } from "./compositions/AppShowcase";
import { BrizPictureEdit, BRIZ_PICTURE_FRAMES } from "./compositions/BrizPictureEdit";
import { BrizChat, brizChatDefaults, chatFrames } from "./compositions/BrizChat";
import { BrizWipe, brizWipeDefaults, wipeFrames } from "./compositions/BrizWipe";
import { chats, wipes, pendulums } from "./compositions/library";
import { BrizPowerFlat, BRIZ_POWER_FLAT_FRAMES } from "./compositions/BrizPowerFlat";
import { BACKGROUNDS, BG_FRAMES } from "./compositions/BrizBackgrounds";
import { BrizBioPass, BRIZ_BIOPASS_FRAMES, SHORT, layout } from "./compositions/BrizBioPass";
import biopassShort from "./compositions/biopass-short.json";
import { BrizBioPassOverlay, BIOPASS_REC_FRAMES } from "./compositions/BrizBioPassOverlay";
import { BrizMidStory, BrizStickerStory, BRIZ_MID_STORY_FRAMES, BRIZ_STICKER_STORY_FRAMES } from "./compositions/BrizMidStory";
import { BrizStickerStress, BRIZ_STICKER_STRESS_FRAMES } from "./compositions/BrizStickerStress";
import { BrizBanner, BRIZ_BANNER_FRAMES } from "./compositions/BrizBanner";
import { BrizPaperEasy, BRIZ_PAPER_EASY_FRAMES } from "./compositions/BrizPaperEasy";
import { BrizPowerCrowd, BRIZ_POWER_CROWD_FRAMES } from "./compositions/BrizPowerCrowd";
import { BrizPowerBurst, BRIZ_POWER_BURST_FRAMES } from "./compositions/BrizPowerBurst";
import { BrizPower, BRIZ_POWER_FRAMES } from "./compositions/BrizPower";
import { BrizRows, BRIZ_ROWS_FRAMES } from "./compositions/BrizRows";
import { NoirPendulum, noirPendulumDefaults, noirPendulumDuration } from "./compositions/NoirPendulum";
import { BrizPendulum, brizPendulumDefaults, brizPendulumDuration } from "./compositions/BrizPendulum";
import { BrizAjoIllustrated, BRIZ_AJO_ILLUSTRATED_FRAMES } from "./compositions/BrizAjoIllustrated";
import { BrizCryptoPhones, BRIZ_CRYPTO_PHONES_FRAMES, PH_W, PH_H } from "./compositions/BrizCryptoPhones";
import { BrizCryptoAd, BRIZ_CRYPTO_AD_FRAMES } from "./compositions/BrizCryptoAd";

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
    {Object.entries(BACKGROUNDS).map(([id, C]) => <Composition key={id} id={id} component={C} width={1080} height={1920} fps={30} durationInFrames={BG_FRAMES} />)}
    <Composition id="BrizMidStory" component={BrizMidStory} width={1080} height={1920} fps={30} durationInFrames={BRIZ_MID_STORY_FRAMES} />
    <Composition id="BrizBioPassOverlay" component={BrizBioPassOverlay} width={1080} height={1920} fps={30} durationInFrames={BIOPASS_REC_FRAMES} />
    <Composition id="BrizBioPassShort" component={BrizBioPass} width={1080} height={1920} fps={30} durationInFrames={layout(SHORT).total} defaultProps={{ timing: SHORT }} />
    <Composition id="BrizBioPassOverlayShort" component={BrizBioPassOverlay} width={1080} height={1920} fps={30} durationInFrames={biopassShort.frames}
      defaultProps={{ steps: biopassShort.steps as [number, string][], split: biopassShort.split, frames: biopassShort.frames }} />
    <Composition id="BrizBioPass" component={BrizBioPass} width={1080} height={1920} fps={30} durationInFrames={BRIZ_BIOPASS_FRAMES} />
    <Composition id="BrizStickerStory" component={BrizStickerStory} width={1080} height={1920} fps={30} durationInFrames={BRIZ_STICKER_STORY_FRAMES} />
    <Composition id="BrizStickerStress" component={BrizStickerStress} width={1080} height={1920} fps={30} durationInFrames={BRIZ_STICKER_STRESS_FRAMES} />
    <Composition id="BrizBannerWide" component={BrizBanner} width={1920} height={1080} fps={30} durationInFrames={BRIZ_BANNER_FRAMES} />
    <Composition id="BrizBannerTall" component={BrizBanner} width={1080} height={1920} fps={30} durationInFrames={BRIZ_BANNER_FRAMES} />
    <Composition id="BrizPaperEasy" component={BrizPaperEasy} width={1080} height={1920} fps={30} durationInFrames={BRIZ_PAPER_EASY_FRAMES} />
    <Composition id="BrizPowerCrowd" component={BrizPowerCrowd} width={1080} height={1920} fps={30} durationInFrames={BRIZ_POWER_CROWD_FRAMES} />
    <Composition id="BrizPowerBurst" component={BrizPowerBurst} width={1080} height={1920} fps={30} durationInFrames={BRIZ_POWER_BURST_FRAMES} />
    <Composition id="BrizPowerFlat" component={BrizPowerFlat} width={1080} height={1920} fps={30} durationInFrames={BRIZ_POWER_FLAT_FRAMES} />
    <Composition id="BrizPower" component={BrizPower} width={1080} height={1920} fps={30} durationInFrames={BRIZ_POWER_FRAMES} />
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
    <Composition id="BrizAjoIllustrated" component={BrizAjoIllustrated} width={1080} height={1920} fps={30} durationInFrames={BRIZ_AJO_ILLUSTRATED_FRAMES} />
    <Composition id="BrizCryptoAd" component={BrizCryptoAd} width={1080} height={1920} fps={30} durationInFrames={BRIZ_CRYPTO_AD_FRAMES} />
    <Composition id="BrizCryptoPhoneRed" component={BrizCryptoPhones} durationInFrames={BRIZ_CRYPTO_PHONES_FRAMES} fps={30} width={PH_W} height={PH_H} defaultProps={{ side: "R" as const }} />
      <Composition id="BrizCryptoPhoneGreen" component={BrizCryptoPhones} durationInFrames={BRIZ_CRYPTO_PHONES_FRAMES} fps={30} width={PH_W} height={PH_H} defaultProps={{ side: "G" as const }} />
    </>
);
