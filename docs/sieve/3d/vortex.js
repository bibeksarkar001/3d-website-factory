// Sculptor: the Sieve vortex. Tens of thousands of light points in a three-arm spiral tunnel the visitor flies
// through; at the end of the track every point leaves the tunnel and settles into one bar chart (the answer).
import { stage, THREE } from '../stage.js';

const track = document.querySelector('#vortex');
const box = document.querySelector('#vortex-3d');
const labels = [...document.querySelectorAll('.bar-labels span')];
const N = innerWidth < 700 ? 26000 : 48000;

// the answers the question chips ask for: seven bars (Mon..Sun), one hot
export const answers = {
  refunds: { h: [.34, .4, .37, 1, .45, .3, .26], hot: 3 },
  first:   { h: [.42, .38, .4, .46, .62, 1, .74], hot: 5 },
  tickets: { h: [1, .7, .52, .48, .44, .3, .36], hot: 0 },
};

const vert = /* glsl */`
uniform float uTime, uP, uBurst, uPix, uHot, uSize, uChartSize, uAspect, uClear, uShift, uLift;
uniform vec2 uPointer;
uniform vec4 uChart;          // centre x, centre y, scale, depth
uniform float uH[7];
attribute vec4 aSeed;         // arm angle, depth, radius, random
attribute vec3 aBar;          // bar index (-1 = baseline), u, v
varying vec3 vCol; varying float vA;
void main() {
  float L = 70.0;
  float travel = uP * 160.0 + uTime * 1.4;
  float z = -(L - mod(aSeed.y * L + travel, L));
  float tight = mix(1.0, 0.42, smoothstep(0.34, 0.64, uP));            // the sieve narrows
  float r = (0.9 + aSeed.z * aSeed.z * 3.8) * tight * (1.0 + 0.22 * sin(z * 0.27 + uTime * 0.6 + aSeed.w * 6.0));
  float ang = aSeed.x + z * (0.09 + uP * 0.12) + uTime * 0.14;
  vec3 tun = vec3(cos(ang) * r, sin(ang) * r, z);
  tun.xy += uPointer * (-z) * 0.07;                                    // the tunnel bends toward the cursor
  tun.x += uShift * (1.0 - smoothstep(0.02, 0.16, uP)) * (-z);           // in the hero the eye of the spiral sits right of the headline
  tun.y += uLift * (1.0 - smoothstep(0.02, 0.16, uP)) * (-z);
  float bt = uTime - uBurst;
  tun.xy *= 1.0 + 0.9 * exp(-bt * 2.2) * step(0.0, bt) * smoothstep(-30.0, -2.0, z);  // click ripple

  float h = 0.0;
  for (int k = 0; k < 7; k++) if (abs(aBar.x - float(k)) < 0.5) h = uH[k];
  float bw = 2.0 / 7.0;
  vec3 tgt = aBar.x < 0.0
    ? vec3(-1.0 + aBar.y * 2.0, -0.035 - aBar.z * 0.02, 0.0)
    : vec3(-1.0 + (aBar.x + 0.19) * bw + aBar.y * bw * 0.62, aBar.z * h * 1.15, (aSeed.w - 0.5) * 0.12);
  tgt.x += uPointer.x * tgt.z * 2.0;
  tgt = vec3(uChart.x + tgt.x * uChart.z, uChart.y + tgt.y * uChart.z, uChart.w + tgt.z);
  tgt.y += sin(uTime * 1.3 + aSeed.w * 30.0) * 0.006;                  // the answer breathes

  float k = smoothstep(0.64 + aSeed.w * 0.12, 0.78 + aSeed.w * 0.1, uP);
  k = k * k * (3.0 - 2.0 * k);
  vec3 p = mix(tun, tgt, k);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float hot = abs(aBar.x - uHot) < 0.5 ? 1.0 : 0.0;
  gl_PointSize = min(34.0, mix(uSize, uChartSize * (1.0 + hot * 0.3), k) * uPix / -mv.z);
  vA = mix(smoothstep(0.4, 4.0, -z) * smoothstep(L, L * 0.55, -z), 0.95, k);
  vec3 tc = mix(vec3(0.42, 0.78, 1.0), vec3(1.0), aSeed.w * aSeed.w);
  vCol = mix(tc, mix(vec3(0.82, 0.9, 1.0), vec3(1.0, 0.7, 0.26), hot), k);
  gl_Position = projectionMatrix * mv;
  vec2 s = gl_Position.xy / gl_Position.w; s.x *= uAspect;
  vA *= mix(1.0, smoothstep(0.1, 0.62, length(s)), uClear * (1.0 - k));   // a clear eye where the chapter line sits
  vA *= 1.0 - step(uAspect, 1.1) * 0.5 * (1.0 - smoothstep(0.08, 0.16, uP));   // phones: a quieter spiral behind the headline
}`;
const frag = /* glsl */`
varying vec3 vCol; varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * vA * 0.8;
  gl_FragColor = vec4(vCol * a, a);
}`;

