"""Scene for the Briz reel "Who's paying?": friends at a suya spot. Run inside Blender with briz_kit importable."""
import math
import random
from briz_kit import *


def skewer(name, loc, rot):
    s = empty(name, loc); s.rotation_euler[2] = rot
    stick = lathe(name + "_stick", [(0.012, -0.34), (0.012, 0.36)], mat("#C99A62"), parent=s); stick.rotation_euler[1] = math.pi / 2
    for i, x in enumerate((-0.2, -0.08, 0.04, 0.16)):
        ball(f"{name}_m{i}", (x, 0, 0), (0.07, 0.06, 0.052), mat("#7A3216" if i % 2 else "#94461E", 0.55), s)


def build():
    studio(lookat=(0, 0, 1.72), cam=(0, -9, 2.2), lens=56)
    people = [
        person("ada", (-1.05, 1.05, 0.72), "#7B4A2D", "#FFF3E2", style="wrap", accent=GOLD, rot=0.14, scale=0.96),
        person("tolu", (0, 0.95, 0.72), "#5B3420", GREEN, style="short", accent=CREAM, rot=0.0, scale=1.08),
        person("kemi", (1.05, 1.05, 0.72), "#8E5A38", "#2F5EE0", style="afro", accent=CREAM, rot=-0.14, scale=0.96),
    ]
    # tabletop in the foreground; a chunky round table reads as a toy
    lathe("table", [(0.001, 0.7), (1.75, 0.7), (1.85, 0.76), (1.85, 0.86), (1.75, 0.92), (0.001, 0.92)], mat("#C9884C", 0.48), (0, -1.35, 0))
    lathe("leg", [(0.3, 0), (0.22, 0.05), (0.2, 0.7)], mat("#8F5A30"), (0, -1.35, 0))
    # the bill, curling up off a little tray: the problem in the middle of the frame
    lathe("tray", [(0.001, 0.92), (0.52, 0.92), (0.56, 0.97), (0.5, 0.96), (0.001, 0.95)], mat("#FFFFFF", 0.3), (-0.95, -1.9, 0))
    for i in range(3): skewer(f"suya{i}", (-0.95, -1.9 + i * 0.09, 1.0 + i * 0.025), 0.35 - i * 0.3)
    rbox("bill", (0.72, -2.0, 0.94), (0.72, 0.9, 0.012), mat(CREAM, 0.6), bevel=0.005).rotation_euler[2] = -0.2
    for i in range(4): rbox(f"bill_l{i}", (0.72 + i * 0.012, -1.74 - i * 0.16, 0.95), (0.5 if i < 3 else 0.24, 0.05, 0.004), mat(INK), bevel=0.001).rotation_euler[2] = -0.2
    rbox("drink", (1.35, -0.75, 1.15), (0.2, 0.2, 0.46), mat(RED, 0.2), bevel=0.08)
    # Tolu holds the phone up beside the head, screen to camera; the others throw their hands up
    arm_r = bpy.data.objects["tolu_armR"]; arm_r.rotation_euler = (-1.75, -0.3, 0)
    bpy.context.view_layer.update()
    ph = phone("tolu_phone", (0, 0, -0.78), arm_r, 1.25); ph.rotation_euler = (1.75, 0.3, 0)
    # outer arm thrown up, inner arm kept low so nobody touches Tolu
    D = bpy.data.objects
    D["ada_armL"].rotation_euler = (-0.2, 2.45, 0); D["ada_armR"].rotation_euler = (-0.2, -0.45, 0)
    D["kemi_armR"].rotation_euler = (-0.2, -2.45, 0); D["kemi_armL"].rotation_euler = (-0.2, 0.45, 0)
    random.seed(4)
    for i in range(9):
        c = coin(f"coin{i}", (-1.45 + i * 0.36, -0.3, 3.15 + random.uniform(-0.2, 0.45))); c.rotation_euler = (random.random() * 3, random.random() * 3, 0)


build()
bake_scale()
