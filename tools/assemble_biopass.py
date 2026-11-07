"""BioPass walkthrough: Remotion draws the cards and the frame, ffmpeg joins them with the blurred recording.
Run from the repo root: python tools/assemble_biopass.py
Voiceover and music are added afterwards by mixing onto the finished file; nothing here needs re-rendering."""
import os, subprocess
from pathlib import Path
import cv2
import numpy as np

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
WORK = Path("out/biopass"); WORK.mkdir(parents=True, exist_ok=True)
FINAL = Path.home() / "Documents/Briz motion/Briz BioPass walkthrough v3.mp4"
# frame ranges from BrizBioPass.tsx
PRE, CARD2, OUTRO = "0-214", "2105-2164", "3313-3422"
SPLIT = 63; MUSIC_GAIN = 0.2


def run(cmd):
    print(">", cmd[:110], flush=True); subprocess.run(cmd, shell=True, check=True)


def clip(frames, name):
    if not (WORK / name).exists():
        run(f'npx remotion render BrizBioPass "{WORK / name}" --frames={frames} --muted --concurrency=2 --browser-executable="{CHROME}"')


def shell(frame, name):
    png = WORK / f"{name}.png"
    run(f'npx remotion still BrizBioPass "{png}" --frame={frame} --browser-executable="{CHROME}"')
    img = cv2.imread(str(png))
    a = np.full(img.shape[:2], 255, np.uint8)
    hole = np.zeros_like(a)
    cv2.rectangle(hole, (X + R, Y), (X + W - R, Y + H), 255, -1); cv2.rectangle(hole, (X, Y + R), (X + W, Y + H - R), 255, -1)
    for cx in (X + R, X + W - R):
        for cy in (Y + R, Y + H - R): cv2.circle(hole, (cx, cy), R, 255, -1, cv2.LINE_AA)
    cv2.imwrite(str(png), np.dstack([img, cv2.subtract(a, hole)]))
    return png


clip(PRE, "pre.mp4"); clip(CARD2, "card2.mp4"); clip(OUTRO, "outro.mp4")
overlay = WORK / "overlay.webm"
if not overlay.exists():
    run(f'npx remotion render BrizBioPassOverlay "{overlay}" --codec=vp8 --pixel-format=yuva420p --image-format=png --concurrency=2 --browser-executable="{CHROME}"')
rec = "public/biopass-blurred.mp4"
OUTRO_S = 3313 / 30
fc = (
    "[1:v]scale=864:1920,pad=1080:1920:108:0:0x0B0F14,fps=30[base];[base][2:v]overlay=0:0:format=auto,format=yuv420p,split[o1][o2];"
    f"[o1]trim=0:{SPLIT},setpts=PTS-STARTPTS[p1];[o2]trim={SPLIT},setpts=PTS-STARTPTS[p2];"
    "[0:v]format=yuv420p,fps=30[a];[3:v]format=yuv420p,fps=30[b];[4:v]format=yuv420p,fps=30[c];"
    "[a][p1][b][p2][c]concat=n=5:v=1:a=0[v];"
    f"[8:a]volume={MUSIC_GAIN},afade=t=in:d=2,afade=t=out:st={OUTRO_S - 1.5:.2f}:d=1.5[m];"
    f"[6:a]adelay={int(OUTRO_S * 1000)}:all=1[o];[5:a][o][7:a][m]amix=inputs=4:normalize=0:duration=longest[au]"
)
run(f'ffmpeg -y -loglevel error -stats -i "{WORK / "pre.mp4"}" -i {rec} -c:v libvpx -i "{overlay}" -i "{WORK / "card2.mp4"}" -i "{WORK / "outro.mp4"}" '
    f'-i public/audio/biopass-sting.wav -i public/audio/biopass-outro.wav -i public/audio/biopass/voiceover-track.wav -i public/audio/biopass/music-sungiu.mp3 '
    f'-filter_complex "{fc}" -map [v] -map [au] -t 114.1 -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -movflags +faststart "{FINAL}"')
print("RENDER DONE", flush=True)
