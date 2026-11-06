"""Clay-toy kit for the Briz 3D reels: studio, materials, poseable characters, props. Run inside Blender 4.0."""
import math
import bpy
from mathutils import Vector

RED, CREAM, INK, GREEN, GOLD = "#E8391D", "#FFF3E2", "#1B1D22", "#1DB45A", "#F5B22E"


def lin(h):
    h = h.lstrip("#")
    return [((int(h[i:i + 2], 16) / 255 + 0.055) / 1.055) ** 2.4 if int(h[i:i + 2], 16) / 255 > 0.04045 else int(h[i:i + 2], 16) / 255 / 12.92 for i in (0, 2, 4)] + [1]


NOISE_SCALE, NOISE_MIX, RED_TINT = 200, 0.2, 0.05  # clay grain, how much of it shows, the faint red in every surface
TINT = "#E23A2A"


def mat(color, rough=0.42, metal=0.0, glow=0.0):
    """Matte clay: low reflection, procedural grain on object coordinates, a truly faint red secondary hue."""
    name = f"{color}_{rough}_{metal}_{glow}"
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    coord = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = NOISE_SCALE; noise.inputs["Detail"].default_value = 3
    tint = nt.nodes.new("ShaderNodeMixRGB"); tint.blend_type = "SOFT_LIGHT"
    tint.inputs[0].default_value = RED_TINT; tint.inputs[1].default_value = lin(color); tint.inputs[2].default_value = lin(TINT)
    grain = nt.nodes.new("ShaderNodeMixRGB"); grain.blend_type = "OVERLAY"; grain.inputs[0].default_value = NOISE_MIX
    nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    spread = nt.nodes.new("ShaderNodeMapRange"); spread.inputs["From Min"].default_value = 0.34; spread.inputs["From Max"].default_value = 0.66  # raw noise hugs mid-grey
    nt.links.new(noise.outputs["Fac"], spread.inputs["Value"])
    nt.links.new(tint.outputs[0], grain.inputs[1]); nt.links.new(spread.outputs[0], grain.inputs[2])
    nt.links.new(grain.outputs[0], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = max(rough + 0.25, 0.62 if not metal else 0.45)
    b.inputs["Specular IOR Level"].default_value = 0.18; b.inputs["Metallic"].default_value = metal * 0.7
    if glow: b.inputs["Emission Color"].default_value = lin(color); b.inputs["Emission Strength"].default_value = glow
    return m


def bake_scale():
    """Object coordinates ignore object scale: bake it into the mesh so the grain is the same size on every object."""
    for ob in bpy.data.objects:
        if ob.type == "MESH" and tuple(ob.scale) != (1, 1, 1):
            ob.data.transform(__import__("mathutils").Matrix.Diagonal((*ob.scale, 1))); ob.data.update(); ob.scale = (1, 1, 1)


def step_keys(ob, path="location", hold=2):
    """Stepped animation: every key holds until the next one (no linear or bezier in-betweens)."""
    for fc in (ob.animation_data.action.fcurves if ob.animation_data else []):
        for kp in fc.keyframe_points: kp.interpolation = "CONSTANT"


def smooth(ob, levels=2):
    for p in ob.data.polygons: p.use_smooth = True
    if levels:
        ob.modifiers.new("sub", "SUBSURF").levels = levels; ob.modifiers["sub"].render_levels = levels
    return ob


def link(ob, parent=None):
    bpy.context.scene.collection.objects.link(ob)
    if parent: ob.parent = parent
    return ob


def ball(name, loc, scale, m, parent=None, seg=64):
    if isinstance(scale, (int, float)): scale = (scale,) * 3
    me = bpy.data.meshes.new(name); ob = bpy.data.objects.new(name, me)
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1); bm.to_mesh(me); bm.free()
    me.materials.append(m); link(ob, parent); ob.location, ob.scale = loc, scale
    return smooth(ob, 0)


def lathe(name, profile, m, loc=(0, 0, 0), parent=None, seg=72):
    """Turn a (radius, z) profile round the Z axis into a closed soft form."""
    v, f = [], []
    for r, z in profile:
        for i in range(seg): v.append((r * math.cos(i * math.tau / seg), r * math.sin(i * math.tau / seg), z))
    n = len(profile)
    for j in range(n - 1):
        for i in range(seg):
            a, b = j * seg + i, j * seg + (i + 1) % seg
            f.append((a, b, b + seg, a + seg))
    f.append(tuple(reversed(range(seg)))); f.append(tuple((n - 1) * seg + i for i in range(seg)))
    me = bpy.data.meshes.new(name); me.from_pydata(v, [], f); me.update(); me.materials.append(m)
    ob = link(bpy.data.objects.new(name, me), parent); ob.location = loc
    return smooth(ob, 1)


