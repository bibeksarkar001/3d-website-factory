import { stage } from '../stage.js';
import { buildSpeaker, floorShadow } from './speaker.js';

// Hero: the speaker turns slowly and tilts toward the cursor.
stage(document.querySelector('#hero-speaker'), ({ THREE, scene, camera, still }) => {
  const sp = buildSpeaker(THREE); scene.add(sp);
  const sh = floorShadow(THREE); sh.position.y = -1.2; scene.add(sh);
  camera.position.set(0, 0.8, 6.6); camera.lookAt(0, -0.1, 0);
  sp.rotation.set(0.05, 0.5, 0);
  if (still) return;
  return ({ t, pointer }) => {
    sp.rotation.y = 0.5 + t * 0.12 + pointer.x * 0.35;
    sp.rotation.x = 0.05 - pointer.y * 0.12;
    sp.rotation.z = -pointer.x * 0.05;
  };
});
