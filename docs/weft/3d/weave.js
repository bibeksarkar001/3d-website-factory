import { stage } from '../stage.js';
import { washes } from './cloth.js';

// Sculptor: the cloth up close. A 3/1 right-hand twill built from real yarns: indigo warp threads float over three
// ecru weft picks and under one, stepping one pick per thread, so the diagonal climbs to the right.
// Every box with class `weave-3d` gets one. data-mode="dive" (inside a sticky track #close: the camera dives into
// the cloth with scroll), "swatch" (tilts to the cursor), "free" (drag to turn it).
// The wash picker sends `weft:wash` with 'raw' or 'rinsed'; every weave recolours.

function yarnTexture(THREE) {
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 256 }), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 256);
  for (let i = -8; i < 40; i++) {                            // the twist: fine diagonal plies
    x.strokeStyle = `rgba(0,0,0,${0.18 + (i % 3) * 0.06})`; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, i * 8); x.lineTo(64, i * 8 + 22); x.stroke();
  }
  for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.35})`; x.fillRect(Math.random() * 64, Math.random() * 256, 1, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 1); return t;
}

export function buildWeave(THREE, { n = 10, s = 0.32, r = 0.12 } = {}) {
  const tex = yarnTexture(THREE);
  const warpMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...washes.raw.warp.map(v => v / 255), THREE.SRGBColorSpace), roughness: 0.92, map: tex, bumpMap: tex, bumpScale: 1.4 });
  const weftMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...washes.raw.weft.map(v => v / 255), THREE.SRGBColorSpace), roughness: 0.95, map: tex, bumpMap: tex, bumpScale: 1.4 });
  const g = new THREE.Group(), a = r * 0.95, half = (n - 1) * s / 2;
  const over = (i, j) => (((i - j) % 4) + 4) % 4 !== 3;       // warp i over weft j? (3 over, 1 under, right-hand)
  const tube = (pts, mat) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal');
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 10, r, 12, false), mat));
  };
  for (let i = 0; i < n; i++) {                              // warp runs up the cloth
    const x = i * s - half, pts = [[x, -half - s, 0]];
    for (let j = 0; j < n; j++) pts.push([x, j * s - half, over(i, j) ? a : -a]);
    pts.push([x, half + s, 0]); tube(pts, warpMat);
  }
  for (let j = 0; j < n; j++) {                              // weft runs across, always on the other side
    const y = j * s - half, pts = [[-half - s, y, 0]];
    for (let i = 0; i < n; i++) pts.push([i * s - half, y, over(i, j) ? -a * 0.9 : a * 0.9]);
    pts.push([half + s, y, 0]); tube(pts, weftMat);
  }
  const target = { warp: warpMat.color.clone(), weft: weftMat.color.clone() };
  g.userData = {
    setWash: w => { target.warp.setRGB(...washes[w].warp.map(v => v / 255), THREE.SRGBColorSpace); target.weft.setRGB(...washes[w].weft.map(v => v / 255), THREE.SRGBColorSpace); },
    ease: k => { warpMat.color.lerp(target.warp, k); weftMat.color.lerp(target.weft, k); },
  };
  return g;
}

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

document.querySelectorAll('.weave-3d').forEach(box => {
  const mode = box.dataset.mode || 'swatch';
  stage(box, ({ THREE, scene, camera, still }) => {
    const weave = buildWeave(THREE); scene.add(weave);
    const key = new THREE.DirectionalLight('#ffe2bd', 2.4); key.position.set(-4, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight('#8fa6ff', 0.6); rim.position.set(3, -2, 2); scene.add(rim);
    document.addEventListener('weft:wash', e => weave.userData.setWash(e.detail));
    let yaw = 0, drag = null;
    if (mode === 'free') {
      box.addEventListener('pointerdown', e => { drag = e.clientX; box.setPointerCapture(e.pointerId); });
      box.addEventListener('pointermove', e => { if (drag !== null) { yaw += (e.clientX - drag) * 0.01; drag = e.clientX; } });
      box.addEventListener('pointerup', () => { drag = null; }); box.addEventListener('pointercancel', () => { drag = null; });
    }
    const update = ({ t = 0, dt = 1, pointer = { x: 0, y: 0 }, scroll = 1 }) => {
      weave.userData.ease(still ? 1 : 1 - Math.exp(-dt * 4));
      if (mode === 'dive') {                                 // from a whole swatch down to a few yarns
        const k = sm(0.05, 0.9, still ? 1 : scroll);
        camera.position.set(pointer.x * 0.3, -1.1 * (1 - k) + pointer.y * 0.2, 7.4 - 4.9 * k);
        camera.lookAt(0, 0, 0);
        weave.rotation.set(-0.55 * (1 - k) - 0.15, 0, -0.35 + 0.2 * k);
      } else {
        camera.position.set(0, -2.2, 5.6); camera.lookAt(0, 0, 0);
        weave.rotation.set(-0.2 - pointer.y * 0.25, pointer.x * 0.4 + yaw, -0.3 + (still ? 0 : Math.sin(t * 0.3) * 0.04));
      }
    };
    if (still) { update({}); return; }
    return update;
  }, mode === 'dive' ? { track: document.querySelector('#close'), fov: 30 } : { fov: 30 });
});
