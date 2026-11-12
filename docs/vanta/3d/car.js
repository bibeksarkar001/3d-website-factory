// Sculptor: the Vanta GT, built from code. Units are metres-ish: 4.5 long, nose at +x, ground at y = 0.
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const PAINTS = { copper: '#a8441d', arctic: '#dfe4ea', graphite: '#2b2f36', green: '#1f6b4f' };

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// a smooth lofted skin: slices along x, each a superellipse ring between bot(x, zn) and top(x, zn), width half(x)
function loft(THREE, { x0, x1, N = 160, M = 96, top, bot, half, tumble = () => 1, n = 3.4, ends = 8, dark }) {
  const pos = [], col = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const u = -Math.cos((i / N) * Math.PI), x = x0 + (u + 1) / 2 * (x1 - x0); // denser slices at the ends
    const e = Math.pow(Math.max(0, 1 - Math.abs(u) ** ends), 1 / ends);    // round the ends in profile too
    const hw = half(x) * Math.pow(Math.max(0, 1 - Math.abs(u) ** 12), 1 / 12);
    for (let j = 0; j < M; j++) {
      const a = (j / M) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const zn = Math.sign(c) * Math.abs(c) ** (2 / n), yn = Math.sign(s) * Math.abs(s) ** (2 / n);
      const yb = bot(x, zn), yt = top(x, zn), ym = (yb + yt) / 2, v = (yn + 1) / 2;
      const y = ym + ((yb + (yt - yb) * v) - ym) * e;
      pos.push(x, y, zn * hw * tumble(v));
      const d = dark ? dark(x, zn, yn) : 1; col.push(d, d, d);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + (j + 1) % M, c = a + M, d = b + M;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// smooth curve through [x, y] keys (cubic Hermite, Catmull-Rom tangents), returns y(x)
function curve(k) {
  const m = k.map((_, i) => { const a = k[Math.max(0, i - 1)], b = k[Math.min(k.length - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); });
  return x => {
    if (x <= k[0][0]) return k[0][1];
    for (let i = 0; i < k.length - 1; i++) {
      const [xa, ya] = k[i], [xb, yb] = k[i + 1];
      if (x > xb) continue;
      const h = xb - xa, t = (x - xa) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ya + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * yb + (t3 - t2) * h * m[i + 1];
    }
    return k[k.length - 1][1];
  };
}

export function buildCar(THREE, { paint = PAINTS.copper, rims = 'black' } = {}) {
  const car = new THREE.Group();
  const mats = {
    paint: new THREE.MeshPhysicalMaterial({ color: paint, vertexColors: true, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0b0f18', metalness: 0.6, roughness: 0.06, clearcoat: 1 }),
    trim: new THREE.MeshStandardMaterial({ color: '#0a0c10', roughness: 0.55, metalness: 0.3 }),
    tyre: new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.82 }),
    rim: new THREE.MeshStandardMaterial({ color: rims === 'black' ? '#1b1d22' : '#d4d8de', metalness: 1, roughness: rims === 'black' ? 0.38 : 0.16 }),
    disc: new THREE.MeshStandardMaterial({ color: '#8a8e95', metalness: 1, roughness: 0.45 }),
    caliper: new THREE.MeshStandardMaterial({ color: '#ff8a50', roughness: 0.4 }),
    front: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.1, 2.9), toneMapped: false }),
    rear: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 0.18, 0.12), toneMapped: false }),
  };

  // body: one lofted skin. Low bonnet, fender humps over both axles, a ducktail, arches cut at the sides only
  const ay = 0.36, R = 0.42, W = 0.99, xr = -2.27, xf = 2.3;
  const belt = curve([[xr, 0.74], [-2.12, 0.9], [-1.75, 0.87], [-0.9, 0.86], [0, 0.85], [0.7, 0.8], [1.3, 0.7], [1.85, 0.6], [2.15, 0.52], [xf, 0.44]]);
  const sill = curve([[xr, 0.36], [-2.05, 0.24], [-1.85, 0.2], [1.9, 0.19], [2.2, 0.2], [xf, 0.26]]);
  const hump = x => 0.15 * Math.exp(-(((x - 1.32) / 0.5) ** 2)) + 0.11 * Math.exp(-(((x + 1.3) / 0.6) ** 2));
  const arch = x => { let y = 0; for (const c of [-1.35, 1.35]) { const d = x - c; if (Math.abs(d) < R) y = Math.max(y, ay + Math.sqrt(R * R - d * d)); } return y; };
  const cut = zn => smooth(0.5, 0.78, Math.abs(zn));
  const plan = x => x > 0 ? Math.pow(Math.max(0, 1 - (x / xf) ** 3.4), 1 / 3.4) : Math.pow(Math.max(0, 1 - (x / xr) ** 6), 1 / 6);
  const bodyGeo = loft(THREE, { x0: xr, x1: xf,
    top: (x, zn) => belt(x) + hump(x) * zn * zn,
    bot: (x, zn) => Math.max(sill(x), sill(x) + (arch(x) - sill(x)) * cut(zn) * (arch(x) > 0)),
    half: x => W * plan(x) + 0.035 * Math.exp(-(((x + 1.35) / 0.55) ** 2)),
    tumble: v => 1 - 0.14 * v ** 2.5 - 0.07 * (1 - v) ** 3,
    dark: (x, zn, yn) => (arch(x) > 0 && yn < -0.2 && cut(zn) > 0.02 && Math.abs(zn) < 0.995) ? 0.04 : 1 });
  const body = new THREE.Mesh(bodyGeo, mats.paint);
  car.add(body);

  // greenhouse: a teardrop canopy of black glass, narrower toward the roof
  const roof = curve([[-2.0, 0.8], [-1.6, 0.92], [-0.9, 1.1], [-0.35, 1.2], [0.1, 1.15], [0.55, 0.95], [0.95, 0.76]]);
  const cplan = x => 0.66 - 0.1 * smooth(0.0, 0.9, x) - 0.12 * smooth(-0.9, -2.0, x);
  const canopy = new THREE.Mesh(undefined, mats.glass);
  canopy.geometry = loft(THREE, { x0: -2.0, x1: 0.95, N: 120, M: 72, n: 3, ends: 5,
    top: x => roof(x), bot: () => 0.72, half: cplan, tumble: v => 1 - 0.32 * v ** 1.6 });
  car.add(canopy);
  const W2 = W * 2;

  // dark sills, splitter and diffuser
  const rb = (w, h, d, r, mat) => new THREE.Mesh(roundedBox(THREE, w, h, d, r), mat);
  const sillL = rb(1.7, 0.05, W2 * 0.8, 0.02, mats.trim); sillL.position.set(0, 0.2, 0); car.add(sillL);
  const split = rb(0.22, 0.03, W2 * 0.56, 0.012, mats.trim); split.position.set(2.02, 0.19, 0); car.add(split);
  const diff = rb(0.24, 0.08, W2 * 0.5, 0.02, mats.trim); diff.position.set(-2.06, 0.25, 0); car.add(diff);

  // light bars: full width, front and rear
  const bar = (xAt, y, span, mat) => {
    const pts = []; for (let i = 0; i <= 40; i++) { const z = (i / 40 * 2 - 1) * span; pts.push(new THREE.Vector3(xAt(z), y, z)); }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.014, 8), mat);
  };
  car.add(bar(z => xf * Math.pow(1 - (Math.abs(z) / (W * 0.97)) ** 3.4, 1 / 3.4) - 0.045, 0.47, 0.8, mats.front));
  car.add(bar(z => xr * Math.pow(1 - (Math.abs(z) / (W * 0.8)) ** 6, 1 / 6) + 0.045, 0.78, 0.7, mats.rear));
  // camera mirrors
  for (const z of [-1, 1]) {
    const m = rb(0.13, 0.055, 0.11, 0.025, mats.paint); m.position.set(0.5, 0.88, z * 0.74); car.add(m);
    const st = rb(0.04, 0.04, 0.08, 0.015, mats.trim); st.position.set(0.53, 0.85, z * 0.66); car.add(st);
  }

  // wheels: lathe tyre and dish, ten instanced spokes, disc and caliper
  const wheels = [], steer = [];
  for (const [x, front] of [[1.35, true], [-1.35, false]]) for (const side of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(x, ay, side * 0.8);
    const w = wheel(THREE, mats); w.rotation.y = side > 0 ? 0 : Math.PI;
    const spin = new THREE.Group(); spin.add(w); pivot.add(spin);
    const cal = rb(0.12, 0.16, 0.06, 0.02, mats.caliper); cal.position.set(-0.13 * (front ? 1 : -1), 0.13, side * 0.02); pivot.add(cal);
    car.add(pivot); wheels.push(spin); if (front) steer.push(pivot);
  }
  car.userData = { mats, wheels, steer, radius: ay };
  return car;
}

