// Animator: the four-evenings explainer. Lump -> thrown pot -> glazed -> fired. 12 s loop, one change every ~1.5 s.
const svg = document.querySelector('#evenings svg');
const $ = id => svg.querySelector('#' + id);
const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const seg = (t, a, b) => ease((t - a) / (b - a));
const marks = [...document.querySelectorAll('#evenings li')];

Factory.loop(document.querySelector('#evenings'), (t, still) => {
  t = still ? 10 : t % 12;
  const shape = seg(t, 1, 3.5);           // lump rises into a pot
  const glaze = seg(t, 5, 6.5);           // glaze pours down
  const fire = seg(t, 8, 9) * (1 - seg(t, 10.5, 11.5)); // kiln glow, then cools
  const out = 1 - seg(t, 11.3, 12);
  // lump -> pot: foot, belly, neck and lip each move from a low dome to a thrown pot
  const L = (a, b) => a + (b - a) * shape;
  const fx = L(40, 24), bx = L(48, 54), by = L(132, 104), nx = L(26, 19), ny = L(120, 70), lx = L(22, 25), ly = L(117, 58);
  $('pot').setAttribute('d', `M${100 - fx} 150 Q${100 - bx * 1.25} ${by} ${100 - nx} ${ny} L${100 - lx} ${ly} L${100 + lx} ${ly} L${100 + nx} ${ny} Q${100 + bx * 1.25} ${by} ${100 + fx} 150 Z`);
  $('glaze').style.transform = `scaleY(${glaze})`;
  $('glow').style.opacity = fire;
  $('pot-g').style.opacity = still ? 1 : Math.min(seg(t, 0, 0.6), out);
  const week = t < 3.8 ? 0 : t < 4.8 ? 1 : t < 7.5 ? 2 : 3;
  marks.forEach((li, i) => li.classList.toggle('on', i === (still ? 3 : week)));
});
