import { loadFont as poppins } from "@remotion/google-fonts/Poppins";
import { loadFont as syne } from "@remotion/google-fonts/Syne";

// One look per company. The chat and wipe reels take one of these, so the same
// motion works for Briz (fintech) and Noirtech (branding, web, mobile, AI).
export type Brand = {
  name: string; // shown in the chat header
  bg: string; // page colour
  ink: string; // text on the page
  accent: string; // the brand colour: user bubbles, cover, flood
  onAccent: string; // text on the accent
  font: string;
  wordScale: number; // Syne is much wider than Poppins, so big words shrink
  logoOnBg: string; // official logo for the page colour
  flood: string; // the chat's ending colour
  onFlood: string;
  logoOnFlood: string; // official logo for the flood colour
  logoW: number;
  mark: string; // avatar in the chat header
  tagline: string;
  url: string;
};

const P = poppins("normal", { weights: ["500", "600", "800"] }).fontFamily;
const S = syne("normal", { weights: ["600", "700", "800"] }).fontFamily;

export const BRIZ: Brand = {
  name: "Briz", bg: "#FDEBD0", ink: "#0B0F14", accent: "#E72E08", onAccent: "#FDEBD0", font: P, wordScale: 1,
  logoOnBg: "briz-logo.png", flood: "#E72E08", onFlood: "#FDEBD0", logoOnFlood: "briz-logo-cream.png", logoW: 500, mark: "briz-mark.png",
  tagline: "Pay with Zero Wahala.", url: "paywithbriz.com",
};

export const NOIR: Brand = {
  name: "Noirtech", bg: "#FAFAFA", ink: "#0A0A0A", accent: "#FF6B2B", onAccent: "#0A0A0A", font: S, wordScale: 0.62,
  logoOnBg: "noir-logo.png", flood: "#0A0A0A", onFlood: "#FAFAFA", logoOnFlood: "noir-logo-white.png", /* the orange mark vanishes on orange */ logoW: 420, mark: "noir-mark.png",
  tagline: "We Build Digital Solutions.", url: "noirtech.digital",
};
