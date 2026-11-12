// Sculptor: the Guild dot globe. Land is a Fibonacci sphere of discs kept where a hand-written outline says land.
// Members are glowing points revealed by setFill(0..1); arcs between members draw with setArcs(0..1).

// Coarse continent outlines, [lon, lat]. Good enough at the dot spacing used; written by hand.
const LAND = [
  [[-168,66],[-162,70],[-156,71],[-140,70],[-128,70],[-115,68],[-95,72],[-82,73],[-80,63],[-90,57],[-82,52],[-78,57],[-77,62],[-65,60],[-60,55],[-56,52],[-66,45],[-70,42],[-76,38],[-76,35],[-81,31],[-80,25],[-82,27],[-85,30],[-90,29],[-97,27],[-97,22],[-92,18],[-87,21],[-88,15],[-83,10],[-79,8],[-80,7],[-86,12],[-92,14],[-105,20],[-110,24],[-112,30],[-115,30],[-110,23],[-117,32],[-121,35],[-124,40],[-124,48],[-130,54],[-137,58],[-147,60],[-155,58],[-160,56],[-165,60],[-166,64]],
  [[-73,78],[-60,82],[-30,83],[-20,80],[-20,70],[-30,68],[-42,60],[-50,64],[-55,70],[-65,76]],
  [[-80,9],[-75,11],[-62,10],[-52,5],[-50,0],[-44,-2],[-35,-6],[-38,-13],[-40,-21],[-48,-26],[-53,-34],[-58,-38],[-63,-41],[-65,-46],[-68,-52],[-72,-54],[-75,-50],[-74,-42],[-73,-30],[-71,-18],[-76,-14],[-81,-6],[-80,0],[-77,4]],
  [[-10,36],[-9,43],[-2,44],[-4,48],[2,51],[8,54],[8,57],[5,62],[10,64],[15,68],[22,70],[30,70],[40,67],[44,68],[55,68],[60,70],[70,73],[80,73],[90,76],[105,78],[115,74],[130,72],[140,72],[150,71],[160,70],[170,70],[180,68],[180,65],[175,62],[163,60],[160,54],[156,51],[155,57],[143,59],[137,54],[141,48],[135,43],[130,42],[127,38],[126,35],[121,31],[122,28],[117,23],[110,21],[108,18],[106,11],[103,9],[100,13],[100,7],[103,2],[98,8],[98,16],[94,17],[92,22],[87,21],[80,15],[78,8],[73,17],[72,21],[67,24],[58,25],[57,23],[59,22],[52,16],[44,12],[43,15],[39,22],[35,28],[33,30],[35,36],[27,36],[26,40],[23,38],[22,36],[20,40],[18,42],[14,45],[13,41],[16,38],[12,38],[9,44],[3,43],[-1,37],[-6,36]],
  [[-17,21],[-16,28],[-9,32],[-6,36],[0,36],[10,37],[11,33],[20,31],[25,32],[32,31],[34,28],[38,18],[43,12],[51,12],[50,8],[45,2],[40,-3],[39,-8],[40,-15],[35,-22],[33,-27],[27,-34],[20,-35],[18,-32],[14,-22],[12,-14],[13,-6],[9,-1],[9,4],[5,6],[-2,5],[-8,4],[-13,8],[-17,13]],
  [[114,-22],[114,-34],[118,-35],[124,-33],[131,-31],[135,-35],[139,-36],[146,-39],[150,-37],[153,-31],[153,-25],[146,-19],[142,-11],[141,-17],[136,-12],[130,-12],[126,-14],[122,-18]],
  [[44,-25],[47,-25],[50,-16],[49,-12],[44,-17]],
  [[-5,50],[1,51],[1,53],[-2,56],[-3,58],[-6,58],[-5,55],[-3,54]],
  [[-10,52],[-6,52],[-6,55],[-10,54]],
  [[130,31],[135,34],[140,35],[141,40],[142,45],[145,44],[141,41],[140,37],[133,33]],
  [[109,1],[117,7],[119,5],[117,-1],[116,-4],[110,-3]],
  [[95,5],[98,4],[106,-6],[102,-4]],
  [[106,-6],[115,-8],[114,-9],[106,-7]],
  [[131,-1],[141,-3],[150,-10],[141,-9],[137,-5]],
  [[120,18],[122,18],[126,7],[122,7]],
  [[172,-34],[178,-38],[174,-41],[168,-47],[166,-45],[172,-40]],
  [[-24,64],[-14,64],[-14,66],[-22,66]],
  [[80,6],[82,7],[81,10],[79,9]],
  [[-85,22],[-74,20],[-74,21],[-84,23]],
];
const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
  const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
export const isLand = (lon, lat) => lat < -70 || LAND.some(p => inPoly(lon, lat, p));

