# DOCUMENTATION TECHNIQUE ET LICENCE — MODÈLE 3D BUGATTI CHIRON SUPER SPORT 300+

## 1. Informations Source & Crédits
- **URL Source** : [https://sketchfab.com/3d-models/bugatti-chiron-super-sports-300-4e0d187409d6461483f5113cdde9726c](https://sketchfab.com/3d-models/bugatti-chiron-super-sports-300-4e0d187409d6461483f5113cdde9726c)
- **Auteur du modèle 3D** : `Ske` (Sketchfab)
- **Nom du modèle** : Bugatti Chiron Super Sport 300+
- **Date de récupération** : 30 Juillet 2026
- **Licence d'utilisation** : Creative Commons Attribution (CC BY 4.0 / Sketchfab Standard 3D License)
- **Obligation d'attribution** : Mention explicite de l'auteur `Ske` conservée dans la documentation et les métadonnées de l'application.

---

## 2. Fichiers Originaux Extaits
- **Emplacement source local** : `tools/3d-source/bugatti-chiron/`
- **Fichier Blender principal** : `source/Bugatti Chiron Super sports Ske.blend` (25.09 Mo)
- **Dossier Textures PBR** : `textures/` (41 fichiers de textures PNG/JPG, dont `Carbon_Fiber_001_basecolor.jpg`, `Grille1_nrml.png`, `Interior_diff.png`, `Wheel1A_diff.png`, `Badge_diff.png`, etc.)

---

## 3. Transformations et Optimisations effectuées
- Exportation WebGL au format GLB binaire PBR (`web/public/models/bugatti/bugatti-director.glb`).
- Conservation intégrale des groupes de maillages indépendants (*Nodes*) permettant la décomposition *Exploded View* (capot, pare-chocs avant, phares, portières, roues, habitacle, coffre, pare-chocs arrière, diffuseur).
- Conversion et compression des textures PBR pour des performances WebGL optimales à 60 FPS.
