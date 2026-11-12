import { stage } from '../stage.js';

// Sculptor + animator: a hand-poured candle in a glazed stoneware vessel. A flame built from layered additive shapes
// that flickers and leans toward the cursor, a warm light that it casts, a melt pool that spreads, and smoke that
// rises when it is blown out. 1 unit = 10 cm. The page reads the light level from the CSS variable --lit on #burn.
export const GLAZES = { fig: '#7c8a5e', cedar: '#8a5a3c', salt: '#9fb4b8' };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const glowTex = THREE => {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 }), g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,214,150,1)'); r.addColorStop(0.25, 'rgba(255,170,90,.45)'); r.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
};

export function buildCandle(THREE, { glaze = GLAZES.fig } = {}) {
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const candle = new THREE.Group();
  // the vessel: thick walls, a rolled rim, a raw foot; glaze stops short of the foot like a real dipped pot
  const glazeMat = new THREE.MeshPhysicalMaterial({ color: glaze, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const clay = new THREE.MeshStandardMaterial({ color: '#c9b49a', roughness: 0.95 });
  const outer = [[0, 0.06], [0.33, 0.06], [0.37, 0.1], [0.4, 0.4], [0.41, 0.72], [0.395, 0.86], [0.37, 0.88], [0.345, 0.86], [0.35, 0.72], [0.34, 0.4], [0.3, 0.13], [0, 0.13]];
  const vessel = new THREE.Mesh(new THREE.LatheGeometry(outer.map(([r, y]) => V2(r, y)), 96), glazeMat); candle.add(vessel);
  const foot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.31, 0], [0.335, 0.03], [0.335, 0.065], [0, 0.065]].map(([r, y]) => V2(r, y)), 96), clay); candle.add(foot);
  // wax: a cream disc just below the rim, and the melt pool that grows on top of it
  const WAX_Y = 0.74;
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.348, 0.34, 0.6, 72), new THREE.MeshStandardMaterial({ color: '#dccab0', roughness: 0.75 }));
  wax.position.y = WAX_Y - 0.3; candle.add(wax);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: '#f6d9a6', roughness: 0.08, metalness: 0, emissive: '#c8662b', emissiveIntensity: 0.15, transparent: true, opacity: 0.85 }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = WAX_Y + 0.002; pool.scale.setScalar(0.001); candle.add(pool);
  // wick: a curled cotton thread
  const wick = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, WAX_Y - 0.02, 0), new THREE.Vector3(0, WAX_Y + 0.05, 0), new THREE.Vector3(0.012, WAX_Y + 0.085, 0)]), 12, 0.006, 6), new THREE.MeshStandardMaterial({ color: '#2a211a', roughness: 0.9 }));
  candle.add(wick);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff8a3c' })); ember.position.set(0.012, WAX_Y + 0.088, 0); candle.add(ember);

  // flame: an outer teardrop, a bright core, a blue base and a soft glow, all additive
  const tear = (h, r) => {
    const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, y = t * h; pts.push(V2(r * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - t * 0.35), y)); }
    return new THREE.LatheGeometry(pts, 32);
  };
  const add = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Group(); flame.position.set(0.012, WAX_Y + 0.08, 0); candle.add(flame);
  const outerF = new THREE.Mesh(tear(0.3, 0.05), add('#ff9a3c', 0.7)); flame.add(outerF);
  const core = new THREE.Mesh(tear(0.17, 0.025), add('#fff1c8', 0.95)); core.position.y = 0.012; flame.add(core);
  const base = new THREE.Mesh(tear(0.06, 0.03), add('#4a7bff', 0.5)); flame.add(base);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(THREE), color: '#ffb36a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(1.3, 1.3, 1); glow.position.y = 0.1; flame.add(glow);
  const light = new THREE.PointLight('#ffb070', 0, 4, 1.6); light.position.y = 0.42; flame.add(light);   // high enough to spread over the wax instead of burning a hot spot

  // smoke: soft puffs that rise and fade after the flame goes out
  const smokeMat = new THREE.SpriteMaterial({ map: glowTex(THREE), color: '#b9b2a8', transparent: true, opacity: 0, depthWrite: false });
  const smoke = Array.from({ length: 22 }, (_, i) => { const s = new THREE.Sprite(smokeMat.clone()); s.userData.k = i / 22; candle.add(s); return s; });

  let lean = 0;
  candle.userData = {
    WAX_Y,
    setGlaze: c => glazeMat.color.set(GLAZES[c] || c),
    // lit: 0..1 flame size, poolR: 0..1 melt pool, smokeK: 0..1 after the flame goes out, pointer x leans the flame
    frame: ({ t, lit, poolR, smokeK, px = 0 }) => {
      const f = 0.85 + 0.1 * Math.sin(t * 13) + 0.06 * Math.sin(t * 23 + 1) + 0.04 * Math.sin(t * 7.3);
      flame.scale.set(lit * (0.95 + 0.06 * Math.sin(t * 17)), lit * f, lit);
      lean += ((px * 0.35 + 0.05 * Math.sin(t * 2.1)) - lean) * 0.08; flame.rotation.z = -lean;
      glow.material.opacity = 0.62 * lit; light.intensity = 1.25 * lit * f;
      ember.visible = lit < 0.05 && smokeK > 0 && smokeK < 0.5;
      pool.scale.setScalar(Math.max(0.001, 0.34 * poolR)); pool.material.emissiveIntensity = 0.1 + 0.35 * lit;
      smoke.forEach(s => {
        const k = (s.userData.k + t * 0.18) % 1, on = smokeK > 0 && smokeK < 1;
        s.position.set(0.012 + Math.sin(k * 9 + t) * 0.04 * k, WAX_Y + 0.1 + k * 1.2, Math.cos(k * 7) * 0.02);
        s.scale.setScalar(0.04 + k * 0.28); s.material.opacity = on ? (1 - k) * 0.35 * (1 - smokeK) * Math.min(1, smokeK * 6) : 0;
      });
    },
  };
  return candle;
}

