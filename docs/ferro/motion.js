// Animator: everything on the Ferro pages that moves and is not the 3D. One rhythm: .8s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);
  const lin = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  const sm = (a, b, x) => { const t = lin(a, b, x); return t * t * (3 - 2 * t); };

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

  // the making: chapters, the coat counter follows the seasoning, the heat bar follows the iron (same curves as pan.js)
  const make = $('#make');
  if (make) {
    const chs = $$('.ch', make), coats = $('#coats'), bar = $('#tempbar');
    let active = -1;
    F.scrub(make, p => {
      chs.forEach((c, i) => {
        const on = still ? i === 0 : p >= +c.dataset.from && p < +c.dataset.to;
        c.classList.toggle('on', on); $('.split', c)?.classList.toggle('in', on);
        if (on && active !== i) {
          const b = $('.big[data-to]', c);
          if (b) { const to = +b.dataset.to, t0 = performance.now(); const run = now => { const k = Math.min(1, (now - t0) / 1100); b.firstChild.textContent = (to * (1 - (1 - k) ** 3)).toFixed(1); if (k < 1) requestAnimationFrame(run); }; still ? (b.firstChild.textContent = to.toFixed(1)) : requestAnimationFrame(run); }
        }
        if (on) active = i;
      });
      coats.firstChild.textContent = Math.min(3, Math.floor(3 * lin(0.62, 0.78, p) + 0.0001));
      const cast = p < 0.17 || p > 0.38 ? 0 : 1 - lin(0.22, 0.36, p);
      bar.style.setProperty('--h', Math.max(cast, sm(0.84, 0.95, p) * 0.7).toFixed(3));
    });
  }

  // heat picker: the 3D swaps its heat source; the form follows
  $$('[data-heat]').forEach(b => b.addEventListener('click', () => {
    $$('[data-heat]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.dispatchEvent(new CustomEvent('ferro:heat', { detail: b.dataset.heat }));
    const sel = $('#f-heat'); if (sel) sel.value = b.textContent.trim();
  }));

  $$('.draw').forEach(p => {
    p.style.strokeDasharray = 1; p.style.strokeDashoffset = still ? 0 : 1;
    if (!still) seen(p.ownerSVGElement, () => { p.style.transition = 'stroke-dashoffset 2s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = 0; }, 0.4);
  });

  // care page: wipe, oil, warm, on a 9 second loop
  const care = $('#care-loop');
  if (care) {
    const cloth = $('#cloth', care), drop = $('#drop', care), glow = $('#glow', care), steps = $$('[data-step]');
    F.loop(care, (t, st) => {
      const c = st ? 8 : t % 9;
      cloth.setAttribute('transform', `translate(${c < 3 ? 60 * Math.sin(c * 3) : 400} 0)`);
      drop.setAttribute('opacity', c > 3 && c < 6 ? 1 : 0); drop.setAttribute('cy', 40 + 70 * ((c - 3) % 1.5) / 1.5);
      glow.setAttribute('opacity', c >= 6 ? Math.min(1, (c - 6) / 1.5) : 0);
      steps.forEach((s, i) => s.classList.toggle('on', st ? true : Math.floor(c / 3) === i));
    });
  }

  $$('form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const err = $('.err', f), email = f.elements.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { err.textContent = 'That email does not look right yet.'; email.focus(); return; }
    err.textContent = '';
    const sec = f.closest('section'); sec.classList.add('sent');
    const done = $('.done', sec); done.setAttribute('tabindex', '-1'); done.focus();
  }));
})();
