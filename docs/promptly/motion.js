// Animator: Promptly. One rhythm (0.8 s, cubic-bezier(.16,1,.3,1)), springy pops. Scroll moments use Factory.scrub.
// The 3D cast listens for promptly:streak, promptly:coach and promptly:cheer (see 3d/scenes.js).
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = x => Math.min(1, Math.max(0, x));
const still = Factory.still;
const send = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
const pop = el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

// Hero blobs drift with the cursor and the scroll, each at its own depth.
const blobs = $$('.blob[data-depth]');
if (blobs.length && !still) {
  let mx = 0, my = 0, queued = false;
  const paint = () => {
    queued = false;
    blobs.forEach(b => { const d = +b.dataset.depth; b.style.transform = `translate(${mx * 40 * d}px, ${my * 40 * d + scrollY * d * 0.4}px)`; });
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; ask(); }, { passive: true });
  addEventListener('scroll', ask, { passive: true });
}

// Five minutes: the ring runs down from 5:00 as you scroll, each step lights while its seconds pass.
const five = $('#five');
if (five) {
  const ring = $('#ring'), time = $('#time'), steps = $$('.steps li', five), done = $('#done-line');
  Factory.scrub(five, p => {
    const k = clamp(p / 0.85);                                   // finish early so the end rests on screen
    const left = Math.round(300 * (1 - k));
    time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    ring.style.strokeDashoffset = k;
    steps.forEach(li => {
      const from = +li.dataset.from, to = +li.dataset.to;
      li.classList.toggle('done', k >= to); li.classList.toggle('on', k >= from && k < to);
    });
    done.classList.toggle('on', k >= 1);
  });
}

// Your week: a day lights per stretch of scroll (the same count the cast hops to), the streak counts, then you can tap.
const week = $('#week');
if (week) {
  const n = $('#streak-n'), days = $$('.days span', week), lesson = $('#lesson'), tap = $('#tap'), flame = $('#flame');
  const unit = ['First words', 'Your notes', 'Trust, but check', 'Plans and lists', 'Your own toolkit'];
  let shown = -1, extra = 0;
  const show = d => {
    const total = d + extra;
    if (total === shown) return;
    if (total > shown && shown >= 0) pop(n);
    shown = total; n.textContent = total;
    days.forEach((s, i) => s.classList.toggle('on', i < d));
    flame.style.fill = total >= 7 ? '#ff5a3c' : '#ffd84a';
    lesson.innerHTML = d === 0 ? 'Scroll through a week of lessons.'
      : total > 7 ? `<b>Day ${total}.</b> Lesson ${total} of 60, ${unit[Math.floor((total - 1) / 12)]}.`
      : d === 7 ? '<b>Seven days.</b> A full week. The cast is thrilled.'
      : `<b>Day ${d}.</b> Lesson ${d} of 60, First words.`;
    tap.classList.toggle('ready', d === 7);
  };
  Factory.scrub(week, p => show(p < 0.08 ? 0 : Math.max(0, Math.min(7, Math.floor((p - 0.08) / 0.7 * 7) + 1))));
  tap.addEventListener('click', () => {
    if (extra >= 53) return;                                      // the course is 60 lessons
    extra++; shown = -1; show(7);
    send('promptly:streak');
    if (!still) confetti(tap);
  });
}

function confetti(from) {
  const r = from.getBoundingClientRect(), colours = ['#ff5a3c', '#2d5bff', '#29c79a', '#ff7ab8', '#ffd84a'];
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('i');
    c.className = 'confetti'; c.style.background = colours[i % 5];
    c.style.left = `${r.left + r.width / 2}px`; c.style.top = `${r.top}px`;
    document.body.append(c);
    const a = Math.random() * Math.PI - Math.PI, v = 160 + Math.random() * 220;
    c.animate([
      { transform: 'translate(0, 0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v + 260}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => c.remove();
  }
}

// The path: the road draws itself through the five units, each one wakes as the road reaches it.
const path = $('#path');
if (path) {
  const road = $('.road', path), units = $$('.unit', path);
  Factory.scrub(path, p => {
    const k = clamp(p / 0.85);
    road.style.strokeDashoffset = 1 - k;
    units.forEach(u => u.classList.toggle('on', k >= +u.dataset.at));
  });
}

// Pick a coach: the bubble speaks, the picked coach steps forward in 3D.
const coaches = $$('.coaches button'), bubble = $('#bubble'), startBox = $('#cast-start');
const lines = ['I\'m Dot. I keep it short.', 'I\'m Block. I like a checklist.', 'I\'m Pip. I\'ll ask you why.', 'I\'m Puck. I cheer loudly!'];
let coach = 0;
coaches.forEach(b => b.addEventListener('click', () => {
  coach = +b.dataset.coach;
  coaches.forEach(o => o.setAttribute('aria-pressed', String(o === b)));
  bubble.textContent = lines[coach]; pop(bubble);
  if (startBox) startBox.dataset.pick = coach;
  send('promptly:coach', coach);
}));

// Start form: check the email, then show the success state and the cast cheers.
const form = $('#start-form');
if (form) form.addEventListener('submit', e => {
  e.preventDefault();
  const email = form.email.value.trim(), at = form.at.value, err = $('.err', form);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'That email does not look right yet.'; form.email.focus(); return; }
  if (!at) { err.textContent = 'Pick a time for your reminder.'; form.at.focus(); return; }
  err.textContent = '';
  $('#ok-time').textContent = at; $('#ok-coach').textContent = ['Dot', 'Block', 'Pip', 'Puck'][coach];
  form.classList.add('sent');
  send('promptly:cheer');
  if (!still) confetti($('.ok'));
});
