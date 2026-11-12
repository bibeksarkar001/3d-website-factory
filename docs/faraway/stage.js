/* 3D Website Factory: stage.js. MIT licence. A three.js stage for objects built in code.
   Needs this import map in the page <head>, before any module script:
     <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
       "three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>

   import { stage, THREE } from './stage.js';
   stage(document.querySelector('#hero-3d'), async ({ scene, camera, load, extrude }) => {
     const logo = await extrude('assets/logo.svg', { depth: 0.25 });   // a flat SVG logo, now a solid object
     scene.add(logo);
     return ({ t, pointer, scroll, dt }) => {                            // runs every frame while on screen
       logo.rotation.y = pointer.x * 0.5 + scroll * Math.PI;            // turns toward the cursor, spins with scroll
     };
   });

   Each frame gets: t (seconds on screen), dt, pointer {x, y} in -1..1 (smoothed, whole window),
   scroll 0..1 (box entering the bottom of the screen = 0, leaving the top = 1), still (reduced motion: one frame).
   Inside a sticky section, pass { track: theTallSection } as the third argument: scroll is then the progress
   through that section (0 at its top, 1 at its end), the way Factory.scrub measures it.
   The box gets class f-on after the first frame, so factory.css can fade it in. If WebGL fails, the box keeps
   whatever is inside it (put a still image there as a fallback). The canvas never traps the mouse wheel. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE };
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
addEventListener('pointermove', e => { aim.x = e.clientX / innerWidth * 2 - 1; aim.y = 1 - e.clientY / innerHeight * 2; }, { passive: true });

export async function stage(box, setup, { fov = 35, z = 6, exposure = 1, track } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { console.warn('3D unavailable, keeping the fallback', e); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; // studio light, free
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.z = z;

  const update = await setup({ THREE, scene, camera, renderer, load, extrude, still });
  const c = renderer.domElement;
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  c.setAttribute('aria-hidden', 'true');
  box.style.position ||= 'relative';
  box.replaceChildren(c);

  const size = () => {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(() => { size(); if (!on) frame(last); }).observe(box);
  size();

  let on = false, t = 0, last = performance.now();
  const frame = now => {
    const dt = Math.min(now - last, 100) / 1000; last = now; t += dt;
    const k = 1 - Math.exp(-dt * 6); // smooth the cursor
    pointer.x += (aim.x - pointer.x) * k; pointer.y += (aim.y - pointer.y) * k;
    let scroll;
    if (track) { // sticky layout: progress through the tall track, 0 at its top, 1 at its end
      const r = track.getBoundingClientRect();
      scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    } else {
      const r = box.getBoundingClientRect();
      scroll = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    }
    update?.({ t, dt, pointer: still ? { x: 0, y: 0 } : pointer, scroll, still });
    renderer.render(scene, camera);
    box.classList.add('f-on');
  };
  const tick = now => { if (!on) return; frame(now); requestAnimationFrame(tick); };
  if (still) { frame(last); addEventListener('scroll', () => frame(performance.now()), { passive: true }); return; }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; last = performance.now(); requestAnimationFrame(tick); }
    else if (!e.isIntersecting) on = false;
  }, { rootMargin: '100px' }).observe(box);
}

/* load('assets/models/chair.glb') → a THREE.Group, centred and scaled to fit a 2-unit box. */
export async function load(url) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);
  return fit(gltf.scene);
}

/* extrude('logo.svg', { depth, bevel, material }) → the SVG's filled shapes as one solid object, centred, 2 units wide. */
export async function extrude(url, { depth = 0.3, bevel = 0.03, material } = {}) {
  const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js');
  const data = await new SVGLoader().loadAsync(url);
  const group = new THREE.Group();
  for (const path of data.paths) {
    const fill = path.userData.style.fill;
    if (!fill || fill === 'none') continue;
    const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(path), {
      depth: depth * 100, bevelEnabled: bevel > 0, bevelThickness: bevel * 100, bevelSize: bevel * 60, bevelSegments: 4, curveSegments: 24 });
    group.add(new THREE.Mesh(geo, material || new THREE.MeshPhysicalMaterial({ color: fill, metalness: 0.2, roughness: 0.25, clearcoat: 1 })));
  }
  group.scale.y = -1; // SVG y points down
  return fit(group);
}

function fit(obj, size = 2) {
  const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const wrap = new THREE.Group();
  obj.position.sub(c);
  wrap.add(obj);
  wrap.scale.setScalar(size / Math.max(s.x, s.y, s.z));
  return wrap;
}
