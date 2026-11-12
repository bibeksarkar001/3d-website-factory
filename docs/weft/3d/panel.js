import { stage } from '../stage.js';
import { twill, washes } from './cloth.js';

// Sculptor + animator: the sewing track. A denim panel in raking light. As you scroll, a steel needle sews the
// pocket's ochre twin-row stitching (about 9 stitches per inch), copper rivets are set at its top corners, and the
// camera drops to the cuff, where the chain-stitched hem shows the selvedge line.
// 1 unit = 10 cm. Tells the page how many stitches are sewn with the event `weft:sew`.
const box = document.querySelector('#panel-3d');
const track = document.querySelector('#sew');
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lin = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const STEP = 0.0282;                                        // one stitch: 1/9 inch
  const W = 3.4, H = 4.2, T = 0.03;
  const cloth = twill(THREE, { wash: washes.raw }), back = twill(THREE, { wash: washes.raw, reverse: true });
  const denim = (tex, rx, ry, tint = '#ffffff') => {
    const map = tex.map.clone(), bump = tex.bump.clone();
    for (const t of [map, bump]) { t.repeat.set(rx, ry); t.needsUpdate = true; }
    return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 0.35, roughness: 0.94, color: tint, envMapIntensity: 0.6 });
  };
  const INDIGO = '#6c79b4';                                   // the fine ecru flecks average out pale; this keeps raw denim deep

  const g = new THREE.Group(); scene.add(g);
  // the panel: one piece of cloth, a little soft at the edges
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), denim(cloth, 24, 29.6, INDIGO));
  g.add(panel);

  // the pocket: a second layer of cloth in the classic five-sided shape
  const P = [[-0.7, 0.85], [-0.66, -0.35], [0, -0.72], [0.66, -0.35], [0.7, 0.85]];
  const shape = new THREE.Shape(); P.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y))); shape.closePath();
  const pocketGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.012, bevelSegments: 3 });
  const pocket = new THREE.Mesh(pocketGeo, denim(cloth, 7, 7, INDIGO));    // extrude UVs are in units: ~1 cell per mm
  pocket.position.z = T / 2; g.add(pocket);
  const pz = T / 2 + 0.03;                                    // the pocket's top surface

  // the hem: a folded cuff at the bottom shows the lighter back of the cloth and the selvedge line at the outseam
  const cuffH = 0.42;
  const cuff = new THREE.Mesh(new THREE.BoxGeometry(W, cuffH, 0.03), denim(back, 24, 3));
  cuff.position.set(0, -H / 2 + cuffH / 2, T / 2 + 0.016); g.add(cuff);
  const selvedge = new THREE.Mesh(new THREE.BoxGeometry(0.09, cuffH, 0.032), new THREE.MeshStandardMaterial({ color: '#e9e2d2', roughness: 0.9 }));
  selvedge.position.set(W / 2 - 0.045, cuff.position.y, cuff.position.z + 0.001); g.add(selvedge);
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.018, cuffH, 0.034), new THREE.MeshStandardMaterial({ color: '#e39a3c', roughness: 0.7 }));
  line.position.copy(selvedge.position); line.position.x -= 0.012; g.add(line);
  const hz = cuff.position.z + 0.016;

  // stitches: instanced capsules laid along a path, one every STEP
  const thread = new THREE.MeshStandardMaterial({ color: '#e39a3c', roughness: 0.8, envMapIntensity: 0.5, emissive: '#e39a3c', emissiveIntensity: 0.45 }); // reads ochre even in raking light
  const sew = (pts, z, gap = STEP, fat = 1) => {
    const path = new THREE.CurvePath(); for (let i = 1; i < pts.length; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i - 1], z), new THREE.Vector3(...pts[i], z)));
    const n = Math.floor(path.getLength() / gap), geo = new THREE.CapsuleGeometry(0.011 * fat, gap * 0.55, 3, 8);
    const mesh = new THREE.InstancedMesh(geo, thread, n), o = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
    const spots = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, p = path.getPointAt(u), d = path.getTangentAt(u);
      o.position.copy(p); o.quaternion.setFromUnitVectors(up, d); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); spots.push(p.clone());
    }
    mesh.count = 0; mesh.frustumCulled = false; g.add(mesh);   // bounds are measured while count is 0, so never cull
    return { mesh, spots, n };
  };
  const inset = (pts, k) => pts.map(([x, y]) => [x * (1 - k / 0.7), y > 0 ? y : y + k * 0.6]);
  const outer = sew(P, pz), inner = sew(inset(P, 0.06).reverse(), pz), top = sew([[-0.62, 0.77], [0.62, 0.77]], pz);
  const pocketRows = [outer, inner, top], pocketTotal = outer.n + inner.n + top.n;
  const hem = sew([[-W / 2 + 0.05, -H / 2 + cuffH - 0.05], [W / 2 - 0.12, -H / 2 + cuffH - 0.05]], hz + 0.004, STEP * 1.2, 1.25);

  // copper rivets at the pocket's top corners
  const copper = new THREE.MeshPhysicalMaterial({ color: '#b8683a', metalness: 1, roughness: 0.28, clearcoat: 0.4, side: THREE.DoubleSide });
  const dome = new THREE.LatheGeometry([[0, 0.03], [0.022, 0.027], [0.038, 0.017], [0.045, 0.004], [0.045, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 40);
  const rivets = [[-0.66, 0.8], [0.66, 0.8]].map(([x, y]) => {
    const r = new THREE.Mesh(dome, copper); r.rotation.x = Math.PI / 2; r.position.set(x, y, pz); r.scale.setScalar(0.001); g.add(r); return r;
  });

  // the needle: polished steel, punches straight down into the cloth
  const steel = new THREE.MeshPhysicalMaterial({ color: '#d7dbe0', metalness: 1, roughness: 0.15 });
  const needle = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.7, 16), steel); shaft.position.y = 0.38;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.05, 16), steel); tip.rotation.x = Math.PI; tip.position.y = 0.01;
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.9, 6), thread); tail.position.set(0.006, 0.6, 0);
  needle.add(shaft, tip, tail); needle.rotation.x = Math.PI / 2; g.add(needle);

  // light: a warm raking key from the left, a cool fill, and a small light that follows the cursor
  const key = new THREE.DirectionalLight('#ffd9a8', 2.6); key.position.set(-6, 2, 2.2); scene.add(key);
  const fill = new THREE.DirectionalLight('#9fb2ff', 0.35); fill.position.set(4, -2, 5); scene.add(fill);
  const hand = new THREE.PointLight('#ffe3c0', 0, 4); scene.add(hand);
  const glint = new THREE.PointLight('#ffc89a', 0, 1.6); scene.add(glint);

  // camera beats, one per chapter: cloth, needle, pocket, rivets, hem
  const beats = [                                             // pairs hold the camera still while a chapter plays
    { at: 0.0, pos: [0, -0.1, 9.8], look: [0, -0.1, 0], tilt: -0.22 },
    { at: 0.1, pos: [0, -0.1, 9.4], look: [0, -0.1, 0], tilt: -0.18 },
    { at: 0.2, pos: [-0.75, 1.1, 2.4], look: [-0.62, 0.72, 0], tilt: -0.05 },
    { at: 0.3, pos: [-0.6, 0.9, 2.6], look: [-0.5, 0.55, 0], tilt: -0.04 },
    { at: 0.4, pos: [0, 0.1, 4.6], look: [0, 0.08, 0], tilt: 0 },
    { at: 0.58, pos: [0, 0.1, 4.4], look: [0, 0.08, 0], tilt: 0.02 },
    { at: 0.66, pos: [0, 0.95, 3.3], look: [0, 0.7, 0], tilt: 0.04 },
    { at: 0.77, pos: [0, 0.93, 3.15], look: [0, 0.7, 0], tilt: 0.06 },
    { at: 0.86, pos: [1.0, -1.45, 2.4], look: [1.2, -1.82, 0], tilt: 0.1 },
    { at: 1.0, pos: [1.1, -1.4, 2.6], look: [1.25, -1.8, 0], tilt: 0.12 },
  ];
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  const frameAt = p => {
    let i = 0; while (i < beats.length - 2 && p > beats[i + 1].at) i++;
    const a = beats[i], b = beats[i + 1], k = sm(a.at, b.at, p);
    cam.copy(A.set(...a.pos)).lerp(B.set(...b.pos), k); look.copy(A.set(...a.look)).lerp(B.set(...b.look), k);
    return a.tilt + (b.tilt - a.tilt) * k;
  };

  let punch = 0, sewnLast = -1, shownRivets = [0, 0], rivetT = [0, 0];
  box.addEventListener('click', () => { punch = 1; });
  const place = (count, rows) => {                            // show `count` stitches across the rows, in order
    let left = count, last = null;
    for (const r of rows) { const k = Math.max(0, Math.min(r.n, left)); r.mesh.count = k; if (k) last = r.spots[k - 1]; left -= k; }
    return last;
  };

  const update = ({ t = 0, dt = 0.016, pointer = { x: 0, y: 0 }, scroll = 1 }) => {
    const p = still ? 1 : scroll;
    const tilt = frameAt(p);
    camera.position.copy(cam).add(A.set(pointer.x * 0.25, pointer.y * 0.18, 0)); camera.lookAt(look);
    g.rotation.y = tilt + pointer.x * 0.06; g.rotation.x = -pointer.y * 0.04;
    hand.position.set(pointer.x * 2.2, pointer.y * 2.2 + look.y, 1.6); hand.intensity = still ? 0 : 1.4;

    // sewing: the pocket from .16 to .6, the hem from .82 to .98
    const sp = lin(0.16, 0.6, p) * pocketTotal, sh = lin(0.82, 0.98, p) * hem.n;
    const at = place(Math.floor(sp), pocketRows), hemAt = place(Math.floor(sh), [hem]);
    const sewn = Math.floor(sp) + Math.floor(sh);
    if (sewn !== sewnLast) { sewnLast = sewn; document.dispatchEvent(new CustomEvent('weft:sew', { detail: { sewn, pocket: Math.floor(sp), hem: Math.floor(sh) } })); }

    // the needle sits on the newest stitch and bobs once per stitch; it hides when there is nothing to sew
    const onHem = p > 0.8, spot = onHem ? hemAt : at, frac = onHem ? sh % 1 : sp % 1;
    punch = Math.max(0, punch - dt * 3);
    const working = (p > 0.15 && p < 0.6) || (p > 0.81 && p < 0.985);
    needle.visible = !still && working && !!spot;
    if (spot) needle.position.set(spot.x + 0.012, spot.y, spot.z + 0.02 + 0.16 * Math.abs(Math.sin(Math.PI * frac)) + 0.12 * Math.sin(punch * Math.PI));

    // rivets drop in at .66 and .71, each with a glint
    [0.66, 0.71].forEach((a, i) => {
      const on = still || p >= a;
      if (on && !shownRivets[i]) { shownRivets[i] = 1; rivetT[i] = 0; }
      if (!on) shownRivets[i] = 0;
      rivetT[i] = Math.min(1, rivetT[i] + dt * 2.2);
      const k = shownRivets[i] ? (still ? 1 : 1 - (1 - rivetT[i]) ** 3) : 0;
      rivets[i].scale.setScalar(Math.max(0.001, 0.85 + 0.15 * k) * (k > 0 ? 1 : 0.001));
      rivets[i].position.z = pz + (1 - k) * 0.25;
    });
    const fresh = Math.max(...rivetT.map((v, i) => (shownRivets[i] ? 1 - v : 0)));
    glint.intensity = still ? 0 : fresh * 6; glint.position.set(rivetT[1] < 1 && shownRivets[1] ? 0.66 : -0.66, 0.8, pz + 0.3);
  };
  if (still) { update({ scroll: 1 }); return; }
  return update;
}, { track, fov: 32 });
