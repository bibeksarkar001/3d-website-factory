// Tech page: the sole unit alone (no upper, no cage), seen from below and the side. Drag to turn; it leans to the cursor
// and opens slightly as the page scrolls past.
import { stage } from '../stage.js';
import { buildShoe, floorShadow } from './shoe.js';

const box = document.querySelector('#sole');
stage(box, ({ scene, camera, still }) => {
  const shoe = buildShoe(); scene.add(shoe);
  const { upper, cage } = shoe.userData.layers; upper.visible = cage.visible = false;
  const sh = floorShadow(3.6, 0.3); sh.position.y = -0.9; scene.add(sh);
  const sole = shoe.userData.order.slice(2);
  camera.position.set(0, 1.4, 6); camera.lookAt(0, -0.3, 0);
  let spin = -0.5, vel = 0, drag = null;
  box.style.touchAction = 'pan-y';
  box.addEventListener('pointerdown', e => { drag = e.clientX; box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e => { if (drag === null) return; vel = (e.clientX - drag) * 0.01; spin += vel; drag = e.clientX; });
  box.addEventListener('pointerup', () => { drag = null; });
  const pose = (open, t = 0, px = 0, py = 0) => {
    sole.forEach((l, i) => { l.position.y = (1.5 - i) * 0.22 * open; });
    shoe.rotation.set(0.45 - py * 0.2, spin + px * 0.4, Math.sin(t * 0.8) * 0.04);
  };
  if (still) return pose(1);
  return ({ t, dt, pointer, scroll }) => {
    if (drag === null) { spin += vel + dt * 0.1; vel *= 0.94; }
    pose(Math.min(1, Math.max(0, (scroll - 0.25) / 0.3)), t, pointer.x, pointer.y);
  };
});
