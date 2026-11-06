"""Original music + sound effects for the Briz reels, synthesised from scratch with numpy (no samples, no licences).
Run: python tools/briz_audio.py   ->   public/audio/<reel>.wav  (each cue is placed on a video frame at 30 fps)
Each reel also gets <reel>-music.wav (music only) so sound can be swapped or remixed."""
import sys
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


def master(music, sfx, name, mute=None):
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

    def hush(st):  # true silence between two frames, whatever the reverb is doing
        if mute: st = st.copy(); st[fr(mute[0]): fr(mute[1])] = 0
        return st

    mu = stereo(music * 0.62, 0.8, 11)
    write(hush(mu + stereo(sfx, 0.35, 3)), OUT / f"{name}.wav"); write(hush(mu), OUT / f"{name}-music.wav")


# --- songs: each reel has its own tune, on a beat grid locked to its video cues ---
def sub(m, d=0.3):
    t = ts(d); s = np.tanh(1.8 * np.sin(2 * np.pi * hz(m) * t))
    return s * np.minimum(1, (d - t) / 0.02) * np.exp(-t * 2.5) * (1 - np.exp(-t * 400))


def brass(ms, d=0.3, c=2600):
    t = ts(d); s = 0 * t
    for m in ms:
        for det in (-0.08, 0.08):
            s += 2 * ((hz(m + det) * t) % 1) - 1
    return lowpass(s, c) * np.minimum(1, t / 0.012) * np.minimum(1, (d - t) / 0.05) * np.exp(-t * 2) / (len(ms) * 2)


def cut(x, frame):
    i = fr(frame); y = x.copy(); k = int(0.006 * SR)
    y[i:i + k] *= np.linspace(1, 0, k); y[i + k:] = 0
    return y


def song(start, stop, beat, chords, hook, bass, voice, kit, n, drums_from=None, lead=0.42):
    """Melody `hook` = (16th, midi) over a 2-bar cycle, `bass` = 16ths in a bar, `kit` = afro, pluck or house.
    Hard-stopped at `stop` so the logo sound gets the room to itself."""
    tr = Track(n); s16 = beat / 4; bar, b = 0, start
    drums_from = start if drums_from is None else drums_from
    while b < stop:
        ch = chords[bar % len(chords)]; full = b >= drums_from
        for k in range(16):
            at = b + k * s16
            tr.f(at, shaker(0.9 if k % 4 == 2 else 0.45), 0.42)
            if k in bass: tr.f(at, logdrum(ch[0] - 12) if kit == "afro" else sub(ch[0] - 24, s16 * 1.6 / FPS), 0.5)
            if not full: continue
            if kit == "house":
                if k % 4 == 0: tr.f(at, kick(), 0.95)
                if k in (4, 12): tr.f(at, clap(), 0.4)
                if k in (3, 6, 11, 14): tr.f(at, brass(ch, 0.2), 0.5)
            elif kit == "afro":
                if k in (0, 6, 8, 14): tr.f(at, kick(), 0.8)
                if k in (4, 12): tr.f(at, clap(), 0.32)
            else:  # finger snaps and a soft thump
                if k in (0, 10): tr.f(at, kick(), 0.5)
                if k in (4, 12): tr.f(at, click(5200, 0.06), 0.55)
        for k, m in hook:
            if k // 16 == bar % 2: tr.f(b + (k % 16) * s16, voice(m), lead)
        tr.f(b, keys(ch, beat * 4 / FPS), 0.26)
        b += beat * 4; bar += 1
    return cut(tr.x, stop)


# --- logo sounds, a different one per reel ---
def logo_breeze():  # sticker story: a soft gust carrying a bell chord up
    s = np.zeros(int(2.4 * SR)); w = swish(1.2, 900, 6000); s[: len(w)] += w * 0.5
    for i, m in enumerate((77, 81, 84, 89, 93)):
        v = kalimba(m, 1.6) + 0.4 * marimba(m + 12, 1.6); j = int(i * 0.06 * SR); s[j: j + len(v)] += v * 0.6
    return s


def logo_pluck():  # paper: a plucked ta-da that lands on a low note
    s = np.zeros(int(2 * SR))
    for at, m, g in ((0, 67, 0.7), (0.1, 72, 0.8), (0.27, 48, 1.0), (0.27, 79, 0.8)):
        v = kalimba(m, 1.5); j = int(at * SR); s[j: j + len(v)] += v * g
    return s


def logo_power():  # crowd: a sub hit under one held brass chord
    a = impact(); b = brass([57, 64, 69, 76], 1.5, 3200) * 0.9
    s = np.zeros(max(len(a), len(b))); s[: len(a)] += a * 0.7; s[: len(b)] += b
    return s


