import bpy
import json
import os

blend_path = os.path.abspath("tools/3d-source/bugatti-chiron/source/Bugatti Chiron Super sports Ske.blend")
report_dir = os.path.abspath("tools/3d-reports")
glb_dir = os.path.abspath("web/public/models/bugatti")

os.makedirs(report_dir, exist_ok=True)
os.makedirs(glb_dir, exist_ok=True)

report_path = os.path.join(report_dir, "bugatti-scene-graph.json")
glb_path = os.path.join(glb_dir, "bugatti-director.glb")

print(f"[BLENDER EXPORT] Opening {blend_path}...")
bpy.ops.wm.open_mainfile(filepath=blend_path)

nodes = []
for obj in bpy.context.scene.objects:
    nodes.append({
        "name": obj.name,
        "type": obj.type,
        "parent": obj.parent.name if obj.parent else None,
        "location": [round(v, 4) for v in obj.location],
        "rotation": [round(v, 4) for v in obj.rotation_euler],
        "scale": [round(v, 4) for v in obj.scale],
        "children": [c.name for c in obj.children],
    })

with open(report_path, "w", encoding="utf-8") as f:
    json.dump(nodes, f, indent=2, ensure_ascii=False)

print(f"[BLENDER EXPORT] Scene graph saved to {report_path} ({len(nodes)} objects).")

print(f"[BLENDER EXPORT] Exporting GLB to {glb_path}...")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
)
print("[BLENDER EXPORT] Export GLB finished successfully.")
