"""Animation for "Who's paying?" (10 s at 30 fps), stepped on 3s: a key every 3 frames, every key Constant.
Run after whos_paying.py. Story: the bill slams down, panic, Tolu pulls out the phone, splits it in chat,
coins burst out to the friends, everyone cheers, the Briz card lands."""
import math
import random
import bpy
from mathutils import Euler, Vector
from briz_kit import *

ROOT = r"C:\Users\Bob\Documents\github\clAude-motion-studio"
END, STEP = 300, 3
SLAM, PHONE_UP, PUSH, SENT, DONE, BURST, LAND, CARD = 18, 66, 90, 117, 138, 153, 195, 249
D = bpy.data.objects


def ease(f, a, b):  # smooth 0-1 between frames, so spacing still eases although the keys are stepped
    p = min(1, max(0, (f - a) / (b - a)))
    return p * p * (3 - 2 * p)


def back(f, a, b, s=2.2):  # overshoot, for things that pop or land
    p = min(1, max(0, (f - a) / (b - a))) - 1
    return p * p * ((s + 1) * p + s) + 1


def mix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def text(name, body, loc, size, col, parent, align="CENTER", glow=0.0):
    c = bpy.data.curves.new(name, "FONT"); c.body = body; c.size = size; c.align_x = align; c.align_y = "CENTER"; c.extrude = 0.0
    c.font = bpy.data.fonts.load(r"C:\Windows\Fonts\arialbd.ttf", check_existing=True)
    c.materials.append(mat(col, glow=glow))
    o = link(bpy.data.objects.new(name, c), parent); o.location = loc; o.rotation_euler[0] = math.pi / 2
    return o


def logo_plane(name, path, width, loc, parent):
    img = bpy.data.images.load(path, check_existing=True); h = width * img.size[1] / img.size[0]
    me = bpy.data.meshes.new(name); me.from_pydata([(-width / 2, 0, -h / 2), (width / 2, 0, -h / 2), (width / 2, 0, h / 2), (-width / 2, 0, h / 2)], [], [(0, 1, 2, 3)])
    me.uv_layers.new(); uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for i, l in enumerate(me.uv_layers[0].data): l.uv = uvs[i]
    m = bpy.data.materials.new(name); m.use_nodes = True; m.blend_method = "CLIP"; m.alpha_threshold = 0.5
    t = m.node_tree.nodes.new("ShaderNodeTexImage"); t.image = img; b = m.node_tree.nodes["Principled BSDF"]
    m.node_tree.links.new(t.outputs[0], b.inputs["Base Color"]); m.node_tree.links.new(t.outputs[1], b.inputs["Alpha"])
    b.inputs["Roughness"].default_value = 0.7; me.materials.append(m)
    o = link(bpy.data.objects.new(name, me), parent); o.location = loc
    return o


def setup():
    # bill moves as one piece
    g = empty("bill_g", (0.72, -2.0, 0.94))
    for o in [D["bill"]] + [D[f"bill_l{i}"] for i in range(4)]:
        o.parent = g; o.location = Vector(o.location) - g.location
    # the chat on the phone
    ph = D["tolu_phone"]; D["tolu_phone_screen"].data.materials[0] = mat("#F4EFE6", glow=0.5)
    rbox("hdr", (0, -0.0155, 0.158), (0.178, 0.002, 0.052), mat(GREEN, glow=0.5), ph, 0.001)
    text("hdr_t", "Briz", (0, -0.018, 0.158), 0.034, "#FFFFFF", ph)
    g1 = empty("msg1", (0.008, -0.0165, 0.07), ph)
    rbox("msg1_b", (0, 0, 0), (0.15, 0.002, 0.062), mat(GREEN, glow=0.5), g1, 0.001)
    text("msg1_t", "Split 12k", (0, -0.003, 0), 0.034, "#FFFFFF", g1, glow=1)
    g2 = empty("msg2", (-0.008, -0.0165, -0.03), ph)
    rbox("msg2_b", (0, 0, 0), (0.15, 0.002, 0.1), mat("#FFE7A8", glow=0.5), g2, 0.001)
    text("msg2_t", "Done!\n4k each", (0, -0.003, 0), 0.034, INK, g2)
    # confetti in brand colours
    random.seed(9)
    for i in range(46):
        rbox(f"conf{i}", (random.uniform(-2.2, 2.2), random.uniform(-1.8, 0.2), 0), (0.09, 0.012, 0.13), mat(random.choice((GOLD, CREAM, GREEN, "#2F5EE0", "#FFFFFF"))), bevel=0.004)
    # the end card
    card = empty("card", (0, -3.2, 12))
    rbox("card_b", (0, 0, 0), (1.72, 0.12, 1.32), mat(CREAM, 0.6), card, 0.09)
    logo_plane("card_logo", ROOT + r"\public\briz-logo.png", 1.05, (0, -0.066, 0.2), card)
    text("card_line", "Pay like a breeze.", (0, -0.066, -0.28), 0.16, INK, card)
    text("card_url", "paywithbriz.com", (0, -0.066, -0.5), 0.1, RED, card)
    for n in ("hdr", "msg1_b", "msg2_b"): pass
    bake_scale()
    D["cam"].data.lens = 56


