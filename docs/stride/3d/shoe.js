// Sculptor: the Stride shoe, built in code. Six layers, each its own group so they can come apart.
// Toe points +x, lateral side faces +z (the camera), sole bottom at y = 0.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const V2 = THREE.Vector2, V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
// a smooth 1D curve through [x, y] keys (Catmull-Rom on a sorted table)
const curve1 = keys => x => {
  if (x <= keys[0][0]) return keys[0][1];
  if (x >= keys.at(-1)[0]) return keys.at(-1)[1];
  let i = 0; while (keys[i + 1][0] < x) i++;
  const p0 = keys[Math.max(0, i - 1)][1], p1 = keys[i][1], p2 = keys[i + 1][1], p3 = keys[Math.min(keys.length - 1, i + 2)][1];
  const t = (x - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
};

// footprint, starting on the medial forefoot (the seam hides there) and running down the lateral side, round the heel, back up the medial side
const FOOT = [[0.5, -0.39], [0.95, -0.37], [1.3, -0.21], [1.42, -0.02], [1.33, 0.2], [1.0, 0.36], [0.5, 0.4], [-0.2, 0.33], [-0.9, 0.31], [-1.3, 0.25], [-1.43, 0.02],
  [-1.32, -0.23], [-0.85, -0.26], [-0.25, -0.24]];
const N = 180;
const outline = new THREE.CatmullRomCurve3(FOOT.map(([x, z]) => new V3(x, 0, z)), true, 'centripetal').getSpacedPoints(N).slice(0, N);

// the stack: rocker lifts toe and heel, heel is 8 mm (0.08) higher than the forefoot
const rock = x => 0.2 * Math.max(0, (x - 0.5) / 0.92) ** 2 + 0.07 * Math.max(0, (-x - 1.0) / 0.43) ** 2;
const tl = x => clamp((x + 1.43) / 2.85, 0, 1); // 0 heel, 1 toe
const L = { out: 0.045, pod: x => lerp(0.09, 0.07, tl(x)), mid: x => lerp(0.25, 0.17, tl(x)), plate: 0.022 };
const y0 = x => rock(x), y1 = x => y0(x) + L.out, y2 = x => y1(x) + L.pod(x), y3 = x => y2(x) + L.mid(x), y4 = x => y3(x) + L.plate;
export const soleTop = y4;

function canvasTex(draw, rx, ry, size = 64) {
  const c = Object.assign(document.createElement('canvas'), { width: size, height: size }), g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
}

// one sole layer: the footprint extruded, then bent onto the rocker between bottom(x) and top(x)
function slab(s, bottom, top, mat, { bevel = 0.02, flare = 0 } = {}) {
  const shape = new THREE.Shape(outline.map(p => new V2(p.x * s[0], -p.z * s[1])));
  const avg = top(0) - bottom(0);
  const g0 = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.004, avg - bevel * 2), steps: 1, curveSegments: 1,
    bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5 });
  g0.rotateX(-Math.PI / 2);
  g0.deleteAttribute('normal');
  const g = mergeVertices(g0, 1e-4);
  g.computeBoundingBox();
  const { min, max } = g.boundingBox, pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), k = (pos.getY(i) - min.y) / (max.y - min.y);
    const f = 1 + flare * (1 - k);
    pos.setXYZ(i, x * f, bottom(x) + k * (top(x) - bottom(x)), pos.getZ(i) * f);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

export const COLOURS = {
  cobalt: { knit: '#2443d6', lining: '#101c66', collar: '#1b2f9c', cage: '#f6f7ef', pod: '#ff5533' },
  coral: { knit: '#ff5a3a', lining: '#7a1a0b', collar: '#e0472a', cage: '#141c12', pod: '#2443d6' },
  chalk: { knit: '#ecebe4', lining: '#8d8b80', collar: '#d5d3c9', cage: '#ff5533', pod: '#141c12' },
};