// the burn: daylight → lit → pool spreads → three scents → blown out
const box = document.querySelector('#candle-3d'), track = document.querySelector('#burn');
const OAT = [242, 235, 224], UMBER = [28, 22, 17];
if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const candle = buildCandle(THREE); scene.add(candle);
  const day = new THREE.DirectionalLight('#fff6e8', 2); day.position.set(-2, 3, 3); scene.add(day);
  const scents = ['fig', 'cedar', 'salt'];
  document.addEventListener('vela:glaze', e => candle.userData.setGlaze(e.detail));
  const look = new THREE.Vector3(0, 0.55, 0);
  const update = ({ t = 0, pointer = { x: 0, y: 0 }, scroll = 0 }) => {
    const p = still ? 0 : scroll;
    const lit = sm(0.17, 0.24, p) * (1 - sm(0.84, 0.88, p));
    const poolR = sm(0.36, 0.58, p) * (1 - sm(0.9, 1, p) * 0.3);
    const smokeK = p > 0.86 ? Math.min(0.999, (p - 0.86) / 0.14) : 0;
    const dark = sm(0.14, 0.3, p) * (1 - sm(0.92, 1, p) * 0.4);
    candle.userData.frame({ t, lit, poolR, smokeK, px: pointer.x });
    day.intensity = 2 - 1.75 * dark; scene.environmentIntensity = 1 - 0.85 * dark;
    // the page around it goes from oat to umber
    const c = OAT.map((v, i) => Math.round(v + (UMBER[i] - v) * dark));
    if (track) { track.style.setProperty('--bg', `rgb(${c})`); track.style.setProperty('--lit', dark.toFixed(3)); }
    // three scents, one glaze each, while the pool spreads
    if (p > 0.6 && p < 0.84) candle.userData.setGlaze(scents[Math.min(2, Math.floor((p - 0.6) / 0.08))]);
    // camera: from a three-quarter view down toward the wick and back
    const close = sm(0.14, 0.3, p) * (1 - sm(0.6, 0.7, p)), top = sm(0.36, 0.48, p) * (1 - sm(0.58, 0.64, p));
    const far = Math.max(1, (1.1 / camera.aspect) ** 0.7);
    camera.position.set((0.95 - 0.3 * close) * far + pointer.x * 0.15, 1.5 + 0.1 * close + 0.6 * top + pointer.y * 0.08, (2.6 - 0.75 * close - 0.5 * top) * far);
    look.set(0, 0.5 + 0.22 * close + 0.15 * top, 0); camera.lookAt(look);
    candle.rotation.y = still ? 0.3 : t * 0.05;
  };
  if (still) { update({}); return; }
  return update;
}, { track, fov: 32 });

// scents.html: a smaller candle, lit, glaze from the picker
const sb = document.querySelector('#scent-3d');
if (sb) stage(sb, ({ THREE, scene, camera, still }) => {
  const candle = buildCandle(THREE); scene.add(candle);
  const day = new THREE.DirectionalLight('#fff6e8', 0.8); day.position.set(-2, 3, 3); scene.add(day);
  scene.environmentIntensity = 0.35;
  document.addEventListener('vela:glaze', e => candle.userData.setGlaze(e.detail));
  camera.position.set(0.8, 1.1, 2.1); camera.lookAt(0, 0.55, 0);
  const update = ({ t = 0, pointer = { x: 0, y: 0 } }) => { candle.userData.frame({ t, lit: 1, poolR: 0.8, smokeK: 0, px: pointer.x }); candle.rotation.y = t * 0.08; };
  if (still) { update({}); return; }
  return update;
}, { fov: 32 });
