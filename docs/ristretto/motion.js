// Animator: the journey's type and numbers, the hold-to-pull shot, the drawn line in the rules.
import { splitWords, chapters, still, clamp } from './site.js';

splitWords();

// 1. the journey: chapters rise word by word, the wordmark drifts, the scale counts while the shot runs
const track = document.querySelector('#journey'), stick = track.querySelector('.stick');
const grams = document.querySelector('#grams'), secs = document.querySelector('#secs'), scale = track.querySelector('.scale');
chapters(track, p => {
  stick.style.setProperty('--p', p);
  const k = clamp((p - 0.22) / (0.66 - 0.22));
  grams.textContent = `${Math.round(k * 27)} g`;
  secs.textContent = `${(k * 21).toFixed(1)} s`;
  scale.style.setProperty('--show', p > 0.2 && p < 0.58 ? 1 : 0);
});

// 2. pull one yourself: hold the button; window.shot is read by the 3D cup every frame
const btn = document.querySelector('#hold'), ring = btn.querySelector('circle');
const timer = document.querySelector('#timer'), verdict = document.querySelector('#verdict');
const shot = window.shot = { level: still ? 1 : 0, pouring: false };
let start = 0, raf = 0, secsHeld = 0;
const paint = () => {
  timer.textContent = secsHeld.toFixed(1);
  shot.level = Math.min(1.15, secsHeld / 21);
  ring.style.strokeDashoffset = 1 - Math.min(1, secsHeld / 21);
};
const tick = now => { secsHeld = (now - start) / 1000; paint(); raf = requestAnimationFrame(tick); };
const down = e => {
  if (shot.pouring) return; e?.preventDefault?.();
  shot.pouring = true; btn.classList.add('down'); verdict.textContent = '';
  start = performance.now(); raf = requestAnimationFrame(tick);
};
const up = () => {
  if (!shot.pouring) return;
  shot.pouring = false; btn.classList.remove('down'); cancelAnimationFrame(raf);
  const s = secsHeld;
  verdict.textContent = s < 15 ? `${s.toFixed(1)} s. Too fast: thin and sour. Try again.`
    : s <= 25 ? `${s.toFixed(1)} s. That's a ristretto. Drink it while it's warm.`
    : `${s.toFixed(1)} s. Too long: it's turning bitter. Try again.`;
};
btn.addEventListener('pointerdown', down);
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => btn.addEventListener(t, up));
btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); });
btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
btn.addEventListener('contextmenu', e => e.preventDefault());
if (still) { secsHeld = 21; paint(); verdict.textContent = '21.0 s. That\'s a ristretto.'; }

// glaze picker: only one pressed at a time (the 3D cup listens to the same clicks)
const glazes = [...document.querySelectorAll('[data-glaze]')];
glazes.forEach(b => b.addEventListener('click', () => glazes.forEach(g => g.setAttribute('aria-pressed', g === b))));

// 3. the rules: a line draws down beside the list as it scrolls past
const list = document.querySelector('#rules ol');
if (!still) {
  const draw = () => { const r = list.getBoundingClientRect(); list.style.setProperty('--d', clamp((innerHeight * 0.7 - r.top) / r.height)); };
  addEventListener('scroll', draw, { passive: true }); draw();
}
