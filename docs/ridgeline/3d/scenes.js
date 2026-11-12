import { stage } from '../stage.js';
import { buildBike, POINTS } from './bike.js';

// Animator: the feature tour (#tour-3d on the #tour track), the turn-it-over stage (#turn-3d: drag, hotspots, colour),
// and the workshop wheel (#wheel-3d). The page sends `ridge:color` with pine, granite or rust.
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lights = (THREE, scene) => {
  const key = new THREE.DirectionalLight('#fffbea', 2.4); key.position.set(-2, 3, 3); scene.add(key);
  const rim = new THREE.DirectionalLight('#c8f03c', 0.6); rim.position.set(3, 1, -2); scene.add(rim);
};
const shadow = THREE => {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 64 }), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 32, 0, 64, 32, 64); grd.addColorStop(0, 'rgba(29,42,33,.45)'); grd.addColorStop(1, 'rgba(29,42,33,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, 0.002, 0); return m;
};

// 1. The tour: the camera rides from part to part. Battery slides out at its stop; the fork compresses at its stop.
const tourBox = document.querySelector('#tour-3d');
if (tourBox) stage(tourBox, ({ THREE, scene, camera, still }) => {
  const bike = buildBike(THREE); scene.add(bike, shadow(THREE)); lights(THREE, scene);
  const u = bike.userData;
  document.addEventListener('ridge:color', e => u.setColor(e.detail));
  const beats = [
    { at: 0.0, pos: [0.15, 0.95, 3.4], look: [0.05, 0.6, 0] },
    { at: 0.12, pos: [0.4, 0.9, 3.2], look: [0.05, 0.6, 0] },
    { at: 0.22, pos: [0.25, 0.42, 0.95], look: POINTS.motor },
    { at: 0.32, pos: [0.3, 0.45, 0.9], look: POINTS.motor },
    { at: 0.42, pos: [0.1, 0.35, 1.25], look: POINTS.battery },
    { at: 0.54, pos: [0.15, 0.4, 1.2], look: POINTS.battery },
    { at: 0.62, pos: [1.15, 0.8, 1.05], look: POINTS.fork },
    { at: 0.74, pos: [1.1, 0.75, 1.0], look: POINTS.fork },
    { at: 0.82, pos: [1.5, 0.42, 0.55], look: POINTS.tyre },
    { at: 1.0, pos: [1.45, 0.4, 0.68], look: POINTS.tyre },
  ];
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  const update = ({ t = 0, pointer = { x: 0, y: 0 }, scroll = 0 }) => {
    const p = still ? 0 : scroll;
    let i = 0; while (i < beats.length - 2 && p > beats[i + 1].at) i++;
    const a = beats[i], b = beats[i + 1], k = sm(a.at, b.at, p);
    cam.copy(A.set(...a.pos)).lerp(B.set(...b.pos), k); look.copy(A.set(...a.look)).lerp(B.set(...b.look), k);
    const far = Math.max(1, (1.2 / camera.aspect) ** 0.7);   // tall screens: step back
    cam.sub(look).multiplyScalar(far).add(look);
    camera.position.copy(cam).add(A.set(pointer.x * 0.12, pointer.y * 0.08, 0)); camera.lookAt(look);
    // the wheels roll with the scroll; the cranks turn with them
    u.wheels.forEach(w => (w.rotation.z = -p * 26)); u.crank.rotation.z = 0.5 - p * 9;
    // battery: out and back during its stop
    const out = sm(0.43, 0.48, p) * (1 - sm(0.53, 0.58, p));
    u.battery.position.copy(u.batteryHome).addScaledVector(u.dtDir, -0.16 * out).addScaledVector(u.under, 0.11 * out);
    // fork: two compressions during its stop, as if over two roots
    const c = still ? 0 : Math.max(0, Math.sin(sm(0.62, 0.74, p) * Math.PI * 2)) * (p > 0.6 && p < 0.76 ? 1 : 0);
    u.lowers.position.copy(u.fDir).multiplyScalar(-0.07 * c);
  };
  if (still) { update({}); return; }
  return update;
}, { track: document.querySelector('#tour'), fov: 32 });

// 2. Turn it over: drag to orbit, hotspots follow their parts, the colour changes live.
const turnBox = document.querySelector('#turn-3d');
if (turnBox) stage(turnBox, async ({ THREE, scene, camera, renderer, still }) => {
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const bike = buildBike(THREE); scene.add(bike, shadow(THREE)); lights(THREE, scene);
  document.addEventListener('ridge:color', e => bike.userData.setColor(e.detail));
  camera.position.set(1.7, 1.15, 3.35);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.02, 0.58, 0); controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
  controls.minPolarAngle = 0.6; controls.maxPolarAngle = 1.55; controls.autoRotate = !still; controls.autoRotateSpeed = 0.6;
  renderer.domElement.style.touchAction = 'pan-y'; renderer.domElement.style.cursor = 'grab';
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  const spots = [...document.querySelectorAll('[data-spot]')], v = new THREE.Vector3();
  const place = () => {
    const w = turnBox.clientWidth, h = turnBox.clientHeight;
    spots.forEach(s => {
      v.set(...POINTS[s.dataset.spot]).project(camera);
      const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h, inside = x > 16 && x < w - 16 && y > 16 && y < h - 16;
      s.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      s.style.visibility = inside ? 'visible' : 'hidden';
    });
  };
  if (still) { controls.update(); place(); return; }
  return () => { controls.update(); place(); };
}, { fov: 30 });
