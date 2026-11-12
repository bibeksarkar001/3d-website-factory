import { stage } from '../stage.js';
import { buildSpeaker, floorShadow } from './speaker.js';

// Inside: as the visitor scrolls the 320vh track, the speaker opens into its five layers and the labels arrive.
const track = document.querySelector('#inside');
const labels = [...track.querySelectorAll('[data-at]')];
stage(document.querySelector('#inside-speaker'), ({ THREE, scene, camera }) => {
  const sp = buildSpeaker(THREE); scene.add(sp);
  const sh = floorShadow(THREE, 3.6, 0.22); sh.position.y = -1.2; scene.add(sh);
  camera.position.set(0, 1.1, 10); camera.lookAt(0, 0, 0);
  const parts = Object.values(sp.userData.parts);
  return ({ scroll, pointer }) => {
    const k = Math.min(1, Math.max(0, (scroll - 0.12) / 0.62));      // rests at both ends
    const e = k * k * (3 - 2 * k);
    parts.forEach(p => { p.position.y = p.userData.rest + p.userData.out * e; });
    sh.position.y = -1.2 - 1.07 * e;
    sp.rotation.y = -0.6 + e * 0.9 + pointer.x * 0.15;
    sp.rotation.x = 0.12 + e * 0.1;
    labels.forEach(l => l.classList.toggle('on', e >= +l.dataset.at));
  };
}, { track });
