// Tech page explainer: the sole rocks along the ground, heel strike → roll → toe off, on an 8 second loop.
const svg = document.querySelector('#roll'), shoe = svg.querySelector('#rollshoe'), dot = svg.querySelector('#contact'), label = svg.querySelector('#phase');
const words = ['Heel strike', 'Roll', 'Toe off'];
Factory.loop(svg, (t, still) => {
  const k = still ? 0.5 : (t % 4) / 4;                         // one stride every 4 seconds
  const a = (0.5 - k) * 0.5;                                   // tilt: toe up at heel strike, heel up at toe off
  const x = 300 + (k - 0.5) * 120;
  const cx = x + (k - 0.5) * 280;                              // the contact point runs from heel to toe
  shoe.setAttribute('transform', `translate(${x} ${214 - Math.abs(a) * 60}) rotate(${-a * 57.3})`);
  dot.setAttribute('cx', cx); dot.setAttribute('cy', 220);
  label.textContent = still ? 'Heel to toe' : words[Math.min(2, Math.floor(k * 3))];
});