export function wheel(THREE, mats) {
  const g = new THREE.Group();
  const v = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));
  // tyre: rounded section, lathed around the axle (lathe axis is y, so turn it to face z)
  const tyre = new THREE.Mesh(new THREE.LatheGeometry(v([[0.272, -0.13], [0.31, -0.135], [0.35, -0.125], [0.362, -0.09],
    [0.364, 0.09], [0.35, 0.125], [0.31, 0.135], [0.272, 0.13]]), 72), mats.tyre);
  // rim barrel and lip
  const barrel = new THREE.Mesh(new THREE.LatheGeometry(v([[0.27, 0.12], [0.278, 0.11], [0.262, 0.09], [0.255, -0.1], [0.26, -0.12]]), 72), mats.rim);
  for (const m of [tyre, barrel]) { m.rotation.x = Math.PI / 2; g.add(m); }
  // hub cap
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 32), mats.rim); hub.rotation.x = Math.PI / 2; hub.position.z = 0.09; g.add(hub);
  // ten spokes, in pairs, slightly dished
  const spoke = new THREE.BoxGeometry(0.2, 0.026, 0.03); spoke.translate(0.165, 0, 0);
  const inst = new THREE.InstancedMesh(spoke, mats.rim, 10), o = new THREE.Object3D();
  for (let i = 0; i < 10; i++) {
    o.rotation.set(0, -0.12, (Math.floor(i / 2) / 5) * Math.PI * 2 + (i % 2 ? 0.11 : -0.11));
    o.position.set(0, 0, 0.085); o.updateMatrix(); inst.setMatrixAt(i, o.matrix);
  }
  g.add(inst);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 48), mats.disc); disc.rotation.x = Math.PI / 2; disc.position.z = -0.02; g.add(disc);
  return g;
}

export function roundedBox(THREE, w, h, d, r) {
  const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r;
  s.moveTo(-x, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); s.lineTo(w / 2, y);
  s.quadraticCurveTo(w / 2, h / 2, x, h / 2); s.lineTo(-x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y);
  s.lineTo(-w / 2, -y); s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.6, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(d - r * 2) / 2);
  return g;
}

export function floorShadow(THREE, w = 5.6, d = 2.8, alpha = 0.55) {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 }), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(2,4,10,${alpha})`); grd.addColorStop(0.6, `rgba(2,4,10,${alpha * 0.5})`); grd.addColorStop(1, 'rgba(2,4,10,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.005;
  return m;
}
