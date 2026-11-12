import { stage } from '../stage.js';

// Sculptor + animator: the Ferro 26 cast-iron skillet, built from code (1 unit = 10 cm). A lathe-turned pan body, a long
// handle with a hanging hole, a helper handle. Heat is emissive: the whole pan glows when it is cast, only the floor
// glows on the flame. Machining sweeps a bright ring across the floor; seasoning darkens it coat by coat.
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lin = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

export function buildPan(THREE) {
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const pan = new THREE.Group();
  // floor heat map: bright at the centre of the base and the floor, fading up the walls (lathe v runs along the profile)
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 }), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, '#fff'); grd.addColorStop(0.45, '#b0b0b0'); grd.addColorStop(0.8, '#222'); grd.addColorStop(1, '#000');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const floorHeat = new THREE.CanvasTexture(c);
  const iron = new THREE.MeshPhysicalMaterial({ color: '#2a2725', roughness: 0.6, metalness: 0.55, clearcoat: 0, emissive: '#ff5a14', emissiveIntensity: 0 });
  const body = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [1.1, 0], [1.19, 0.04], [1.24, 0.14], [1.3, 0.5], [1.325, 0.525], [1.3, 0.545], [1.265, 0.52],
    [1.205, 0.16], [1.15, 0.085], [1.06, 0.06], [0, 0.06]].map(([r, y]) => V2(r, y)), 128), iron);
  pan.add(body);
  // the cooking floor: its own disc so it can be machined and seasoned separately
  const floorMat = new THREE.MeshPhysicalMaterial({ color: '#3a3633', roughness: 0.85, metalness: 0.6, clearcoat: 0, emissive: '#ff5a14', emissiveIntensity: 0, emissiveMap: floorHeat });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 96), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.062; pan.add(floor);
  // long handle (top view shape, with a hanging hole), tilted up a little
  const hs = new THREE.Shape(); hs.moveTo(0, -0.17); hs.lineTo(1.35, -0.1); hs.absarc(1.4, 0, 0.1, -Math.PI / 2, Math.PI / 2, false); hs.lineTo(0, 0.17); hs.closePath();
  const hole = new THREE.Path(); hole.absellipse(1.33, 0, 0.07, 0.045, 0, Math.PI * 2, true); hs.holes.push(hole);
  const handle = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3, curveSegments: 24 }), iron);
  handle.rotation.x = Math.PI / 2; handle.position.set(1.22, 0.5, 0); handle.rotation.y = 0; const hp = new THREE.Group(); hp.add(handle); hp.rotation.z = 0.14; pan.add(hp);
  // helper handle opposite: a small lug with a hole
  const ls = new THREE.Shape(); ls.moveTo(0, -0.2); ls.quadraticCurveTo(0.34, -0.2, 0.34, 0); ls.quadraticCurveTo(0.34, 0.2, 0, 0.2); ls.closePath();
  const lh = new THREE.Path(); lh.absellipse(0.15, 0, 0.08, 0.1, 0, Math.PI * 2, true); ls.holes.push(lh);
  const lug = new THREE.Mesh(new THREE.ExtrudeGeometry(ls, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 20 }), iron);
  lug.rotation.x = Math.PI / 2; lug.rotation.z = Math.PI; lug.position.set(-1.27, 0.52, 0); pan.add(lug);

  // the cutter's ring of light that sweeps the floor while it is machined
  const cut = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 96), new THREE.MeshBasicMaterial({ color: '#fff3dc', transparent: true, opacity: 0 }));
  cut.rotation.x = -Math.PI / 2; cut.position.y = 0.07; pan.add(cut);
  // oil drops that skate on a hot floor
  const drops = Array.from({ length: 14 }, (_, i) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), new THREE.MeshPhysicalMaterial({ color: '#e9b04a', roughness: 0.05, transmission: 0, clearcoat: 1, transparent: true, opacity: 0 }));
    d.scale.y = 0.55; d.userData = { a: i * 2.4, r: 0.2 + (i % 5) * 0.17, s: 0.6 + (i % 3) * 0.3 }; pan.add(d); return d;
  });

  const cRaw = new THREE.Color('#5d5955'), cBlack = new THREE.Color('#121110'), cMid = new THREE.Color('#2a2725');
  pan.userData = {
    // cast: 0..1 whole-pan glow; cool: 0..1 cooling; machined: 0..1 sweep; coats: 0..3; heat: 0..1 floor glow on the flame
    state: ({ t, cast = 0, machined = 0, coats = 3, heat = 0 }) => {
      const hot = cast;                                          // casting glow, uniform
      const casting = hot > 0.01;
      if (floorMat.userData.m !== casting) { floorMat.emissiveMap = casting ? null : floorHeat; floorMat.needsUpdate = true; floorMat.userData.m = casting; }
      // tone mapping washes strong emissive out to pale yellow, so keep it under ~1 and let the colour do the work
      iron.emissiveIntensity = casting ? 0.72 * hot : 0; floorMat.emissiveIntensity = casting ? 0.82 * hot : 1.0 * heat;
      iron.emissive.set(hot > 0.7 ? '#ff6a1a' : '#e23c0a'); floorMat.emissive.copy(iron.emissive);
      // seasoning: raw grey iron → deep black, a little gloss with each coat
      const k = Math.min(1, coats / 3);
      iron.color.copy(cRaw).lerp(cMid, Math.min(1, coats)).lerp(cBlack, k); floorMat.color.copy(iron.color);
      iron.clearcoat = floorMat.clearcoat = 0.15 * coats; iron.clearcoatRoughness = floorMat.clearcoatRoughness = 0.5;
      // machining: rough floor becomes smooth behind the cutting ring
      floorMat.roughness = 0.85 - 0.5 * machined; cut.material.opacity = machined > 0.01 && machined < 0.99 ? 1 : 0; cut.scale.setScalar(Math.max(0.02, 1.1 * machined));
      drops.forEach(d => {
        const u = d.userData, on = heat > 0.6;
        d.material.opacity = on ? Math.min(1, (heat - 0.6) * 4) : 0;
        const a = u.a + t * u.s * 2.2, r = u.r + 0.06 * Math.sin(t * 5 + u.a);
        d.position.set(r * Math.cos(a), 0.085 + 0.012 * Math.abs(Math.sin(t * 9 + u.a)), r * Math.sin(a));
      });
    },
  };
  return pan;
}

