import { stage } from '../stage.js';
import { buildCar, floorShadow, PAINTS } from './car.js';

// The configurator: the car on a slow turntable. Paint, wheels and light bars change live from the pickers.
// The cursor turns the car; dragging spins the turntable.
const box = document.querySelector('#studio-car');
stage(box, ({ THREE, scene, camera, still }) => {
  const car = buildCar(THREE); scene.add(car);
  const { mats } = car.userData;
  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.15, 0.06, 128), new THREE.MeshStandardMaterial({ color: '#0c1733', roughness: 0.35, metalness: 0.6 }));
  turntable.position.y = -0.03; scene.add(turntable);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(3.12, 0.01, 8, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.2, 0.8), toneMapped: false }));
  edge.rotation.x = Math.PI / 2; scene.add(edge);
  scene.add(floorShadow(THREE, 5.4, 2.4, 0.75));
  const key = new THREE.DirectionalLight('#fff', 1.6); key.position.set(3, 6, 4); scene.add(key);
  const sweep = new THREE.PointLight('#ffffff', 0, 9); scene.add(sweep);
  camera.position.set(4.7, 2.0, 5.3); camera.lookAt(0, 0.45, 0);

  const target = { color: new THREE.Color(PAINTS.copper), rim: new THREE.Color('#1b1d22'), rough: 0.38, lights: 1 };
  let flash = 0, yaw = -0.5, spin = 0, drag = null;
  box.addEventListener('vanta:paint', e => { target.color.set(PAINTS[e.detail]); flash = 1; });
  box.addEventListener('vanta:rims', e => { const p = e.detail === 'polished'; target.rim.set(p ? '#d4d8de' : '#1b1d22'); target.rough = p ? 0.16 : 0.38; flash = 0.6; });
  box.addEventListener('vanta:lights', e => { target.lights = e.detail ? 1 : 0; });
  box.addEventListener('pointerdown', e => { drag = e.clientX; box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e => { if (drag === null) return; spin += (e.clientX - drag) * 0.008; drag = e.clientX; });
  box.addEventListener('pointerup', () => { drag = null; });
  box.addEventListener('pointercancel', () => { drag = null; });

  const front = mats.front.color.clone(), rear = mats.rear.color.clone(), off = new THREE.Color('#202630');
  let lit = 1;
  return ({ t, dt, pointer }) => {
    const k = still ? 1 : 1 - Math.exp(-dt * 5);
    mats.paint.color.lerp(target.color, k);
    mats.rim.color.lerp(target.rim, k); mats.rim.roughness += (target.rough - mats.rim.roughness) * k;
    lit += (target.lights - lit) * k;
    mats.front.color.copy(off).lerp(front, lit); mats.rear.color.copy(off).lerp(rear, lit);
    if (!still) yaw += dt * 0.12;
    const r = yaw + spin + pointer.x * 0.5;
    car.rotation.y = r; turntable.rotation.y = r;
    camera.position.y = 2.0 - pointer.y * 0.5; camera.lookAt(0, 0.45, 0);
    // a light sweeps across the paint after every change
    flash = Math.max(0, flash - dt * 0.8);
    sweep.intensity = Math.sin(flash * Math.PI) * 40;
    sweep.position.set(3 - flash * 6, 2.2, 2.4);
  };
}, { fov: 30 });