def sticker_story():
    TAP, PROC, PEND, FAIL, COMPLAIN, FLIP, TYPE, TYPED, ASK, PIN_TAP, SHEET, DOWN, SENT, THANKS, END = 40, 50, 170, 210, 236, 300, 330, 380, 396, 430, 436, 512, 524, 556, 780
    OPEN, HUSH, LOGO, beat = 262, 292, 652, 16  # build OPEN-HUSH, silence HUSH-FLIP; the grid puts FLIP, SENT and LOGO on beats
    m, s = Track(END), Track(END)
    # the old way: the calm drone, then its filter opens into the flip
    dull = pad([38, 45, 50, 51], (HUSH + 20) / FPS, 420); bright = pad([38, 45, 50, 51], (HUSH + 20) / FPS, 6000)
    p = np.clip((np.arange(len(dull)) / SR * FPS - OPEN) / (HUSH - OPEN), 0, 1) ** 2
    m.f(0, dull * (1 - p) + bright * p * 1.1, 0.7)
    m.f(PEND, pad([37, 44, 49], (HUSH + 20 - PEND) / FPS, 300), 0.5)
    m.x = cut(m.x, HUSH)
    s.f(TAP, click(), 0.8)
    for f in range(PROC, PEND, 15): s.f(f, tick_clock(), 0.42)
    s.f(PEND, bonk(50), 0.45); s.f(FAIL, bonk(43), 0.8); s.f(FAIL + 7, bonk(41), 0.7)
    s.f(COMPLAIN, ding([64, 60], 0.12), 0.45)
    s.f(OPEN, riser((HUSH - OPEN) / FPS), 0.75)
    # Briz: the song starts on the reveal; its drums join on "Sent"
    chords = [[65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67]]
    hook = [(0, 77), (3, 79), (6, 81), (10, 84), (13, 81), (16, 79), (19, 77), (22, 74), (26, 72), (29, 74)]
    m.x += song(FLIP, LOGO, beat, chords, hook, (0, 3, 6, 10, 13), marimba, "afro", END, drums_from=SENT)
    for i in range(15): s.f(TYPE + i * (TYPED - TYPE) / 15, click(3200), 0.32)
    s.f(TYPED + 6, swish(0.18, 700, 3600), 0.5); s.f(TYPED + 8, pop(76), 0.3)
    s.f(ASK, pop(72), 0.45)
    s.f(PIN_TAP, click(), 0.8); s.f(SHEET, swish(0.34, 400, 2800), 0.6)
    for k in (462, 475, 488, 501): s.f(k, click(2200), 0.7)
    s.f(DOWN, swish(0.3, 400, 2600, False), 0.5)
    s.f(SENT, ding([77, 81, 84, 89], 0.07), 0.8)
    s.f(THANKS, ding([84, 89], 0.1), 0.6)
    # flair stickers landing, "Less stress.", phone off, end frame in the clear
    for f in (60, 216, 228, 530, 542, 564): s.f(f, paper_slap(), 0.4)
    s.f(588, paper_slap(), 0.7); s.f(588, pop(77), 0.3)
    s.f(636, swish(0.4), 0.5)
    s.f(LOGO, paper_slap(), 0.7); s.f(LOGO, logo_breeze(), 0.6)
    s.f(690, pop(81), 0.3)
    master(m.done(), s.done(), "sticker-story", mute=(HUSH, FLIP))


def paper_easy():
    END, beat, a, LOGO = 360, 16, 10, 296  # 112.5 bpm: every card lands on a beat
    m, s = Track(END), Track(END)
    chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]
    hook = [(0, 76), (2, 79), (4, 84), (8, 83), (10, 79), (14, 76), (16, 74), (18, 76), (20, 79), (24, 72), (28, 74)]
    m.x += song(a, LOGO, beat, chords, hook, (0, 7, 10), kalimba, "pluck", END, drums_from=a + beat * 8, lead=0.5)
    for f in (10, 58, 106): s.f(max(0, f - 8), paper_fly(), 0.45); s.f(f, paper_slap(), 0.75)
    s.f(160, swish(0.3, 500, 3000), 0.4); s.f(176, paper_slap(), 0.7); s.f(232, paper_fly(), 0.7); s.f(232, swish(0.4), 0.45)
    for i in range(4): s.f(246 + i * 6, paper_slap(), 0.55)
    s.f(286, paper_fly(), 0.55); s.f(LOGO, paper_slap(), 0.8); s.f(LOGO, logo_pluck(), 0.7)
    s.f(308, paper_slap(), 0.5)
    master(m.done(), s.done(), "paper-easy")


