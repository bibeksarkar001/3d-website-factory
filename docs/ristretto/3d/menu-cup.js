import { stage } from '../stage.js';
import { buildCup, lightRoom } from './cup.js';

// Menu: hover or focus a drink and the cup shows it. The fill, the crema and the milk ease to the new drink.
const DRINKS = { espresso: [1, 1, 0], ristretto: [0.68, 1, 0], macchiato: [1, 1, 1], cortado: [1, 0.8, 2.2] };
let want = DRINKS.espresso;
document.querySelectorAll('[data-drink]').forEach(el => {
  const pick = () => { want = DRINKS[el.dataset.drink]; };
  el.addEventListener('pointerenter', pick); el.addEventListener('focusin', pick);
});
stage(document.querySelector('#menu-cup'), ({ THREE, scene, camera, renderer, still }) => {
  const c = buildCup(THREE); scene.add(c.root);
  const { key } = lightRoom(THREE, scene, renderer);
  const now = [...want];
  const pose = (t, pointer) => {
    for (let i = 0; i < 3; i++) now[i] += (want[i] - now[i]) * (still ? 1 : 0.08);
    c.fill(now[0], now[1], now[2]); c.pour(0, 0, t); c.steam(0.7, t);
    camera.position.set(pointer.x * 0.4, 3.2 + pointer.y * 0.3, camera.aspect < 1 ? 4.6 : 3.6); camera.lookAt(0, 0.45, 0);
    c.cup.rotation.y = -0.7 + pointer.x * 0.4 + Math.sin(t * 0.5) * 0.05;
    key.position.set(-3 + pointer.x * 4, 5 + pointer.y, 3);
  };
  if (still) return () => pose(0, { x: 0, y: 0 });
  return ({ t, pointer }) => pose(t, pointer);
}, { fov: 32 });
