// Sculptor: the Orbit speaker, built from lathed profiles. Parts are separate meshes so they can come apart.
export function buildSpeaker(THREE) {
  const lathe = (pts, mat, seg = 96) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);

  // woven fabric: a tiny canvas pattern used as a bump map, repeated around the body
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 }), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 4) { g.fillStyle = i % 8 ? '#9a9a9a' : '#6a6a6a'; g.fillRect(0, i, 64, 2); g.fillRect(i, 0, 2, 64); }
  const weave = new THREE.CanvasTexture(c); weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(48, 24);

  const metal = new THREE.MeshStandardMaterial({ color: '#c7cbcf', metalness: 1, roughness: 0.32 });
  const fabric = new THREE.MeshStandardMaterial({ color: '#33373c', roughness: 1, bumpMap: weave, bumpScale: 1.2 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#16181a', roughness: 0.7 });
  const dome = new THREE.MeshPhysicalMaterial({ color: '#22252a', roughness: 0.25, clearcoat: 1 });
  const signal = new THREE.MeshStandardMaterial({ color: '#e2481d', roughness: 0.45, emissive: '#e2481d', emissiveIntensity: 0.15 });

  const parts = {};
  // base: a shallow aluminium dish with rounded rims
  parts.base = lathe([[0, -0.1], [0.92, -0.1], [0.98, -0.07], [1.0, 0], [0.98, 0.07], [0.9, 0.09], [0, 0.09]], metal);
  // woofer: cone facing down with a soft surround
  parts.woofer = new THREE.Group();
  parts.woofer.add(lathe([[0.08, -0.16], [0.62, 0.0], [0.7, 0.02], [0.76, 0.0], [0.8, 0.03], [0.8, 0.07], [0, 0.07]], rubber));
  parts.woofer.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), dome));
  parts.woofer.children[1].position.y = -0.12;
  // body: a gently barrelled fabric column
  const body = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; body.push([0.9 - Math.sin(t * Math.PI) * 0.02, -1.15 + t * 2.3]); } // tall, very slightly waisted
  parts.body = lathe([[0, -1.15], ...body, [0, 1.15]], fabric, 128);
  // tweeter ring: a dark band with six domes looking outward
  parts.tweeters = new THREE.Group();
  parts.tweeters.add(lathe([[0.86, -0.09], [0.9, -0.09], [0.9, 0.09], [0.86, 0.09], [0, 0.09], [0, -0.09]], rubber));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, d = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 12, 0, Math.PI), dome);
    d.position.set(Math.sin(a) * 0.885, 0, Math.cos(a) * 0.885); d.scale.z = 0.5; // nearly flush with the band d.rotation.y = a; parts.tweeters.add(d);
  }
  // top dial: aluminium cap with the orange ring
  parts.dial = new THREE.Group();
  parts.dial.add(lathe([[0, 0], [0.88, 0], [0.9, 0.03], [0.88, 0.07], [0, 0.08]], metal));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 16, 96), signal);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.085; parts.dial.add(ring);

  // rest positions (assembled) and how far each part travels when exploded
  const plan = { base: [-1.34, -1.3], woofer: [-1.17, -0.65], body: [0, 0], tweeters: [1.24, 0.65], dial: [1.33, 1.3] };
  const group = new THREE.Group();
  group.scale.setScalar(0.82); // the column is about 2.3 units tall; keep it inside the frame
  for (const [k, [rest, out]] of Object.entries(plan)) {
    const p = parts[k]; p.position.y = rest; p.userData = { rest, out }; group.add(p);
  }
  group.userData.parts = parts;
  return group;
}

// a soft floor shadow: a plane with a radial gradient
export function floorShadow(THREE, size = 3.2, alpha = 0.28) {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 }), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, `rgba(18,20,22,${alpha})`); grd.addColorStop(1, 'rgba(18,20,22,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}
