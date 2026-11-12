import { stage } from '../stage.js';

// Sculptor: the Optra 35, a manual-focus prime built from code. Lathe-turned metal barrel with a knurled focus ring,
// a coated front element, an iris of 11 curved blades that really closes, and 10 glass elements in 8 groups that can
// spread along the axis. Axis = +z (the front of the lens faces the camera). 1 unit = 10 cm.
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const FINISH = { black: { body: '#1a1a1a', rough: 0.42 }, silver: { body: '#c9c9c6', rough: 0.28 } };
export const F_STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];

export function buildLens(THREE, { finish = 'black' } = {}) {
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const lens = new THREE.Group();
  const body = new THREE.MeshPhysicalMaterial({ color: FINISH[finish].body, metalness: 1, roughness: FINISH[finish].rough, clearcoat: 0.3, transparent: true });
  const ink = new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.75, transparent: true });
  const lathe = (pts, mat, seg = 96) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => V2(r, y)), seg), mat); m.rotation.x = Math.PI / 2; return m; };

  // the barrel: mount at z=0, front at z≈0.78
  const barrel = new THREE.Group(); lens.add(barrel);
  barrel.add(lathe([[0.2, 0], [0.31, 0], [0.315, 0.04], [0.33, 0.05], [0.335, 0.2], [0.33, 0.22]], body));
  barrel.add(lathe([[0.33, 0.52], [0.338, 0.54], [0.338, 0.66], [0.348, 0.68], [0.35, 0.76], [0.33, 0.785], [0.29, 0.79], [0.275, 0.77]], body));
  // focus ring: a knurled band, its own mesh so it can turn
  const kn = []; for (let i = 0; i <= 28; i++) kn.push([i % 2 ? 0.351 : 0.343, 0.23 + i * 0.01]);
  const ring = lathe([[0.33, 0.22], [0.344, 0.225], ...kn, [0.344, 0.515], [0.33, 0.52]], ink, 120);
  const ring2 = new THREE.Group(); ring2.add(ring); barrel.add(ring2);
  const tick = new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.5, transparent: true });   // distance marks, so the turn shows
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, m = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, i % 2 ? 0.03 : 0.05), tick);
    m.position.set(0.359 * Math.cos(a), 0.359 * Math.sin(a), 0.5); m.rotation.z = a; ring2.add(m); }
  // the index line and the red ring that says Optra
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.004, 0.05), new THREE.MeshStandardMaterial({ color: '#f2f0ea' })); mark.position.set(0, 0.34, 0.545); barrel.add(mark);
  const red = new THREE.Mesh(new THREE.TorusGeometry(0.339, 0.0035, 8, 120), new THREE.MeshStandardMaterial({ color: '#d93d1e', roughness: 0.5, transparent: true })); red.position.z = 0.6; barrel.add(red);

  // glass: coated, slightly purple-green in reflection
  // transmission samples the page behind a transparent canvas and goes milky, so: dark, see-through, coated glass
  const glass = new THREE.MeshPhysicalMaterial({ color: '#141a22', metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.42, depthWrite: false,
    iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [200, 460], clearcoat: 1, envMapIntensity: 1.6 });
  const element = (r, front, back, t) => {                      // a lens element: two spherical faces, an edge
    const pts = [], n = 18;
    for (let i = 0; i <= n; i++) { const x = (i / n) * r; pts.push([x, t / 2 + front * (1 - (x / r) ** 2)]); }
    pts.push([r, -t / 2]);
    for (let i = n; i >= 0; i--) { const x = (i / n) * r; pts.push([x, -t / 2 - back * (1 - (x / r) ** 2)]); }
    return lathe(pts.reverse(), glass, 64);
  };
  const elements = new THREE.Group(); lens.add(elements);
  const spec = [[0.27, 0.035, 0.0, 0.03], [0.24, 0.0, 0.02, 0.02], [0.22, 0.03, 0.01, 0.03], [0.2, 0.0, 0.025, 0.018], [0.18, 0.02, 0.02, 0.035],
    [0.18, 0.02, 0.0, 0.025], [0.19, 0.0, 0.03, 0.02], [0.21, 0.03, 0.01, 0.03], [0.22, 0.01, 0.02, 0.025], [0.23, 0.02, 0.005, 0.03]];
  const homeZ = [0.73, 0.68, 0.62, 0.57, 0.48, 0.36, 0.3, 0.22, 0.15, 0.08];
  const cellMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.7, roughness: 0.35 });   // each element sits in a thin metal cell
  spec.forEach(([r, f, b, t], i) => {
    const e = new THREE.Group(); e.add(element(r, f, b, t));
    const cell = new THREE.Mesh(new THREE.TorusGeometry(r + 0.006, 0.007, 8, 64), cellMat); e.add(cell);
    e.position.z = homeZ[i]; e.userData.home = homeZ[i]; elements.add(e);
  });

  // the iris: 11 curved blades on pivots round the inside of the barrel, at z = 0.42
  const iris = new THREE.Group(); iris.position.z = 0.42; lens.add(iris);
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#262626', roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide, transparent: true });
  const bs = new THREE.Shape();                                 // a sickle: pivot at the origin, the blade curving inward
  // wide enough that each blade overlaps its neighbours, so only the centre lets light through
  bs.moveTo(0.02, -0.03); bs.quadraticCurveTo(-0.12, -0.075, -0.23, -0.03); bs.lineTo(-0.2, 0.13); bs.quadraticCurveTo(-0.08, 0.1, 0.02, 0.1); bs.closePath();
  const bg = new THREE.ShapeGeometry(bs, 12), N = 11, RP = 0.255, blades = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, pivot = new THREE.Group();
    pivot.position.set(RP * Math.cos(a), RP * Math.sin(a), i * 0.0012); pivot.rotation.z = a;
    const blade = new THREE.Mesh(bg, bladeMat); pivot.add(blade); iris.add(pivot); blades.push(blade);
  }
  // open → closed: each blade swings about its pivot. 0 = f/1.4 (wide open), 1 = f/16
  const setAperture = k => blades.forEach(b => { b.rotation.z = -1.05 + 0.86 * k; });
  setAperture(0);
  // the light you see through the opening: a warm disc behind the blades
  const backPlate = new THREE.Mesh(new THREE.CircleGeometry(0.3, 64), new THREE.MeshBasicMaterial({ color: '#fbe9d2', transparent: true }));
  backPlate.position.z = 0.395; lens.add(backPlate);

  const fadeables = [body, ink, red.material, bladeMat, backPlate.material, tick];
  lens.userData = {
    barrel, ring: ring2, elements, iris, setAperture,
    setFinish: f => { body.color.set(FINISH[f].body); body.roughness = FINISH[f].rough; },
    fadeBarrel: o => fadeables.forEach(m => { m.opacity = o; m.depthWrite = o > 0.5; }),
  };
  return lens;
}

