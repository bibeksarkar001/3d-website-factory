// Animator: the chapters over the vortex, the counter, the rail, the question chips, the drawing line.
const track = document.querySelector('#vortex');
const chs = [...track.querySelectorAll('.ch')];
const rail = [...track.querySelectorAll('.rail button')];
const count = track.querySelector('.count');
const chips = [...track.querySelectorAll('.sources span')];
const receipt = track.querySelector('.receipt');
const hint = track.querySelector('.scroll-hint');
const clamp = x => Math.min(1, Math.max(0, x));
const ease = x => x * x * (3 - 2 * x);

Factory.scrub(track, p => {
  chs.forEach(c => {
    const a = +c.dataset.in, b = +c.dataset.out, fade = .035;
    const o = Factory.still ? 1 : Math.min(clamp((p - a) / fade + (a === 0 ? 1 : 0)), clamp((b - p) / fade));
    c.style.opacity = o;
    c.style.transform = `translateY(${(1 - o) * (p < a + fade ? 30 : -30)}px)`;
    const on = o > .5;
    c.classList.toggle('on', on);
    c.querySelector('[data-words]')?.classList.toggle('on', on || Factory.still);
  });
  // sources fly into the spiral one by one
  chips.forEach((s, i) => s.style.setProperty('--k', ease(clamp((p - .37 - i * .012) / .06))));
  count.textContent = Math.round(2418330 * ease(clamp((p - .48) / .14))).toLocaleString('en');
  receipt.classList.toggle('on', p > .93);
  hint.style.opacity = 1 - clamp(p / .05);
  const cur = p < .12 ? 0 : p < .3 ? 1 : p < .46 ? 2 : p < .7 ? 3 : 4;
  rail.forEach((r, i) => r.classList.toggle('on', i === cur));
});

// the rail jumps to a chapter
rail.forEach(r => r.addEventListener('click', () => {
  scrollTo({ top: track.offsetTop + +r.dataset.go * (track.offsetHeight - innerHeight), behavior: Factory.still ? 'auto' : 'smooth' });
}));

// question chips: the particles re-form into a different answer
const said = {
  refunds: '<b>Thursday.</b> Orders placed after the 2 pm courier left a day late.',
  first: '<b>Saturday.</b> First orders cluster on weekend mornings.',
  tickets: '<b>Monday.</b> Weekend orders turn into Monday questions.',
};
const out = track.querySelector('.said');
track.querySelectorAll('.ask button').forEach(b => b.addEventListener('click', () => {
  track.querySelectorAll('.ask button').forEach(o => o.setAttribute('aria-pressed', o === b));
  out.innerHTML = said[b.dataset.q];
  dispatchEvent(new CustomEvent('sieve:ask', { detail: b.dataset.q }));
}));

// "what it does": an amber line draws down the list as you read it
const steps = document.querySelector('#what .steps'), line = steps.querySelector('.draw-line');
const drawLine = () => {
  const r = steps.getBoundingClientRect();
  line.style.setProperty('--d', Factory.still ? 1 : clamp((innerHeight * .7 - r.top) / r.height));
};
addEventListener('scroll', drawLine, { passive: true }); drawLine();

// plan dots: one per seat, they light up on hover
[3, 10, 24].forEach((n, i) => {
  document.querySelectorAll('.plan .dots')[i].innerHTML = Array.from({ length: n }, (_, k) => `<i style="--i:${k}"></i>`).join('');
});
