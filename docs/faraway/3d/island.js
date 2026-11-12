import { stage } from '../stage.js';

// Sculptor + animator: a low-poly miniature island you fly over. Flat-shaded grass and sand, a hill, a village of
// small houses, trees, a harbour with a pier and moored boats, the ferry arriving, a lighthouse on the headland and
// moving water. As you scroll the camera flies harbour → village → headland, the day turns to dusk, windows light
// up and the lighthouse lamp comes on. The sky colour is shared with the page through the CSS variable --sky.

const rng = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);
const flat = (THREE, color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// coastline: a lumpy circle with a cove to the south (the harbour) and a headland to the east (the lighthouse)
const coast = th => 4.2 + 0.5 * Math.sin(3 * th) + 0.3 * Math.sin(5 * th + 1.3)
  + 1.7 * Math.exp(-(th ** 2) / 0.05) - 0.9 * Math.exp(-((th + Math.PI / 2) ** 2) / 0.04);
const HILL = { x: -0.6, z: -1.3, r: 2.3, h: 0.5 };
export const ground = (x, z) => { const d = Math.hypot(x - HILL.x, z - HILL.z); return 0.45 + (d < HILL.r ? HILL.h * Math.sqrt(HILL.r ** 2 - d ** 2) : 0); };

export function buildBoat(THREE, { hull = '#f4efe6', stripe = '#b23a1a', size = 1 } = {}) {
  const b = new THREE.Group();
  const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.35, 0); s.quadraticCurveTo(0.6, 0.05, 0.62, 0.22); s.lineTo(-0.55, 0.22); s.closePath();
  const h = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), flat(THREE, hull));
  h.position.z = -0.15; b.add(h);
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.36), flat(THREE, stripe)); band.position.set(0.02, 0.17, 0); b.add(band);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.24), flat(THREE, '#fff4e6')); cab.position.set(-0.15, 0.34, 0); b.add(cab);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5), flat(THREE, '#5a3a2e')); mast.position.set(0.12, 0.47, 0); b.add(mast);
  b.scale.setScalar(size);
  return b;
}

export function buildWater(THREE, size = 60, seg = 90, color = '#3fb3b0') {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, flat(THREE, color, { roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.94 }));
  const pos = geo.attributes.position, base = Float32Array.from(pos.array);
  mesh.userData.wave = (t, amp = 1) => {
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.array[i * 3 + 1] = 0.12 + amp * (0.045 * Math.sin(x * 0.8 + t * 1.1) + 0.035 * Math.cos(z * 0.9 + t * 1.4) + 0.02 * Math.sin((x + z) * 1.7 + t * 2));
    }
    pos.needsUpdate = true;
  };
  return mesh;
}

