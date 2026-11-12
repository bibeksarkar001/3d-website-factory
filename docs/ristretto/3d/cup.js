// Sculptor: the Ristretto demitasse, saucer, espresso, crema, the falling stream and steam. Built from lathes and a shader.
const V = (THREE, pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// inner wall of the cup: [height, radius], used to size the espresso surface at any fill level
const INNER = [[0.15, 0.0], [0.165, 0.2], [0.26, 0.33], [0.40, 0.41], [0.56, 0.455], [0.70, 0.47]];
const innerR = y => {
  for (let i = 1; i < INNER.length; i++) if (y <= INNER[i][0]) {
    const [y0, r0] = INNER[i - 1], [y1, r1] = INNER[i], k = (y - y0) / (y1 - y0);
    return r0 + (r1 - r0) * k;
  }
  return INNER.at(-1)[1];
};
export const LOW = 0.17, FULL = 0.62;

function cremaTexture(THREE) {
  const c = Object.assign(document.createElement('canvas'), { width: 512, height: 512 }), g = c.getContext('2d');
  const r = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  r.addColorStop(0, '#d29a5c'); r.addColorStop(0.55, '#b9783f'); r.addColorStop(0.86, '#8c4f25'); r.addColorStop(1, '#4a2210');
  g.fillStyle = r; g.fillRect(0, 0, 512, 512);
  // tiger stripes: soft dark arcs swirling round the centre
  g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, rr = 60 + Math.random() * 170;
    g.strokeStyle = `rgba(110,55,25,${0.12 + Math.random() * 0.18})`; g.lineWidth = 3 + Math.random() * 10;
    g.beginPath(); g.arc(256, 256, rr, a, a + 0.6 + Math.random() * 1.4); g.stroke();
  }
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 900; i++) { // fine bubbles
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 230;
    g.fillStyle = `rgba(255,225,180,${Math.random() * 0.18})`;
    g.beginPath(); g.arc(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr, Math.random() * 2.2, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function softDot(THREE, color = '255,240,220') {
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 }), g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, `rgba(${color},0.55)`); r.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export const GLAZES = { white: '#f3eee6', black: '#1d1716', terracotta: '#b9532f' };

