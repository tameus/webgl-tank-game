# 3D Tank Game — WebGL Graphics Project

Computer Graphics and Interfaces — FCT Nova, 2025–26
**Authors:** Mateus Albergaria · Francisc Gututui

Interactive 3D tank game built from scratch in WebGL.

## Demo

**[Play in browser](https://tameus.github.io/webgl-tank-game)**

## What Was Built

### Hierarchical Scene Graph
The entire scene is defined in `scene.json` and traversed recursively at render time. Each node carries its own position, rotation, and scale transformations, applied down the hierarchy — allowing independent animation of each part.

**Tank components (18+ primitives):**
- Body — 4 base plates (cubes)
- Cabin — cube + sphere cupola + cylinder hatch
- Cannon — pivot, barrel, and muzzle (cylinders)
- 6 axles + 12 wheels (toruses) + 12 wheel caps (cylinders)
- Checkerboard ground plane — tiles positioned procedurally via `g(i,j)`

### Projectile Physics
Firing launches a projectile that follows gravity using **Euler numerical integration**, computed frame-by-frame. The projectile type can be switched between tomato and rabbit (`V` key).

### Enemy Cows
Two types of enemies with randomised spawning:
- **Inimigos1** — cows that spawn ahead or behind the tank at random distances, moving along the Z axis
- **Inimigos2** — cows that spawn from random directions and move erratically with randomised rotation speed

### Two Minigames

**"Atrupela-muuuus" (`M` key)**
Run over the target number of cows shown on screen before time runs out. Move with `Q/E`. Red boundary lines on the board define the play area — touching them ends the game.

**"Vacas loucas" (`N` key)**
Survive as long as possible without being hit by the frantic cows. Sets a new high score each run. Toggle visual sensitivity mode (`B` key) for a calmer visual style.

### Multiple Camera Modes

| Key | Mode |
|-----|------|
| `1` | Front orthographic view |
| `2` | Left orthographic view |
| `3` | Top orthographic view |
| `4` | Axonometric projection (adjustable azimuth/elevation) |
| `5` | Oblique projection (adjustable L and alpha) |
| `0` | Quad-view (all four views simultaneously) |

Mouse wheel zooms in any mode.

### Controls

| Key | Action |
|-----|--------|
| `Q / E` | Move tank forward / backward (wheels rotate) |
| `A / D` | Rotate cabin left / right |
| `W / S` | Elevate / lower cannon |
| `Space` | Fire projectile |
| `V` | Switch projectile type (tomato / rabbit) |
| `M` | Start minigame 1 — Atrupela-muuuus |
| `N` | Start minigame 2 — Vacas loucas |
| `B` | Toggle visual sensitivity mode |
| `Arrow keys` | Adjust camera parameters |
| `Mouse wheel` | Zoom |

### Rendering Modes
Toggle between wireframe, filled, and wireframe-over-fill. Depth testing and back-face culling ensure correct occlusion.

## Technologies

WebGL · GLSL · JavaScript · HTML/CSS · JSON (scene graph)
