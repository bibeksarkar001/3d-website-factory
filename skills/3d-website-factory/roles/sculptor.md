# Role: Sculptor

You make the 3D objects in `_work/<slug>/objects.md`, one module each, ready for the builder to drop in.

**Reads:** `objects.md`, `design.md` (3D mood, colours), the files in `assets/`.
**Writes:** `sites/<slug>/3d/<object>.js`, one per object. Copies the files it uses into `sites/<slug>/assets/`.
Adds a `Status:` line under each object in `objects.md` (done, or why not).

## The stage
Every code-built object runs on `runtime/stage.js` (three.js, studio lighting, cursor and scroll built in).
The builder copies `stage.js` next to `index.html` and adds the import map. Your module only builds the object:

```js
// sites/<slug>/3d/hero-mark.js
import { stage, THREE } from '../stage.js';

stage(document.querySelector('#hero-mark'), async ({ scene, camera, extrude, still }) => {
  const mark = await extrude('assets/logo.svg', { depth: 0.35,
    material: new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.35, clearcoat: 1 }) });
  scene.add(mark);
  return ({ t, pointer, scroll }) => {
    mark.rotation.y = pointer.x * 0.6 + scroll * Math.PI;   // cursor and scroll
    mark.rotation.x = -pointer.y * 0.3;
    mark.position.y = Math.sin(t * 1.2) * 0.05;             // breathing, not bouncing
  };
});
```

Helpers: `extrude(svgUrl, {depth, bevel, material})` and `load(glbUrl)` both return an object centred and
sized to 2 units. `still` is true with reduced motion: show the best pose and return nothing.

## Ways to make an object
Follow the route in `objects.md`. Costs and providers: `references/assets.md`.
1. **code: the logo or a symbol, extruded.** `extrude()` on an SVG with filled shapes. Strokes do not extrude:
   convert them to fills first, or draw the shape as an SVG path yourself.
2. **code: built from shapes.** Most products are a few primitives. `LatheGeometry` for anything round (bottles,
   cups, speakers), `RoundedBoxGeometry` (`three/addons/geometries/RoundedBoxGeometry.js`) for devices,
   `TubeGeometry` along a curve for cables and ribbons, `ExtrudeGeometry` for flat parts.
   **Always group the parts by layer** so they can come apart (see the exploded view below).
3. **model:** the user's `.glb` in `assets/models/`, or a CC0 model. `load()` it. Note the licence in `objects.md`.
4. **model-gen:** a `.glb` generated from a product still (paid, quoted). Then as in 3.
5. **spline:** no module. The builder places it with `data-spline`.
Keep each model under 5 MB.

## Recipes

### Exploded view, driven by scroll
Parts sit in a group, each with a rest position and an exploded offset along one axis. The builder gives the
box a tall sticky track (200 to 300vh). Map `scroll` to 0..1 across the track with a small dead zone at each end:
```js
const k = Math.min(1, Math.max(0, (scroll - 0.2) / 0.6));        // 0 until 20 %, 1 after 80 %
const e = k * k * (3 - 2 * k);                                    // ease in and out
parts.forEach(p => p.position.y = p.userData.rest + p.userData.out * e);
group.rotation.y = -0.4 + e * 0.5;                                // a slow turn while it opens
```
Labels are HTML beside the box, not 3D text. Each label is tied to a part and fades in when `e` passes its
threshold. Report the thresholds to the animator.

### Feature tour
The camera visits parts one by one as the visitor scrolls, a headline beside each. Keep a list of stops
(`{ at: 0.25, target: [x, y, z], from: [x, y, z] }`) and ease the camera between the two stops around `scroll`.

### Turn it over
Free rotation with `OrbitControls` (`enableZoom = false`, `enablePan = false`, damping on) so the wheel still
scrolls the page. Hotspots: small HTML dots projected from 3D points each frame (`vector.project(camera)`),
each opening a short spec from the user's facts.

## Materials that look expensive
The stage already lights everything like a photo studio. Pick one material family per site, from `design.md`:

| Mood | Material |
|---|---|
| Glossy plastic | `MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1 })` |
| Matte, soft | `MeshStandardMaterial({ color, roughness: 0.9 })` |
| Metal | `MeshStandardMaterial({ color: '#ccc', metalness: 1, roughness: 0.2 })` |
| Glass | `MeshPhysicalMaterial({ transmission: 1, thickness: 0.6, roughness: 0.05, ior: 1.4 })` |
| Clay | `MeshStandardMaterial({ color: '#e9dccb', roughness: 1 })` and slightly rounded shapes |

Use bevels on everything. Sharp-edged primitives are the fastest way to look cheap.
Soft ground shadow: a plane with a radial gradient texture under the object, not a real shadow map.

## Interactions people ask for

| They say | Do |
|---|---|
| "follow the cursor" | rotate toward `pointer`, at most about 35 degrees |
| "move when I scroll" | drive rotation, position or an exploded view from `scroll` |
| "react when I hover" | raycast `pointer` against the mesh, ease a scale or colour change |
| "spin it with the mouse" | `OrbitControls` with `enableZoom = false` so the wheel still scrolls the page |
| "float" | small sine on position, under 0.1 units |
| "burst when clicked" | listen for `click` on the box, animate parts outward and back |

Everything eases. Nothing snaps. The page must always scroll over the object.

## Done when
Each module loads alone on a blank test page without console errors, looks right from the camera's
starting view, and does what `objects.md` says it reacts to.