stage(box, ({ scene, camera, renderer, still }) => {
  camera.fov = 58; camera.position.set(0, 0, 0); camera.updateProjectionMatrix();
  const seed = new Float32Array(N * 4), bar = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const arm = i % 3, g = (Math.random() + Math.random() + Math.random()) / 3 - .5; // arms are soft, not lines
    seed.set([arm * 2.094 + g * 1.6, Math.random(), Math.random(), Math.random()], i * 4);
    bar.set([i % 25 === 0 ? -1 : i % 7, Math.random(), Math.sqrt(Math.random()) * .999 + Math.random() * .001], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geo.setAttribute('aBar', new THREE.BufferAttribute(bar, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  const u = {
    uTime: { value: 0 }, uP: { value: 0 }, uBurst: { value: -10 }, uPix: { value: renderer.getPixelRatio() },
    uHot: { value: 3 }, uSize: { value: innerWidth < 700 ? 44 : 60 }, uChartSize: { value: innerWidth < 700 ? 18 : 24 }, uPointer: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uClear: { value: 0 }, uShift: { value: 0 }, uLift: { value: 0 },
    uChart: { value: new THREE.Vector4(1.5, -1, 2, -9) }, uH: { value: [...answers.refunds.h] },
  };
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts);

  // the chart sits right of the copy on a desk, centred above it on a phone
  const place = () => {
    const zc = -9, hh = -zc * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), hw = hh * camera.aspect;
    if (camera.aspect > 1.1) { const s = Math.min(hw * .34, hh * .78); u.uChart.value.set(hw * .42, -s * .62, s, zc); }
    else { const s = hw * .8; u.uChart.value.set(0, hh * .02, s, zc); }
  };

  // the question chips swap the answer: heights ease toward the new bars
  let want = answers.refunds;
  addEventListener('sieve:ask', e => { want = answers[e.detail]; u.uHot.value = want.hot; u.uBurst.value = u.uTime.value - .6; });
  box.closest('.stick').addEventListener('click', e => { if (!e.target.closest('a,button')) u.uBurst.value = u.uTime.value; });

  const v = new THREE.Vector3();
  return ({ t, dt, pointer, scroll }) => {
    place();
    const p = still ? 1 : scroll;
    u.uTime.value = t; u.uP.value = p; u.uAspect.value = camera.aspect;
    u.uShift.value = camera.aspect > 1.1 ? .42 : 0; u.uLift.value = camera.aspect > 1.1 ? 0 : .34;
    u.uClear.value = Math.min(1, Math.max(0, (p - .1) / .05)) * Math.min(1, Math.max(0, (.68 - p) / .05));
    u.uPointer.value.set(pointer.x, pointer.y);
    u.uH.value.forEach((h, i) => { u.uH.value[i] = still ? want.h[i] : h + (want.h[i] - h) * Math.min(1, dt * 5); });
    camera.rotation.z = (1 - p) * Math.sin(t * .2) * .06 - pointer.x * .04;
    // day labels under each bar, projected from 3D
    const c = u.uChart.value, show = p > .86;
    labels.forEach((l, i) => {
      v.set(c.x + (-1 + (i + .5) * 2 / 7) * c.z, c.y - .16 * c.z, c.w).project(camera);
      l.style.transform = `translate(${(v.x + 1) / 2 * box.clientWidth}px, ${(1 - v.y) / 2 * box.clientHeight}px) translate(-50%, 0)`;
      l.classList.toggle('on', show); l.classList.toggle('hot', i === want.hot);
    });
  };
}, { track, fov: 58 });
