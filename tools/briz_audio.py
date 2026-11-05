"""Original music + sound effects for the Briz reels, synthesised from scratch with numpy (no samples, no licences).
Run: python tools/briz_audio.py   ->   public/audio/<reel>.wav  (each cue is placed on a video frame at 30 fps)
Each reel also gets <reel>-music.wav (music only) so sound can be swapped or remixed."""
import wave
from pathlib import Path
import numpy as np

SR, FPS = 44100, 30
VOLUME = 0.3  # final level of every reel, 1 = full scale
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
rng = np.random.default_rng(7)
fr = lambda f: int(round(f / FPS * SR))
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
ts = lambda d: np.arange(int(d * SR)) / SR


def lowpass(x, c):
    X = np.fft.rfft(x); w = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (w / c) ** 4), len(x))


def highpass(x, c):
    return x - lowpass(x, c)


def noise(d):
    return rng.standard_normal(int(d * SR)) * 0.3


class Track:
    def __init__(self, frames, wrap=False):
        self.n, self.wrap = fr(frames), wrap
        self.x = np.zeros(self.n + SR * 6)

    def f(self, frame, s, g=1.0):
        i = fr(frame)
        if i < 0: s, i = s[-i:], 0
        e = min(len(self.x), i + len(s))
        if i >= e: return
        self.x[i:e] += s[: e - i] * g

    def done(self):
        if not self.wrap: return self.x[: self.n]
        out = self.x[: self.n].copy(); tail = self.x[self.n:]  # tails ring round into the start: no click on loop
        out[: len(tail)] += tail
        return out


# --- instruments ---
def marimba(m, d=0.7):
    t = ts(d); f = hz(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 28)) * (1 - np.exp(-t * 900))


def kalimba(m, d=1.1):
    t = ts(d); f = hz(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 4.5) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 40)) * (1 - np.exp(-t * 700))


def keys(ms, d=1.4):
    t = ts(d); s = 0 * t
    for m in ms:
        f = hz(m)
        s += np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t + 1.2 * np.sin(2 * np.pi * f * t) * np.exp(-t * 5))
    return s * np.exp(-t * 2.2) * (1 - np.exp(-t * 200)) / len(ms)


def pad(ms, d, c=900):
    t = ts(d); s = 0 * t
    for m in ms:
        for det in (-0.07, 0.07):
            s += 2 * ((hz(m + det) * t) % 1) - 1
    env = np.minimum(1, np.minimum(t / 0.4, (d - t) / 0.5))
    return lowpass(s, c) * env / (len(ms) * 2)


def logdrum(m, d=0.42):
    t = ts(d); ph = 2 * np.pi * np.cumsum(hz(m) * (1 + 1.1 * np.exp(-t * 55))) / SR
    return np.tanh(2.2 * np.sin(ph)) * np.exp(-t * 7.5)


def kick(d=0.3):
    t = ts(d); ph = 2 * np.pi * np.cumsum(48 + 120 * np.exp(-t * 34)) / SR
    return np.sin(ph) * np.exp(-t * 11)


def shaker(g=1.0):
    n = highpass(noise(0.07), 5000); t = ts(0.07)[: len(n)]
    return n * np.exp(-t * 70) * g


def clap():
    n = highpass(lowpass(noise(0.18), 3400), 900); t = ts(0.18)[: len(n)]
    return n * (np.exp(-t * 26) + 0.8 * np.exp(-((t - 0.012) * 300) ** 2) + 0.8 * np.exp(-((t - 0.024) * 300) ** 2))


# --- sound effects ---
def click(c=2600, d=0.05):
    n = lowpass(noise(d), c); t = ts(d)[: len(n)]
    return n * np.exp(-t * 130) * 2.4


def tick_clock():
    t = ts(0.05)
    return np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 260) * 0.8 + click(5000) * 0.4


def swish(d=0.32, lo=500, hi=4200, rise=True):
    n = noise(d); p = ts(d)[: len(n)] / d
    mix = p if rise else 1 - p
    return (lowpass(n, lo) * (1 - mix) + lowpass(n, hi) * mix) * np.sin(np.pi * p) ** 2 * 2.2


def pop(m=79):
    t = ts(0.14); ph = 2 * np.pi * np.cumsum(hz(m) * (0.7 + 0.5 * (1 - np.exp(-t * 60)))) / SR
    return np.sin(ph) * np.exp(-t * 34)


def ding(ms, gap=0.09, voice=marimba):
    s = np.zeros(int((gap * len(ms) + 0.8) * SR))
    for i, m in enumerate(ms):
        v = voice(m); j = int(i * gap * SR); e = min(len(s), j + len(v)); s[j:e] += v[: e - j]
    return s


