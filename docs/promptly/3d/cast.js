// Sculptor: the Promptly cast. Four coaches from rounded primitives: Dot (sphere), Block (rounded box), Pip (capsule), Puck (lathe puck).
// Each: glossy toy body, eyes that look at a target, a smile, two arms that can wave, a soft floor shadow.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const COACHES = [
  { name: 'Dot', color: '#ff5a3c' },
  { name: 'Block', color: '#2d5bff' },
  { name: 'Pip', color: '#29c79a' },
  { name: 'Puck', color: '#ff7ab8' },
];

const shadowTex = THREE => {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 }), g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(28,24,64,.34)'); r.addColorStop(1, 'rgba(28,24,64,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

function character(THREE, i, tex) {
  const { color } = COACHES[i];
  const plastic = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  const body = plastic(color), white = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, clearcoat: 1 });
  const ink = new THREE.MeshStandardMaterial({ color: '#1c1840', roughness: 0.3 });
  const cheekMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45), roughness: 0.8 });

  const root = new THREE.Group();      // sits on the floor, moves around
  const bob = new THREE.Group();       // squash and stretch, jumps
  root.add(bob);

  // body and where the face sits: [faceY, faceZ, halfWidth, height]
  let mesh, face;
  if (i === 0) { mesh = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 48), body); mesh.position.y = 0.62; face = [0.7, 0.56, 0.6, 1.24]; }
  if (i === 1) { mesh = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.12, 0.86, 8, 0.24), body); mesh.position.y = 0.56; face = [0.68, 0.43, 0.5, 1.12]; }
  if (i === 2) { mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.72, 16, 48), body); mesh.position.y = 0.78; face = [1.0, 0.4, 0.42, 1.56]; }
  if (i === 3) {
    const pts = [[0, 0], [0.52, 0], [0.64, 0.05], [0.7, 0.16], [0.71, 0.3], [0.7, 0.44], [0.64, 0.55], [0.52, 0.6], [0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(40), 96), body); face = [0.32, 0.68, 0.7, 0.6];
  }
  bob.add(mesh);

  // eyes: white ball, pupil and a highlight, inside a group that turns toward the target
  const eyes = [-1, 1].map(s => {
    const eye = new THREE.Group();
    const r = i === 3 ? 0.11 : 0.13;
    eye.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), white));
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 24, 16), ink); pupil.position.z = r * 0.62; pupil.scale.z = 0.6; eye.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 12, 8), white); glint.position.set(r * 0.2, r * 0.22, r * 0.95); eye.add(glint);
    eye.position.set(s * (i === 3 ? 0.2 : 0.19), face[0], face[1] - r * 0.25);
    bob.add(eye); return eye;
  });
  // the smile: half a torus, ends up
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.024, 12, 32, Math.PI), ink);
  smile.rotation.z = Math.PI; smile.position.set(0, face[0] - (i === 3 ? 0.14 : 0.2), face[1] + 0.005);
  bob.add(smile);
  [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), cheekMat); c.scale.set(1, 0.6, 0.35); c.position.set(s * 0.34, face[0] - 0.16, face[1] - 0.06); bob.add(c); });

  // arms: little capsules hinged at the shoulder
  const arms = [-1, 1].map(s => {
    const pivot = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.26, 8, 16), body);
    arm.position.y = -0.2; pivot.add(arm);
    const shoulderY = i === 3 ? 0.36 : face[3] * 0.5;
    pivot.position.set(s * (face[2] + (i === 3 ? 0.02 : 0.04)), shoulderY, 0);
    pivot.rotation.z = s * 0.35;
    pivot.userData.s = s; bob.add(pivot); return pivot;
  });

  // a touch of character on top
  if (i === 0) { const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 6, 12), plastic('#29c79a')); stem.position.set(0.05, 1.3, 0); stem.rotation.z = -0.4; bob.add(stem); }
  if (i === 2) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 12), ink); stalk.position.y = 1.67; bob.add(stalk);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 16), plastic('#ffd84a')); ball.position.y = 1.82; bob.add(ball);
  }
  if (i === 1) { const cap = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.5, 4, 0.05), plastic('#ffd84a')); cap.position.set(0.12, 1.16, 0); cap.rotation.z = -0.12; bob.add(cap); }

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002; root.add(shadow);

  root.userData = { bob, eyes, arms, smile, shadow, h: face[3], jump: 0, jumpLen: 0.7, spin: 0, wave: 0, phase: i * 1.7 };
  return root;
}

export function buildCast(THREE, who = [0, 1, 2, 3], gap = 1.62) {
  const tex = shadowTex(THREE), group = new THREE.Group();
  const chars = who.map((w, k) => { const c = character(THREE, w, tex); c.position.x = (k - (who.length - 1) / 2) * gap; c.userData.home = c.position.x; group.add(c); return c; });
  const target = new THREE.Vector3();

  // jump(i, {spin}) starts a hop; wave(i, seconds) waves the right arm
  const jump = (k, { spin = 0, delay = 0, high = 0.45 } = {}) => { const u = chars[k].userData; u.jump = -delay; u.spin = spin; u.high = high; u.jumping = true; };
  const wave = (k, sec = 2.2) => { chars[k].userData.wave = sec; };

  // one frame: t, dt, a look target in world space, cheer (0..1 arms up), lean
  const update = ({ t, dt, look, cheer = 0 }) => {
    target.copy(look);
    chars.forEach((c, k) => {
      const u = c.userData;
      // idle bounce: a small hop on a soft beat, squash on landing
      const beat = Math.abs(Math.sin(t * 2.4 + u.phase));
      let y = beat * 0.06, sq = 1 - (1 - beat) * 0.05;
      if (u.jumping) {
        u.jump += dt;
        const p = u.jump / u.jumpLen;
        if (p >= 1) { u.jumping = false; u.bob.rotation.y = 0; }
        else if (p > 0) { y = Math.sin(Math.PI * p) * u.high; sq = p < 0.12 ? 0.86 : 1.08 - Math.abs(p - 0.5) * 0.16; u.bob.rotation.y = u.spin * Math.PI * 2 * (p * p * (3 - 2 * p)); }
      }
      if (cheer > 0) { y = Math.max(y, Math.abs(Math.sin(t * 5 + k)) * 0.35 * cheer); }
      u.bob.position.y = y;
      u.bob.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6);
      u.shadow.scale.setScalar(1 - y * 0.6);
      u.shadow.material.opacity = 1 - y;
      // arms: rest, wave, or up for a cheer
      u.wave = Math.max(0, u.wave - dt);
      u.arms.forEach(a => {
        const s = a.userData.s;
        let z = s * 0.35 + Math.sin(t * 2.4 + u.phase) * 0.06 * s;
        if (u.wave > 0 && s > 0) z = 2.5 + Math.sin(t * 14) * 0.45;
        if (cheer > 0) z = z + (s * 2.6 + Math.sin(t * 9 + s) * 0.25 - z) * cheer;
        a.rotation.z += (z - a.rotation.z) * Math.min(1, dt * 14);
      });
      u.smile.scale.y = 1 + cheer * 0.8 + (u.wave > 0 ? 0.3 : 0);
      u.eyes.forEach(e => e.lookAt(target));
    });
  };
  return { group, chars, jump, wave, update };
}

// a pointer (-1..1) to a point in front of the cast for the eyes to follow
export const lookPoint = (THREE, camera, pointer, out = new THREE.Vector3()) =>
  out.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(camera.position.length() * 0.7).add(camera.position);
