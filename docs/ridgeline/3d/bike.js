// Sculptor: the Ridgeline E1, a full-suspension e-MTB built from code in real scale (1 unit = 1 m), side view in XY.
// Exposes the moving parts so a scene can drive them: wheels (spin), battery (slides out of the down tube),
// lowers (fork compression), and setColor() for the three frame colours.
export const COLORS = { pine: '#2f4b3a', granite: '#76797a', rust: '#9a4a2a' };
export const POINTS = {                                       // world points the camera tour and hotspots aim at
  motor: [0.02, 0.33, 0], battery: [0.24, 0.6, 0], fork: [0.56, 0.62, 0], tyre: [1.0, 0.3, 0.03], shock: [-0.04, 0.66, 0],
};

export function buildBike(THREE, { color = COLORS.pine } = {}) {
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const bike = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15 });
  const alloy = new THREE.MeshStandardMaterial({ color: '#b9bec2', roughness: 0.32, metalness: 1 });
  const black = new THREE.MeshStandardMaterial({ color: '#17191a', roughness: 0.6, metalness: 0.2 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#1d1e1f', roughness: 0.92 });
  const volt = new THREE.MeshStandardMaterial({ color: '#c8f03c', roughness: 0.45, metalness: 0.1 });

  const tube = (a, b, r, mat, r2 = r) => {
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, len, 20), mat);
    m.position.copy(a).addScaledVector(dir, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
    return m;
  };
  const joint = (p, r, mat = frameMat) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat); s.position.copy(p); return s; };

  // key points
  const R = V(-0.62, 0.345), F = V(0.645, 0.372), BB = V(0, 0.33), HTt = V(0.42, 1.0), HTb = V(0.47, 0.86);
  const STt = V(-0.17, 0.84), seat = V(-0.235, 1.0), pivot = V(-0.12, 0.42), rock = V(-0.14, 0.73);

  // front triangle: a fat down tube that holds the battery, a sloping top tube, seat tube, head tube
  const frame = new THREE.Group(); bike.add(frame);
  frame.add(tube(BB, HTb, 0.042, frameMat, 0.036), tube(V(-0.15, 0.79), HTt.clone().add(V(0, -0.03)), 0.022, frameMat),
    tube(BB, STt, 0.024, frameMat), tube(HTb.clone().add(V(0.0, -0.03)), HTt.clone().add(V(0, 0.03)), 0.03, frameMat),
    joint(HTb, 0.036), joint(BB, 0.045), joint(V(-0.15, 0.79), 0.026));
  // rear: chainstays and seatstays (both sides), a rocker and the shock
  for (const z of [-0.06, 0.06]) {
    frame.add(tube(V(pivot.x, pivot.y, z * 0.7), V(R.x, R.y, z), 0.014, frameMat), tube(V(R.x, R.y, z), V(rock.x - 0.06, rock.y - 0.02, z * 0.8), 0.012, frameMat));
  }
  frame.add(tube(V(rock.x - 0.07, rock.y - 0.02), V(rock.x + 0.06, rock.y + 0.02), 0.02, frameMat));
  const shockA = V(0.14, 0.52), shockB = V(rock.x + 0.02, rock.y - 0.01);
  frame.add(tube(shockA, shockB, 0.02, black), tube(shockA.clone().lerp(shockB, 0.15), shockA.clone().lerp(shockB, 0.6), 0.026, volt));
  // seatpost and saddle
  frame.add(tube(STt, seat.clone().add(V(0.012, -0.03)), 0.015, black));
  const sShape = new THREE.Shape(); sShape.moveTo(-0.12, -0.07); sShape.quadraticCurveTo(-0.14, 0, -0.12, 0.07); sShape.lineTo(0.03, 0.04); sShape.lineTo(0.15, 0.018);
  sShape.quadraticCurveTo(0.17, 0, 0.15, -0.018); sShape.lineTo(0.03, -0.04); sShape.closePath();
  const saddle = new THREE.Mesh(new THREE.ExtrudeGeometry(sShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 }), black);
  saddle.rotation.x = -Math.PI / 2; saddle.position.set(seat.x, seat.y, 0); frame.add(saddle);

  // the motor at the bottom bracket, with a volt ring; chainring, cranks and pedals
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.12, 40), black); motor.rotation.x = Math.PI / 2; motor.position.copy(BB); frame.add(motor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.007, 10, 48), volt); ring.position.copy(motor.position).add(V(0, 0, 0.062)); frame.add(ring);
  const chainring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 6, 40), alloy); chainring.position.copy(BB).add(V(0, 0, 0.085)); frame.add(chainring);
  const crank = new THREE.Group(); crank.position.copy(BB);
  for (const [z, s] of [[0.1, 1], [-0.1, -1]]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.016), black); arm.position.set(0, -0.085 * s, z); crank.add(arm);
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.014, 0.075), black); pedal.position.set(0, -0.17 * s, z + 0.05 * Math.sign(z)); crank.add(pedal);
  }
  crank.rotation.z = 0.5; frame.add(crank);
  // chain: a loop from the chainring to the cassette
  const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0.405, 0.085), V(-0.62, 0.395, 0.07), V(-0.67, 0.345, 0.07), V(-0.62, 0.3, 0.07), V(0, 0.255, 0.085), V(0.075, 0.33, 0.085)], true), 80, 0.004, 5, true), black);
  frame.add(chain);

  // the battery: a panel along the underside of the down tube; it slides out towards the motor
  const dtDir = new THREE.Vector3().subVectors(HTb, BB), dtLen = dtDir.length(); dtDir.normalize();
  const battery = new THREE.Group();
  const cell = new THREE.Mesh(new THREE.BoxGeometry(0.07, dtLen * 0.66, 0.07), black);
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.03, 0.072), volt); band.position.y = -dtLen * 0.3;
  battery.add(cell, band);
  battery.quaternion.setFromUnitVectors(V(0, 1, 0), dtDir);
  const under = new THREE.Vector3(dtDir.y, -dtDir.x, 0);      // perpendicular, below the tube
  const batteryHome = BB.clone().addScaledVector(dtDir, dtLen * 0.52).addScaledVector(under, 0.03);
  battery.position.copy(batteryHome); frame.add(battery);

  // cockpit: steerer, stem, bar, grips
  const barC = HTt.clone().add(V(0.05, 0.06));
  frame.add(tube(HTt, barC, 0.016, black), tube(V(barC.x, barC.y, -0.39), V(barC.x, barC.y, 0.39), 0.011, black));
  for (const z of [-1, 1]) frame.add(tube(V(barC.x, barC.y, z * 0.3), V(barC.x, barC.y, z * 0.4), 0.017, rubber));

  // fork: crown and stanchions (alloy) up top, lowers (volt) and arch below; the lowers carry the front wheel
  const fDir = new THREE.Vector3().subVectors(F, HTb).normalize(), crown = HTb.clone().addScaledVector(fDir, 0.03);
  frame.add(tube(crown.clone().add(V(0, 0, -0.065)), crown.clone().add(V(0, 0, 0.065)), 0.022, black));
  const stTop = crown, stBot = crown.clone().addScaledVector(fDir, 0.3);
  for (const z of [-0.065, 0.065]) frame.add(tube(V(stTop.x, stTop.y, z), V(stBot.x, stBot.y, z), 0.018, alloy));
  const lowers = new THREE.Group(); bike.add(lowers);
  const lowTop = crown.clone().addScaledVector(fDir, 0.2);
  for (const z of [-0.065, 0.065]) lowers.add(tube(V(lowTop.x, lowTop.y, z), V(F.x, F.y, z), 0.024, volt));
  lowers.add(tube(V(lowTop.x + 0.03, lowTop.y + 0.02, -0.065), V(lowTop.x + 0.03, lowTop.y + 0.02, 0.065), 0.014, volt));

  // wheels: tyre with real knobs, rim, 32 spokes, hub, brake rotor
  const wheel = (radius, knobsN) => {
    const w = new THREE.Group(), t = 0.031;
    w.add(new THREE.Mesh(new THREE.TorusGeometry(radius - t, t, 18, 96), rubber));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius - t * 2.1, 0.012, 10, 96), black); w.add(rim);
    const knob = new THREE.BoxGeometry(0.014, 0.014, 0.012), inst = new THREE.InstancedMesh(knob, rubber, knobsN * 3), o = new THREE.Object3D();
    let k = 0;
    for (let i = 0; i < knobsN; i++) for (const phi of [0, 0.75, -0.75]) {
      const a = (i + (phi === 0 ? 0.5 : 0)) / knobsN * Math.PI * 2, rr = radius - t + t * Math.cos(phi);
      const p = V(rr * Math.cos(a), rr * Math.sin(a), t * Math.sin(phi)), n = V(Math.cos(phi) * Math.cos(a), Math.cos(phi) * Math.sin(a), Math.sin(phi));
      o.position.copy(p).addScaledVector(n, 0.004); o.lookAt(p.clone().add(n)); o.updateMatrix(); inst.setMatrixAt(k++, o.matrix);
    }
    w.add(inst);
    const spoke = new THREE.CylinderGeometry(0.0016, 0.0016, 1, 4), sp = new THREE.InstancedMesh(spoke, alloy, 32);
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * Math.PI * 2, side = i % 2 ? 0.028 : -0.028;
      const a0 = V(0.02 * Math.cos(a + 0.6), 0.02 * Math.sin(a + 0.6), side), b0 = V((radius - t * 2.2) * Math.cos(a), (radius - t * 2.2) * Math.sin(a), 0);
      const d = new THREE.Vector3().subVectors(b0, a0); o.position.copy(a0).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
      o.scale.set(1, d.length(), 1); o.updateMatrix(); sp.setMatrixAt(i, o.matrix); o.scale.set(1, 1, 1);
    }
    w.add(sp);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 20), alloy); hub.rotation.x = Math.PI / 2; w.add(hub);
    const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.006, 4, 48), alloy); rotor.position.z = -0.05; w.add(rotor);
    return w;
  };
  const rear = wheel(0.345, 54); rear.position.copy(R); bike.add(rear);
  const cassette = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.04, 24), alloy); cassette.rotation.x = Math.PI / 2; cassette.position.copy(R).add(V(0, 0, 0.065)); bike.add(cassette);
  const front = wheel(0.372, 58); front.position.copy(F); lowers.add(front);

  bike.userData = {
    wheels: [front, rear], battery, batteryHome, dtDir, under, lowers, fDir, frameMat, crank,
    setColor: c => frameMat.color.set(COLORS[c] || c),
  };
  return bike;
}
