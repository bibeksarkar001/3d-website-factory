// Sculptor: how.html. Four sources as clouds of light, each streaming points into one amber ring (the sieve).
import { stage, THREE } from '../stage.js';

const box = document.querySelector('#constellation');
stage(box, ({ scene, camera, still }) => {
  camera.position.set(0, 0, 9);
  const dot = (() => { // soft round sprite
    const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 }), g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const mat = (color, size) => new THREE.PointsMaterial({ color, size, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const world = new THREE.Group(); world.scale.setScalar(.7); scene.add(world);

  const nodes = [[-2.3, 1.4, 0], [2.2, 1.6, -1], [-2.1, -1.5, -.5], [2.4, -1.3, .5]].map(v => new THREE.Vector3(...v));
  nodes.forEach(n => { // each source: a small cloud
    const a = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random()) * .38).add(n); a.set([v.x, v.y, v.z], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    world.add(new THREE.Points(g, mat('#a8d4ff', .08)));
  });
  // the sieve: a ring of amber points
  const ring = new Float32Array(1400 * 3);
  for (let i = 0; i < 1400; i++) { const t = Math.random() * Math.PI * 2, r = 1.05 + (Math.random() - .5) * .14; ring.set([Math.cos(t) * r, Math.sin(t) * r, (Math.random() - .5) * .14], i * 3); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(ring, 3));
  const sieve = new THREE.Points(rg, mat('#ffb547', .08)); world.add(sieve);
  // the streams: points travel from a source along a curve into the ring
  const S = 1600, sp = new Float32Array(S * 3), life = Float32Array.from({ length: S }, Math.random);
  const curves = nodes.map(n => new THREE.QuadraticBezierCurve3(n, new THREE.Vector3(n.x * .15, n.y * 1.3, 2), new THREE.Vector3()));
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  world.add(new THREE.Points(sg, mat('#eef2ff', .06)));
  const v = new THREE.Vector3();
  const place = () => {
    for (let i = 0; i < S; i++) { curves[i % 4].getPoint(life[i], v); v.x += Math.sin(i) * .22 * (1 - life[i]); v.y += Math.cos(i * 1.7) * .22 * (1 - life[i]); sp.set([v.x, v.y, v.z], i * 3); }
    sg.attributes.position.needsUpdate = true;
  };
  place();
  return ({ t, dt, pointer, scroll }) => {
    const speed = still ? 0 : .12 + scroll * .25;
    for (let i = 0; i < S; i++) life[i] = (life[i] + dt * speed * (.6 + (i % 7) * .1)) % 1;
    place();
    sieve.rotation.z = t * .15;
    world.rotation.y = pointer.x * .35; world.rotation.x = -pointer.y * .2;
    camera.position.z = 9 - scroll * 1.5;
  };
});
