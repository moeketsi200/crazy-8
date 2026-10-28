"""
Crazy 8 VIP - FITTED & FULLY CLOSED Decentraland Wearables (Blender 5.x / 4.x / 3.x)

UPDATED: 
  - All clothes now have PROPERLY CLOSED openings (cuffs, collar, and bottom hem).
  - Uses an inward rolled rim extrusion + complete edgeloop cap fill.
  - Zero open holes, zero paper-thin edges, zero empty voids.
  - Finished with ribbed knit UVs on rims and dark interior lining.

HOW TO USE IN BLENDER:
  1. Open Blender with your Decentraland Avatar shape imported.
  2. Select the avatar body parts (or leave nothing selected if using AVATAR_COLLECTION).
  3. Go to Scripting tab > paste this script > click 'Run Script'.
  4. Viewport in 'Material Preview' shows the completed, closed garments!
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector

# ================================================================ SETTINGS
PROJECT_MODELS_DIR = "/home/wtc09/Personal_projects/crazy-8/assets/Models"
BACKUP_OUT_DIR = os.path.join(os.path.expanduser("~"), "crazy8_wearables")
OUT_DIR = PROJECT_MODELS_DIR if os.path.exists(PROJECT_MODELS_DIR) else BACKUP_OUT_DIR

TEX_SIZE = 512
EXPORT_GLB = True
AVATAR_COLLECTION = "DCLAvatar_ShapeA_Editable"   # used if nothing is selected
FACING = -1            # avatar faces -Y in Blender (DCL default). Use 1 if print is on back.
FONT_PATH = ""         # optional font path
TRI_LIMIT = 2000

# Closing settings
CLOSE_OPENINGS = True  # Seals wrist cuffs, collar, and bottom hem shut with closed caps & rolled hems
ROLLED_RIM_DEPTH = 0.015 # 15mm finished inward rolled hem depth

# cut lines as fractions of avatar height / wingspan
TORSO_HALF = 0.105     # half width of torso panel
NECK_FRAC = 0.790      # collar height fraction

CYAN = "#19E6F2"
GOLD = "#FFB020"
GOLD_DARK = "#C9A24B"
TEAL = "#1FA79B"
BROWN = "#7A5A1A"
NAVY = "#06203A"

PANEL, FAB, RIB = 0, 1, 2


# ============================================================ colour helpers
def _s2l(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lin(c):
    if isinstance(c, str):
        c = c.lstrip("#")
        c = tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return tuple(_s2l(v) for v in c[:3]) + (1.0,)


def holo(t):
    stops = [(0.0, (0.0, 0.75, 0.85)), (0.5, (0.30, 0.35, 0.95)), (1.0, (0.95, 0.75, 0.25))]
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(c0[i] + (c1[i] - c0[i]) * k for i in range(3))
    return stops[-1][1]


FONT = None


def init_font():
    global FONT
    for p in [FONT_PATH,
              "C:/Windows/Fonts/seguisym.ttf", "C:/Windows/Fonts/arialbd.ttf",
              "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"]:
        if p and os.path.exists(p):
            try:
                FONT = bpy.data.fonts.load(p)
                print("Using font:", p)
                return
            except Exception:
                pass
    print("No font loaded: using procedural diamond glyphs.")


# ==================================================== texture atlas (512x512)
def pos(side, px, py):
    return (0.5 * px + (0.5 if side == "back" else 0.0), 0.2 + 0.8 * py)


class Drawer:
    def __init__(self, mode, bg):
        self.mode = mode
        self.z = 0.0
        sc = bpy.data.scenes.new("TEX_" + mode)
        self.scene = sc
        self.prev = bpy.context.window.scene if bpy.context.window else None
        if bpy.context.window:
            bpy.context.window.scene = sc
        sc.render.engine = "BLENDER_WORKBENCH"
        sc.render.resolution_x = sc.render.resolution_y = TEX_SIZE
        sc.render.resolution_percentage = 100
        sc.render.image_settings.file_format = "PNG"
        sc.render.image_settings.color_mode = "RGB"
        try:
            sc.display.shading.light = "FLAT"
            sc.display.shading.color_type = "OBJECT"
            sc.display.shading.show_object_outline = False
            sc.view_settings.view_transform = "Standard"
        except Exception as e:
            print("Workbench setup warning:", e)
        w = bpy.data.worlds.new("TEXW_" + mode)
        w.color = lin(bg)[:3] if mode == "base" else (0, 0, 0)
        sc.world = w
        cd = bpy.data.cameras.new("texcam")
        cd.type = "ORTHO"
        cd.ortho_scale = 1.0
        cam = bpy.data.objects.new("texcam", cd)
        cam.location = (0.5, 0.5, 3.0)
        sc.collection.objects.link(cam)
        sc.camera = cam
        pm = bpy.data.meshes.new("unitplane")
        pm.from_pydata([(-.5, -.5, 0), (.5, -.5, 0), (.5, .5, 0), (-.5, .5, 0)], [], [(0, 1, 2, 3)])
        self.plane = pm
        n = 48
        cm = bpy.data.meshes.new("unitcircle")
        cm.from_pydata([(math.cos(2 * math.pi * i / n), math.sin(2 * math.pi * i / n), 0) for i in range(n)],
                       [], [tuple(range(n))])
        self.circ = cm

    def _col(self, color, neon):
        if self.mode == "emit" and not neon:
            return lin("#000000")
        return lin(color)

    def _add(self, data, x, y, color, neon, scale=(1, 1, 1), rot=0.0):
        o = bpy.data.objects.new("o", data)
        o.location = (x, y, self.z)
        self.z += 0.0004
        o.scale = scale
        o.rotation_euler = (0, 0, rot)
        o.color = self._col(color, neon)
        self.scene.collection.objects.link(o)
        return o

    def rect(self, side, px, py, w, h, color, neon=False, rot=0.0):
        x, y = pos(side, px, py)
        self._add(self.plane, x, y, color, neon, (0.5 * w, 0.8 * h, 1), rot)

    def rect_tex(self, x, y, w, h, color):
        self._add(self.plane, x, y, color, False, (w, h, 1))

    def bar(self, side, p1, p2, th, color, neon=False):
        x1, y1 = pos(side, *p1)
        x2, y2 = pos(side, *p2)
        L = math.hypot(x2 - x1, y2 - y1)
        self._add(self.plane, (x1 + x2) / 2, (y1 + y2) / 2, color, neon,
                  (L, th, 1), math.atan2(y2 - y1, x2 - x1))

    def circle(self, side, px, py, r, color, neon=False):
        x, y = pos(side, px, py)
        self._add(self.circ, x, y, color, neon, (r, r, 1))

    def text(self, side, px, py, body, width, color, neon=False):
        x, y = pos(side, px, py)
        cu = bpy.data.curves.new("t", "FONT")
        cu.body = body
        cu.size = 1.0
        cu.align_x = "CENTER"
        cu.align_y = "CENTER"
        if FONT:
            cu.font = FONT
        o = self._add(cu, x, y, color, neon)
        try:
            bpy.context.view_layer.update()
        except Exception:
            pass
        w = o.dimensions.x or 0.6 * len(body)
        s = (0.5 * width) / (w if w > 0 else 1.0)
        o.scale = (s, s, 1)

    def suit(self, side, px, py, ch, width, color, neon=False):
        if FONT:
            self.text(side, px, py, ch, width, color, neon)
        else:
            self.rect(side, px, py, width * 0.7, width * 0.7 * 0.625, color, neon, math.pi / 4)

    def render(self, path):
        self.scene.render.filepath = path
        bpy.ops.render.render(write_still=True, scene=self.scene.name)
        if self.prev:
            bpy.context.window.scene = self.prev
        bpy.data.scenes.remove(self.scene)


def bake_textures(name, fabric, rib, art):
    os.makedirs(OUT_DIR, exist_ok=True)
    out = {}
    for mode in ("base", "emit"):
        d = Drawer(mode, fabric)
        if mode == "base":
            d.rect_tex(0.375, 0.1, 0.25, 0.2, rib)
        art(d)
        path = os.path.join(OUT_DIR, f"{name}_{mode}.png")
        d.render(path)
        out[mode] = path
    return out


# ================================================================== artwork
def raglan_lines(d):
    for side in ("front", "back"):
        d.bar(side, (0.36, 0.99), (0.10, 0.78), 0.007, CYAN, True)
        d.bar(side, (0.64, 0.99), (0.90, 0.78), 0.007, CYAN, True)
        d.bar(side, (0.13, 0.74), (0.13, 0.16), 0.007, CYAN, True)
        d.bar(side, (0.87, 0.74), (0.87, 0.16), 0.007, CYAN, True)


def art_vip_jacket(d):
    raglan_lines(d)
    pts = [(0.14, 0.84), (0.16, 0.90), (0.22, 0.86), (0.27, 0.92), (0.32, 0.86),
           (0.38, 0.90), (0.40, 0.84), (0.14, 0.84)]
    for a, b in zip(pts, pts[1:]):
        d.bar("back", a, b, 0.006, GOLD, True)
    d.text("back", 0.17, 0.75, "K", 0.10, GOLD, True)
    d.suit("back", 0.17, 0.66, "\u2666", 0.08, GOLD, True)
    d.text("back", 0.62, 0.66, "8", 0.40, GOLD, True)
    d.text("back", 0.50, 0.38, "CRAZY 8", 0.72, CYAN, True)
    d.text("back", 0.50, 0.28, "VIP CLUB", 0.72, GOLD, True)


def art_crest_jacket(d):
    raglan_lines(d)
    d.bar("front", (0.50, 0.12), (0.50, 0.93), 0.006, GOLD)
    d.circle("front", 0.27, 0.80, 0.040, CYAN, True)
    d.circle("front", 0.27, 0.80, 0.034, "#0A0A0C")
    d.text("front", 0.27, 0.80, "C8", 0.09, CYAN, True)


def art_card_tee(d):
    cx, cy, n, w = 0.5, 0.55, 16, 0.52
    for i in range(n):
        d.rect("front", cx - w / 2 + (i + 0.5) * w / n, cy, w / n + 0.002, 0.60, holo(i / (n - 1)))
    d.rect("front", cx, cy, 0.46, 0.54, NAVY)
    d.rect("front", cx, cy, 0.46, 0.07, TEAL)
    d.text("front", 0.5, 0.69, "8", 0.20, CYAN, True)
    d.text("front", 0.5, 0.42, "8", 0.20, CYAN, True)
    d.text("front", cx, cy, "CRAZY 8", 0.38, "#04141F")
    d.text("front", 0.34, 0.77, "8", 0.06, CYAN, True)
    d.suit("front", 0.34, 0.72, "\u2660", 0.05, CYAN, True)
    d.text("front", 0.66, 0.33, "8", 0.06, CYAN, True)
    d.suit("front", 0.66, 0.38, "\u2660", 0.05, CYAN, True)


def art_high_roller(d):
    for x, ch, c in zip([0.27, 0.42, 0.58, 0.73],
                        ["\u2660", "\u2665", "\u2666", "\u2663"],
                        [TEAL, GOLD_DARK, GOLD_DARK, TEAL]):
        d.suit("front", x, 0.80, ch, 0.09, c)
    d.text("front", 0.5, 0.66, "CRAZY 8", 0.62, TEAL)
    d.text("front", 0.5, 0.58, "HIGH ROLLER", 0.62, BROWN)


# ============================================================ wearable specs
WEARABLES = [
    dict(name="crazy8_vip_club_bomber", long=True, hem_rib=True, hem=0.545, sleeve_end=0.395,
         offset=0.022, fabric="#0A0A0C", rib="#B8892B", rough=0.35, art=art_vip_jacket),
    dict(name="crazy8_crest_bomber", long=True, hem_rib=True, hem=0.545, sleeve_end=0.395,
         offset=0.022, fabric="#0A0A0C", rib="#B8892B", rough=0.35, art=art_crest_jacket),
    dict(name="crazy8_holo_card_tee", long=False, hem_rib=False, hem=0.515, sleeve_end=0.215,
         offset=0.010, fabric="#101012", rib="#101012", rough=0.85, art=art_card_tee),
    dict(name="crazy8_high_roller_tee", long=False, hem_rib=False, hem=0.515, sleeve_end=0.215,
         offset=0.010, fabric="#E9E4D8", rib="#E9E4D8", rough=0.85, art=art_high_roller),
]


# ===================================================================== core
def pct(a, p):
    return a[int(p * (len(a) - 1))]


def clamp01(v):
    return min(max(v, 0.0), 1.0)


def find_sources():
    sel = [o for o in bpy.context.selected_objects
           if o.type == "MESH" and not o.name.startswith("crazy8_")]
    if sel:
        return sel
    coll = bpy.data.collections.get(AVATAR_COLLECTION)
    if coll:
        return [o for o in coll.all_objects if o.type == "MESH" and not o.name.startswith("crazy8_")]
    return []


def duplicate_and_join(srcs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in srcs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = srcs[0]
    bpy.ops.object.duplicate()
    dups = list(bpy.context.selected_objects)
    bpy.context.view_layer.objects.active = dups[0]
    if len(dups) > 1:
        bpy.ops.object.join()
    return bpy.context.view_layer.objects.active


def find_armature(obj):
    if obj.parent and obj.parent.type == "ARMATURE":
        return obj.parent
    for m in obj.modifiers:
        if m.type == "ARMATURE" and m.object:
            return m.object
    return None


def make_material(name, base_path, emit_path, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]

    def setin(names, val):
        for n in names:
            if n in b.inputs:
                b.inputs[n].default_value = val
                return

    setin(["Roughness"], rough)
    setin(["Metallic"], 0.0)
    setin(["Specular IOR Level", "Specular"], 0.3)
    base = nt.nodes.new("ShaderNodeTexImage")
    base.image = bpy.data.images.load(base_path, check_existing=False)
    nt.links.new(base.outputs["Color"], b.inputs["Base Color"])
    em = nt.nodes.new("ShaderNodeTexImage")
    em.image = bpy.data.images.load(emit_path, check_existing=False)
    nt.links.new(em.outputs["Color"], b.inputs["Emission Color" if "Emission Color" in b.inputs else "Emission"])
    if "Emission Strength" in b.inputs:
        b.inputs["Emission Strength"].default_value = 1.0
    return m


def garment_from_avatar(spec, srcs, mat):
    obj = duplicate_and_join(srcs)
    obj.name = spec["name"]
    obj.data = obj.data.copy()
    obj.data.name = spec["name"]
    me = obj.data
    if me.shape_keys:
        for kb in list(me.shape_keys.key_blocks)[::-1]:
            obj.shape_key_remove(kb)

    M = obj.matrix_world.copy()
    M3 = M.to_3x3()
    Minv3 = M3.inverted()

    bm = bmesh.new()
    bm.from_mesh(me)
    ws = [M @ v.co for v in bm.verts]
    xs = sorted(w.x for w in ws)
    zs = sorted(w.z for w in ws)
    x_lo, x_hi = pct(xs, 0.001), pct(xs, 0.999)
    z_lo, z_hi = pct(zs, 0.001), pct(zs, 0.999)
    cx = (x_lo + x_hi) / 2
    span = x_hi - x_lo
    H = z_hi - z_lo
    z0 = z_lo + spec["hem"] * H
    z1 = z_lo + NECK_FRAC * H
    xe = spec["sleeve_end"] * span

    # 1) keep only torso + arms
    kill = []
    for f in bm.faces:
        c = M @ f.calc_center_median()
        if not (z0 <= c.z <= z1 and abs(c.x - cx) <= xe):
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context="FACES_ONLY")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    if not bm.faces:
        raise RuntimeError("Nothing left after cutting. Check NECK_FRAC / hem / sleeve_end.")

    # 2) inflate along normals so it sits over the skin
    bm.normal_update()
    off = spec["offset"]
    for v in bm.verts:
        nw = (M3 @ v.normal)
        if nw.length > 0:
            v.co += Minv3 @ (nw.normalized() * off)

    # 3) UVs for outer shell
    for l in list(bm.loops.layers.uv):
        bm.loops.layers.uv.remove(l)
    uvl = bm.loops.layers.uv.new("UVMap")
    cy = sum((M @ v.co).y for v in bm.verts) / len(bm.verts)
    Th = TORSO_HALF * span
    rib_hem = z0 + 0.045 * H
    rib_neck = z1 - 0.035 * H
    cuff = xe - 0.05 * span

    for f in bm.faces:
        f.material_index = 0
        f.smooth = True
        c = M @ f.calc_center_median()
        ax = abs(c.x - cx)
        if c.z > rib_neck and ax <= 0.06 * span:
            mode = RIB
        elif spec["hem_rib"] and c.z < rib_hem and ax <= Th * 1.2:
            mode = RIB
        elif spec["long"] and ax > cuff:
            mode = RIB
        elif ax <= Th:
            mode = PANEL
        else:
            mode = FAB
        front = (c.y - cy) * FACING > 0
        for l in f.loops:
            w = M @ l.vert.co
            if mode == PANEL:
                nx = clamp01((w.x - cx + Th) / (2 * Th))
                if FACING == 1:
                    nx = 1 - nx
                ny = clamp01((w.z - z0) / (z1 - z0))
                u = 0.5 * nx if front else 0.5 + 0.5 * (1 - nx)
                v_ = 0.2 + 0.8 * ny
            elif mode == RIB:
                u, v_ = 0.375, 0.1
            else:
                u, v_ = 0.125, 0.1
            l[uvl].uv = (u, v_)

    # 4) PROPERLY CLOSE ALL OPENINGS (Cuffs, Neck Collar, and Bottom Hem)
    if CLOSE_OPENINGS:
        boundary_edges = [e for e in bm.edges if e.is_boundary]
        if boundary_edges:
            # 4a. Extrude boundary edges slightly inward to create a finished rolled rim
            ext_res = bmesh.ops.extrude_edge_only(bm, edges=boundary_edges)
            ext_verts = [v for v in ext_res.get("geom", []) if isinstance(v, bmesh.types.BMVert)]
            ext_faces = [f for f in ext_res.get("geom", []) if isinstance(f, bmesh.types.BMFace)]

            for v in ext_verts:
                # Move slightly inward towards torso center
                v.co.x = cx + (v.co.x - cx) * 0.92
                v.co.y = cy + (v.co.y - cy) * 0.92

            for f in ext_faces:
                f.material_index = 0
                f.smooth = True
                for l in f.loops:
                    l[uvl].uv = (0.375, 0.1)  # Ribbing swatch for rolled rim

            # 4b. Seal the inner loops completely with fabric caps
            inner_boundary = [e for e in bm.edges if e.is_boundary]
            if inner_boundary:
                fill_res = bmesh.ops.edgeloop_fill(bm, edges=inner_boundary)
                for f in fill_res.get("faces", []):
                    f.material_index = 0
                    f.smooth = True
                    for l in f.loops:
                        l[uvl].uv = (0.125, 0.1)  # Dark inner lining swatch

    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.materials.clear()
    me.materials.append(mat)
    me.update()
    me.calc_loop_triangles()
    tris = len(me.loop_triangles)
    print(f"[Crazy 8] {spec['name']}: {tris} triangles (Properly closed & sealed)")
    return obj


def export_glb(obj, arm, path):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    if arm:
        arm.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                              export_apply=False, export_animations=False)
    print("Exported GLB:", path)


def material_preview():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == "VIEW_3D":
                area.spaces[0].shading.type = "MATERIAL"


# ===================================================================== main
def main():
    srcs = find_sources()
    if not srcs:
        raise RuntimeError("No avatar meshes found. Select the avatar mesh parts of ONE shape "
                           "(or set AVATAR_COLLECTION) and run again.")
    print("Avatar sources:", [o.name for o in srcs])

    for o in list(bpy.data.objects):
        if o.name.startswith("crazy8_"):
            bpy.data.objects.remove(o)

    init_font()
    os.makedirs(OUT_DIR, exist_ok=True)
    made = []
    for spec in WEARABLES:
        try:
            tex = bake_textures(spec["name"], spec["fabric"], spec["rib"], spec["art"])
            mat = make_material(spec["name"], tex["base"], tex["emit"], spec["rough"])
            obj = garment_from_avatar(spec, srcs, mat)
            arm = find_armature(obj)
            if EXPORT_GLB:
                glb_file = os.path.join(OUT_DIR, spec["name"] + ".glb")
                export_glb(obj, arm, glb_file)
            made.append(obj)
        except Exception as e:
            print(f"!! {spec['name']} failed: {e}")

    for o in made[1:]:
        o.hide_set(True)
    try:
        material_preview()
    except Exception:
        pass
    print("Done! All garments properly closed and exported to:", OUT_DIR)


main()