def rbox(name, loc, size, m, parent=None, bevel=0.03):
    import bmesh
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); bm.to_mesh(me); bm.free()
    me.materials.append(m); ob = link(bpy.data.objects.new(name, me), parent); ob.location, ob.scale = loc, size
    ob.modifiers.new("b", "BEVEL").width = bevel; ob.modifiers["b"].segments = 4
    bpy.context.view_layer.objects.active = None
    ob.data.polygons.foreach_set("use_smooth", [True] * len(ob.data.polygons))
    ob.modifiers["b"].harden_normals = False
    return ob


def empty(name, loc=(0, 0, 0), parent=None):
    return link(bpy.data.objects.new(name, None), parent) if False else _empty(name, loc, parent)


def _empty(name, loc, parent):
    e = bpy.data.objects.new(name, None); e.location = loc; e.empty_display_size = 0.1
    return link(e, parent)


def arm(name, side, sleeve, skin, parent, shoulder):
    """Pivot empty at the shoulder; rotate it to pose. The limb hangs down -Z and the hand is at the tip."""
    p = empty(name, shoulder, parent)
    lathe(name + "_sleeve", [(0.001, 0.02), (0.09, 0.0), (0.095, -0.1), (0.082, -0.3), (0.06, -0.4), (0.001, -0.41)], mat(sleeve), parent=p)
    lathe(name + "_fore", [(0.062, -0.34), (0.056, -0.5), (0.001, -0.54)], mat(skin), parent=p)
    ball(name + "_hand", (0, 0, -0.58), (0.085, 0.07, 0.095), mat(skin), p)
    ball(name + "_thumb", (0.07 * side, 0.02, -0.54), (0.03, 0.03, 0.05), mat(skin), p)
    return p


def mouth(name, parent, loc, w=0.1):
    """A big open smile; scale the `_mouth` object to change expression (z near 0.1 = a flat worried line)."""
    pivot = empty(name, loc, parent)
    o = ball(name + "_shape", (0, 0, 0), (w, 0.02, w * 0.72), mat("#4A1216", 0.5), pivot)
    ball(name + "_teeth", (0, -0.012, w * 0.4), (w * 0.72, 0.012, w * 0.2), mat("#FFFFFF", 0.3), pivot)
    return pivot


def person(name, loc, skin, shirt, hair="#17110F", style="short", rot=0.0, scale=1.0, accent=GOLD):
    root = empty(name, loc); root.rotation_euler[2] = rot; root.scale = (scale,) * 3
    lathe(name + "_body", [(0.001, 0), (0.26, 0.0), (0.33, 0.1), (0.33, 0.42), (0.27, 0.72), (0.15, 0.84), (0.001, 0.87)], mat(shirt), parent=root)
    # neck band gives the shirt a finished edge
    lathe(name + "_collar", [(0.13, 0.8), (0.16, 0.84), (0.13, 0.87), (0.1, 0.84)], mat(accent), parent=root)
    head = empty(name + "_head", (0, 0, 1.12), root)  # pivot for nods and bounces
    ball(name + "_skull", (0, 0, 0), (0.3, 0.29, 0.31), mat(skin, 0.38), head)
    for sx in (-1, 1):
        ball(f"{name}_ear{sx}", (sx * 0.295, 0.0, -0.01), (0.04, 0.03, 0.06), mat(skin), head)
        ball(f"{name}_eye{sx}", (sx * 0.115, -0.255, 0.05), (0.07, 0.04, 0.08), mat("#FFFFFF", 0.2), head)
        ball(f"{name}_pupil{sx}", (sx * 0.112, -0.3, 0.045), (0.04, 0.018, 0.048), mat("#120D0C", 0.12), head)
        ball(f"{name}_glint{sx}", (sx * 0.098, -0.316, 0.07), (0.012, 0.004, 0.012), mat("#FFFFFF", 0.2, glow=2), head)
        b = ball(f"{name}_brow{sx}", (sx * 0.115, -0.272, 0.165), (0.07, 0.016, 0.018), mat(hair), head); b.rotation_euler[1] = sx * 0.12
    ball(name + "_nose", (0, -0.3, -0.015), (0.04, 0.03, 0.033), mat(skin), head)
    mouth(name + "_mouth", head, (0, -0.28, -0.125))
    if style == "short":
        ball(name + "_hair", (0, 0.03, 0.09), (0.315, 0.3, 0.27), mat(hair, 0.75), head)
    elif style == "afro":
        ball(name + "_hair", (0, 0.11, 0.2), (0.39, 0.36, 0.31), mat(hair, 0.85), head)
    elif style == "wrap":  # head-tie
        ball(name + "_wrap", (0, 0.03, 0.13), (0.33, 0.32, 0.26), mat(accent, 0.5), head)
        ball(name + "_knot", (0.13, -0.02, 0.38), (0.15, 0.1, 0.09), mat(accent, 0.5), head)
    elif style == "cap":
        ball(name + "_cap", (0, 0.02, 0.12), (0.32, 0.31, 0.24), mat(accent, 0.5), head)
        ball(name + "_brim", (0, -0.27, 0.1), (0.22, 0.17, 0.025), mat(accent, 0.5), head)
    # chest sits behind the hair so hair is added before arms; arms pivot at the shoulders
    arm(name + "_armL", -1, shirt, skin, root, (-0.34, 0, 0.68)).rotation_euler = (0, 0.16, 0)
    arm(name + "_armR", 1, shirt, skin, root, (0.34, 0, 0.68)).rotation_euler = (0, -0.16, 0)
    return root


