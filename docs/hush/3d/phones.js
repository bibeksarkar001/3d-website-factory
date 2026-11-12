import { stage } from '../stage.js';

// Sculptor + animator: the Hush One over-ear headphones, built from code (1 unit = 10 cm), in front of a field of
// waveforms. Scroll: the noise settles to a flat line, six microphones light one by one, the cups turn flat.
export const COLOURS = { fog: { shell: '#d9dcdf', band: '#b9bec4', soft: '#c9ccd0' }, ink: { shell: '#23272d', band: '#14171c', soft: '#2c3037' } };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function buildPhones(THREE, { colour = 'fog' } = {}) {
  const C = COLOURS[colour];
  const phones = new THREE.Group();
  const shell = new THREE.MeshPhysicalMaterial({ color: C.shell, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  const band = new THREE.MeshStandardMaterial({ color: C.band, roughness: 0.85 });
  const soft = new THREE.MeshStandardMaterial({ color: C.soft, roughness: 0.95 });
  const metal = new THREE.MeshStandardMaterial({ color: '#c4c8cd', metalness: 1, roughness: 0.25 });
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

  // headband: an arc of padded tube with a thinner metal spine on top
  const arc = new THREE.EllipseCurve(0, 0.15, 0.82, 0.95, 0.12, Math.PI - 0.12);
  const pts = arc.getPoints(64).map(p => V(p.x, p.y));
  const curve = new THREE.CatmullRomCurve3(pts);
  const pad = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.075, 20), band); pad.scale.z = 1.35; phones.add(pad);
  const spine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => p.clone().multiplyScalar(1.06).setY(p.y * 1.06 + 0.005))), 96, 0.02, 10), metal); phones.add(spine);

  // each side: a slider, a yoke that can turn the cup flat, the cup with its cushion and six microphone dots
  const sides = [], mics = [];
  for (const s of [-1, 1]) {
    const side = new THREE.Group(); side.position.set(s * 0.8, 0.0, 0); phones.add(side);
    const slider = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 10), metal); slider.position.y = 0.2; side.add(slider);
    const yoke = new THREE.Group(); yoke.position.y = 0.0; side.add(yoke);
    const fork = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.022, 10, 48, Math.PI), shell); fork.rotation.z = 0; fork.rotation.y = Math.PI / 2; fork.position.y = -0.36; yoke.add(fork);
    const cup = new THREE.Group(); cup.position.set(0, -0.42, 0); yoke.add(cup);
    // the cup: a soft rounded oval drum facing inward
    const prof = [[0, 0], [0.3, 0], [0.34, 0.03], [0.355, 0.08], [0.35, 0.15], [0.32, 0.19], [0, 0.2]].map(([r, y]) => new THREE.Vector2(r, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), shell); body.rotation.z = -s * Math.PI / 2; body.scale.set(1, 1, 1.22); cup.add(body);
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.075, 18, 64), soft); cushion.rotation.y = Math.PI / 2; cushion.scale.set(1, 1.22, 1); cushion.position.x = -s * 0.02; cup.add(cushion);
    const grille = new THREE.Mesh(new THREE.CircleGeometry(0.21, 48), new THREE.MeshStandardMaterial({ color: '#3b3f46', roughness: 0.9 })); grille.rotation.y = s * Math.PI / 2; grille.position.x = -s * 0.03; grille.scale.set(1, 1.22, 1); cup.add(grille);
    // three microphones on each cup's outer face
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.019, 20), new THREE.MeshBasicMaterial({ color: '#59606b' }));   // a short row near the back edge (a triangle read as a face)
      m.position.set(s * 0.206, (k - 1) * 0.06, -0.17); m.rotation.y = s * Math.PI / 2; cup.add(m); mics.push(m);
    }
    sides.push({ side, yoke, cup });
  }
  phones.userData = {
    sides, mics,
    setColour: c => { shell.color.set(COLOURS[c].shell); band.color.set(COLOURS[c].band); soft.color.set(COLOURS[c].soft); },
    fold: k => sides.forEach(({ yoke }, i) => { yoke.rotation.y = (i ? -1 : 1) * k * Math.PI / 2; }),
    micsOn: n => mics.forEach((m, i) => m.material.color.set(i < n ? '#19d3c5' : '#59606b')),
  };
  return phones;
}

