"""Bake privacy blurs into the BioPass recording (irreversible: pixels are destroyed, not overlaid).
Run: python tools/biopass_blur.py "<source.mp4>"  ->  public/biopass-blurred.mp4
Fixed rects cover screens that hold still; templates follow text that scrolls."""
import subprocess, sys
from pathlib import Path
import cv2

OUT = Path(__file__).resolve().parent.parent / "public" / "biopass-blurred.mp4"
FPS, HOLD, THRESH = 30, 3, 0.62

# (start s, end s, x0, y0, x1, y1)
FIXED = [
    (66.3, 74.4, 40, 790, 930, 910),      # phone number field
    (66.3, 73.0, 0, 1640, 1080, 1850),    # digit row: touch dots show the keys pressed
    (73.3, 80.4, 20, 465, 860, 610),      # name on Payment Amount
    (80.0, 81.3, 0, 1470, 1080, 1670),    # name while Authorization slides in
    (84.3, 90.8, 60, 1195, 930, 1335),    # Emergency PIN field: last digit flashes up
    (84.3, 90.8, 0, 1640, 1080, 2300),    # keypad: touch dots
    (90.4, 92.3, 0, 1230, 1080, 1420),    # name during the slide away
    (91.3, 98.2, 370, 585, 980, 700),     # name on Payment Received
    (97.4, 97.8, 0, 200, 1080, 2200),     # the crossfade into the receipt screen
    (97.4, 102, 165, 500, 700, 556),      # receipt: name
    (97.4, 102, 115, 552, 840, 612),      # receipt: reference
    (97.4, 102, 105, 930, 690, 1262),     # receipt card: name, reference
    (97.4, 102, 510, 1275, 640, 1400),    # receipt card: QR
    (97.4, 102, 55, 1775, 740, 1885),     # join link
]
# name, grab time, template box, span, blur rects relative to the match
TEMPLATES = [
    ("heading", 81, (40, 1488, 530, 1560), (79.5, 92.3), [(490, -20, 1040, 85), (-20, 70, 470, 165)]),
    ("balance", 60, (60, 985, 480, 1050), (0, 65), [(-10, -10, 430, 75)]),
    ("main", 60, (60, 1725, 690, 1785), (0, 65), [(-10, -10, 640, 70)]),
]


def destroy(f, x0, y0, x1, y1):
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(1080, x1), min(2400, y1)
    if x1 <= x0 or y1 <= y0: return
    r = f[y0:y1, x0:x1]
    small = cv2.resize(r, (max(1, (x1 - x0) // 22), max(1, (y1 - y0) // 22)), interpolation=cv2.INTER_AREA)
    f[y0:y1, x0:x1] = cv2.GaussianBlur(cv2.resize(small, (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR), (0, 0), 14)


src = sys.argv[1]
cap = cv2.VideoCapture(src)
tpl = {}
for name, t, (x0, y0, x1, y1), span, rects in TEMPLATES:
    cap.set(cv2.CAP_PROP_POS_FRAMES, t * FPS); _, fr = cap.read()
    g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
    tpl[name] = cv2.resize(g[y0:y1, x0:x1], None, fx=0.5, fy=0.5)
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1080x2400", "-r", str(FPS), "-i", "-",
                       "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-pix_fmt", "yuv420p", str(OUT)], stdin=subprocess.PIPE)
last, hits, i = {}, {}, 0
while True:
    ok, f = cap.read()
    if not ok: break
    t = i / FPS
    clean = f
    g = None
    for name, _, box, span, rects in TEMPLATES:
        if not span[0] <= t <= span[1]: continue
        if g is None: g = cv2.resize(cv2.cvtColor(clean, cv2.COLOR_BGR2GRAY), None, fx=0.5, fy=0.5)
        _, score, _, loc = cv2.minMaxLoc(cv2.matchTemplate(g, tpl[name], cv2.TM_CCOEFF_NORMED))
        if score >= THRESH:
            last[name] = (i, loc[0] * 2, loc[1] * 2); hits[name] = hits.get(name, 0) + 1
        if name in last and i - last[name][0] <= HOLD:
            _, mx, my = last[name]
            for x0, y0, x1, y1 in rects: destroy(f, mx + x0, my + y0, mx + x1, my + y1)
    for s, e, *r in FIXED:
        if s <= t <= e: destroy(f, *r)
    ff.stdin.write(f.tobytes()); i += 1
ff.stdin.close(); ff.wait()
print("frames", i, "tracked", hits)