export function buildFlame(THREE, kind = 'gas') {
  // under-pan heat: a gas ring of blue flames, an induction coil that glows, or a wood fire
  const g = new THREE.Group(); g.position.y = -0.42;
  const add = (color, o) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const gas = new THREE.Group(), coil = new THREE.Group(), fire = new THREE.Group(); g.add(gas, coil, fire);
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.08, 48), new THREE.MeshStandardMaterial({ color: '#2b2b2d', metalness: 0.8, roughness: 0.4 })); burner.position.y = -0.04; gas.add(burner);
  const jets = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, f = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 8), add('#4d8bff', 0.8)); f.position.set(0.58 * Math.cos(a), 0.11, 0.58 * Math.sin(a)); gas.add(f); jets.push(f); }
  for (let i = 1; i <= 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(i * 0.16, 0.018, 6, 64), add('#ff7a2c', 0.6)); r.rotation.x = -Math.PI / 2; coil.add(r); }
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.03, 64), new THREE.MeshStandardMaterial({ color: '#0c0c0d', metalness: 0.3, roughness: 0.1 })); glass.position.y = -0.03; coil.add(glass);
  const flames = []; for (let i = 0; i < 9; i++) { const a = i * 2.39, r = 0.15 + (i % 3) * 0.2, f = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 10), add(i % 2 ? '#ff8a2a' : '#ffc04a', 0.75)); f.position.set(r * Math.cos(a), 0.2, r * Math.sin(a)); fire.add(f); flames.push(f); }
  const logs = new THREE.Group(); for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.3, 10), new THREE.MeshStandardMaterial({ color: '#4a3424', roughness: 0.9 })); l.rotation.z = Math.PI / 2; l.rotation.y = i * Math.PI / 4; l.position.y = -0.02; logs.add(l); } fire.add(logs);
  const light = new THREE.PointLight('#ff8a3c', 0, 3); light.position.y = 0.1; g.add(light);
  g.userData = {
    set: k => { gas.visible = k === 'gas'; coil.visible = k === 'induction'; fire.visible = k === 'fire'; light.color.set(k === 'gas' ? '#6d9bff' : '#ff8a3c'); },
    frame: (t, on) => {
      g.visible = on > 0.01; light.intensity = 2.5 * on;
      jets.forEach((j, i) => { j.scale.y = on * (0.85 + 0.2 * Math.sin(t * 20 + i)); });
      coil.children.forEach((r, i) => { if (r.material.blending === THREE.AdditiveBlending) r.material.opacity = on * (0.45 + 0.2 * Math.sin(t * 2 + i)); });
      flames.forEach((f, i) => { f.scale.set(on, on * (0.8 + 0.35 * Math.sin(t * 9 + i * 1.7)), on); });
    },
  };
  g.userData.set(kind);
  return g;
}

