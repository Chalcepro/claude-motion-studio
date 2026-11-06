"""BioPass walkthrough: Remotion draws the cards and the frame, ffmpeg joins them with the blurred recording.
Run from the repo root: python tools/assemble_biopass.py
Voiceover and music are added afterwards by mixing onto the finished file; nothing here needs re-rendering."""
import os, subprocess
from pathlib import Path
import cv2
import numpy as np

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
WORK = Path("out/biopass"); WORK.mkdir(parents=True, exist_ok=True)
FINAL = Path.home() / "Documents/Briz motion/Briz BioPass walkthrough v1 (no voiceover).mp4"
# frame ranges from BrizBioPass.tsx
PRE, CARD2, OUTRO = "0-214", "2105-2164", "3313-3422"
SPLIT = 63; X, Y, W, H, R = 157, 150, 765, 1700, 54


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
s1, s2 = shell(300, "shell1"), shell(2250, "shell2")
rec = "public/biopass-blurred.mp4"
fc = (
    f"[1:v]trim=0:{SPLIT},setpts=PTS-STARTPTS,scale={W}:{H},pad=1080:1920:{X}:{Y}:black,fps=30[r1];"
    f"[1:v]trim={SPLIT},setpts=PTS-STARTPTS,scale={W}:{H},pad=1080:1920:{X}:{Y}:black,fps=30[r2];"
    "[r1][2:v]overlay=0:0:shortest=1[p1];[r2][3:v]overlay=0:0:shortest=1[p2];"
    "[0:v]format=yuv420p,fps=30[a];[4:v]format=yuv420p,fps=30[b];[5:v]format=yuv420p,fps=30[c];"
    "[p1]format=yuv420p[p1f];[p2]format=yuv420p[p2f];"
    "[a][p1f][b][p2f][c]concat=n=5:v=1:a=0[v];"
    f"[7:a]adelay={int(3313 / 30 * 1000)}:all=1[o];[6:a][o]amix=inputs=2:normalize=0:duration=longest,apad[au]"
)
run(f'ffmpeg -y -loglevel error -stats -i "{WORK / "pre.mp4"}" -i {rec} -loop 1 -i "{s1}" -loop 1 -i "{s2}" -i "{WORK / "card2.mp4"}" -i "{WORK / "outro.mp4"}" '
    f'-i public/audio/biopass-sting.wav -i public/audio/biopass-outro.wav -filter_complex "{fc}" -map [v] -map [au] -shortest '
    f'-c:v libx264 -crf 18 -preset fast -c:a aac -b:a 192k -movflags +faststart "{FINAL}"')
print("RENDER DONE", flush=True)
