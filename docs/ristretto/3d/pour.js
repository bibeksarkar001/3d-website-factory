import { stage } from '../stage.js';
import { buildCup, lightRoom, shift } from './cup.js';

// The journey: as the visitor scrolls the 620vh track, the stream falls, the crema rises, the camera dives, then pulls back.
const track = document.querySelector('#journey');
const clamp = v => Math.min(1, Math.max(0, v)), ease = k => k * k * (3 - 2 * k);
const span = (p, a, b) => ease(clamp((p - a) / (b - a)));
// camera stops along the journey: [p, position, look-at]
const STOPS = [
  [0.00, [0, 2.2, 6.6], [0, 1.1, 0]],
  [0.30, [0, 2.0, 6.2], [0, 1.25, 0]],
  [0.52, [0.15, 2.4, 4.6], [0, 0.75, 0]],
  [0.70, [0.2, 3.7, 3.3], [0, 0.55, 0]],
  [0.82, [0.2, 3.7, 3.3], [0, 0.55, 0]],
  [1.00, [-1.9, 2.0, 5.4], [0, 0.7, 0]],
];
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
function cameraAt(p) {
  let i = 0; while (i < STOPS.length - 2 && p > STOPS[i + 1][0]) i++;
  const [p0, a0, l0] = STOPS[i], [p1, a1, l1] = STOPS[i + 1], k = ease(clamp((p - p0) / (p1 - p0)));
  return [lerp3(a0, a1, k), lerp3(l0, l1, k)];
}

stage(document.querySelector('#pour'), ({ THREE, scene, camera, renderer, still }) => {
  const c = buildCup(THREE); scene.add(c.root);
  const { key } = lightRoom(THREE, scene, renderer);
  const look = new THREE.Vector3();
  const pose = (p, t, pointer) => {
    const head = 4.4 - 4.4 * span(p, 0.12, 0.24);                     // the first drops fall
    const level = span(p, 0.22, 0.66), cream = span(p, 0.3, 0.7);
    c.fill(level, cream);
    const tailK = span(p, 0.62, 0.72);                                 // the stream stops: its tail falls
    const top = 7 - 7 * tailK;
    c.pour(Math.max(head, c.surface - 0.02), Math.max(top, c.surface), t, 1 - tailK * 0.4);
    c.fade = 4.4;
    c.steam(span(p, 0.8, 0.95), t);
    const [pos, at] = cameraAt(p);
    const far = camera.aspect < 1 ? 1.45 : 1;                         // phones: step back so the saucer fits
    camera.position.set(at[0] + (pos[0] - at[0]) * far + pointer.x * 0.25, at[1] + (pos[1] - at[1]) * far + pointer.y * 0.15, pos[2] * far);
    camera.lookAt(look.set(...at));
    shift(camera, renderer);
    c.cup.rotation.y = -0.5 + span(p, 0.8, 1) * 1.1 + pointer.x * 0.35 + Math.sin(t * 0.4) * 0.03;
    key.position.set(-3 + pointer.x * 4, 5 + pointer.y * 1.5, 3);
  };
  if (still) return () => pose(1, 2, { x: 0, y: 0 });
  return ({ t, scroll, pointer }) => pose(scroll, t, pointer);
}, { track, fov: 32 });