const lights = (THREE, scene) => {
  const key = new THREE.DirectionalLight('#fff4e6', 2.4); key.position.set(-3, 5, 3); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd9b8', 0.8); rim.position.set(3, 1, -3); scene.add(rim);
  return key;
};

// the story: finished → cast hot and cooling → machined → seasoned → heated
const box = document.querySelector('#pan-3d'), track = document.querySelector('#make');
if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const pan = buildPan(THREE), flame = buildFlame(THREE, 'gas'); scene.add(pan, flame); const keyL = lights(THREE, scene);
  const beats = [
    [0, [3.1, 3.0, 4.4], [0.35, 0.05, 0]], [0.12, [2.9, 3.2, 4.3], [0.35, 0.05, 0]],
    [0.2, [0.6, 2.1, 4.6], [0.3, 0.15, 0]], [0.36, [0.8, 2.2, 4.5], [0.3, 0.15, 0]],
    [0.42, [0.2, 3.6, 1.4], [0, 0, 0]], [0.58, [0.3, 3.6, 1.5], [0, 0, 0]],
    [0.64, [2.7, 2.8, 3.3], [0.3, 0.05, 0]], [0.78, [2.8, 2.7, 3.4], [0.3, 0.05, 0]],
    [0.84, [0.6, 1.3, 4.3], [0.3, -0.1, 0]], [1, [0.7, 1.5, 4.4], [0.3, -0.05, 0]],
  ];
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  const update = ({ t = 0, pointer = { x: 0, y: 0 }, scroll = 0 }) => {
    const p = still ? 0 : scroll;
    let i = 0; while (i < beats.length - 2 && p > beats[i + 1][0]) i++;
    const a = beats[i], b = beats[i + 1], k = sm(a[0], b[0], p);
    cam.copy(A.set(...a[1])).lerp(B.set(...b[1]), k); look.copy(A.set(...a[2])).lerp(B.set(...b[2]), k);
    const far = Math.max(1, (1.1 / camera.aspect) ** 0.7); cam.sub(look).multiplyScalar(far).add(look);
    camera.position.copy(cam).add(A.set(pointer.x * 0.3, pointer.y * 0.2, 0)); camera.lookAt(look);
    const cast = p < 0.17 || p > 0.38 ? 0 : 1 - lin(0.22, 0.36, p);            // pours hot at .17, cools by .36
    const machined = p < 0.38 ? (p < 0.17 ? 1 : 0) : lin(0.42, 0.56, p);       // finished pan at the start
    const coats = p < 0.17 ? 3 : p < 0.6 ? 0 : 3 * lin(0.62, 0.78, p);
    const heat = sm(0.84, 0.95, p);
    pan.userData.state({ t, cast, machined: p < 0.17 ? 1 : machined, coats, heat });
    const dark = sm(0.17, 0.22, p) * (1 - sm(0.34, 0.4, p));
    scene.environmentIntensity = 1 - 0.6 * dark; keyL.intensity = 2.4 - 1.1 * dark;   // keep some light so the glowing iron still has shape
    if (track) { const c = [230, 225, 216].map((v, i) => Math.round(v + ([20, 18, 17][i] - v) * dark)); track.style.setProperty('--bg', `rgb(${c})`); track.style.setProperty('--dark', dark.toFixed(3)); }
    flame.userData.frame(t, heat);
    pan.rotation.y = still ? -0.5 : -0.5 + Math.sin(t * 0.15) * 0.08;
  };
  if (still) { update({}); return; }
  return update;
}, { track, fov: 30 });

// heat.html and the home picker: the pan on the heat source you pick
document.querySelectorAll('.heat-3d').forEach(hb => stage(hb, ({ THREE, scene, camera, still }) => {
  const pan = buildPan(THREE), flame = buildFlame(THREE, 'gas'); scene.add(pan, flame); lights(THREE, scene);
  document.addEventListener('ferro:heat', e => flame.userData.set(e.detail));
  const update = ({ t = 0, pointer = { x: 0, y: 0 } }) => {
    pan.userData.state({ t, heat: 0.9 }); flame.userData.frame(t, 1);
    camera.position.set(1.9 + pointer.x * 0.4, 3.1 + pointer.y * 0.3, 6.3); camera.lookAt(0, -0.05, 0);
    pan.rotation.y = 2.3 + (still ? 0 : Math.sin(t * 0.2) * 0.15);   // handle pointing away, so the pan fits a half-width panel
  };
  if (still) { update({}); return; }
  return update;
}, { fov: 30 }));
