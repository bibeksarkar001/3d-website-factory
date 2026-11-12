// Animator: everything on the Hush pages that moves and is not the 3D. One rhythm: .8s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

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

  // the quiet: chapters, the mic count follows the 3D, the noise meter jumps and then settles (same curve as phones.js)
  const quiet = $('#quiet');
  if (quiet) {
    const chs = $$('.ch', quiet), mics = $('#mics'), bars = $$('#bars i');
    let active = -1, amp = 1;
    F.scrub(quiet, p => {
      chs.forEach((c, i) => {
        const on = still ? c.classList.contains('last') : p >= +c.dataset.from && p < +c.dataset.to;
        c.classList.toggle('on', on); $('.split', c)?.classList.toggle('in', on);
        if (on && active !== i) {
          const b = $('.big[data-to]', c);
          if (b) { const to = +b.dataset.to, t0 = performance.now(); const run = now => { const k = Math.min(1, (now - t0) / 1100); b.firstChild.textContent = Math.round(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(run); }; still ? (b.firstChild.textContent = to) : requestAnimationFrame(run); }
        }
        if (on) active = i;
      });
      mics.firstChild.textContent = p >= 0.6 ? 6 : Math.round(6 * sm(0.18, 0.32, p));
      amp = still ? 0 : 1 - sm(0.36, 0.56, p);
    });
    if (!still) F.loop(quiet, t => bars.forEach((b, i) => b.style.setProperty('--n', (0.04 + amp * (0.5 + 0.5 * Math.sin(t * (9 + i * 1.7) + i * 2))).toFixed(3))));
    else bars.forEach(b => b.style.setProperty('--n', 0.04));
  }

  $$('[data-colour]').forEach(b => b.addEventListener('click', () => {
    $$('[data-colour]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.dispatchEvent(new CustomEvent('hush:colour', { detail: b.dataset.colour }));
    const sel = $('#f-colour'); if (sel) sel.value = b.textContent.trim();
  }));

  // quiet.html: a noise wave, its opposite, and their sum, which is flat
  const cancel = $('#cancel');
  if (cancel) {
    const [w1, w2, sum] = ['#w1', '#w2', '#sum'].map(s => $(s, cancel));
    const path = (fn, y0) => { let d = ''; for (let x = 0; x <= 560; x += 8) d += `${x ? 'L' : 'M'}${x} ${(y0 + fn(x)).toFixed(1)}`; return d; };
    F.loop(cancel, (t, st) => {
      const n = x => 22 * Math.sin(x * 0.045 + t * 3) + 10 * Math.sin(x * 0.11 - t * 5);
      const k = st ? 1 : 0.5 + 0.5 * Math.sin(t * 0.6);                 // the opposite wave fades in and out
      w1.setAttribute('d', path(n, 60)); w2.setAttribute('d', path(x => -n(x) * k, 160)); sum.setAttribute('d', path(x => n(x) * (1 - k), 260));
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
