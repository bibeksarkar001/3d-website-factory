// Animator + sculptor: the Stride story. One shoe on one stage, pinned across a 720vh track, five chapters:
// float (hero) → impact (it lands, rings spread) → six layers split off one by one → the stack, side on → it rolls heel to toe.
import { stage, THREE } from '../stage.js';
import { buildShoe, floorShadow } from './shoe.js';

const track = document.querySelector('#story');
const chaps = [...track.querySelectorAll('.chap')];
const items = [...track.querySelectorAll('.index li')];
const bars = [...track.querySelectorAll('.progress i')];
const cue = track.querySelector('.scrollcue');
const huge = track.querySelector('.huge');
const nums = [...track.querySelectorAll('[data-n]')];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a, b, p) => { const k = clamp((p - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (a, b, t) => a + (b - a) * t;
const phone = () => innerWidth < 820;

stage(document.querySelector('#story-shoe'), ({ scene, camera, still }) => {
  const shoe = buildShoe(); scene.add(shoe);
  const shadow = floorShadow(3.8, 0.34); scene.add(shadow);
  const layers = shoe.userData.order;

  // impact rings on the ground, and speed streaks for the roll
  const ringMat = new THREE.MeshBasicMaterial({ color: '#2443d6', transparent: true, opacity: 0, depthWrite: false });
  const rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 96), ringMat.clone()); r.rotation.x = -Math.PI / 2; scene.add(r); return r; });
  const streakMat = new THREE.MeshBasicMaterial({ color: '#0f1a0d', transparent: true, opacity: 0, depthWrite: false });
  const streaks = Array.from({ length: 14 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.012), streakMat);
    m.userData = { y: -0.6 + (i * 0.37) % 1.4, z: -0.6 + (i * 0.53) % 1.2, len: 0.6 + (i * 0.29) % 0.9, sp: 1 + (i * 0.41) % 1.2 };
    scene.add(m); return m;
  });

  let lastChap = -1;
  const draw = (p, t, pointer) => {
    const ph = phone();
    // chapter windows
    const ex = sm(0.31, 0.62, p) - sm(0.66, 0.72, p);          // exploded amount, back together for the stack chapter
    const side = sm(0.66, 0.74, p);                            // turn side-on for the stack
    const roll = sm(0.84, 0.99, p);
    const land = sm(0.13, 0.22, p) - sm(0.27, 0.33, p);        // dropped onto the ground

    // the pose: hero three-quarter → side-on landing → three-quarter exploded → side-on stack → rolling
    const hx = ph ? 0 : 0.95;
    shoe.position.x = mix(hx, ph ? 0 : 0.85, sm(0.13, 0.2, p)) + (ph ? 0 : -0.15 * side) + roll * (ph ? 0 : 0.1);
    shoe.position.y = (ph ? -0.55 : 0) + Math.sin(t * 1.3) * 0.06 * (1 - land) - 0.32 * land - 0.1 * side * (1 - roll) - 0.5 * ex;
    shoe.rotation.y = mix(-0.55, -0.08, sm(0.13, 0.2, p)) + mix(0, -0.42, sm(0.29, 0.36, p)) + 0.5 * side - 0.0 * roll + pointer.x * 0.35;
    shoe.rotation.x = mix(0.22, 0.05, sm(0.13, 0.2, p)) + 0.22 * ex - 0.1 * side - pointer.y * 0.15;
    // the roll: heel strike (toe up) → flat → toe off (heel up), twice over the chapter
    const ph2 = roll * 2 % 1, rock = roll > 0 && roll < 1 ? Math.sin(ph2 * Math.PI * 2) * 0.16 : 0;
    shoe.rotation.z = mix(0.1, 0, sm(0.13, 0.2, p)) + 0.06 * (1 - land) * Math.sin(t * 0.9) * (1 - roll) + rock;
    const s = ph ? 0.78 : 1; shoe.scale.setScalar(s);

    // layers come apart one at a time, top first
    layers.forEach((l, i) => {
      const k = sm(0.33 + i * 0.05, 0.42 + i * 0.05, p) * (1 - sm(0.66, 0.72, p));
      l.position.y = l.userData.out * k;
      l.position.z = 0;
    });

    // camera: pulls back for the explosion, leans in on the heel for the stack
    camera.position.set(mix(0, -0.5, side * (1 - roll)) * (ph ? 0.3 : 1), mix(0.9, 1.5, ex), mix(6.4, 9.6, ex) - 0.5 * side * (1 - roll) + (ph ? 2.4 : 0));
    camera.lookAt(mix(0, -0.5, side * (1 - roll)) * (ph ? 0.3 : 1), ph ? -0.3 : 0.05, 0);

    shadow.position.set(shoe.position.x, -0.62 * s + (ph ? -0.55 : 0) - 0.95 * ex * s - 0.5 * ex, 0);
    shadow.material.opacity = 1 - 0.5 * ex;

    // impact rings
    const ringK = sm(0.2, 0.3, p);
    rings.forEach((r, i) => {
      const k = clamp(ringK * 1.6 - i * 0.3);
      r.position.set(shoe.position.x, shadow.position.y + 0.01, 0);
      r.scale.setScalar(0.6 + k * 2.4);
      r.material.opacity = k > 0 && k < 1 ? (1 - k) * 0.7 : 0;
    });
    // speed streaks while rolling
    streaks.forEach(m => {
      const u = m.userData, x = 3 - ((t * u.sp * 2.4 + u.len * 7) % 7);
      m.position.set(x, u.y, u.z); m.scale.x = u.len;
      m.material.opacity = 0.5 * Math.sin(roll * Math.PI);
    });

    // the HTML layers: chapters, the layer index, counters, progress
    let on = -1;
    chaps.forEach((c, i) => { const a = +c.dataset.from, b = +c.dataset.to, v = p >= a && p < b; c.classList.toggle('on', v); if (v) on = i; });
    if (on !== lastChap) { lastChap = on; }
    let now = -1;
    items.forEach((li, i) => { const v = p >= +li.dataset.at; li.classList.toggle('on', v); if (v) now = i; });
    items.forEach((li, i) => li.classList.toggle('now', i === now));
    nums.forEach(n => {
      const to = +n.dataset.n, dec = to % 1 ? 1 : 0;
      const k = n.closest('.stat') ? sm(0.17, 0.26, p) : sm(0.7, 0.8, p);
      n.textContent = (to * k).toFixed(dec) + (n.closest('.stat') ? '×' : '');
    });
    const cuts = [0, 0.14, 0.3, 0.67, 0.84, 1];
    bars.forEach((b, i) => b.style.setProperty('--k', clamp((p - cuts[i]) / (cuts[i + 1] - cuts[i]))));
    cue.style.opacity = p < 0.03 ? 1 : 0;
    huge.style.transform = `translate(calc(-50% + ${-p * 30}vw), -50%)`;
    huge.style.opacity = 1 - sm(0.12, 0.2, p) + sm(0.84, 0.95, p);
  };

  if (still) { // reduced motion: the exploded view, side by side with every chapter in the page flow
    shoe.rotation.set(0.25, -0.45, 0); layers.forEach(l => { l.position.y = l.userData.out; });
    camera.position.set(0, 1.6, 8.6); camera.lookAt(0, 0.05, 0); shadow.position.y = -1.6;
    nums.forEach(n => { n.textContent = n.dataset.n + (n.closest('.stat') ? '×' : ''); });
    items.forEach(li => li.classList.add('on'));
    return;
  }
  return ({ t, scroll, pointer }) => draw(scroll, t, pointer);
}, { track, fov: 32 });
