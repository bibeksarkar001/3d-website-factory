import { stage } from '../stage.js';
import { buildBike } from './bike.js';

// Extra pages. battery.html: the battery slides out of the down tube and back on a loop (#battery-3d).
// workshop.html: the rear wheel alone, turning with the scroll and tilting to the cursor (#wheel-3d).
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const light = (THREE, scene) => {
  const key = new THREE.DirectionalLight('#fffbea', 2.4); key.position.set(-2, 3, 3); scene.add(key);
  const rim = new THREE.DirectionalLight('#c8f03c', 0.7); rim.position.set(3, 1, -2); scene.add(rim);
};

const bat = document.querySelector('#battery-3d');
if (bat) stage(bat, ({ THREE, scene, camera, still }) => {
  const bike = buildBike(THREE); scene.add(bike); light(THREE, scene);
  const u = bike.userData, look = new THREE.Vector3(0.22, 0.56, 0);
  const update = ({ t = 0, pointer = { x: 0, y: 0 } }) => {
    const c = t % 7, out = still ? 1 : sm(1, 2.4, c) * (1 - sm(4.6, 6, c));      // out, rest, back in
    u.battery.position.copy(u.batteryHome).addScaledVector(u.dtDir, -0.18 * out).addScaledVector(u.under, 0.12 * out);
    camera.position.set(0.55 + pointer.x * 0.15, 0.62 + pointer.y * 0.1, 1.15); camera.lookAt(look);
  };
  if (still) { update({}); return; }
  return update;
}, { fov: 32 });

const wb = document.querySelector('#wheel-3d');
if (wb) stage(wb, ({ THREE, scene, camera, still }) => {
  const bike = buildBike(THREE); scene.add(bike); light(THREE, scene);
  const [, rear] = bike.userData.wheels;
  bike.children.forEach(c => { if (c !== rear) c.visible = false; });   // the rear wheel alone
  const pos = rear.position.clone();
  const update = ({ pointer = { x: 0, y: 0 }, scroll = 0.5 }) => {
    rear.rotation.z = -scroll * 9;
    rear.rotation.y = -0.5 + pointer.x * 0.4; rear.rotation.x = -pointer.y * 0.2;
    camera.position.set(pos.x, pos.y + 0.06, 1.25); camera.lookAt(pos);
  };
  if (still) { update({}); return; }
  return update;
}, { fov: 32 });