def phone(name, loc, parent=None, s=1.0):
    p = empty(name, loc, parent); p.scale = (s,) * 3
    rbox(name + "_body", (0, 0, 0), (0.2, 0.024, 0.4), mat(INK, 0.25, 0.4), p, 0.02)
    rbox(name + "_screen", (0, -0.0135, 0), (0.178, 0.002, 0.372), mat(GREEN, 0.3, glow=1.5), p, 0.001)
    return p


def coin(name, loc, parent=None, s=0.14):
    c = lathe(name, [(0.001, 0.14), (0.82, 0.14), (0.84, 0.17), (1, 0.17), (1.03, 0.1), (1.03, -0.1), (1, -0.17), (0.84, -0.17), (0.82, -0.14), (0.001, -0.14)], mat(GOLD, 0.24, 0.9), loc, parent)
    c.scale = (s,) * 3; c.rotation_euler[0] = math.pi / 2
    return c


def studio(lookat=(0, 0, 1.2), cam=(0, -8.2, 1.9), lens=62, floor=RED):
    s = bpy.context.scene
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob)
    s.render.resolution_x, s.render.resolution_y, s.render.fps = 1080, 1920, 30
    s.render.engine = "BLENDER_EEVEE"; s.eevee.taa_render_samples = 48
    s.eevee.use_gtao = True; s.eevee.gtao_distance = 1.1; s.eevee.gtao_factor = 1.4
    s.eevee.use_bloom = True; s.eevee.bloom_intensity = 0.05; s.eevee.bloom_threshold = 1.1
    s.eevee.use_soft_shadows = True; s.eevee.shadow_cube_size = "2048"; s.eevee.shadow_cascade_size = "2048"
    s.view_settings.view_transform = "Standard"; s.view_settings.look = "None"
    w = bpy.data.worlds.get("W") or bpy.data.worlds.new("W"); s.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = lin("#FFD9B8"); w.node_tree.nodes["Background"].inputs[1].default_value = 0.42
    # one seamless cyclorama sweep
    v, f, n = [], [], 40
    for i in range(n + 1):
        a = i / n * math.pi / 2; y, z = 3 + math.sin(a) * 3, 3 - math.cos(a) * 3
        v += [(-30, y, z), (30, y, z)]
    v = [(-30, -30, 0), (30, -30, 0)] + v + [(-30, 6, 30), (30, 6, 30)]
    for i in range(len(v) // 2 - 1): f.append((i * 2, i * 2 + 1, i * 2 + 3, i * 2 + 2))
    me = bpy.data.meshes.new("cyc"); me.from_pydata(v, [], f); me.update(); me.materials.append(mat(floor, 0.62))
    smooth(link(bpy.data.objects.new("cyc", me)), 0)
    target = empty("cam_target", lookat)
    cd = bpy.data.cameras.new("cam"); cd.lens = lens; cd.sensor_fit = "VERTICAL"; cd.sensor_height = 36
    c = link(bpy.data.objects.new("cam", cd)); c.location = cam; s.camera = c
    t = c.constraints.new("TRACK_TO"); t.target = target; t.track_axis, t.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"

    def area(name, loc, size, power, col, aim=(0, 0, 1)):
        d = bpy.data.lights.new(name, "AREA"); d.size, d.energy, d.color = size, power, lin(col)[:3]; d.shape = "SQUARE"
        d.use_contact_shadow = True; d.shadow_soft_size = size / 2
        o = link(bpy.data.objects.new(name, d)); o.location = loc
        o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        return o

    area("key", (-4, -6, 8), 13, 1500, "#FFF0DC")
    area("fill", (6, -6, 3), 12, 380, "#FFC7A6")
    area("rim", (3.5, 0.6, 6.5), 4, 650, "#FFE3B0")