const box = document.querySelector('#lens-3d'), track = document.querySelector('#tour');
if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const lens = buildLens(THREE); scene.add(lens);
  const u = lens.userData;
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 3, 3); scene.add(key);
  const warm = new THREE.PointLight('#ffb48a', 4, 4); warm.position.set(1.2, -0.6, 1.4); scene.add(warm);
  document.addEventListener('optra:finish', e => u.setFinish(e.detail));
  const beats = [                                               // [at, camera position, look target, lens yaw]
    [0.0, [1.25, 0.7, 2.45], [0, 0, 0.36], 0], [0.12, [1.1, 0.62, 2.35], [0, 0, 0.36], 0],
    [0.2, [0, 0, 2.15], [0, 0, 0.4], 0], [0.36, [0, 0, 2.1], [0, 0, 0.4], 0],
    [0.44, [2.3, 0.75, 2.0], [0, 0, 0.45], 0], [0.6, [2.4, 0.8, 1.9], [0, 0, 0.45], 0],
    [0.68, [1.05, 1.15, 1.75], [0, 0.05, 0.36], 0], [0.82, [1.1, 1.1, 1.8], [0, 0.05, 0.36], 0],
    [0.9, [1.85, 0.12, 0.4], [0, 0, 0.36], 0], [1.0, [1.9, 0.15, 0.45], [0, 0, 0.36], 0],
  ];
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  const update = ({ t = 0, pointer = { x: 0, y: 0 }, scroll = 0 }) => {
    const p = still ? 0 : scroll;
    let i = 0; while (i < beats.length - 2 && p > beats[i + 1][0]) i++;
    const a = beats[i], b = beats[i + 1], k = sm(a[0], b[0], p);
    cam.copy(A.set(...a[1])).lerp(B.set(...b[1]), k); look.copy(A.set(...a[2])).lerp(B.set(...b[2]), k);
    const far = Math.max(1, (1.1 / camera.aspect) ** 0.7); cam.sub(look).multiplyScalar(far).add(look);
    camera.position.copy(cam).add(A.set(pointer.x * 0.12, pointer.y * 0.08, 0)); camera.lookAt(look);
    lens.rotation.z = still ? 0 : Math.sin(t * 0.2) * 0.03;
    // aperture: closes from .2 to .34
    u.setAperture(sm(0.2, 0.34, p));
    // inside: the barrel fades back, the elements spread along the axis
    const ex = sm(0.42, 0.56, p) * (1 - sm(0.62, 0.68, p));
    u.fadeBarrel(1 - 0.92 * ex); u.barrel.position.z = -0.25 * ex;
    u.elements.children.forEach((e, j) => { e.position.z = e.userData.home + ex * (j - 4.5) * 0.17; });
    // focus: the ring turns a third of a turn from .68 to .82
    u.ring.rotation.z = -sm(0.68, 0.82, p) * 2.1;
  };
  if (still) { update({}); return; }
  return update;
}, { track, fov: 30 });