export function buildShoe() {
  const knitTex = canvasTex((g, s) => {
    g.fillStyle = '#777'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 8) for (let x = 0; x < s; x += 8) { // little knit V's
      g.fillStyle = '#c8c8c8'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 7); g.lineTo(x + 8, y); g.lineTo(x + 4, y + 3); g.fill();
    }
  }, 70, 16);
  const carbonTex = canvasTex((g, s) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#444' : '#bbb'; g.fillRect(x * 8, y * 8, 8, 8); } }, 22, 8);
  const lugTex = canvasTex((g, s) => { g.fillStyle = '#999'; g.fillRect(0, 0, s, s); g.fillStyle = '#333'; for (let i = 0; i < s; i += 10) g.fillRect(i, 0, 3, s); }, 30, 30);

  const M = {
    knit: new THREE.MeshStandardMaterial({ roughness: 0.82, bumpMap: knitTex, bumpScale: 1.6 }),
    lining: new THREE.MeshStandardMaterial({ roughness: 0.95, side: THREE.BackSide }),
    collar: new THREE.MeshStandardMaterial({ roughness: 0.9, bumpMap: knitTex, bumpScale: 0.8 }),
    cage: new THREE.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.6 }),
    pod: new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 }),
    foam: new THREE.MeshPhysicalMaterial({ color: '#f4f3ec', roughness: 0.62, sheen: 0.4, sheenColor: '#ffffff' }),
    plate: new THREE.MeshPhysicalMaterial({ color: '#1d2022', metalness: 0.1, roughness: 0.45, clearcoat: 1, bumpMap: carbonTex, bumpScale: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#16191a', roughness: 0.8, bumpMap: lugTex, bumpScale: 1.5 }),
  };

  const layers = {};
  layers.outsole = slab([1.0, 1.0], y0, y1, M.rubber, { bevel: 0.012 });
  layers.pod = slab([0.985, 0.965], x => y1(x) - 0.005, x => y2(x) + 0.005, M.pod, { bevel: 0.03 });
  layers.midsole = slab([1.0, 1.0], y2, y3, M.foam, { bevel: 0.045, flare: 0.035 });
  layers.plate = slab([0.95, 0.88], y3, y4, M.plate, { bevel: 0.006 });

  // the upper: a lofted surface. Each footprint point rises and leans in toward a spine line along the top.
  const inset = outline.map(p => new V3(p.x * 0.975, 0, p.z * 0.94));
  const H = curve1([[-1.6, 0.9], [-1.0, 0.88], [-0.35, 0.78], [0.2, 0.6], [0.7, 0.42], [1.1, 0.3], [1.5, 0.24]]);
  const collarH = curve1([[-1.6, 0.74], [-1.38, 0.72], [-1.05, 0.52], [-0.72, 0.5], [-0.42, 0.68], [-0.28, 0.92]]);
  const surf = (i, w) => {
    const p = inset[((i % N) + N) % N], cx = clamp(p.x, -1.37, 0.93), cz = 0.03, a = w * Math.PI / 2;
    const sh = Math.cos(a) ** 0.62;
    return new V3(cx + (p.x - cx) * sh, y4(p.x) - 0.03 + H(p.x) * Math.sin(a), cz + (p.z - cz) * sh);
  };
  const rel = v => v.y - y4(v.x) + 0.03;
  const isCut = v => v.x < -0.27 && rel(v) > collarH(v.x);
  const RW = 64, pos = [], uv = [], idx = [], cut = [];
  for (let i = 0; i <= N; i++) for (let j = 0; j <= RW; j++) {
    const v = surf(i, j / RW); pos.push(v.x, v.y, v.z); uv.push(i / N, j / RW); cut.push(isCut(v));
  }
  const at = (i, j) => i * (RW + 1) + j;
  for (let i = 0; i < N; i++) for (let j = 0; j < RW; j++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    if (cut[a] || cut[b] || cut[c] || cut[d]) continue;
    idx.push(a, d, b, b, d, c);
  }
  const ug = new THREE.BufferGeometry();
  ug.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  ug.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  ug.setIndex(idx); ug.computeVertexNormals();
  // the seam at i = 0 / i = N sits at the toe tip; average its normals so no line shows
  const nrm = ug.attributes.normal;
  for (let j = 0; j <= RW; j++) { const a = at(0, j), b = at(N, j); for (let k = 0; k < 3; k++) { const m = (nrm.array[a * 3 + k] + nrm.array[b * 3 + k]) / 2; nrm.array[a * 3 + k] = nrm.array[b * 3 + k] = m; } }
  layers.upper = new THREE.Group();
  layers.upper.add(new THREE.Mesh(ug, M.knit), new THREE.Mesh(ug, M.lining));

  // padded collar: a tube along the edge of the opening, found by bisection on each column
  const ring = [];
  for (let i = 0; i < N; i++) {
    if (!isCut(surf(i, 1))) continue;
    let lo = 0, hi = 1;
    for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; isCut(surf(i, m)) ? hi = m : lo = m; }
    ring.push(surf(i, lo));
  }
  const collar = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true, 'centripetal'), 200, 0.05, 14, true), M.collar);
  layers.upper.add(collar);
  // heel tab
  const tab = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 6, 12), M.collar);
  const back = ring.reduce((a, b) => b.x < a.x ? b : a); tab.position.set(back.x + 0.01, back.y - 0.02, back.z); tab.rotation.z = 0.25; layers.upper.add(tab);

  // lacing cage: five straps a side running from the sole to the lace line, laces criss-crossing over the top
  const side = (lateral, x) => { // fractional column index on one side at a given x
    let best = 0, bd = 1e9;
    for (let i = 0; i < N; i++) { const p = inset[i]; if ((p.z > 0.03) !== lateral) continue; const d = Math.abs(p.x - x); if (d < bd) { bd = d; best = i; } }
    return best;
  };
  const lift = (v, d) => { const c = new V3(clamp(v.x, -1.37, 0.93), y4(v.x) + 0.25, 0.03); return v.clone().add(v.clone().sub(c).normalize().multiplyScalar(d)); };
  layers.cage = new THREE.Group();
  const xs = [-0.42, -0.18, 0.06, 0.3, 0.54], tops = { true: [], false: [] };
  for (const lat of [true, false]) xs.forEach(x => {
    const pts = [0, 0.33, 0.66, 1].map(k => lift(surf(side(lat, x + 0.22 * (1 - k)), 0.03 + k * 0.75), 0.016));
    tops[lat].push(pts.at(-1));
    const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.024, 8), M.cage);
    strap.scale.set(1, 1, 1); layers.cage.add(strap);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.011, 8, 20), M.cage); eye.position.copy(pts.at(-1)); eye.lookAt(pts.at(-1).clone().multiplyScalar(2)); layers.cage.add(eye);
  });
  const laceMat = new THREE.MeshStandardMaterial({ color: '#f6f7ef', roughness: 0.85 });
  for (let k = 0; k < xs.length - 1; k++) for (const [a, b] of [[tops.true[k], tops.false[k + 1]], [tops.false[k], tops.true[k + 1]]]) {
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.z = 0.03; mid.y = y4(mid.x) - 0.03 + H(mid.x) + 0.03;
    layers.cage.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 24, 0.013, 6), laceMat));
  }
  // the bow: two loops at the top of the lacing
  const bowC = surf(side(true, -0.42), 1); bowC.y += 0.04;
  for (const s of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.013, 6, 24), laceMat);
    loop.position.set(bowC.x - 0.02, bowC.y + 0.01, bowC.z + s * 0.08); loop.rotation.set(Math.PI / 2 - 0.3 * s, 0.2, 0); layers.cage.add(loop);
  }

  // order matters: index 0 is the top layer
  const plan = [['upper', 0.9], ['cage', 1.55], ['plate', 0.32], ['midsole', -0.12], ['pod', -0.52], ['outsole', -0.92]];
  const shoe = new THREE.Group(), inner = new THREE.Group();
  inner.position.set(0, -0.55, 0);
  plan.forEach(([k, out], i) => { const l = layers[k]; l.userData = { out, i }; inner.add(l); });
  shoe.add(inner);
  shoe.userData = { layers, order: plan.map(p => layers[p[0]]) };
  shoe.userData.paint = name => {
    const c = COLOURS[name];
    M.knit.color.set(c.knit); M.lining.color.set(c.lining); M.collar.color.set(c.collar); M.cage.color.set(c.cage); M.pod.color.set(c.pod);
    laceMat.color.set(c.cage === '#141c12' ? '#1d241b' : '#f6f7ef');
  };
  shoe.userData.mats = M;
  shoe.userData.paint('cobalt');
  return shoe;
}

export function floorShadow(size = 3.6, alpha = 0.3, rgb = '16,26,12') {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 }), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(${rgb},${alpha})`); grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.38), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}
