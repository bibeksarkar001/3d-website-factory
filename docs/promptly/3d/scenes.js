import { stage } from '../stage.js';
import { buildCast, lookPoint } from './cast.js';

// shared: frame the cast for any box shape, eyes follow the cursor, a click on a coach makes it hop
function castStage(box, { who, gap, width = 6.6, lift = 0.75, track, setup }) {
  stage(box, ({ THREE, scene, camera, still }) => {
    const cast = buildCast(THREE, who, gap); scene.add(cast.group);
    const look = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const frame = () => { // fit the whole cast across the box, whatever its aspect
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const z = Math.max(width / (2 * tan * camera.aspect), 2.4 / (2 * tan) + 2);
      camera.position.set(0, lift + z * 0.12, z); camera.lookAt(0, lift, 0);
    };
    box.addEventListener('click', e => {
      const r = box.getBoundingClientRect();
      ndc.set((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(cast.group.children, true)[0];
      if (!hit) return;
      let o = hit.object; while (o.parent !== cast.group) o = o.parent;
      cast.jump(cast.chars.indexOf(o), { spin: 1 });
    });
    const ctl = setup?.(cast) || {};
    frame();
    if (still) { ctl.still?.(); cast.update({ t: 0.3, dt: 1, look: lookPoint(THREE, camera, { x: 0, y: 0 }, look), cheer: ctl.stillCheer || 0 }); return; }
    return ({ t, dt, pointer, scroll }) => {
      frame();
      const extra = ctl.frame?.({ t, dt, scroll, pointer }) || {};
      cast.group.rotation.y = pointer.x * 0.18;
      cast.update({ t, dt, look: lookPoint(THREE, camera, pointer, look), cheer: extra.cheer || 0 });
    };
  }, { track });
}

// Hero: everyone waves hello in turn, then someone waves now and then.
const hero = document.querySelector('#cast-hero');
if (hero) castStage(hero, { who: [0, 1, 2, 3], gap: 1.62, setup: cast => {
  let next = 0.6, k = 0;
  return {
    still: () => cast.chars[0].userData.wave = 1,
    frame: ({ t }) => { if (t > next) { cast.wave(k % 4, 1.6); k++; next = t + (k < 4 ? 0.45 : 5); } },
  };
} });

// Your week: one hop per new streak day as you scroll, a spinning celebration at day 7; a tap on the streak sends promptly:streak.
const week = document.querySelector('#cast-week');
if (week) castStage(week, { who: [0, 1, 2, 3], gap: 1.5, width: 6.2, track: document.querySelector('#week'), setup: cast => {
  let day = 0, party = 0;
  document.addEventListener('promptly:streak', () => { cast.chars.forEach((_, k) => cast.jump(k, { spin: 1, delay: k * 0.08, high: 0.7 })); party = 1.6; });
  return {
    stillCheer: 0.6,
    frame: ({ dt, scroll }) => {
      const d = Math.max(0, Math.min(7, Math.floor((scroll - 0.08) / 0.7 * 7) + 1));
      if (d > day) {
        if (d === 7) { cast.chars.forEach((_, k) => cast.jump(k, { spin: 1, delay: k * 0.1, high: 0.75 })); party = 2.2; }
        else cast.jump((d - 1) % 4, { high: 0.5 });
      }
      day = scroll < 0.08 ? 0 : d;
      party = Math.max(0, party - dt);
      return { cheer: Math.min(1, party) };
    },
  };
} });

// Start: the picked coach steps forward; when the form is sent, everyone cheers.
const start = document.querySelector('#cast-start');
if (start) castStage(start, { who: [0, 1, 2, 3], gap: 1.45, width: 6, setup: cast => {
  let pick = +(start.dataset.pick || 0), cheer = 0, cheering = false;
  document.addEventListener('promptly:coach', e => { pick = e.detail; cast.jump(pick, { high: 0.55 }); cast.wave(pick, 1.8); });
  document.addEventListener('promptly:cheer', () => { cheering = true; cast.chars.forEach((_, k) => cast.jump(k, { spin: 1, delay: k * 0.09, high: 0.8 })); });
  const place = (k = 1) => cast.chars.forEach((c, i) => {
    const on = i === pick;
    c.position.z += ((on ? 0.9 : -0.2) - c.position.z) * k;
    const s = on ? 1.16 : 0.92; c.scale.setScalar(c.scale.x + (s - c.scale.x) * k);
  });
  return {
    still: () => place(1),
    frame: ({ dt }) => { place(Math.min(1, dt * 6)); cheer += ((cheering ? 1 : 0) - cheer) * Math.min(1, dt * 3); return { cheer }; },
  };
} });

// Extra pages: one coach alone.
document.querySelectorAll('.cast-solo').forEach(box => castStage(box, { who: [+box.dataset.who], gap: 0, width: 2.6, lift: 0.7, setup: cast => {
  let next = 1;
  return { frame: ({ t }) => { if (t > next) { cast.wave(0, 1.6); next = t + 6; } } };
} }));
