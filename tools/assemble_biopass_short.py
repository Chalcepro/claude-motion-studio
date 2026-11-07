"""Short BioPass walkthrough: cards from Remotion, short recording + transparent tag layer, voiceover lines
placed on their steps, the music bed, sting and outro. Run from the repo root (prints "RENDER DONE")."""
import json, re, subprocess
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
WORK = Path("out/biopass-short"); WORK.mkdir(parents=True, exist_ok=True)
FINAL = Path.home() / "Documents/Briz motion/Briz BioPass walkthrough v4 (short).mp4"
INTRO, TITLE, CARD, OUTRO = 45, 45, 36, 105  # must match SHORT in BrizBioPass.tsx
J = json.load(open("src/compositions/biopass-short.json"))
SPLIT, REC = J["split"], J["frames"]
P1 = INTRO + TITLE + CARD; P2 = P1 + SPLIT + CARD; OUT_AT = P2 + REC - SPLIT; TOTAL = OUT_AT + OUTRO
VO = "public/audio/biopass/vo-short-take1.mp3"
LINES = ["Open Briz and tap BioPass.", "Set an Emergency PIN, used only for BioPass, and choose how long it lasts.",
         "Fund your Emergency Wallet and confirm with your Briz PIN.", "Tap Collect Payment and find the customer.",
         "Enter the amount, then hand the phone to the customer.", "They enter their Emergency PIN to pay.",
         "Done. The customer can switch the PIN off now, or it turns off by itself when time runs out.", "Both get a WhatsApp receipt."]
STEP_OF_LINE = [0, 1, 2, 3, 4, 5, 6, 7]
MUSIC_GAIN = 0.2


def run(cmd):
    print(">", cmd[:120], flush=True); subprocess.run(cmd, shell=True, check=True)


def vid_s(rec_frame):  # short-recording frame -> seconds in the final video
    return (rec_frame + (P1 if rec_frame < SPLIT else P2 - SPLIT)) / 30


# --- voiceover: find the 7 breaks (longest pause near where each should fall), then place each line on its step
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", VO, "-af", "silencedetect=noise=-34dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
sil = list(zip([float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)], [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]))
h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", log).groups(); dur = int(m) * 60 + float(s)
chars = [len(l) for l in LINES]; run_c, cuts = 0, [0.0]
for c in chars[:-1]:
    run_c += c; want = dur * run_c / sum(chars)
    g = max((g for g in sil if abs((g[0] + g[1]) / 2 - want) < 3), key=lambda g: (g[1] - g[0]) - abs((g[0] + g[1]) / 2 - want) * 0.08)
    cuts.append((g[0] + g[1]) / 2)
cuts.append(dur)
steps = [st for st, _ in J["steps"]]
place, prev_end = [], 0.0
for i, (a, b) in enumerate(zip(cuts, cuts[1:])):
    at = max(vid_s(steps[STEP_OF_LINE[i]]) + 0.25, prev_end + 0.3)
    nxt = vid_s(steps[STEP_OF_LINE[i] + 1]) if STEP_OF_LINE[i] + 1 < len(steps) else OUT_AT / 30
    print(f"line {i + 1}: {b - a:.2f}s at {at:.2f}, step ends {nxt:.2f} {'OVER' if at + b - a > nxt + 0.3 else ''}", flush=True)
    place.append((a, b, at)); prev_end = at + (b - a)

# --- picture parts
def clip(frames, name):
    if not (WORK / name).exists():
        run(f'npx remotion render BrizBioPassShort "{WORK / name}" --frames={frames} --muted --concurrency=2 --browser-executable="{CHROME}"')

clip(f"0-{P1 - 1}", "pre.mp4"); clip(f"{P1 + SPLIT}-{P2 - 1}", "card2.mp4"); clip(f"{OUT_AT}-{TOTAL - 1}", "outro.mp4")
overlay = WORK / "overlay.webm"
if not overlay.exists():
    run(f'npx remotion render BrizBioPassOverlayShort "{overlay}" --codec=vp8 --pixel-format=yuva420p --image-format=png --concurrency=2 --browser-executable="{CHROME}"')

vo = ";".join(f"[7:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,adelay={int(at * 1000)}:all=1[v{i}]" for i, (a, b, at) in enumerate(place))
fc = (
    "[1:v]scale=864:1920,pad=1080:1920:108:0:0x0B0F14,fps=30[base];[base][2:v]overlay=0:0:format=auto,format=yuv420p,split[o1][o2];"
    f"[o1]trim=start_frame=0:end_frame={SPLIT},setpts=PTS-STARTPTS[p1];[o2]trim=start_frame={SPLIT},setpts=PTS-STARTPTS[p2];"
    "[0:v]format=yuv420p,fps=30[a];[3:v]format=yuv420p,fps=30[b];[4:v]format=yuv420p,fps=30[c];[a][p1][b][p2][c]concat=n=5:v=1:a=0[v];"
    + vo + ";" + "".join(f"[v{i}]" for i in range(len(place))) + f"amix=inputs={len(place)}:normalize=0,volume=0.42[vo];"
    f"[8:a]volume={MUSIC_GAIN},atrim=0:{OUT_AT / 30:.2f},afade=t=in:d=2,afade=t=out:st={OUT_AT / 30 - 1.5:.2f}:d=1.5[m];"
    f"[6:a]adelay={int(OUT_AT / 30 * 1000)}:all=1[o];[5:a][o][vo][m]amix=inputs=4:normalize=0:duration=longest[au]"
)
run(f'ffmpeg -y -loglevel error -stats -i "{WORK / "pre.mp4"}" -i public/biopass-short.mp4 -c:v libvpx -i "{overlay}" -i "{WORK / "card2.mp4"}" -i "{WORK / "outro.mp4"}" '
    f'-i public/audio/biopass-sting.wav -i public/audio/biopass-outro.wav -i {VO} -i public/audio/biopass/music-sungiu.mp3 '
    f'-filter_complex "{fc}" -map [v] -map [au] -t {TOTAL / 30:.3f} -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -movflags +faststart "{FINAL}"')
print("RENDER DONE", flush=True)
