// The 2026-10-28 batch: 6 Briz + 6 Noirtech reels, two of each style.
import { BRIZ, NOIR } from "../lib/brands";
import type { ChatProps } from "./BrizChat";
import type { WipeProps } from "./BrizWipe";

export const chats: Record<string, ChatProps> = {
  BrizChatMerchant: {
    brand: BRIZ, endLine: "Sign up at paywithbriz.com",
    chat: [
      { q: "I run a shop.\nCan Briz help me?", a: "Yeah boss. BioPass\nturns your phone into a till 🏪" },
      { q: "No POS\nmachine?", a: "None needed. Their\nphone, their PIN 😌" },
      { q: "When does\nthe money land?", a: "Instantly.\nNo waiting game ⚡" },
      { q: "And my\nsales record?", a: "Every naira,\ntracked for you 📊" },
      { q: "Sounds good.\nHow do I start?", a: "Sign up at\npaywithbriz.com 😎" },
    ],
  },
  BrizChatLateNight: {
    brand: BRIZ, endLine: "Sign up at paywithbriz.com",
    chat: [
      { q: "It's 2am and\nI need cash 😩", a: "Emergency Wallet.\nRight here 💪" },
      { q: "Do I need\na new app?", a: "Nope. It's all\non WhatsApp 💬" },
      { q: "Can I send\nmoney too?", a: "Snap it, say it,\ntype it. Done 📲" },
      { q: "Is it safe?", a: "Your own PIN,\nevery time 🔒" },
      { q: "Where do\nI sign up?", a: "paywithbriz.com.\nSee you inside 😎" },
    ],
  },
  NoirChatBrand: {
    brand: NOIR, endLine: "Say hi at noirtech.digital",
    chat: [
      { q: "We need a\nnew brand", a: "Love that. Logo,\ncolours, the lot 🎨" },
      { q: "And a\nwebsite?", a: "Fast, clean,\nbuilt to convert 💻" },
      { q: "What about\nan app?", a: "iOS and Android.\nWe got you 📱" },
      { q: "Can AI save\nus time?", a: "Automations that\nwork while you sleep 🤖" },
      { q: "How do\nwe start?", a: "Say hi at\nnoirtech.digital 👋" },
    ],
  },
  NoirChatRefresh: {
    brand: NOIR, endLine: "Let's talk: noirtech.digital",
    chat: [
      { q: "Our site\nlooks dated 😬", a: "Happens. Let's\nrefresh it ✨" },
      { q: "Will it work\non phones?", a: "Every screen.\nEvery size 📱" },
      { q: "Can it bring\nin customers?", a: "That's the whole\npoint. Built to convert 📈" },
      { q: "Where do\nwe begin?", a: "We plan it\nwith you first 🤝" },
      { q: "Let's talk.", a: "noirtech.digital.\nWe're ready 🚀" },
    ],
  },
};

export const wipes: Record<string, WipeProps> = {
  BrizWipeHow: {
    brand: BRIZ,
    beats: [
      { word: "OPEN\nWHATSAPP.", line: "Chat with Briz.", icon: "phone" },
      { word: "SNAP IT.", line: "Screenshot the account.", icon: "camera" },
      { word: "CHECK IT.", line: "Confirm the details.", icon: "pen" },
      { word: "PIN IT.", line: "Your own PIN.", icon: "print" },
      { word: "SENT.", line: "Instantly. Zero wahala.", icon: "bolt" },
    ],
  },
  BrizWipeMerchant: {
    brand: BRIZ,
    beats: [
      { word: "YOUR SHOP.", line: "Now takes Briz.", icon: "store" },
      { word: "BIOPASS.", line: "No POS. No card.", icon: "print" },
      { word: "INSTANT.", line: "The money lands now.", icon: "bolt" },
      { word: "TRACKED.", line: "Every sale, recorded.", icon: "chart" },
      { word: "SAFE.", line: "Their PIN. Their pay.", icon: "shield" },
    ],
  },
  NoirWipeServices: {
    brand: NOIR,
    beats: [
      { word: "BRANDING.", line: "Look the part.", icon: "pen" },
      { word: "WEBSITES.", line: "Built to convert.", icon: "globe" },
      { word: "MOBILE\nAPPS.", line: "In every pocket.", icon: "phone" },
      { word: "AI.", line: "Work while you sleep.", icon: "bolt" },
    ],
  },
  NoirWipeProcess: {
    brand: NOIR,
    beats: [
      { word: "DISCOVER.", line: "We learn your goals.", icon: "globe" },
      { word: "DESIGN.", line: "Every pixel planned.", icon: "pen" },
      { word: "BUILD.", line: "Clean, fast code.", icon: "keys" },
      { word: "LAUNCH.", line: "Live and ready.", icon: "bolt" },
      { word: "GROW.", line: "Better every month.", icon: "chart" },
    ],
  },
};

export const pendulums = {
  BrizPendulumSend: {
    pairs: [
      { q: "SCREEN-\nSHOT?", a: "SENT." },
      { q: "VOICE\nNOTE?", a: "SENT." },
      { q: "LOST YOUR\nPHONE?", a: "BIOPASS\nGOT YOU." },
      { q: "EMER-\nGENCY?", a: "WALLET\nREADY." },
    ],
    footer: "SNAP · SAY · TYPE · PAY", tagline: "Pay with Zero Wahala.", url: "paywithbriz.com",
  },
  BrizPendulumMerchant: {
    pairs: [
      { q: "NO POS?", a: "NO\nPROBLEM." },
      { q: "NO CARD?", a: "USE\nBIOPASS." },
      { q: "SLOW\nPAYMENTS?", a: "INSTANT\nNOW." },
      { q: "MESSY\nRECORDS?", a: "ALL\nTRACKED." },
    ],
    footer: "BRIZ FOR MERCHANTS", tagline: "Pay with Zero Wahala.", url: "paywithbriz.com",
  },
  NoirPendulumFix: {
    pairs: [
      { q: "OLD\nLOGO?", a: "FRESH\nBRAND." },
      { q: "SLOW\nSITE?", a: "FAST\nNOW." },
      { q: "NO APP\nYET?", a: "LET'S\nBUILD IT." },
      { q: "MANUAL\nWORK?", a: "AUTO-\nMATED." },
    ],
    footer: "BRANDING · WEB · MOBILE · AI", tagline: "We Build Digital Solutions.", url: "noirtech.digital",
  },
  NoirPendulumJourney: {
    pairs: [
      { q: "AN\nIDEA?", a: "DESIGNED." },
      { q: "DESIGNED?", a: "BUILT." },
      { q: "BUILT?", a: "LAUNCHED." },
      { q: "LAUNCHED?", a: "GROWING." },
    ],
    footer: "FROM IDEA TO LAUNCH", tagline: "We Build Digital Solutions.", url: "noirtech.digital",
  },
};