function buildIsland(THREE) {
  const g = new THREE.Group();
  const shape = (k = 1) => { const s = new THREE.Shape(); for (let i = 0; i <= 96; i++) { const th = (i / 96) * Math.PI * 2 - Math.PI; const r = coast(th) * k; (i ? s.lineTo : s.moveTo).call(s, r * Math.cos(th), r * Math.sin(th)); } return s; };
  const slab = (k, depth, color, y) => {
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape(k), { depth, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.1, bevelSegments: 2, curveSegments: 4 }), flat(THREE, color));
    m.rotation.x = -Math.PI / 2; m.position.y = y; g.add(m); return m;
  };
  slab(1.07, 0.25, '#f1d9a8', -0.05);                         // sand rim
  slab(1, 0.35, '#86b56a', 0.1);                              // grass
  const hill = new THREE.Mesh(new THREE.SphereGeometry(HILL.r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(THREE, '#6f9f57'));
  hill.scale.y = HILL.h; hill.position.set(HILL.x, 0.45, HILL.z); g.add(hill);

  // the village: houses in two crooked rows on the low ground north-west of the harbour
  const windows = [], pastel = ['#fff4e6', '#f6e1c3', '#f3cdb6', '#e9efe4', '#fbe7d0'];
  const roofMat = flat(THREE, '#c0583a'), winMat = new THREE.MeshStandardMaterial({ color: '#3a2a22', emissive: '#ffbf66', emissiveIntensity: 0 });
  for (let i = 0; i < 14; i++) {
    const x = -2.7 + (i % 7) * 0.62 + (rng() - 0.5) * 0.2, z = 1.35 + Math.floor(i / 7) * 0.95 + (rng() - 0.5) * 0.25;
    const w = 0.34 + rng() * 0.14, d = 0.3 + rng() * 0.1, h = 0.28 + rng() * 0.16, y = ground(x, z);
    const house = new THREE.Group(); house.position.set(x, y, z); house.rotation.y = (rng() - 0.5) * 0.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(THREE, pastel[i % 5])); body.position.y = h / 2; house.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 0.22, 4), roofMat); roof.rotation.y = Math.PI / 4; roof.position.y = h + 0.1; house.add(roof);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.09), winMat); win.position.set(0, h * 0.55, d / 2 + 0.002); house.add(win); windows.push(win);
    g.add(house);
  }
  // trees: cones on the hill and along the coast path, none in the village or the harbour
  const leaf = [flat(THREE, '#3f7a45'), flat(THREE, '#4d8a4a'), flat(THREE, '#5c9850')], trunk = flat(THREE, '#6b4b3a');
  let placed = 0;
  while (placed < 40) {
    const th = rng() * Math.PI * 2 - Math.PI, r = coast(th) * (0.25 + rng() * 0.62), x = r * Math.cos(th), z = -r * Math.sin(th);
    if (z > 1 && x < 1.6 && x > -3.2) continue;                // village
    if (z > 2.4 && Math.abs(x) < 1.4) continue;                // harbour
    if (x > 3.8) continue;                                     // headland stays open
    const tree = new THREE.Group(), s = 0.7 + rng() * 0.6; tree.position.set(x, ground(x, z), z);
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.14, 5), trunk); t1.position.y = 0.07; tree.add(t1);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.45, 6), leaf[placed % 3]); c.position.y = 0.36; tree.add(c);
    tree.scale.setScalar(s); g.add(tree); placed++;
  }
  // the headland path: stepping stones out to the lighthouse
  const stone = flat(THREE, '#e3d3b4');
  for (let i = 0; i < 16; i++) { const k = i / 15, x = 1.6 + k * 3.5, z = 1.2 - k * 1.2 + Math.sin(k * 6) * 0.15; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 6), stone); st.position.set(x, ground(x, z) + 0.01, z); g.add(st); }

  // the harbour: a pier into the cove, boats moored either side
  const wood = flat(THREE, '#8a6248');
  const pier = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 2.9), wood); pier.position.set(0.25, 0.3, 4.75); g.add(pier);
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), wood); post.position.set(0.25 + sx * 0.19, 0.12, 3.5 + i * 0.5); g.add(post); }
  const boats = [[-0.65, 4.3, 0.3, '#2d6e8e'], [-0.75, 5.4, -0.2, '#b23a1a'], [1.15, 4.6, 2.9, '#3f8a5a'], [1.2, 5.6, 3.3, '#c99a2e']].map(([x, z, ry, c]) => {
    const b = buildBoat(THREE, { stripe: c, size: 0.55 }); b.position.set(x, 0.12, z); b.rotation.y = ry + Math.PI / 2; g.add(b); return b;
  });
  const ferry = buildBoat(THREE, { stripe: '#123f3d', size: 1.25 }); g.add(ferry);

  // the lighthouse on the headland tip, with a lamp and a beam for the dusk
  const lh = new THREE.Group(); const lx = 5.65, lz = 0; lh.position.set(lx, ground(lx, lz), lz);
  const white = flat(THREE, '#fbf3e6'), red = flat(THREE, '#b23a1a');
  [[0.22, 0.26, 0.3, white], [0.2, 0.22, 0.28, red], [0.18, 0.2, 0.28, white], [0.16, 0.18, 0.26, red]].forEach(([rt, rb, h], i, a) => {
    const y = a.slice(0, i).reduce((s, x) => s + x[2], 0);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), a[i][3]); m.position.y = y + h / 2; lh.add(m);
  });
  const lampMat = new THREE.MeshStandardMaterial({ color: '#fff4e6', emissive: '#ffd27a', emissiveIntensity: 0.2 });
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 10), lampMat); lamp.position.y = 1.2; lh.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.18, 10), red); cap.position.y = 1.37; lh.add(cap);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  beam.geometry.translate(0, -3, 0); beam.geometry.rotateZ(Math.PI / 2);
  const beamPivot = new THREE.Group(); beamPivot.position.y = 1.2; beamPivot.add(beam); lh.add(beamPivot);
  const glow = new THREE.PointLight('#ffcf7a', 0, 5); glow.position.y = 1.25; lh.add(glow);
  g.add(lh);
  return { g, windows, winMat, boats, ferry, lampMat, beam, beamPivot, glow };
}

const box = document.querySelector('#island-3d'), track = document.querySelector('#fly');
const SKY = [[0, '#f6c3a0'], [0.62, '#f6c3a0'], [0.78, '#e8916f'], [0.92, '#2a3557'], [1, '#1d2747']];
export function skyAt(THREE, p, out) {
  let i = 0; while (i < SKY.length - 2 && p > SKY[i + 1][0]) i++;
  return out.set(SKY[i][1]).lerp(new THREE.Color(SKY[i + 1][1]), sm(SKY[i][0], SKY[i + 1][0], p));
}

