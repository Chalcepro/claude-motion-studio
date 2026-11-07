"""Split the voiceover take into its 10 lines by silence, place each at its slot, mix onto the finished picture.
Run from repo root: python tools/biopass_vo.py [--write]. Video is copied, never re-encoded; the VO stays a separate wav."""
import re, subprocess, sys
from pathlib import Path

SRC = "public/audio/biopass/vo-take1.mp3"
OUT = Path.home() / "Documents/Briz motion"
PIC = OUT / "Briz BioPass walkthrough v1 (no voiceover).mp4"
FINAL = OUT / "Briz BioPass walkthrough v2 (voiceover, no music).mp4"
# recording seconds each line starts at, and the next line's start (or end of recording)
SLOTS = [0, 9, 24, 36, 54, 63, 72, 78, 90, 96, 101.2]
vid = lambda s: s + (215 if s < 63 else 275) / 30  # recording time -> video time (same map as BrizBioPass.tsx)

log = subprocess.run(["ffmpeg", "-hide_banner", "-i", SRC, "-af", "silencedetect=noise=-34dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
dur = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", log).group(3)) + 60 * float(re.search(r"Duration: (\d+):(\d+)", log).group(2))
CHARS = [86, 187, 97, 174, 108, 133, 43, 124, 80, 51]  # script length per line: each break is expected in proportion
total, run, gaps = sum(CHARS), 0, []
sil = list(zip(starts, ends))
for c in CHARS[:-1]:
    run += c
    want = dur * run / total
    # the longest pause close to where this break should fall
    gaps.append(max((g for g in sil if abs((g[0] + g[1]) / 2 - want) < 3.5), key=lambda g: (g[1] - g[0]) - abs((g[0] + g[1]) / 2 - want) * 0.08))
print([round((a + b) / 2, 2) for a, b in gaps])
cuts = [0.0] + [(a + b) / 2 for a, b in gaps] + [dur]
parts = list(zip(cuts, cuts[1:]))
for i, (a, b) in enumerate(parts):
    room = SLOTS[i + 1] - SLOTS[i]
    print(f"line {i + 1}: {b - a:.2f}s, slot {room:.1f}s {'OVER' if b - a > room else ''}")
if "--write" in sys.argv:
    trims, mix = [], []
    for i, (a, b) in enumerate(parts):
        ms = int(vid(SLOTS[i]) * 1000)
        trims.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,adelay={ms}:all=1[v{i}]")
        mix.append(f"[v{i}]")
    fc = ";".join(trims) + ";" + "".join(mix) + f"amix=inputs={len(parts)}:normalize=0:duration=longest,volume=0.42[vo]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", SRC, "-filter_complex", fc, "-map", "[vo]", "-ar", "44100", "-ac", "2", "public/audio/biopass/voiceover-track.wav"], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(PIC), "-i", "public/audio/biopass/voiceover-track.wav", "-filter_complex",
                    "[0:a][1:a]amix=inputs=2:normalize=0:duration=first[a]", "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(FINAL)], check=True)
    print("written", FINAL)
