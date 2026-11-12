// Animator: everything on the Optra pages that moves and is not the 3D. One rhythm: .8s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16], DIST = ['0.3', '0.5', '0.7', '1', '2', '3', '∞'];
  const count = (el, to) => {
    const set = v => { el.firstChild.textContent = Math.round(v); };
    if (still) return set(to);
    const t0 = performance.now(), run = now => { const k = Math.min(1, (now - t0) / 1100); set(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(run); };
    requestAnimationFrame(run);
  };

  const nav = $('#nav');
  const solid = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solid, { passive: true }); solid();
  $('.menu', nav).addEventListener('click', e => { const o = nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

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
    if (!h.closest('.ch')) seen(h, () => h.classList.add('in'));
  });

  // the tour: chapters, the f-number follows the blades, the distance follows the focus ring, the scale lights up
  const tour = $('#tour');
  if (tour) {
    const chs = $$('.ch', tour), marks = $$('.scale span', tour), fnum = $('#fnum'), dist = $('#dist'), unit = $('#unit');
    let active = -1;
    F.scrub(tour, p => {
      chs.forEach((c, i) => {
        const on = still ? i === 0 : p >= +c.dataset.from && p < +c.dataset.to;
        c.classList.toggle('on', on); $('.split', c)?.classList.toggle('in', on);
        if (on && active !== i) { const n = $('.num[data-to]', c); if (n) count(n, +n.dataset.to); }
        if (on) active = i;
      });
      const a = Math.round(sm(0.2, 0.34, p) * (STOPS.length - 1));       // same curve as the blades in lens.js
      fnum.textContent = `f/${STOPS[a]}`; marks.forEach((m, i) => m.classList.toggle('on', i === a));
      const d = DIST[Math.round(sm(0.68, 0.82, p) * (DIST.length - 1))];
      dist.textContent = d; unit.textContent = d === '∞' ? '' : 'm';
    });
  }

  // finish: both 3D views follow; the form follows
  $$('[data-finish]').forEach(b => b.addEventListener('click', () => {
    $$('[data-finish]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.dispatchEvent(new CustomEvent('optra:finish', { detail: b.dataset.finish }));
    const sel = $('#f-finish'); if (sel) sel.value = b.textContent.trim();
  }));

  // drawings draw themselves when they scroll into view; numbers count
  $$('.draw').forEach(p => {
    p.style.strokeDasharray = 1; p.style.strokeDashoffset = still ? 0 : 1;
    if (!still) seen(p.ownerSVGElement, () => { p.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = 0; }, 0.4);
  });

  // aperture page: a slider sets the f-number; the SVG iris closes to match
  const iris = $('#iris'), slider = $('#fstop'), out = $('#fout');
  if (iris && slider) {
    const blades = $$('.blade', iris);
    const set = () => {
      const i = +slider.value, k = i / (STOPS.length - 1);
      out.textContent = `f/${STOPS[i]}`;
      blades.forEach((b, j) => b.setAttribute('transform', `rotate(${j * (360 / blades.length)} 200 200) rotate(${-38 + 34 * k} 200 62)`));
      $('#light').setAttribute('r', 120 * (1 - k * 0.88));
    };
    slider.addEventListener('input', set); set();
  }

  // forms: front end only, with a success state
  $$('form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const err = $('.err', f), email = f.elements.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { err.textContent = 'That email does not look right yet.'; email.focus(); return; }
    err.textContent = '';
    const sec = f.closest('section'); sec.classList.add('sent');
    const done = $('.done', sec); done.setAttribute('tabindex', '-1'); done.focus();
  }));
})();
