import { stage } from '../stage.js';
import { buildCup, lightRoom, GLAZES } from './cup.js';

// Pull one yourself: the visitor holds the button (motion.js sets window.shot), the stream runs and the cup fills live.
// The glaze buttons change the cup's colour.
const box = document.querySelector('#pull-cup');
stage(box, ({ THREE, scene, camera, renderer, still }) => {
  const c = buildCup(THREE); scene.add(c.root);
  const { key } = lightRoom(THREE, scene, renderer);
  camera.position.set(0, 1.9, 4.3); camera.lookAt(0, 0.75, 0);
  document.querySelectorAll('[data-glaze]').forEach(b => b.addEventListener('click', () => c.glaze(GLAZES[b.dataset.glaze])));
  let head = 4, top = 4, tilt = 0, was = false;
  return ({ t, dt, pointer }) => {
    camera.position.set(0, 1.9, camera.aspect < 1 ? 5.4 : 4.3); camera.lookAt(0, 0.75, 0);
    const s = window.shot || { level: still ? 1 : 0, pouring: false };
    c.fill(Math.min(1, s.level), Math.min(1, s.level * 1.4));
    // the head falls while pouring; when released the tail falls after it
    if (s.pouring && !was) head = top = 4;
    was = s.pouring;
    if (s.pouring) { head = Math.max(c.surface, head - dt * 14); top = 4; }
    else { top = Math.max(c.surface, top - dt * 14); head = Math.max(head, c.surface); }
    c.pour(Math.max(head, c.surface - 0.02), top, t);
    c.fade = 3.6;
    c.steam(s.level > 0.6 && !s.pouring ? 1 : 0, t);
    tilt += (pointer.x * 0.5 - tilt) * 0.08;
    c.cup.rotation.y = -0.6 + tilt + Math.sin(t * 0.5) * 0.04;
    key.position.set(-3 + pointer.x * 4, 5 + pointer.y, 3);
  };
}, { fov: 32 });
