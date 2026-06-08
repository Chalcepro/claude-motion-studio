# 🎬 Claude Motion Studio

> **Turn Claude Code into a motion-graphic designer.**
> Describe a video — or drop an app's URL — and Claude writes the animation code and renders it. No After Effects. No timeline scrubbing.

This repo is two things working together:

1. **A [Remotion](https://remotion.dev) studio** — React components that render branded videos, reels, ads, and posts to MP4/PNG. Everything is code: deterministic, version-controlled, re-renders in seconds.
2. **Two Claude Code _skills_** (`.claude/skills/`) — the design + build knowledge that turns Claude into a motion designer the moment you open the repo.

Open it in [Claude Code](https://claude.com/claude-code) and say *"make a kinetic-typography intro"* or *"build an app-UI ad for this site: <url>"* — the skills activate automatically and Claude does the rest.

---

## 🧠 How it works — the skills are the magic

When you open this repo in Claude Code, two skills in `.claude/skills/` auto-activate (they're just Markdown with frontmatter — no plugins, no config):

- **`remotion-motion`** — build & render any motion-graphic style: the production workflow, the animation toolkit, the AI-image pipeline, real-data visuals, render commands, formats, and every Remotion gotcha.
- **`motion-design`** — a premium, palette-agnostic visual-design system: color, type, spacing, layered elevation, glassmorphism, depth, and a *"make it premium"* checklist so output reads award-winning, not flat.

Together they give Claude **taste + mechanics**. The Remotion project gives it a canvas. Claude designs *and* implements.

---

## ✨ What it can build

Kinetic typography · logo stings & brand bumpers · data-driven reels & posts · app-UI / product demos · cinematic product ads · explainers · social & notification reels · carousels · lower-thirds — any style, in code.

Three runnable examples ship in `src/compositions/`:

| id | Style |
|---|---|
| `KineticIntro` | kinetic-typography logo sting |
| `DataReel` | data-driven stat reel (count-ups, bars) |
| `AppShowcase` | app-UI device demo (status bar, cards, tap, confirm) |

---

## 🚀 Quickstart

```bash
git clone <this-repo> && cd claude-motion-studio
npm install                                   # Node 22+

npm run dev                                    # live preview — http://localhost:3000
npx remotion still  KineticIntro out/f.png --frame=150   # QA one frame
npx remotion render KineticIntro out/intro.mp4           # render to MP4
```

Then open the repo in **Claude Code** and ask:

```
make a 10s kinetic-typography intro for a brand called "Nova"
build an Instagram app-UI ad from this site: https://your-app.com
turn this product photo into a cinematic ad with a light sweep
```

Remotion bundles its own ffmpeg + Chromium — **system ffmpeg is not required.**

---

## 🧰 The reusable toolkit (`src/lib/`)

`primitives.tsx` packages the pro techniques so you (and Claude) don't re-derive timing each time:

- `APPLE` / `SMOOTH` easings (use these, never linear)
- `Reveal` — Apple-style blur-in entrance
- `MaskUp` — kinetic type rising from a clipped box
- `useCount` — decelerating count-up
- `Scene` — **cinematic camera**: enter from a push → hold → zoom *through* into the next scene (one continuous move, not slideshow cuts; big `exitTo` = match-cut zoom into a screen)
- `StatusBar` / `HomeBar` — realistic device chrome
- `mulberry32` — seeded RNG for deterministic particles

`design.ts` holds palette-agnostic tokens (layered shadows, glass, 8pt grid) + an example theme you swap per brand.

---

## 🖼️ Optional asset pipeline (`src/generate/`)

```
photo / idea → gpt-image (generate or restyle on green) → chroma-key cut-out → animate → render
```

- `generate.mjs` — text→image or photo→restyle via `gpt-image` (cost-gated, prompt-cached). Needs `OPENAI_API_KEY` in `.env`.
- `removebg.mjs` — keys a flat chroma-green background to a transparent cut-out (`sharp`).
- `sfx.mjs` — synthesizes UI clicks / whooshes / chimes / risers / pads from scratch (no audio library).

Everything renders without a key — image components fall back to placeholders/vectors.

---

## 📁 Structure

```
claude-motion-studio/
├── .claude/skills/
│   ├── remotion-motion/SKILL.md   # build + render any style
│   └── motion-design/SKILL.md     # premium visual-design system
├── src/
│   ├── Root.tsx                   # registers every composition
│   ├── lib/                       # design tokens + the motion toolkit
│   ├── compositions/              # your videos (3 examples included)
│   └── generate/                  # gpt-image, removebg, sfx
└── public/                        # fonts, images, audio
```

## ➕ Add your own
Create `src/compositions/MyVideo.tsx`, compose from `src/lib/primitives.tsx`, register a `<Composition>` in `src/Root.tsx`, render by id.

## 🛠️ Tech
Remotion 4 · React 19 · TypeScript · Node 22 · `@remotion/google-fonts` · `sharp`

## 📄 License
MIT — build cool things, ship them.