// the noise: rows of waveforms; amp 1 = a crowded room, 0 = silence
export function buildNoise(THREE, { rows = 22, n = 140, w = 9, h = 5.2 } = {}) {
  const g = new THREE.Group(), lines = [];
  for (let r = 0; r < rows; r++) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = -w / 2 + (i / (n - 1)) * w; pos[i * 3 + 1] = -h / 2 + (r / (rows - 1)) * h; pos[i * 3 + 2] = -1.4; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#7d858f', transparent: true, opacity: 0.55 })); g.add(line); lines.push(line);
  }
  g.userData.frame = (t, amp) => lines.forEach((l, r) => {
    const p = l.geometry.attributes.position, y0 = -h / 2 + (r / (rows - 1)) * h;
    for (let i = 0; i < n; i++) {
      const x = p.array[i * 3];
      const noise = Math.sin(x * 3.1 + t * 7 + r) * 0.5 + Math.sin(x * 7.7 - t * 11 + r * 2.3) * 0.3 + Math.sin(x * 17 + t * 19 + r * 5.1) * 0.2;
      p.array[i * 3 + 1] = y0 + amp * 0.09 * noise + (1 - amp) * 0.006 * Math.sin(x * 1.5 + t * 0.8 + r);
    }
    p.needsUpdate = true; l.material.opacity = 0.25 + 0.35 * amp;
  });
  return g;
}

const box = document.querySelector('#phones-3d'), track = document.querySelector('#quiet');
if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const phones = buildPhones(THREE), noise = buildNoise(THREE); scene.add(phones, noise);
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 3, 3); scene.add(key);
  const fill = new THREE.DirectionalLight('#cfe9ff', 0.6); fill.position.set(3, -1, 2); scene.add(fill);
  const u = phones.userData;
  document.addEventListener('hush:colour', e => u.setColour(e.detail));
  const look = new THREE.Vector3();
  const update = ({ t = 0, pointer = { x: 0, y: 0 }, scroll = 0 }) => {
    const p = still ? 1 : scroll;
    const amp = still ? 0 : 1 - sm(0.36, 0.56, p);
    noise.userData.frame(t, amp);
    u.micsOn(Math.round(6 * sm(0.18, 0.32, p)) * (p < 0.6 ? 1 : 0) + (p >= 0.6 ? 6 : 0));
    u.fold(sm(0.82, 0.95, p));
    // camera: whole → close on the left cup's mics → back → turning for the fold
    const close = sm(0.16, 0.24, p) * (1 - sm(0.32, 0.4, p));
    const far = Math.max(1, (1.1 / camera.aspect) ** 0.7);
    // the headphones sit right of the copy (the camera aims left of them); the close-up looks square at the left cup's outer face
    const wide = 1 - close, side = camera.aspect < 0.9 ? 0 : 1;      // on tall phone screens, keep them centred
    camera.position.set((-0.75 * side * wide - 2.7 * close + pointer.x * 0.25) * far, 0.15 * wide - 0.42 * close + pointer.y * 0.15 + 0.4 * (1 - side) * wide, (4.4 * wide + 0.45 * close) * far);
    look.set(-1.05 * side * wide - 0.9 * close, -0.15 * wide - 0.42 * close + 1.15 * (1 - side) * wide, -0.12 * close); camera.lookAt(look);
    phones.rotation.y = ((still ? 0.5 : 0.35 + 0.25 * Math.sin(t * 0.25)) + 0.6 * sm(0.8, 0.95, p) + pointer.x * 0.2) * wide;
    phones.rotation.x = -0.12 - pointer.y * 0.08;
    phones.position.y = still ? 0 : 0.03 * Math.sin(t * 0.8);
  };
  if (still) { update({}); return; }
  return update;
}, { track, fov: 30 });

// colour picker and cushions.html: the headphones turning, colour from the picker
document.querySelectorAll('.phones-small').forEach(b => stage(b, ({ THREE, scene, camera, still }) => {
  const phones = buildPhones(THREE); scene.add(phones);
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 3, 3); scene.add(key);
  document.addEventListener('hush:colour', e => phones.userData.setColour(e.detail));
  const close = b.dataset.view === 'cup';
  camera.position.set(close ? 0.35 : 0.4, close ? -0.25 : 0.3, close ? 2.1 : 4.3); camera.lookAt(close ? -0.8 : 0, close ? -0.45 : -0.15, 0);
  const update = ({ t = 0, pointer = { x: 0, y: 0 } }) => {
    phones.rotation.y = (close ? 0 : 0.4) + (still ? 0 : Math.sin(t * 0.3) * (close ? 0.12 : 0.3)) + pointer.x * (close ? 0.15 : 0.35); phones.rotation.x = -0.1 - pointer.y * 0.1;
  };
  if (still) { update({}); return; }
  return update;
}, { fov: 30 }));
