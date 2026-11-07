"""Short BioPass cut: keep only these spans of the blurred recording (no speed change), hide the leftover
"Incorrect PIN" line during the retry, write public/biopass-short.mp4 and the step times (short-video frames)."""
import json, subprocess
import cv2

SRC, OUT = "public/biopass-blurred.mp4", "public/biopass-short.mp4"
# (start s, end s, step label or None to continue the step)
SPANS = [
    (2.0, 10.0, "Open BioPass"),
    (10.0, 25.0, "Set Emergency PIN"),
    (38.5, 46.2, "Fund Emergency Wallet"), (51.4, 56.8, None),
    (63.3, 73.6, "Find customer"),
    (73.6, 79.8, "Enter amount"),
    (79.8, 90.6, "Customer pays"),
    (91.2, 97.4, "Payment received"),
    (97.4, 101.2, "WhatsApp receipt"),
]
MERCHANT_FROM = 4  # index of the first merchant span
HIDE = (51.4, 54.6, 30, 928, 760, 988)  # the "Incorrect PIN" line left over from the removed first try

cap = cv2.VideoCapture(SRC)
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1080x2400", "-r", "30", "-i", "-",
                       "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-pix_fmt", "yuv420p", OUT], stdin=subprocess.PIPE)
n, steps, split = 0, [], 0
for k, (a, b, label) in enumerate(SPANS):
    if k == MERCHANT_FROM: split = n
    if label: steps.append([n, label])
    cap.set(cv2.CAP_PROP_POS_FRAMES, round(a * 30))
    for i in range(round(a * 30), round(b * 30)):
        ok, f = cap.read()
        if not ok: break
        t = i / 30
        if HIDE[0] <= t <= HIDE[1]:
            x0, y0, x1, y1 = HIDE[2:]
            f[y0:y1, x0:x1] = f[y0 - 14, 20]
        ff.stdin.write(f.tobytes()); n += 1
ff.stdin.close(); ff.wait()
json.dump({"frames": n, "split": split, "steps": steps}, open("src/compositions/biopass-short.json", "w"), indent=1)
print(n, split, steps)
