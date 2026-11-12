// Sculptor: shared denim pieces for Weft. A canvas-woven 3/1 right-hand twill (colour + bump), and the washes.
export const washes = {
  raw:    { warp: [28, 40, 82],  weft: [214, 206, 188], name: 'Raw indigo' },
  rinsed: { warp: [44, 64, 118], weft: [222, 218, 204], name: 'Once-rinsed' },
};

// Draws the twill: indigo warp floats over three ecru weft picks, under one, stepping one pick per thread so the
// diagonal climbs to the right. `reverse` draws the back of the cloth (weft-faced, much lighter), seen on the cuff.
export function twill(THREE, { wash = washes.raw, cell = 16, cells = 32, reverse = false } = {}) {
  const n = cell * cells, col = document.createElement('canvas'), bmp = document.createElement('canvas');
  col.width = col.height = bmp.width = bmp.height = n;
  const c = col.getContext('2d'), b = bmp.getContext('2d');
  const rnd = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(7);
  const slub = Array.from({ length: cells }, () => .82 + rnd() * .3); // each warp thread dyed a touch differently
  const rgb = (a, k) => `rgb(${a.map(v => Math.min(255, v * k) | 0).join(',')})`;
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
    const x = i * cell, y = j * cell;
    let warpUp = (i + j) % 4 !== 3;
    if (reverse) warpUp = !warpUp;
    // a yarn is round: light along its middle, dark at its edges
    const g = warpUp ? c.createLinearGradient(x, 0, x + cell, 0) : c.createLinearGradient(0, y, 0, y + cell);
    const base = warpUp ? wash.warp : wash.weft, k = warpUp ? slub[i] : .9 + rnd() * .12;
    g.addColorStop(0, rgb(base, k * .55)); g.addColorStop(.5, rgb(base, k * 1.08)); g.addColorStop(1, rgb(base, k * .55));
    c.fillStyle = g; c.fillRect(x, y, cell, cell);
    const h = warpUp ? b.createLinearGradient(x, 0, x + cell, 0) : b.createLinearGradient(0, y, 0, y + cell);
    h.addColorStop(0, '#222'); h.addColorStop(.5, '#eee'); h.addColorStop(1, '#222');
    b.fillStyle = h; b.fillRect(x, y, cell, cell);
  }
  // fibre: fine light hairs and specks so it reads as cotton, not plastic
  for (let k = 0; k < n * 6; k++) {
    const x = rnd() * n, y = rnd() * n, l = 2 + rnd() * 6;
    c.strokeStyle = `rgba(235,230,215,${rnd() * .18})`; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l * .4, y + l); c.stroke();
  }
  const tex = cv => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  const map = tex(col); map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump: tex(bmp) };
}
