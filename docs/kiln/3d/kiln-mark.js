import { stage, THREE } from '../stage.js';

// Sculptor: the Kiln mark as fired clay. Body matte, flame warm and faintly lit from within.
stage(document.querySelector('#kiln-mark'), async ({ scene, camera, extrude, still }) => {
  const mark = await extrude('assets/kiln.svg', { depth: 0.42, bevel: 0.05 });
  mark.traverse(o => {
    if (!o.isMesh) return;
    const flame = o.material.color.getHexString() === new THREE.Color('#f2b33d').getHexString();
    o.material = flame
      ? new THREE.MeshStandardMaterial({ color: '#e8891e', emissive: '#c4410f', emissiveIntensity: 0.9, roughness: 0.5 })
      : new THREE.MeshStandardMaterial({ color: '#9c4426', roughness: 0.92 });
  });
  scene.add(mark);

  // a soft pool of warm light under the mark: a plane with a radial gradient, calmer than a real light
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 }), g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(238,144,86,.32)'); grd.addColorStop(1, 'rgba(238,144,86,0)'); // warm heat pooling under the mark
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.15;
  scene.add(shadow);

  camera.position.set(0, 0.15, 5.2);
  mark.rotation.set(-0.08, -0.35, 0);
  if (still) return;
  return ({ t, pointer, scroll }) => {
    mark.rotation.y = -0.35 + pointer.x * 0.55 + scroll * Math.PI * 0.5;
    mark.rotation.x = -0.08 - pointer.y * 0.25;
    mark.position.y = Math.sin(t * 0.9) * 0.04;
    shadow.material.opacity = 1 - mark.position.y * 2;
  };
}, { exposure: 1, track: document.querySelector('.hero') });
