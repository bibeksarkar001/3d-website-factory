import { stage } from '../stage.js';
import { buildCar, floorShadow } from './car.js';

// The signature move. One stage carries all five chapters of the #run track:
// standstill at the tunnel mouth, launch, full speed through the light, out the far side, a slow orbit.
const track = document.querySelector('#run');
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

const box = document.querySelector('#run-car');
stage(box, ({ THREE, scene, camera, still }) => {
  const NIGHT = new THREE.Color('#0e1a36');
  scene.fog = new THREE.Fog(NIGHT, 8, 46);

  const car = buildCar(THREE); scene.add(car);
  const { wheels, steer, radius } = car.userData;
  const shadow = floorShadow(THREE, 5.8, 2.6, 0.7); scene.add(shadow);

  // floor: dark, a little glossy
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 14), new THREE.MeshStandardMaterial({ color: '#060d22', roughness: 0.55, metalness: 0.3, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  // the tunnel: arches of light around the road, instanced
  const arch = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI, c = Math.cos(a), s = Math.sin(a);
    arch.push(new THREE.Vector3(0, 4.3 * Math.abs(s) ** 0.55, 3.7 * Math.sign(c) * Math.abs(c) ** 0.6));
  }
  const RINGS = 34, GAP = 2.4, LEN = RINGS * GAP;
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.8), toneMapped: false, transparent: true });
  const rings = new THREE.InstancedMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch), 96, 0.022, 6), ringMat, RINGS);
  scene.add(rings);
  // light streaks along the walls and roof
  const STREAKS = 70, sGeo = new THREE.BoxGeometry(1, 0.012, 0.012);
  const streakMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.9, 2.6), toneMapped: false, transparent: true, opacity: 0 });
  const streaks = new THREE.InstancedMesh(sGeo, streakMat, STREAKS); scene.add(streaks);
  const sPos = [...Array(STREAKS)].map((_, i) => { const a = 0.15 + Math.random() * (Math.PI - 0.3); return { a, r: 3.2 + Math.random() * 0.3, x: Math.random() * LEN, k: 1 + Math.random() }; });
  // centre-line dashes on the road
  const DASH = 30, dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.2, 0.07), new THREE.MeshBasicMaterial({ color: '#c9d3ea', transparent: true, opacity: 0.55 }), DASH);
  scene.add(dash);
  // dust in the light
  const P = 500, pg = new THREE.BufferGeometry(), pp = new Float32Array(P * 3);
  for (let i = 0; i < P; i++) { pp[i * 3] = Math.random() * LEN - LEN / 2; pp[i * 3 + 1] = Math.random() * 4; pp[i * 3 + 2] = (Math.random() * 2 - 1) * 3.4; }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dustMat = new THREE.PointsMaterial({ color: '#ffd9c2', size: 0.035, transparent: true, opacity: 0.7, depthWrite: false });
  const dust = new THREE.Points(pg, dustMat); scene.add(dust);
  // the halo: the last ring of the tunnel stays behind and settles over the car
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.03, 12, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.8), toneMapped: false, transparent: true, opacity: 0 }));
  halo.rotation.x = Math.PI / 2; scene.add(halo);

  // key light that follows the cursor, warm fill from the rings
  const key = new THREE.DirectionalLight('#ffffff', 1.4); scene.add(key);
  const warm = new THREE.PointLight('#ffcfa8', 0, 12); warm.position.set(0, 3.2, 0); scene.add(warm);

  const o = new THREE.Object3D(), look = new THREE.Vector3(), cam = new THREE.Vector3();
  // camera keys: [p, position, target, fov]
  const keys = [
    [0.00, [6.4, 1.15, 6.9], [0.1, 0.5, 0], 30],
    [0.12, [6.0, 1.0, 6.4], [0.0, 0.5, 0], 30],
    [0.30, [-7.6, 1.9, 4.4], [1.2, 0.5, 0], 36],
    [0.50, [-6.6, 0.95, 3.0], [2.5, 0.5, 0], 44],
    [0.66, [-2.0, 2.6, 8.4], [0.3, 0.5, 0], 34],
  ];
  let travel = 0;

  const frame = ({ dt, pointer, scroll }) => {
    const p = still ? 1 : scroll; // reduced motion: the finished reveal, no rushing light
    // speed: 0 at rest, flat out in chapter three, easing off as the tunnel ends
    const v = 64 * sm(0.13, 0.42, p) * (1 - sm(0.58, 0.74, p));
    const tunnel = 1 - sm(0.6, 0.76, p);
    travel += still ? 0 : (v + 1.5 * tunnel) * dt;
    const pos = travel + 160 * sm(0.12, 0.74, p) ** 1.6;  // scroll moves the road too, so it reverses with you

    // rings and streaks rush past toward -x; stretch with speed
    const stretch = 1 + v * 0.05;
    for (let i = 0; i < RINGS; i++) {
      let x = ((i * GAP - pos) % LEN + LEN) % LEN - LEN * 0.32;
      o.position.set(x, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(stretch, 1, 1);
      o.updateMatrix(); rings.setMatrixAt(i, o.matrix);
    }
    rings.instanceMatrix.needsUpdate = true;
    ringMat.opacity = tunnel;
    rings.visible = tunnel > 0.01;
    for (let i = 0; i < STREAKS; i++) {
      const s = sPos[i], x = ((s.x - pos * 1.4 * s.k) % LEN + LEN) % LEN - LEN * 0.32;
      o.position.set(x, Math.sin(s.a) * s.r * 1.12, Math.cos(s.a) * s.r);
      o.scale.set(0.5 + v * 0.18 * s.k, 1, 1); o.updateMatrix(); streaks.setMatrixAt(i, o.matrix);
    }
    streaks.instanceMatrix.needsUpdate = true;
    streakMat.opacity = sm(0.2, 0.42, p) * tunnel;
    for (let i = 0; i < DASH; i++) {
      o.position.set(((i * 3 - pos) % 90 + 90) % 90 - 30, 0.006, 0); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.set(1 + v * 0.05, 1, 1);
      o.updateMatrix(); dash.setMatrixAt(i, o.matrix);
    }
    dash.instanceMatrix.needsUpdate = true;
    dust.position.x = -((pos * 0.9) % LEN); dustMat.opacity = 0.7 * tunnel;
    scene.fog.near = mix(8, 20, 1 - tunnel); scene.fog.far = mix(46, 90, 1 - tunnel);

    // the car: wheels roll with the road, a hint of squat under power, steers toward the cursor when slow
    wheels.forEach(w => { w.rotation.z = -pos / radius; });
    steer.forEach(s => { s.rotation.y = -pointer.x * 0.28 * (1 - sm(0.1, 0.25, p)); });
    car.rotation.z = 0.012 * sm(0.13, 0.3, p) * (1 - sm(0.3, 0.45, p));
    car.position.y = still ? 0 : Math.sin(travel * 3.1) * 0.004 * Math.min(1, v / 20);

    // camera: fly between the keys, then the slow orbit of the reveal
    const rev = sm(0.72, 1, p);
    let k = keys.length - 1; while (k > 0 && p < keys[k][0]) k--;
    const A = keys[k], B = keys[Math.min(k + 1, keys.length - 1)], t = B === A ? 0 : sm(A[0], B[0], p);
    cam.set(mix(A[1][0], B[1][0], t), mix(A[1][1], B[1][1], t), mix(A[1][2], B[1][2], t));
    look.set(mix(A[2][0], B[2][0], t), mix(A[2][1], B[2][1], t), mix(A[2][2], B[2][2], t));
    let fov = mix(A[3], B[3], t);
    if (p > 0.66) {
      const ang = Math.atan2(8.4, -2.0) - rev * Math.PI * 1.25, r = mix(8.6, 8.2, rev);
      const orbit = new THREE.Vector3(Math.cos(ang) * r, mix(2.6, 1.4, rev), Math.sin(ang) * r);
      const b = sm(0.66, 0.74, p);
      cam.lerp(orbit, b); look.lerp(new THREE.Vector3(0, 0.5, 0), b); fov = mix(fov, 30, b);
    }
    cam.x += pointer.x * 0.35; cam.y += pointer.y * 0.18;
    camera.position.copy(cam); camera.lookAt(look);
    // frame the car beside the copy: to the right on wide screens, lower down on phones
    const w = box.clientWidth, h = box.clientHeight, wide = w > h;
    camera.fov = fov * (wide ? 1 : 1.5);
    camera.setViewOffset(w, h, wide ? -w * 0.13 : 0, wide ? 0 : -h * 0.1, w, h);

    key.position.set(cam.x + pointer.x * 3, 5, cam.z + 2);
    warm.intensity = 3 * tunnel * (0.6 + 0.4 * sm(0.13, 0.4, p)) + 4 * rev;
    halo.material.opacity = sm(0.7, 0.86, p);
    halo.position.y = mix(4.6, 2.9, sm(0.7, 0.92, p));
    halo.scale.setScalar(mix(1.5, 1, sm(0.7, 0.92, p)));
  };
  return frame;
}, { track, fov: 32 });