def bonk(m=43):
    t = ts(0.5)
    return np.tanh(1.6 * (np.sin(2 * np.pi * hz(m) * t) + 0.4 * np.sin(2 * np.pi * hz(m + 1) * 2 * t))) * np.exp(-t * 9)


def paper_slap():
    n = lowpass(noise(0.16), 2400); t = ts(0.16)[: len(n)]
    return n * np.exp(-t * 34) * 2.2 + kick(0.16) * 0.55


def paper_fly():
    d = 0.3; n = highpass(lowpass(noise(d), 6000), 900); t = ts(d)[: len(n)]
    return n * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 34 * t))) * np.sin(np.pi * t / d) ** 2 * 1.4


def riser(d):
    n = noise(d); p = ts(d)[: len(n)] / d
    return (lowpass(n, 300) * (1 - p) + highpass(lowpass(n, 7000), 800) * p) * p ** 2 * 2.2


def impact():
    t = ts(1.3)
    return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t * 20)) / SR)) * np.exp(-t * 3.2) + lowpass(noise(1.3), 2500) * np.exp(-t * 11) * 1.2


# --- patterns ---
TRESILLO = [0, 3, 6, 8, 11, 14]  # 16ths in a bar


def groove(tr, start, stop, beat, chords, light_until=None, voice=marimba, g=1.0):
    """Afro-pop groove on a beat grid. Before light_until only melody + shaker play; the drums join after."""
    bar, s16, b = 0, beat / 4, start
    while b < stop:
        ch = chords[bar % len(chords)]; full = light_until is None or b >= light_until
        for k in range(16):
            at = b + k * s16
            if at >= stop: continue
            tr.f(at, shaker(0.9 if k % 4 == 2 else 0.45), 0.5 * g)
            if k in TRESILLO: tr.f(at, voice(ch[(TRESILLO.index(k) + bar) % len(ch)] + 12), 0.3 * g)
            if full:
                if k in (0, 8): tr.f(at, kick(), 0.8 * g)
                if k in (4, 12): tr.f(at, clap(), 0.3 * g)
                if k in (0, 3, 6, 10, 13): tr.f(at, logdrum(ch[0] - 12), 0.5 * g)
        tr.f(b, keys(ch, beat * 4 / FPS), 0.3 * g)
        b += beat * 4; bar += 1


