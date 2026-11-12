// Animator: Guild. One rhythm (0.8 s, cubic-bezier(.16,1,.3,1)). Scroll moments use Factory.scrub; loops use Factory.loop.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = x => Math.min(1, Math.max(0, x)), ease = x => (x = clamp(x), x * x * (3 - 2 * x));
const still = Factory.still;

// Receipts: a claim counts once it has passed 65% of the way up the screen. Reverses on the way back.
const claims = $$('.claim'), meter = $('#receipts-meter');
if (meter) {
  const n = $('.n', meter), ticks = $$('i', meter);
  let shown = -1;
  const count = () => {
    let k = 0;
    claims.forEach(c => { const on = still || c.getBoundingClientRect().top < innerHeight * 0.65; c.classList.toggle('seen', on); if (on) k++; });
    if (k !== shown) { shown = k; n.textContent = `${k}/${claims.length}`; ticks.forEach((t, i) => t.classList.toggle('on', i < k)); }
  };
  addEventListener('scroll', count, { passive: true }); addEventListener('resize', count); count();
  // The meter waits until the cover has gone: on the cover it reads 0/6 and sits on the headline.
  const cover = $('.cover');
  if (cover) new IntersectionObserver(([e]) => meter.classList.toggle('away', e.isIntersecting), { threshold: 0.35 }).observe(cover);
}

// Cover: the masthead sinks slower than the page (depth), the issue line drifts up.
const mast = $('.masthead');
if (mast && !still) addEventListener('scroll', () => {
  const y = Math.min(scrollY, innerHeight);
  mast.style.transform = `translateY(${y * 0.35}px)`; mast.style.opacity = 1 - y / innerHeight * 0.8;
}, { passive: true });

// Stuck: the sentence lights word by word as you scroll the 190vh track.
const big = $('#stuck .big');
if (big) {
  big.innerHTML = big.textContent.split(' ').map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  const words = $$('.w', big);
  Factory.scrub($('#stuck'), p => { const k = ease((p - 0.05) / 0.7) * words.length; words.forEach((w, i) => w.classList.toggle('lit', i < k)); });
}

// The map: counters and the fill bar follow the same curve the globe uses (3d/scenes.js).
const mapT = $('#map');
if (mapT) {
  const mem = $('#members'), ctry = $('#countries'), bar = $('#fillbar'), late = $('#late1');
  Factory.scrub(mapT, p => {
    const f = ease((p - 0.08) / 0.55);
    mem.textContent = Math.round(4180 * f).toLocaleString('en-US');
    ctry.textContent = Math.round(61 * f);
    bar.style.transform = `scaleX(${f})`;
    late.classList.toggle('on', p > 0.62);
  });
}

// How it works: a review loop. Project goes out to two reviewers, two notes come back. 8 s loop.
const loopSvg = $('#review-loop');
if (loopSvg) {
  const paths = ['#rl-a', '#rl-b', '#rl-c', '#rl-d'].map(s => $(s, loopSvg)), d1 = $('#rl-dot1', loopSvg), d2 = $('#rl-dot2', loopSvg), day = $('#rl-day', loopSvg);
  const at = (p, k) => { const L = p.getTotalLength(), q = p.getPointAtLength(L * clamp(k)); return `translate(${q.x}px, ${q.y}px)`; };
  Factory.loop(loopSvg, (t, s) => {
    t = s ? 7 : t % 8;
    const out = ease(t / 2.5), back = ease((t - 3.5) / 2.5);
    const leg = t < 3.5 ? 0 : 2;
    d1.style.transform = at(paths[leg], leg ? back : out); d2.style.transform = at(paths[leg + 1], leg ? back : out);
    d1.style.opacity = d2.style.opacity = t > 7.4 ? 1 - (t - 7.4) / 0.6 : 1;
    day.textContent = `day ${Math.min(7, Math.floor(t))}`;
  });
}

// Exhibits: the strip slides as you scroll; each diagram draws itself as its panel nears the centre.
const exT = $('#exhibits');
if (exT) {
  const strip = $('.strip', exT), panels = $$('.ex', exT);
  Factory.scrub(exT, p => {
    const k = ease((p - 0.06) / 0.88);
    strip.style.transform = `translateX(${-k * Math.max(0, strip.scrollWidth - innerWidth + 48)}px)`;
    panels.forEach(el => {
      const r = el.getBoundingClientRect(), c = 1 - clamp((r.left + r.width * 0.3 - innerWidth * 0.2) / (innerWidth * 0.6));
      $$('.d', el).forEach((d, i) => d.style.strokeDashoffset = 1 - clamp(c * 1.6 - i * 0.25));
    });
  });
}

// The picker: turns the globe (3d/scenes.js listens for guild:zone) and states the local time of the next build night.
const zones = $$('.zones button');
const ZONE = [{ tz: 'America/New_York', city: 'New York' }, { tz: 'Europe/London', city: 'London' }, { tz: 'Asia/Singapore', city: 'Singapore' }];
const local = $('#local');
const say = i => {
  if (!local) return;
  const z = ZONE[i];
  // find the next Thursday 19:00 in that city, then show it in the visitor's own time
  const now = new Date();
  for (let d = 0; d < 8; d++) {
    const day = new Date(now.getTime() + d * 864e5);
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: z.tz, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(day).map(p => [p.type, p.value]));
    if (parts.weekday !== 'Thu') continue;
    const guess = Date.UTC(+parts.year, +parts.month - 1, +parts.day, 19);
    const off = new Date(guess).toLocaleString('en-US', { timeZone: z.tz, hour: 'numeric', hour12: false }) - 19;
    const when = new Date(guess - off * 36e5);
    if (when < now) continue;
    local.textContent = `Next one in ${z.city}: ${when.toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })} your time.`;
    return;
  }
};
zones.forEach(b => b.addEventListener('click', () => {
  const i = +b.dataset.zone;
  zones.forEach(x => x.setAttribute('aria-pressed', x === b));
  document.dispatchEvent(new CustomEvent('guild:zone', { detail: i }));
  say(i);
}));
if (zones.length) say(+($('[aria-pressed="true"]', zones[0].parentNode)?.dataset.zone || 1));

// Apply: front-end only. Checks the two fields, then shows the success state.
const form = $('#apply-form');
form?.addEventListener('submit', e => {
  e.preventDefault();
  const err = $('.err', form);
  if (!form.email.validity.valid) { err.textContent = 'That email needs another look.'; form.email.focus(); return; }
  if (!form.what.value.trim()) { err.textContent = 'Tell us one line about what you are building.'; form.what.focus(); return; }
  $('#ok-night').textContent = form.night.value;
  form.classList.add('sent');
  form.nextElementSibling.focus?.();
});

// Magnetic buttons: they lean toward the cursor a few pixels, then settle.
if (!still) $$('.btn').forEach(b => {
  b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
  });
  b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1), background .15s'; b.style.transform = ''; });
  b.addEventListener('pointerenter', () => { b.style.transition = 'transform .12s, background .15s'; });
});
