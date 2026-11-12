// Animator: everything on the Weft pages that moves and is not the 3D. One rhythm: .8s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);

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
    if (!h.closest('.chapter')) seen(h, () => h.classList.add('in'));
  });

  // the sewing track: chapters swap by scroll, the stitch rule draws, the counter follows the needle
  const sew = $('#sew');
  if (sew) {
    const chapters = $$('.chapter', sew), rule = $('#rule');
    F.scrub(sew, p => {
      chapters.forEach((c, i) => {
        const on = still ? c.classList.contains('last') : p >= +c.dataset.from && p < +c.dataset.to;
        c.classList.toggle('on', on); $('.split', c)?.classList.toggle('in', on);
      });
      rule.style.strokeDashoffset = 100 - p * 100;
    });
    rule.setAttribute('stroke-dasharray', '1.2 .8'); rule.style.strokeDasharray = '100'; rule.style.strokeDashoffset = 100;
    const n = $('#stitches');
    document.addEventListener('weft:sew', e => { n.textContent = e.detail.sewn; });
  }

  // the close-up: three facts arrive as the camera dives
  const close = $('#close');
  if (close) F.scrub(close, p => $$('.facts li', close).forEach(li => li.classList.toggle('on', p >= +li.dataset.at)));

  // pick your pair: the wash recolours every weave; waist chips; the form follows the choice
  const waists = $('#waists'), fw = $('#f-waist');
  const state = { wash: 'Raw indigo', waist: 32 };
  const say = () => { const c = $('#chosen'); if (c) c.textContent = `${state.wash}, waist ${state.waist}. Hemmed for free.`; };
  for (let w = 28; w <= 38; w++) {
    if (waists) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = w; b.setAttribute('aria-pressed', String(w === 32));
      b.addEventListener('click', () => { $$('button', waists).forEach(x => x.setAttribute('aria-pressed', String(x === b))); state.waist = w; say(); if (fw) fw.value = w; });
      waists.append(b);
    }
    if (fw) fw.append(new Option(`${w}`, w, false, w === 32));
  }
  $$('[data-wash]').forEach(b => b.addEventListener('click', () => {
    $$('[data-wash]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    state.wash = b.textContent; say();
    document.dispatchEvent(new CustomEvent('weft:wash', { detail: b.dataset.wash }));
    const fwash = $('#f-wash'); if (fwash) fwash.value = b.textContent;
  }));

  // forms: front end only, with a success state
  $$('form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const err = $('.err', f), email = f.elements.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { if (err) err.textContent = 'That email does not look right yet.'; email.focus(); return; }
    if (err) err.textContent = '';
    const sec = f.closest('section'); sec.classList.add('sent');
    const done = $('.done', sec); done.setAttribute('tabindex', '-1'); done.focus();
  }));

  // fit page: the cuff rolls up to show the selvedge line, then rolls back (10 s loop)
  const roll = $('#roll');
  if (roll) {
    const cuff = $('#cuff', roll), sel = $('#sel', roll), leg = $('#leg', roll);
    const ease = x => x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
    F.loop(roll, (t, st) => {
      const c = t % 10, k = st ? 1 : c < 1.5 ? 0 : c < 3.5 ? ease((c - 1.5) / 2) : c < 7.5 ? 1 : c < 9.5 ? 1 - ease((c - 7.5) / 2) : 0;
      cuff.setAttribute('height', 14 + 40 * k); cuff.setAttribute('y', 330 - 40 * k);
      sel.setAttribute('y', 330 - 40 * k); sel.setAttribute('height', 14 + 40 * k); sel.style.opacity = k;
      leg.setAttribute('height', 300 - 40 * k);
    });
  }

  // cloth page: the selvedge edge draws itself as it scrolls into view
  $$('.draw').forEach(p => {
    p.style.strokeDasharray = 1; p.style.strokeDashoffset = still ? 0 : 1;
    if (!still) seen(p.ownerSVGElement, () => { p.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = 0; }, 0.5);
  });
})();
