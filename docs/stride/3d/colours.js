// The colourway picker: the swatches repaint the 3D shoe live. Drag the shoe to turn it; it leans toward the cursor.
import { stage } from '../stage.js';
import { buildShoe, floorShadow } from './shoe.js';

const sec = document.querySelector('#colours'), box = document.querySelector('#colour-shoe');
const lines = { cobalt: 'Cobalt knit, chalk cage, coral pod. The one you see first.',
  coral: 'Coral knit, black cage, cobalt pod. Easy to spot at the start line.',
  chalk: 'Chalk knit, coral cage, black pod. Quiet until it moves.' };
const btns = [...sec.querySelectorAll('.swatches button')];

stage(box, ({ scene, camera, still }) => {
  const shoe = buildShoe(); scene.add(shoe);
  const sh = floorShadow(4, 0.4, '0,0,0'); sh.position.y = -0.66; scene.add(sh);
  camera.position.set(0, 1.0, 6.4); camera.lookAt(0, 0, 0);
  let spin = -0.6, vel = 0, drag = null, hop = 0;

  const pick = c => {
    shoe.userData.paint(c); sec.dataset.c = c;
    btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.c === c));
    document.querySelector('#cw-line').textContent = lines[c];
    document.querySelector('#cw-name').textContent = c[0].toUpperCase() + c.slice(1);
    hop = 1; if (still) dispatchEvent(new Event('scroll')); // reduced motion renders on scroll only
  };
  btns.forEach(b => b.addEventListener('click', () => pick(b.dataset.c)));

  box.style.touchAction = 'pan-y'; box.style.cursor = 'grab';
  box.addEventListener('pointerdown', e => { drag = e.clientX; box.setPointerCapture(e.pointerId); box.style.cursor = 'grabbing'; });
  box.addEventListener('pointermove', e => { if (drag === null) return; vel = (e.clientX - drag) * 0.01; spin += vel; drag = e.clientX; });
  const up = () => { drag = null; box.style.cursor = 'grab'; };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);

  shoe.rotation.set(0.15, spin, 0.05);
  if (still) return;
  return ({ t, dt, pointer }) => {
    if (drag === null) { spin += vel; vel *= 0.94; spin += dt * 0.12; }
    hop = Math.max(0, hop - dt * 1.8);
    shoe.rotation.y = spin + pointer.x * 0.3;
    shoe.rotation.x = 0.15 - pointer.y * 0.12;
    shoe.position.y = Math.sin(t * 1.2) * 0.05 + Math.sin(hop * Math.PI) * 0.35;
    shoe.rotation.z = 0.05 + Math.sin(hop * Math.PI * 2) * 0.12;
    sh.material.opacity = 1 - shoe.position.y;
  };
});