// the finish picker stage: the lens turning slowly, finish from the buttons
const fb = document.querySelector('#finish-3d');
if (fb) stage(fb, ({ THREE, scene, camera, still }) => {
  const lens = buildLens(THREE); scene.add(lens); lens.userData.setAperture(0.35);
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 3, 3); scene.add(key);
  document.addEventListener('optra:finish', e => lens.userData.setFinish(e.detail));
  camera.position.set(1.25, 0.5, 1.5); camera.lookAt(0, 0, 0.36);
  const update = ({ t = 0, pointer = { x: 0, y: 0 } }) => { lens.rotation.y = (still ? 0.3 : Math.sin(t * 0.4) * 0.35) + pointer.x * 0.4; lens.rotation.x = -pointer.y * 0.2; };
  if (still) { update({}); return; }
  return update;
}, { fov: 30 });

// craft.html: the ten elements alone, spread along the axis, turning slowly toward the cursor
const cb = document.querySelector('#craft-3d');
if (cb) stage(cb, ({ THREE, scene, camera, still }) => {
  const lens = buildLens(THREE); scene.add(lens);
  const u = lens.userData;
  u.fadeBarrel(0); u.barrel.visible = false; u.iris.visible = false;
  lens.children.forEach(c => { if (c !== u.elements) c.visible = false; });
  u.elements.children.forEach((e, j) => { e.position.z = e.userData.home + (j - 4.5) * 0.17; });
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 3, 3); scene.add(key);
  camera.position.set(2.0, 0.7, 1.9); camera.lookAt(0, 0, 0.42);
  const update = ({ t = 0, pointer = { x: 0, y: 0 } }) => {
    lens.rotation.y = (still ? 0 : Math.sin(t * 0.3) * 0.25) + pointer.x * 0.35; lens.rotation.x = -pointer.y * 0.15;
  };
  if (still) { update({}); return; }
  return update;
}, { fov: 30 });