def faces(f):
    """(mouth open 0-1, smile 0-1, look) per person over the story."""
    panic = ease(f, SLAM, SLAM + 6) * (1 - ease(f, BURST + 6, BURST + 18))
    joy = ease(f, BURST + 6, BURST + 18)
    for n, sign in (("ada", 1), ("tolu", 0), ("kemi", -1)):
        m = D[n + "_mouth"]
        if joy:
            m.scale = (1 + 0.45 * joy, 1, 1 + 0.25 * joy)
        else:
            wobble = 0.72 + 0.28 * (int(f / 6) % 2)  # a nervous flicker on the hold
            m.scale = (0.55 + 0.45 * panic, 1, (0.3 + 0.7 * panic) * wobble)
        head = D[n + "_head"]
        # after the slam the two friends look at each other then at Tolu; everyone looks at camera for the cheer
        look = ease(f, 33, 39) * (1 - ease(f, 54, 60)) * (-1 if int(f / 12) % 2 else 1) * 0.3
        at_tolu = ease(f, 60, 69) * (1 - joy) * sign * 0.42
        head.rotation_euler = (0.08 * panic, 0, look + at_tolu)
        for s in (-1, 1):
            D[f"{n}_brow{s}"].location[2] = 0.165 + 0.05 * max(panic, joy)
            D[f"{n}_pupil{s}"].location[0] = s * 0.112 + (look + at_tolu) * 0.05
        b = D[n + "_body"]; hop = 0.0
        if SLAM <= f < SLAM + 12: hop += 0.3 * math.sin((f - SLAM) / 12 * math.pi)
        if f >= LAND: hop += abs(math.sin((f - LAND) / 15 * math.pi + sign)) * 0.34
        D[n].location[2] = 0.72 + hop


def arms(f):
    panic = ease(f, SLAM, SLAM + 6) * (1 - ease(f, LAND - 12, LAND))
    joy = ease(f, LAND - 12, LAND)
    wig = math.sin(f / 9 * math.pi) * 0.22
    for n, outer, inner, sg in (("ada", "L", "R", 1), ("kemi", "R", "L", -1)):
        o, i = D[f"{n}_arm{outer}"], D[f"{n}_arm{inner}"]
        o.rotation_euler = (-0.2, sg * (0.16 + 1.5 * panic + (2.55 + wig) * joy * (1 - 0.0)), 0)
        if joy: o.rotation_euler[1] = sg * (1.66 + (0.9 + wig) * joy)
        i.rotation_euler = (-0.2, -sg * (0.16 + 0.3 * panic + (2.2 + wig - 0.3 * panic) * joy), 0)
    lift = back(f, PHONE_UP, PHONE_UP + 15, 1.2)
    a = D["tolu_armR"]; a.rotation_euler = mix((0, -0.16, 0), (-1.75, -0.3, 0), lift)
    p = D["tolu_phone"]
    p.rotation_euler = Euler(a.rotation_euler).to_matrix().inverted().to_euler()
    big = back(f, PUSH, PUSH + 15, 1.4) * (1 - ease(f, BURST + 21, BURST + 36))
    p.scale = (1.25 + 1.1 * big,) * 3
    jab = 0.12 if SENT - 9 <= f < SENT else 0
    l = D["tolu_armL"]; l.rotation_euler = (-1.1 * big - jab, 0.2 + 0.1 * big, 0)
    if f >= LAND: l.rotation_euler = (-0.2, 2.2 + wig, 0)