def master(music, sfx, name):
    n = len(music); ir = rng.standard_normal(int(0.7 * SR)) * np.exp(-ts(0.7) * 7)[: int(0.7 * SR)]

    def stereo(x, wet, ms):
        tail = np.fft.irfft(np.fft.rfft(x, n + len(ir)) * np.fft.rfft(ir, n + len(ir)))[:n] / 18
        y = x + wet * tail; d = int(ms / 1000 * SR)
        return np.stack([y, np.concatenate([np.zeros(d), y])[:n] * 0.5 + y * 0.5], 1)

    def write(st, path):
        st = np.tanh(st * 1.15); st = st / max(1e-6, np.abs(st).max()) * 0.89 * VOLUME
        with wave.open(str(path), "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((st * 32767).astype("<i2").tobytes())

    mu = stereo(music * 0.62, 0.8, 11)
    write(mu + stereo(sfx, 0.35, 3), OUT / f"{name}.wav"); write(mu, OUT / f"{name}-music.wav")


def sticker_story():
    TAP, PROC, PEND, FAIL, COMPLAIN, FLIP, TYPE, TYPED, ASK, PIN_TAP, SHEET, DOWN, SENT, THANKS, END = 40, 50, 170, 210, 236, 300, 330, 380, 396, 430, 436, 512, 524, 556, 780
    m, s = Track(END), Track(END)
    # the old way: a dull uneasy drone, no beat, only the clock
    m.f(0, pad([38, 45, 50, 51], FLIP / FPS, 420), 0.7)
    m.f(PEND, pad([37, 44, 49], (FLIP - PEND) / FPS, 300), 0.5)
    s.f(TAP, click(), 0.8)
    for f in range(PROC, PEND, 15): s.f(f, tick_clock(), 0.42)
    s.f(PEND, bonk(50), 0.45); s.f(FAIL, bonk(43), 0.8); s.f(FAIL + 7, bonk(41), 0.7)
    s.f(COMPLAIN, ding([64, 60], 0.12), 0.45)
    # Briz: a bright groove on a grid locked so the full drums land exactly on "Sent"
    beat = 16
    chords = [[65, 69, 72], [60, 64, 67], [62, 65, 69], [58, 62, 65]]
    g = Track(END); groove(g, SENT - beat * 16, END - beat * 2, beat, chords, light_until=SENT)
    g.x[: fr(FLIP - 2)] = 0; m.x += g.x
    m.f(END - beat * 2, keys([53, 65, 69, 72, 77], 2.0), 0.45)
    s.f(FLIP - 10, swish(0.45), 0.7)
    for i in range(15): s.f(TYPE + i * (TYPED - TYPE) / 15, click(3200), 0.32)
    s.f(TYPED + 6, swish(0.18, 700, 3600), 0.5); s.f(TYPED + 8, pop(76), 0.3)
    s.f(ASK, pop(72), 0.45)
    s.f(PIN_TAP, click(), 0.8); s.f(SHEET, swish(0.34, 400, 2800), 0.6)
    for k in (462, 475, 488, 501): s.f(k, click(2200), 0.7)
    s.f(DOWN, swish(0.3, 400, 2600, False), 0.5)
    s.f(SENT, ding([77, 81, 84, 89], 0.07), 0.8)
    s.f(THANKS, ding([84, 89], 0.1), 0.6)
    # flair stickers landing, "Less stress.", phone off, end frame on the bar
    for f in (60, 216, 228, 530, 542, 564): s.f(f, paper_slap(), 0.4)
    s.f(588, paper_slap(), 0.7); s.f(588, pop(77), 0.3)
    s.f(636, swish(0.4), 0.5)
    s.f(652, paper_slap(), 0.7); s.f(652, ding([77, 81, 84, 89], 0.07), 0.6)
    s.f(668, swish(0.5, 900, 5000), 0.3); s.f(690, pop(81), 0.3)
    master(m.done(), s.done(), "sticker-story")


def paper_easy():
    END, beat, a = 360, 16, 10  # 112.5 bpm: every card lands on a beat
    m, s = Track(END), Track(END)
    chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]
    groove(m, a, 292, beat, chords, light_until=a + beat * 8, voice=kalimba, g=0.85)
    groove(m, 292, END - beat * 2, beat, chords[:2], light_until=999, voice=kalimba, g=0.6)
    m.f(END - beat * 2, keys([48, 60, 64, 67, 72], 1.8), 0.4)
    for f in (10, 58, 106): s.f(max(0, f - 8), paper_fly(), 0.45); s.f(f, paper_slap(), 0.75)
    s.f(160, swish(0.3, 500, 3000), 0.4); s.f(176, paper_slap(), 0.7); s.f(232, paper_fly(), 0.7); s.f(232, swish(0.4), 0.45)
    for i in range(4): s.f(246 + i * 6, paper_slap(), 0.55)
    s.f(286, paper_fly(), 0.55); s.f(296, paper_slap(), 0.8); s.f(296, ding([72, 76, 79, 84], 0.07, kalimba), 0.7)
    s.f(308, paper_slap(), 0.5)
    master(m.done(), s.done(), "paper-easy")


def power_crowd():
    END, ANT, PUSH, BACK, beat = 420, 150, 200, 352, 15  # 120 bpm, grid locked to PUSH
    m, s = Track(END, wrap=True), Track(END, wrap=True)
    chords = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]
    muffled = Track(END + 90)  # the crowd's music heard from inside the crowd
    groove(muffled, PUSH - beat * 16, PUSH, beat, chords, light_until=999, g=0.9)
    groove(muffled, BACK + beat * 2, END, beat, chords, light_until=999, g=0.9)
    m.x += lowpass(muffled.x, 1100)[: len(m.x)] * 0.9
    for f in range(PUSH % beat, PUSH, beat): m.f(f, kick(), 0.45)
    m.f(0, pad([45, 52, 57], ANT / FPS, 500), 0.4)
    for f, up in ((16, 0), (46, 1), (76, 0), (104, 1), (128, 0)): s.f(f, ding([81 + up * 5, 88 + up * 5], 0.06), 0.45)
    for f in range(4, ANT, 9): s.f(f, click(2600), 0.16)
    s.f(ANT, riser((PUSH - ANT) / FPS), 0.75)
    # the phone is shown: everything opens up
    groove(m, PUSH, BACK + beat * 2, beat, chords, g=1.15)
    m.f(PUSH, pad([45, 57, 64, 69], (BACK - PUSH) / FPS, 1600), 0.3)
    s.f(PUSH, impact(), 0.75)
    s.f(BACK, swish(0.5, 400, 2500, False), 0.5)
    master(m.done(), s.done(), "power-crowd")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    sticker_story(); paper_easy(); power_crowd()
    print("ok")