def power_crowd():
    END, ANT, PUSH, BACK, LOGO, beat = 420, 150, 200, 352, 350, 15  # 120 bpm, grid locked to PUSH; LOGO = the text leaving, on a bar
    m, s = Track(END, wrap=True), Track(END, wrap=True)
    chords = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]
    hook = [(0, 81), (3, 81), (6, 84), (8, 83), (12, 79), (16, 81), (19, 76), (22, 79), (24, 76), (28, 74)]
    voice = lambda n: brass([n], 0.3, 3000)
    tune = song(PUSH % (beat * 4), LOGO, beat, chords, hook, (0, 3, 6, 10, 13), voice, "house", END, lead=0.5)
    i = fr(PUSH)  # heard from inside the crowd until the phone is shown
    m.x[:i] += lowpass(tune, 1100)[:i] * 0.45; m.x[i:] += tune[i:] * 1.05
    m.f(0, pad([45, 52, 57], ANT / FPS, 500), 0.4)
    m.f(BACK + 20, pad([45, 52, 57], (END - BACK - 20) / FPS, 500), 0.4)  # back to the opening drone so the loop joins
    for f, up in ((16, 0), (46, 1), (76, 0), (104, 1), (128, 0)): s.f(f, ding([81 + up * 5, 88 + up * 5], 0.06), 0.45)
    for f in range(4, ANT, 9): s.f(f, click(2600), 0.16)
    s.f(ANT, riser((PUSH - ANT) / FPS), 0.75)
    m.f(PUSH, pad([45, 57, 64, 69], (LOGO - PUSH) / FPS, 1600), 0.3)
    s.f(PUSH, impact(), 0.75)
    s.f(LOGO, logo_power(), 0.75)
    s.f(BACK, swish(0.5, 400, 2500, False), 0.5)
    master(m.done(), s.done(), "power-crowd")


def logo_chime():  # who's paying: three warm pops and an open chord
    s = np.zeros(int(2 * SR))
    for at, m in ((0, 72), (0.09, 76), (0.18, 79)):
        v = pop(m); j = int(at * SR); s[j: j + len(v)] += v
    v = keys([60, 67, 72, 76, 84], 1.7); j = int(0.27 * SR); s[j: j + len(v)] += v * 1.6
    return s


def whos_paying():
    END, SLAM, UP, PUSH, SENT, DONE, BURST, LAND, CARD, beat = 300, 18, 66, 90, 117, 138, 153, 195, 249, 16
    m, s = Track(END), Track(END)
    m.f(0, pad([40, 47, 52], (BURST - 6) / FPS, 450), 0.6)
    s.f(SLAM - 6, paper_fly(), 0.5); s.f(SLAM, impact(), 0.6); s.f(SLAM, paper_slap(), 0.9)
    for f in range(33, UP, 12): s.f(f, tick_clock(), 0.4)
    s.f(UP, swish(0.3, 500, 3200), 0.5); s.f(PUSH, swish(0.35, 500, 3600), 0.5)
    for f in range(SENT - 18, SENT, 3): s.f(f, click(3200), 0.32)
    s.f(SENT, pop(76), 0.45); s.f(DONE, ding([84, 89], 0.08), 0.6)
    s.f(BURST - 12, riser(12 / FPS), 0.5); s.f(BURST, impact(), 0.45)
    for f in range(BURST + 15, LAND, 3): s.f(f, ding([86 + f % 7], 0.05), 0.16)
    chords = [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69]]
    hook = [(0, 79), (3, 83), (6, 86), (8, 83), (11, 79), (14, 81), (16, 78), (19, 81), (22, 83), (27, 79)]
    m.x += song(BURST, CARD, beat, chords, hook, (0, 3, 6, 10, 13), marimba, "afro", END)
    s.f(CARD, paper_slap(), 0.8); s.f(CARD, logo_chime(), 0.6)
    master(m.done(), s.done(), "whos-paying")


def briz_banner():  # 8 s loop, frames match BrizBanner.tsx
    END, LAND, beat = 240, 24, 16
    m, s = Track(END), Track(END)
    s.f(0, swish(0.7, 400, 3800), 0.5); s.f(LAND, impact(), 0.5); s.f(LAND, logo_breeze(), 0.55)
    chords = [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]]
    hook = [(0, 76), (3, 79), (6, 84), (8, 79), (11, 76), (14, 79), (16, 74), (19, 77), (22, 79), (27, 76)]
    m.x += song(LAND, 222, beat, chords, hook, (0, 3, 6, 10, 13), marimba, "afro", END)
    for at, n in ((84, 72), (118, 76), (152, 79)):
        s.f(at - 8, swish(0.27, 700, 4200), 0.45); s.f(at, pop(n), 0.5)
    s.f(192, logo_chime(), 0.6); s.f(218, swish(0.5, 3800, 500, False), 0.35)
    master(m.done(), s.done(), "briz-banner")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    if "banner" in sys.argv: briz_banner(); print("ok"); sys.exit()
    whos_paying() if "whos" in sys.argv else (sticker_story(), paper_easy(), power_crowd())
    print("ok")