export function buildCup(THREE) {
  const root = new THREE.Group();
  const ceramic = new THREE.MeshPhysicalMaterial({ color: GLAZES.white, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.2 });
  const unglazed = new THREE.MeshStandardMaterial({ color: '#d9cdbd', roughness: 0.9 });

  const cup = new THREE.Group(); root.add(cup);
  // outer wall up over the rim and down the inside, closed on the axis at both ends
  const profile = [[0, 0], [0.24, 0], [0.285, 0.015], [0.3, 0.055], [0.275, 0.09], [0.34, 0.15], [0.42, 0.26], [0.475, 0.4],
    [0.505, 0.55], [0.518, 0.68], [0.52, 0.735], [0.508, 0.758], [0.49, 0.756], [0.478, 0.735], [0.47, 0.70],
    [0.455, 0.56], [0.41, 0.40], [0.33, 0.26], [0.2, 0.165], [0, 0.15]];
  cup.add(new THREE.Mesh(new THREE.LatheGeometry(V(THREE, profile), 128), ceramic));
  const foot = new THREE.Mesh(new THREE.CircleGeometry(0.24, 64), unglazed); foot.rotation.x = Math.PI / 2; foot.position.y = 0.001; cup.add(foot);
  const handlePath = new THREE.CatmullRomCurve3([[0.44, 0.6, 0], [0.62, 0.64, 0], [0.75, 0.55, 0], [0.74, 0.4, 0], [0.62, 0.3, 0], [0.42, 0.3, 0]].map(p => new THREE.Vector3(...p)));
  const handle = new THREE.Mesh(new THREE.TubeGeometry(handlePath, 64, 0.042, 20), ceramic); handle.scale.z = 1.35; cup.add(handle);

  // espresso: a disc whose radius follows the inner wall, with the crema texture on top
  const crema = cremaTexture(THREE);
  const coffeeMat = new THREE.MeshPhysicalMaterial({ map: crema, color: '#3a1a0c', roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(1, 96), coffeeMat); coffee.rotation.x = -Math.PI / 2; cup.add(coffee);
  // milk spot for a macchiato
  const milk = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshPhysicalMaterial({ color: '#f6eadb', roughness: 0.5, transparent: true, opacity: 0 }));
  milk.rotation.x = -Math.PI / 2; cup.add(milk);

  const saucer = new THREE.Mesh(new THREE.LatheGeometry(V(THREE, [[0, 0.01], [0.42, 0], [0.46, 0.02], [0.44, 0.045], [0.62, 0.05],
    [0.95, 0.1], [1.08, 0.155], [1.12, 0.175], [1.105, 0.19], [1.0, 0.155], [0.62, 0.085], [0.34, 0.075], [0.31, 0.068], [0, 0.068]]), 128), ceramic);
  root.add(saucer); cup.position.y = 0.068;

  // the stream: an open cylinder from y=0 to y=1, stretched each frame between its head and its tail
  const streamMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uFade: { value: 4.2 }, uWidth: { value: 1 } },
    vertexShader: `uniform float uTime; uniform float uWidth; varying vec3 vN; varying vec3 vW; varying float vA;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        float thin = 0.55 + 0.45 * smoothstep(0.6, 4.0, w.y);           // it narrows as it falls and speeds up
        float wob = 1.0 + 0.16 * sin(w.y * 9.0 - uTime * 16.0) + 0.06 * sin(w.y * 23.0 - uTime * 31.0);
        w.xz = (w.xz - modelMatrix[3].xz) * thin * wob * uWidth + modelMatrix[3].xz;
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vA = atan(position.z, position.x);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform float uTime; uniform float uFade; varying vec3 vN; varying vec3 vW; varying float vA;
      void main() {
        vec3 v = normalize(cameraPosition - vW);
        float f = pow(1.0 - abs(dot(normalize(vN), v)), 1.6);
        float flow = 0.5 + 0.5 * sin(vW.y * 38.0 + uTime * 26.0 + vA * 2.0);
        vec3 col = mix(vec3(0.07, 0.025, 0.01), vec3(0.62, 0.3, 0.1), f * 0.85 + flow * 0.12);
        col += vec3(1.0, 0.75, 0.45) * pow(max(0.0, 1.0 - abs(vA - 2.3)), 8.0) * 0.35;   // a hot highlight down one side
        float a = 1.0 - smoothstep(uFade - 1.4, uFade, vW.y);                       // fades out toward the top of the frame
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const streamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 24, 80, true); streamGeo.translate(0, 0.5, 0);
  const stream = new THREE.Mesh(streamGeo, streamMat); stream.renderOrder = 2; root.add(stream);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#2a1206', roughness: 0.1, clearcoat: 1 }));
  root.add(drop);

  // steam: soft sprites that rise and curl
  const dot = softDot(THREE), steam = [];
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData = { off: Math.random(), x: (Math.random() - 0.5) * 0.7, sp: 0.6 + Math.random() * 0.5 };
    root.add(s); steam.push(s);
  }

  const api = {
    root, cup, saucer, ceramic,
    // level 0..1 (empty..full), cream 0..1 (crema develops), milk 0..1
    fill(level, cream = 1, milkK = 0) {
      const y = LOW + (FULL - LOW) * level;
      coffee.visible = level > 0.001;
      coffee.position.y = y; coffee.scale.setScalar(innerR(y) * 0.995);
      coffeeMat.color.set('#3a1a0c').lerp(new THREE.Color('#ffffff'), cream);
      milk.position.y = y + 0.002; milk.scale.setScalar(innerR(y) * 0.42 * milkK); milk.material.opacity = milkK; milk.visible = milkK > 0.01;
      api.surface = y + cup.position.y;
    },
    // the stream between head (lowest point) and tail (highest point), world y
    pour(head, tail, t, width = 1) {
      const on = tail - head > 0.01;
      stream.visible = on; drop.visible = on && head > api.surface + 0.05;
      if (!on) return;
      stream.position.y = head; stream.scale.y = tail - head;
      streamMat.uniforms.uTime.value = t; streamMat.uniforms.uWidth.value = width;
      drop.position.y = head;
    },
    steam(k, t) {
      steam.forEach(s => {
        const u = (t * 0.18 * s.userData.sp + s.userData.off) % 1;
        s.position.set(s.userData.x * 0.6 + Math.sin(u * 6 + s.userData.off * 9) * 0.1, api.surface + 0.05 + u * 1.2, Math.cos(u * 5 + s.userData.off * 7) * 0.1);
        s.scale.set(0.1 + u * 0.3, 0.35 + u * 0.6, 1);
        s.material.opacity = k * Math.sin(u * Math.PI) * 0.08;
      });
    },
    glaze(hex) { ceramic.color.set(hex); ceramic.roughness = hex === GLAZES.black ? 0.12 : 0.18; },
    set fade(y) { streamMat.uniforms.uFade.value = y; },
    surface: 0,
  };
  api.fill(0, 0);
  return api;
}

// warm, dramatic light: a key spot that follows the cursor, a brass rim from behind, little ambient
export function lightRoom(THREE, scene, renderer) {
  scene.environmentIntensity = 0.35;
  renderer.toneMappingExposure = 1.05;
  const key = new THREE.SpotLight('#ffd7a8', 60, 20, 0.45, 0.6, 1.4); key.position.set(-3, 5, 3); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#f0a04a', 2.2); rim.position.set(2.5, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffe9d2', 0.5); fill.position.set(3, 1, 4); scene.add(fill);
  const shade = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), new THREE.MeshBasicMaterial({ map: softDot(THREE, '20,4,5'), transparent: true, depthWrite: false }));
  shade.rotation.x = -Math.PI / 2; shade.position.y = -0.005; shade.material.map.colorSpace = THREE.SRGBColorSpace; scene.add(shade);
  shade.scale.setScalar(0.95);
  return { key, rim };
}

// on wide screens the copy sits on the left, so the picture is shifted right inside a full-width canvas (no box edge)
export function shift(camera, renderer, amount = 0.17) {
  const { width: w, height: h } = renderer.domElement;
  const k = w / h > 1.2 ? amount : 0;
  if (camera.view?.offsetX === -w * k && camera.view.fullWidth === w) return;
  if (k) camera.setViewOffset(w, h, -w * k, 0, w, h); else camera.clearViewOffset();
}