if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const isl = buildIsland(THREE); scene.add(isl.g);
  const water = buildWater(THREE); scene.add(water);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.4); sun.position.set(-8, 10, 6); scene.add(sun);
  const hemi = new THREE.HemisphereLight('#ffe2c8', '#2f6f6a', 0.9); scene.add(hemi);
  const sky = new THREE.Color('#f6c3a0'); scene.fog = new THREE.Fog(sky, 20, 46);

  const beats = [                                             // pairs hold the camera while a chapter plays
    { at: 0.0, pos: [-1.2, 15.5, 13.5], look: [-1.4, 0, 0.6] },
    { at: 0.1, pos: [0, 14, 13], look: [-1.3, 0, 0.6] },
    { at: 0.2, pos: [1.6, 2.7, 10.2], look: [-0.8, 0.3, 4.6] },
    { at: 0.33, pos: [0.6, 2.4, 9.4], look: [-0.9, 0.3, 4.8] },
    { at: 0.43, pos: [-4.6, 3, 5.6], look: [-1.3, 0.5, 1.7] },
    { at: 0.56, pos: [-3.9, 2.6, 5.4], look: [-1.1, 0.5, 1.8] },
    { at: 0.66, pos: [8.6, 2.5, 3.6], look: [5, 0.9, 0.2] },
    { at: 0.78, pos: [8.2, 2.2, 2.4], look: [5.2, 1, 0] },
    { at: 0.9, pos: [3.2, 9.5, 12.5], look: [0.3, 0, 0.3] },
    { at: 1.0, pos: [2.8, 10, 13.2], look: [0.2, 0, 0.3] },
  ];
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  const frameAt = p => {
    let i = 0; while (i < beats.length - 2 && p > beats[i + 1].at) i++;
    const a = beats[i], b = beats[i + 1], k = sm(a.at, b.at, p);
    cam.copy(A.set(...a.pos)).lerp(B.set(...b.pos), k); look.copy(A.set(...a.look)).lerp(B.set(...b.look), k);
  };
  let bob = 0; box.addEventListener('click', () => { bob = 1; });
  const sunDay = new THREE.Color('#fff1d6'), sunDusk = new THREE.Color('#ff8a5c'), hemiDay = new THREE.Color('#ffe2c8'), hemiNight = new THREE.Color('#3a4a7a');
  const sec = track, waterDay = new THREE.Color('#3fb3b0'), waterNight = new THREE.Color('#1d4a5e');

  const update = ({ t = 0, dt = 0.016, pointer = { x: 0, y: 0 }, scroll = 0 }) => {
    const p = still ? 0 : scroll;
    frameAt(p);
    const far = Math.max(1, (1.1 / camera.aspect) ** 0.6);          // tall phone screens: pull back so the island fits
    cam.sub(look).multiplyScalar(far).add(look);
    look.z += 3 * (far - 1);                                        // and aim a little nearer, so it sits above the postcard
    scene.fog.near = 20 * far; scene.fog.far = 46 * far;
    camera.position.copy(cam).add(A.set(pointer.x * 0.6, pointer.y * 0.35, 0)); camera.lookAt(look);
    water.userData.wave(t);
    bob = Math.max(0, bob - dt * 1.2);
    isl.boats.forEach((b, i) => { b.position.y = 0.12 + 0.03 * Math.sin(t * 1.6 + i) + 0.12 * Math.sin(bob * Math.PI * 3) * bob; b.rotation.z = 0.05 * Math.sin(t * 1.3 + i * 2); });
    // the ferry comes in from the open sea and ties up at the end of the pier
    const f = sm(0.12, 0.34, p);
    isl.ferry.position.set(0.25 + 1.0 * (1 - f) + 0.8, 0.14 + 0.04 * Math.sin(t * 1.4) + 0.1 * bob * Math.sin(bob * 9), 6.6 + 7 * (1 - f));
    isl.ferry.rotation.y = Math.PI / 2 + 0.25 * (1 - f); isl.ferry.rotation.z = 0.04 * Math.sin(t * 1.1);
    // dusk: the sun goes orange and low, the sky and fog darken, windows and the lamp come on, the beam turns
    const d = sm(0.66, 0.95, p), lit = sm(0.7, 0.9, p);
    skyAt(THREE, p, sky); scene.fog.color.copy(sky); if (sec) sec.style.setProperty('--sky', `#${sky.getHexString()}`);
    sun.color.copy(sunDay).lerp(sunDusk, Math.min(1, d * 1.6)); sun.intensity = 2.4 - 2.0 * d; sun.position.set(-8 + 4 * d, 10 - 8 * d, 6);
    hemi.color.copy(hemiDay).lerp(hemiNight, d); hemi.intensity = 0.9 - 0.35 * d;
    scene.environmentIntensity = 1 - 0.82 * d;                    // the studio light would keep it noon otherwise
    water.material.color.copy(waterDay).lerp(waterNight, d);
    isl.winMat.emissiveIntensity = 2.2 * lit; isl.lampMat.emissiveIntensity = 0.2 + 3 * lit; isl.glow.intensity = 6 * lit;
    isl.beam.material.opacity = 0.22 * lit; isl.beamPivot.rotation.y = t * 0.9;
  };
  if (still) { update({}); return; }
  return update;
}, { track, fov: 30 });