// lon/lat (degrees) -> unit vector, with lon 0 facing +z
export const toVec = (THREE, lon, lat, r = 1) => {
  const a = lon * Math.PI / 180, b = lat * Math.PI / 180;
  return new THREE.Vector3(Math.cos(b) * Math.sin(a) * r, Math.sin(b) * r, Math.cos(b) * Math.cos(a) * r);
};

const glowTex = THREE => {
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 }), g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,240,205,1)'); r.addColorStop(0.18, 'rgba(242,184,75,.95)'); r.addColorStop(0.45, 'rgba(242,184,75,.25)'); r.addColorStop(1, 'rgba(242,184,75,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
};

export function buildGlobe(THREE, { dots = 18000, members = 700, arcs = 26, dotColor = '#d5dfec' } = {}) {
  const globe = new THREE.Group();
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // the body: matte navy, a touch lighter than the page so the edge reads
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.985, 96, 64),
    new THREE.MeshStandardMaterial({ color: '#19355f', roughness: 0.9, metalness: 0 })));

  // land dots: discs lying on the surface, so they foreshorten toward the edge like print
  const land = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < dots; i++) {
    const y = 1 - (i / (dots - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    const lat = Math.asin(v.y) * 180 / Math.PI, lon = Math.atan2(v.x, v.z) * 180 / Math.PI;
    if (isLand(lon, lat)) land.push({ v, lon, lat });
  }
  const disc = new THREE.CircleGeometry(0.0085, 8);
  const inst = new THREE.InstancedMesh(disc, new THREE.MeshBasicMaterial({ color: dotColor }), land.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), z = new THREE.Vector3(0, 0, 1), one = new THREE.Vector3(1, 1, 1);
  land.forEach((d, i) => { q.setFromUnitVectors(z, d.v); m.compose(d.v.clone().multiplyScalar(1.001), q, one); inst.setMatrixAt(i, m); });
  globe.add(inst);

  // members: a seeded pick of land dots, weighted away from the poles; revealed in this order
  const pool = land.filter(d => d.lat > -50 && d.lat < 66);
  const pick = [];
  while (pick.length < members) { const d = pool[Math.floor(rnd() * pool.length)]; if (rnd() < Math.cos(d.lat * Math.PI / 180)) pick.push(d); }
  const pos = new Float32Array(members * 3);
  pick.forEach((d, i) => d.v.clone().multiplyScalar(1.012).toArray(pos, i * 3));
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const memberPts = new THREE.Points(mg, new THREE.PointsMaterial({ map: glowTex(THREE), size: 0.11, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, color: '#ffffff' }));
  mg.setDrawRange(0, 0);
  globe.add(memberPts);

  // arcs: great-circle hops lifted off the surface, drawn by growing the draw range
  const arcLines = [];
  for (let i = 0, tries = 0; arcLines.length < arcs && tries < 2000; tries++) {
    const a = pick[Math.floor(rnd() * members)].v, b = pick[Math.floor(rnd() * members)].v;
    if (a.angleTo(b) < 0.35 || a.angleTo(b) > 1.1) continue;
    i++;
    const pts = [];
    for (let k = 0; k <= 48; k++) { const t = k / 48; pts.push(new THREE.Vector3().copy(a).lerp(b, t).normalize().multiplyScalar(1.01 + Math.sin(Math.PI * t) * 0.14 * a.angleTo(b))); }
    const g = new THREE.BufferGeometry().setFromPoints(pts); g.setDrawRange(0, 0);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#f2b84b', transparent: true, opacity: 0.75 }));
    line.userData.at = i / arcs; arcLines.push(line); globe.add(line);
  }

  // a thin cool rim of light around the edge
  const rim = new THREE.Mesh(new THREE.SphereGeometry(1.07, 64, 48), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 n; varying vec3 vp; void main(){ n = normalize(normalMatrix*normal); vec4 p = modelViewMatrix*vec4(position,1.); vp = normalize(-p.xyz); gl_Position = projectionMatrix*p; }',
    fragmentShader: 'varying vec3 n; varying vec3 vp; void main(){ float f = pow(clamp(1.0 + dot(n, vp) * 1.6, 0., 1.), 2.5); gl_FragColor = vec4(0.45,0.62,0.95,1.) * f * .7; }',
  }));
  globe.add(rim);

  const memberData = pick;
  globe.userData = {
    land, members: memberData,
    setFill(k) { mg.setDrawRange(0, Math.round(members * Math.min(1, Math.max(0, k)))); },
    setArcs(k) { arcLines.forEach(l => { const e = Math.min(1, Math.max(0, (k - l.userData.at * 0.7) / 0.3)); l.geometry.setDrawRange(0, Math.round(49 * e)); }); },
  };
  return globe;
}

// longitude so that a given lon faces the camera (+z)
export const faceLon = lon => -lon * Math.PI / 180;
