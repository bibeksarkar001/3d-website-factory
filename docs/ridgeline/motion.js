// Animator: everything on the Ridgeline pages that moves and is not the 3D. One rhythm: .8s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);
  const count = (el, to, dec = 0, ms = 1100) => {
    const small = el.querySelector('small'), t0 = performance.now();
    const set = v => { el.firstChild.textContent = dec ? v.toFixed(dec) : Math.round(v); };
    if (still) return set(to);
    const run = now => { const k = Math.min(1, (now - t0) / ms); set(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(run); };
    requestAnimationFrame(run); void small;
  };

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
    if (!h.closest('.stopx')) seen(h, () => h.classList.add('in'));
  });

  // the tour: a stop per part; each big number counts up when its stop arrives; the step bar fills; contours drift
  const tour = $('#tour');
  if (tour) {
    const stops = $$('.stopx', tour), steps = $$('.steps li', tour), lines = $$('#contours path');
    let active = -1;
    F.scrub(tour, p => {
      stops.forEach((s, i) => {
        const on = still ? i === 0 : p >= +s.dataset.from && p < +s.dataset.to;
        s.classList.toggle('on', on); $('.split', s)?.classList.toggle('in', on);
        steps[i]?.classList.toggle('on', on);
        steps[i]?.style.setProperty('--k', Math.min(1, Math.max(0, (p - s.dataset.from) / (s.dataset.to - s.dataset.from))));
        if (on && active !== i) { const b = $('.big', s); if (b) count(b, +b.dataset.to, +(b.dataset.dec || 0)); }
        if (on) active = i;
      });
      if (!still) lines.forEach((l, i) => l.style.transform = `translateY(${-p * (40 + i * 22)}px)`);
    });
  }

  // turn it over: hotspots explain parts; swatches change the frame colour in every 3D view
  const INFO = {
    motor: ['Motor', 'A mid-drive motor with 85 Nm of torque. It assists up to 25 km/h.'],
    battery: ['Battery', '720 Wh inside the down tube. It slides out from below to charge off the bike.'],
    fork: ['Fork', '160 mm of travel up front.'],
    shock: ['Rear suspension', '150 mm of travel at the back.'],
    tyre: ['Tyres', '2.5-inch knobby tyres, tubeless. 29-inch front, 27.5-inch rear.'],
  };
  const info = $('#info');
  $$('[data-spot]').forEach(b => b.addEventListener('click', () => {
    $$('[data-spot]').forEach(x => x.setAttribute('aria-expanded', String(x === b)));
    const [h, p] = INFO[b.dataset.spot]; info.innerHTML = `<h3>${h}</h3><p class="muted">${p}</p>`;
    if (!still) info.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' });
  }));
  $$('[data-color]').forEach(b => b.addEventListener('click', () => {
    $$('[data-color]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.dispatchEvent(new CustomEvent('ridge:color', { detail: b.dataset.color }));
    const sel = $('#f-colour'); if (sel) sel.value = b.textContent.trim();
  }));

  // geometry: the bike drawing draws itself when it scrolls into view
  $$('.draw').forEach(p => {
    p.style.strokeDasharray = 1; p.style.strokeDashoffset = still ? 0 : 1;
    if (!still) seen(p.ownerSVGElement, () => { p.style.transition = 'stroke-dashoffset 2s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = 0; }, 0.4);
  });
  // numbers on the extra pages count when they arrive
  $$('[data-count]').forEach(n => seen(n, () => count(n, +n.dataset.count, +(n.dataset.dec || 0), 1400), 0.6));

  // forms: front end only, with a success state
  $$('form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const err = $('.err', f), email = f.elements.email, name = f.elements.name;
    if (name && !name.value.trim()) { err.textContent = 'Tell us your name.'; name.focus(); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { err.textContent = 'That email does not look right yet.'; email.focus(); return; }
    err.textContent = '';
    const sec = f.closest('section'); sec.classList.add('sent');
    const done = $('.done', sec); if (name) $('h3', done).textContent = `You're booked in, ${name.value.trim().split(' ')[0]}.`;
    done.setAttribute('tabindex', '-1'); done.focus();
  }));
})();
