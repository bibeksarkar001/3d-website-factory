import { stage } from '../stage.js';
import { buildBoat, buildWater } from './island.js';

// About page: one small boat on a patch of sea, rocking on a loop. It leans toward the cursor; a click gives it a
// bigger swell. A quiet picture of "slow".
const box = document.querySelector('#boat-3d');
if (box) stage(box, ({ THREE, scene, camera, still }) => {
  const water = buildWater(THREE, 14, 60); scene.add(water);
  const boat = buildBoat(THREE, { stripe: '#b23a1a', size: 1.6 }); scene.add(boat);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.2); sun.position.set(-4, 6, 4); scene.add(sun);
  scene.add(new THREE.HemisphereLight('#ffe2c8', '#2f6f6a', 0.8));
  scene.fog = new THREE.Fog('#fff4e6', 6, 14);
  camera.position.set(3.4, 2.4, 4.6); camera.lookAt(0, 0.3, 0);
  let swell = 0; box.addEventListener('click', () => { swell = 1; });
  const update = ({ t = 0, dt = 0.016, pointer = { x: 0, y: 0 } }) => {
    swell = Math.max(0, swell - dt * 0.6);
    const a = 1 + 2.5 * swell;
    water.userData.wave(t, a);
    boat.position.y = 0.1 + (0.04 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 2.1)) * a;
    boat.rotation.z = 0.06 * Math.sin(t * 1.1) * a; boat.rotation.x = 0.04 * Math.sin(t * 0.9 + 1) * a;
    boat.rotation.y = -0.6 + pointer.x * 0.35;
    camera.position.set(3.4 + pointer.x * 0.4, 2.4 + pointer.y * 0.3, 4.6); camera.lookAt(0, 0.3, 0);
  };
  if (still) { update({}); return; }
  return update;
}, { fov: 32 });
