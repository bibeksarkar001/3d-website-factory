// Animator: everything on the Faraway pages that moves and is not the 3D. One rhythm: .8s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);
  const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October'];

  // nav: solid once you leave the top; a menu on phones
  const nav = $('#nav');
  const solid = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solid, { passive: true }); solid();
  $('.menu', nav).addEventListener('click', e => { const o = nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  // headings: words rise out of a mask
  $$('.split').forEach(h => {
    let i = 0;
    const wrap = node => [...node.childNodes].forEach(n => {
      if (n.nodeType !== 3) return wrap(n);
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(w => {
        if (!w) return;
        if (/^\s+$/.test(w)) return frag.append(w);
        const o = document.createElement('span'), inner = document.createElement('span');
        o.className = 'w'; inner.textContent = w; inner.style.setProperty('--i', i++); o.append(inner); frag.append(o);
      });
      n.replaceWith(frag);
    });
    wrap(h);
    if (!h.closest('.stop')) seen(h, () => h.classList.add('in'));
  });

  // the flight: a postcard per place; the route bar fills
  const fly = $('#fly');
  if (fly) {
    const stops = $$('.stop', fly), bars = $$('.route b', fly);
    F.scrub(fly, p => {
      stops.forEach((s, i) => {
        const on = still ? i === 0 : p >= +s.dataset.from && p < +s.dataset.to;
        s.classList.toggle('on', on); $('.split', s)?.classList.toggle('in', on);
        const a = +s.dataset.from, b = +s.dataset.to;
        bars[i]?.style.setProperty('--k', Math.min(1, Math.max(0, (p - a) / (b - a))));
      });
    });
  }

  // three kinds of day: the line draws as you scroll, each day's dot fills as the line reaches it
  const days = $('#days');
  if (days) {
    const tl = $('#tl'), items = $$('.day', days);
    F.scrub(days, p => {
      const k = Math.min(1, Math.max(0, (p - 0.15) / 0.55));
      tl.style.strokeDashoffset = 1 - k;
      items.forEach(d => d.classList.toggle('on', k >= +d.dataset.at));
    });
  }

  // pick a trip: nights and month; the dotted route gets a stop per night
  const months = $('#months'), when = $('#f-when'), trip = $('#trip'), dots = $('#nights'), summary = $('#summary');
  const state = { nights: 7, month: 'May' };
  const drawNights = () => {
    if (!trip) return;
    const len = trip.getTotalLength(), n = state.nights;
    dots.replaceChildren(...Array.from({ length: n + 1 }, (_, i) => {
      const pt = trip.getPointAtLength(len * i / n), c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', i === 0 || i === n ? 8 : 5);
      c.setAttribute('fill', i === 0 || i === n ? '#123f3d' : '#fff4e6'); c.setAttribute('stroke', '#123f3d'); c.setAttribute('stroke-width', 2);
      if (!still) c.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: i * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      return c;
    }));
    summary.textContent = `${n} nights in ${state.month}. Up to 10 travellers, one local host.`;
  };
  MONTHS.forEach(m => {
    if (months) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = m.slice(0, 3); b.setAttribute('aria-label', m); b.setAttribute('aria-pressed', String(m === 'May'));
      b.addEventListener('click', () => { $$('button', months).forEach(x => x.setAttribute('aria-pressed', String(x === b))); state.month = m; drawNights(); if (when) when.value = m; });
      months.append(b);
    }
    if (when) when.append(new Option(m, m, false, m === 'May'));
  });
  $$('[data-nights]').forEach(b => b.addEventListener('click', () => {
    $$('[data-nights]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); state.nights = +b.dataset.nights; drawNights();
  }));
  drawNights();

  // forms: front end only, with a success state
  $$('form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const err = $('.err', f), email = f.elements.email, name = f.elements.name;
    if (name && !name.value.trim()) { err.textContent = 'Tell us your name.'; name.focus(); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { err.textContent = 'That email does not look right yet.'; email.focus(); return; }
    err.textContent = '';
    const sec = f.closest('section'); sec.classList.add('sent');
    const done = $('.done', sec); if (name) $('h3', done).textContent = `It's on its way, ${name.value.trim().split(' ')[0]}.`;
    done.setAttribute('tabindex', '-1'); done.focus();
  }));

  // trips page: the two routes draw themselves on a loop
  const routes = $('#routes');
  if (routes) {
    const ps = $$('path.r', routes);
    F.loop(routes, (t, st) => {
      ps.forEach((p, i) => { const k = st ? 1 : Math.min(1, Math.max(0, ((t + i * 1.2) % 9) / 5)); p.style.strokeDashoffset = 1 - k; });
    });
  }
})();