def props(f):
    D["bill_g"].location[2] = 0.94 + (1 - ease(f, SLAM - 9, SLAM)) * 4.4
    k = D["bill_g"]; k.rotation_euler[2] = (1 - ease(f, SLAM - 9, SLAM)) * 1.6
    k.scale = (1 + 0.25 * (f >= SLAM and f < SLAM + 6),) * 3
    for n, g, at in (("msg1", "msg1", SENT), ("msg2", "msg2", DONE)):
        s = back(f, at, at + 6) if f >= at else 0.0
        D[g].scale = (max(s, 0.0001),) * 3
    # coins burst from the phone then rain on to the friends
    src = Vector((0.32, -0.9, 1.75)); random.seed(21)
    for i in range(9):
        c = D[f"coin{i}"]; a = BURST + i % 3 * 3; t = (f - a) / (LAND - a)
        to = Vector((-1.05 if i % 2 else 1.05, 0.7, 2.1))
        peak = 3.3 + random.random() * 0.7; side = (i - 4) * 0.34
        sp = random.random() * 3 + 2; r0 = random.random() * 3
        if t <= 0 or t >= 1.05:
            c.scale = (0.0001,) * 3
            c.location = src
            continue
        c.scale = (1, 1, 1)
        c.location = (src.x + (to.x - src.x) * t + side * math.sin(t * math.pi), src.y + (to.y - src.y) * t, src.z + (to.z - src.z) * t + (peak - src.z) * 4 * t * (1 - t) * 0.9)
        c.rotation_euler = (r0 + f * 0.0 + t * sp * 3, r0 + t * sp * 2, 0)
    random.seed(33)
    for i in range(46):
        o = D[f"conf{i}"]; a = LAND - 3 + random.randint(0, 30); v = random.uniform(0.045, 0.075); x0 = o.location[0]
        z0 = random.uniform(3.6, 4.4); sp = random.uniform(0.2, 0.5)
        t = f - a
        o.scale = (1, 1, 1) if t >= 0 else (0.0001,) * 3
        o.location[2] = max(1.0, z0 - t * v) if t >= 0 else 7
        o.rotation_euler = (t * sp, t * sp * 0.7, t * sp * 0.4)
    D["card"].location[2] = 1.42 + (1 - back(f, CARD, CARD + 12, 1.5)) * 8
    D["card"].rotation_euler[1] = (1 - back(f, CARD, CARD + 12, 1.5)) * 0.5 - 0.03


def camera(f):
    near = ease(f, PUSH - 3, PUSH + 12) * (1 - ease(f, BURST, BURST + 15))
    shake = 0.09 * (1 if int(f / 3) % 2 else -1) if SLAM <= f < SLAM + 9 else 0
    D["cam"].location = mix((0, -9, 2.2 + shake), (0.55, -5.1, 2.0), near)
    D["cam_target"].location = mix((0, 0, 1.42), (0.45, -0.9, 1.72), near)
    D["cam"].data.lens = 56


GROUPS = None


def key_all(f):
    faces(f); arms(f); props(f); camera(f)
    for ob in KEYED:
        for path in ("location", "rotation_euler", "scale"):
            ob.keyframe_insert(path, frame=f)
    D["cam"].data.keyframe_insert("lens", frame=f)


setup()
KEYED = [ob for ob in D if ob.name.split("_")[0] in ("ada", "tolu", "kemi", "bill", "msg1", "msg2", "card", "cam") or ob.name.startswith(("coin", "conf"))]
for f in range(0, END + STEP, STEP): key_all(f)
for ob in KEYED: step_keys(ob)
s = bpy.context.scene; s.frame_start, s.frame_end, s.frame_step = 0, END - 1, 1
s.render.image_settings.file_format = "PNG"; s.render.image_settings.color_mode = "RGB"; s.render.resolution_percentage = 100
