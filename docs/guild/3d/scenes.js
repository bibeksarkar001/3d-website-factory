import { stage } from '../stage.js';
import { buildGlobe, faceLon, toVec } from './globe.js';

const ease = x => (x = Math.min(1, Math.max(0, x)), x * x * (3 - 2 * x));
export const ZONES = [{ lon: -74, lat: 40.7 }, { lon: -0.1, lat: 51.5 }, { lon: 103.8, lat: 1.35 }];

// Cover: the globe sits over the masthead, a few members already glowing. Turns to the cursor, spins away on scroll.
const cover = document.querySelector('#cover-globe');
if (cover) stage(cover, ({ THREE, scene, camera, still }) => {
  const g = buildGlobe(THREE); scene.add(g);
  g.userData.setFill(0.28);
  g.rotation.set(0.38, faceLon(-20), 0);
  camera.position.z = 3.9;
  if (still) return;
  return ({ t, pointer, scroll }) => {
    g.rotation.y = faceLon(-20) + t * 0.05 + pointer.x * 0.35 + scroll * 1.2;
    g.rotation.x = 0.38 - pointer.y * 0.18;
  };
});

// The map: through a 280vh track the globe fills with members, then arcs draw between them.
const mapTrack = document.querySelector('#map');
const mapBox = document.querySelector('#map-globe');
if (mapBox) stage(mapBox, ({ THREE, scene, camera, still }) => {
  const g = buildGlobe(THREE, { arcs: 34 }); scene.add(g);
  g.rotation.x = 0.32;
  const draw = (s, px = 0, py = 0) => {
    g.userData.setFill(ease((s - 0.08) / 0.55));
    g.userData.setArcs(ease((s - 0.58) / 0.32));
    g.rotation.y = faceLon(-60) + s * 2.4 + px * 0.25;
    g.rotation.x = 0.32 - py * 0.12;
    camera.position.z = 5.6 - ease(s / 0.6) * 0.6;
  };
  if (still) { draw(1); return; }
  return ({ scroll, pointer }) => draw(scroll, pointer.x, pointer.y);
}, { track: mapTrack });

// The picker (and nights.html): turns to the chosen build-night city and rings it.
document.querySelectorAll('.zone-globe').forEach(box => stage(box, ({ THREE, scene, camera, still }) => {
  const g = buildGlobe(THREE, { arcs: 0 }); scene.add(g);
  g.userData.setFill(1);
  const rings = ZONES.map(z => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 48), new THREE.MeshBasicMaterial({ color: '#f2b84b', transparent: true, side: THREE.DoubleSide }));
    const v = toVec(THREE, z.lon, z.lat, 1.015); r.position.copy(v); r.lookAt(v.clone().multiplyScalar(2)); g.add(r); return r;
  });
  camera.position.z = 4.4;
  let pick = +(box.dataset.zone || 1), ry = faceLon(ZONES[pick].lon), rx = ZONES[pick].lat * Math.PI / 180;
  document.addEventListener('guild:zone', e => { pick = e.detail; });
  const pose = (t, px, py) => {
    const z = ZONES[pick];
    ry += (faceLon(z.lon) - ry) * 0.06; rx += (z.lat * Math.PI / 180 * 0.8 - rx) * 0.06;
    g.rotation.set(rx - py * 0.15, ry + px * 0.3, 0, 'XYZ');
    rings.forEach((r, i) => { const on = i === pick; const s = on ? 1 + (t * 0.8 % 1) * 1.6 : 0.8; r.scale.setScalar(s); r.material.opacity = on ? 1 - (t * 0.8 % 1) * 0.8 : 0.35; });
  };
  pose(0, 0, 0); ry = faceLon(ZONES[pick].lon);
  if (still) { for (let i = 0; i < 200; i++) pose(0.3, 0, 0); return; }
  return ({ t, pointer }) => pose(t, pointer.x, pointer.y);
}));
