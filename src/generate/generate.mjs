// Two-phase image engine — PHASE 1 (generate).
// Calls OpenAI gpt-image-1 for each prompt and caches the PNG in
// public/generated/, recording prompt -> filename in manifest.json.
// The <GenImage prompt> component (PHASE 2) renders those files at render time.
//
// Usage:
//   node src/generate/generate.mjs --plan plans/pika-ai-news.json
//   node src/generate/generate.mjs --prompt "a cute robot waving, flat pastel"
//   ...optional: --size 1024x1024 --quality medium --model gpt-image-2 --yes
//
// Before spending anything it shows how many NEW images it will create and the
// estimated cost, then asks for confirmation (skip with --yes). Already-cached
// prompts are free and never re-generated.
//
// Reads OPENAI_API_KEY from the environment or from ./.env

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline/promises";

// Approx USD per image at 1024x1024 for gpt-image-2 (scaled by area otherwise).
const COST_1K = { low: 0.006, medium: 0.053, high: 0.211 };
const estCost = (size, quality, n) => {
  const [w, h] = size.split("x").map(Number);
  const area = (w * h) / (1024 * 1024);
  return (COST_1K[quality] ?? COST_1K.medium) * area * n;
};

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question(question)).trim().toLowerCase();
  rl.close();
  return ans === "y" || ans === "yes";
}

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "generated");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

// --- tiny .env loader (no dependency) ---
function loadEnv() {
  if (process.env.OPENAI_API_KEY) return;
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// --- arg parsing ---
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

// --- collect prompts from a plan: any string under an "image"/"imagePrompt" key ---
function collectPrompts(node, acc) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectPrompts(n, acc));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if ((k === "image" || k === "imagePrompt") && typeof v === "string") acc.add(v);
      else collectPrompts(v, acc);
    }
  }
  return acc;
}

const fileFor = (prompt, size) =>
  "img_" + crypto.createHash("sha1").update(`${size}::${prompt}`).digest("hex").slice(0, 12) + ".png";

async function generateOne(prompt, { key, size, quality, model, transparent }) {
  const body = { model, prompt, size, n: 1 };
  if (model.startsWith("dall-e")) body.response_format = "b64_json";
  else {
    body.quality = quality; // gpt-image-1/2 quality: low|medium|high
    if (transparent) {
      body.background = "transparent"; // cut-out product on transparent PNG
      body.output_format = "png";
    }
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }
  const item = json.data[0];
  let buf;
  if (item.b64_json) buf = Buffer.from(item.b64_json, "base64");
  else if (item.url) buf = Buffer.from(await (await fetch(item.url)).arrayBuffer());
  else throw new Error("No image data returned");

  const filename = fileFor(prompt, size);
  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  return filename;
}

// Image EDIT — take a real photo + a prompt, return a styled version.
// Uses OpenAI's /images/edits endpoint (gpt-image-2). Returns the PNG buffer.
async function editOne(imagePath, prompt, { key, size, quality, model, transparent }) {
  const data = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const type =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", size);
  if (!model.startsWith("dall-e")) {
    form.append("quality", quality);
    if (transparent) {
      form.append("background", "transparent");
      form.append("output_format", "png");
    }
  }
  form.append("image", new Blob([data], { type }), "image" + ext);

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return Buffer.from(json.data[0].b64_json, "base64");
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("✖ Missing OPENAI_API_KEY (set it in .env or the environment).");
    process.exit(1);
  }

  const size = args.size || "1024x1024";
  const quality = args.quality || "medium";
  const model = args.model || "gpt-image-2";

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  // --- EDIT MODE: real photo + prompt -> styled image ---
  if (args.edit) {
    const imagePath = path.isAbsolute(args.edit) ? args.edit : path.join(ROOT, args.edit);
    if (!fs.existsSync(imagePath)) {
      console.error(`✖ Source image not found: ${imagePath}`);
      process.exit(1);
    }
    if (!args.prompt) {
      console.error('✖ --edit needs a --prompt describing the effect/scene.');
      process.exit(1);
    }
    const outName = args.out || ("edit_" + crypto.createHash("sha1").update(`${args.edit}::${args.prompt}::${size}`).digest("hex").slice(0, 12) + ".png");
    const cost = estCost(size, quality, 1);
    console.log(`\nEdit: ${path.basename(imagePath)}  →  ${outName}`);
    console.log(`  prompt: ${String(args.prompt).slice(0, 80)}`);
    console.log(`  model: ${model}   quality: ${quality}   size: ${size}`);
    console.log(`  estimated cost: ~$${cost.toFixed(3)}\n`);
    if (!args.yes) {
      const ok = await confirm(`Proceed with 1 edit? (y/N) `);
      if (!ok) { console.log("Cancelled — no API call, no cost."); return; }
    }
    process.stdout.write(`→ editing... `);
    try {
      const buf = await editOne(imagePath, String(args.prompt), { key, size, quality, model, transparent: !!args.transparent });
      fs.writeFileSync(path.join(OUT_DIR, outName), buf);
      console.log(`✓ generated/${outName}`);
    } catch (e) {
      console.log(`✖ ${e.message}`);
    }
    return;
  }

  // Build the prompt list
  const prompts = new Set();
  if (args.prompt) prompts.add(String(args.prompt));
  if (args.plan) {
    const plan = JSON.parse(fs.readFileSync(path.join(ROOT, args.plan), "utf8"));
    collectPrompts(plan, prompts);
  }
  if (prompts.size === 0) {
    console.error("✖ Nothing to do. Pass --plan <file> or --prompt \"...\".");
    process.exit(1);
  }

  // Split into already-cached (free) vs. new (will cost money).
  const todo = [];
  let cached = 0;
  for (const prompt of prompts) {
    if (manifest[prompt] && fs.existsSync(path.join(OUT_DIR, manifest[prompt]))) cached++;
    else todo.push(prompt);
  }

  if (todo.length === 0) {
    console.log(`All ${cached} image(s) already cached — nothing to generate. ✓`);
    return;
  }

  // Confirmation gate — never spend without an explicit yes.
  const cost = estCost(size, quality, todo.length);
  console.log(`\nReady to generate ${todo.length} new image(s) (${cached} cached, free):`);
  todo.forEach((p, i) => console.log(`  ${i + 1}. ${p.slice(0, 70)}${p.length > 70 ? "…" : ""}`));
  console.log(`\n  model: ${model}   quality: ${quality}   size: ${size}`);
  console.log(`  estimated cost: ~$${cost.toFixed(3)}  (≈ $${(cost / todo.length).toFixed(3)}/image)\n`);

  if (!args.yes) {
    const ok = await confirm(`Proceed and call the API for ${todo.length} image(s)? (y/N) `);
    if (!ok) {
      console.log("Cancelled — no API calls made, no cost incurred.");
      return;
    }
  }

  let made = 0;
  for (const prompt of todo) {
    process.stdout.write(`→ generating: "${prompt.slice(0, 50)}..." `);
    try {
      const filename = await generateOne(prompt, { key, size, quality, model, transparent: !!args.transparent });
      manifest[prompt] = filename;
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
      made++;
      console.log(`✓ ${filename}`);
    } catch (e) {
      console.log(`✖ ${e.message}`);
    }
  }
  console.log(`\nDone. ${made} generated, ${cached} cached. Manifest: ${MANIFEST}`);
}

main();
