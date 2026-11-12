import { stage } from '../stage.js';
import { wheel } from './car.js';

// Design page: the 21-inch wheel alone, big. It leans toward the cursor, rolls as you scroll,
// and its finish changes from the satin black / polished buttons (vanta:rims, sent by motion.js).
// The car's wheel is made to be seen small; this close-up swaps in tapered, bevelled spokes, a dished face and a
// centre cap, and renders the barrel from both sides so you cannot see through it.
const box = document.querySelector('#wheel');
if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const mats = {
    tyre: new THREE.MeshStandardMaterial({ color: '#17181b', roughness: 0.78, side: THREE.DoubleSide }),
    rim: new THREE.MeshPhysicalMaterial({ color: '#1b1d22', metalness: 1, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide }),
    disc: new THREE.MeshStandardMaterial({ color: '#7d8188', metalness: 1, roughness: 0.32 }),
  };
  const w = wheel(THREE, mats);
  w.children.filter(c => c.isInstancedMesh).forEach(c => (c.visible = false));   // replaced by the spokes below

  // ten tapered spokes in five pairs, narrow at the hub, wide at the rim, bevelled
  const sh = new THREE.Shape();
  sh.moveTo(0.06, -0.008); sh.lineTo(0.258, -0.015); sh.lineTo(0.258, 0.015); sh.lineTo(0.06, 0.008); sh.closePath();
  const spokeGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3 });
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(spokeGeo, mats.rim);
    s.rotation.set(0, -0.1, (Math.floor(i / 2) / 5) * Math.PI * 2 + (i % 2 ? 0.15 : -0.15));
    s.position.z = 0.07; w.add(s);
  }
  // the inside of the barrel, dark, so nothing behind the wheel shows through
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.262, 64), new THREE.MeshStandardMaterial({ color: '#07090e', roughness: 0.9 }));
  inner.position.z = -0.1; w.add(inner);
  // dished face ring where the spokes meet the rim, and a centre cap
  const v = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));
  const face = new THREE.Mesh(new THREE.LatheGeometry(v([[0.248, 0.07], [0.262, 0.1], [0.276, 0.118], [0.282, 0.112]]), 96), mats.rim);
  face.rotation.x = Math.PI / 2; w.add(face);
  const cap = new THREE.Mesh(new THREE.LatheGeometry(v([[0, 0.125], [0.03, 0.123], [0.055, 0.112], [0.072, 0.09], [0.075, 0.07]]), 64), mats.rim);
  cap.rotation.x = Math.PI / 2; w.add(cap);
  const mark = new THREE.Mesh(new THREE.CircleGeometry(0.022, 32), new THREE.MeshStandardMaterial({ color: '#ff8a50', roughness: 0.4 }));
  mark.position.z = 0.126; w.add(mark);

  // the caliper stays put behind the spokes while the wheel turns past it
  const caliper = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.026, 12, 32, 0.9), new THREE.MeshStandardMaterial({ color: '#ff8a50', roughness: 0.45 }));
  caliper.position.z = 0.015; caliper.rotation.z = 0.5; caliper.scale.z = 0.6;

  const g = new THREE.Group(); g.add(w, caliper); g.scale.setScalar(4.2); scene.add(g);
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const warm = new THREE.PointLight('#ffb08a', 10, 7); warm.position.set(2.2, -1.2, 2); scene.add(warm);
  camera.position.set(0, 0, 6.4); camera.lookAt(0, 0, 0);

  const target = { color: new THREE.Color('#1b1d22'), rough: 0.38 };
  box.addEventListener('vanta:rims', e => { const p = e.detail === 'polished'; target.color.set(p ? '#d9dde3' : '#1b1d22'); target.rough = p ? 0.12 : 0.38; });

  let roll = 0;
  const pose = (pointer, scroll, dt) => {
    const k = still ? 1 : 1 - Math.exp(-dt * 5);
    mats.rim.color.lerp(target.color, k); mats.rim.roughness += (target.rough - mats.rim.roughness) * k;
    g.rotation.y = -0.38 + pointer.x * 0.35;
    g.rotation.x = 0.06 - pointer.y * 0.2;
    roll += ((-scroll * Math.PI * 3) - roll) * Math.min(1, dt * 6);   // it rolls forward as the page moves down
    w.rotation.z = roll;
  };
  if (still) { pose({ x: 0, y: 0 }, 0.4, 1); return; }
  return ({ dt, pointer, scroll }) => pose(pointer, scroll, dt);
});
