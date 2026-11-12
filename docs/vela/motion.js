// Animator: everything on the Vela pages that moves and is not the 3D. One rhythm: .9s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);
  const NOTES = {
    fig: ['Fig Leaf', 'Green and soft. A glaze the colour of the leaf.'],
    cedar: ['Cedar Smoke', 'Dry wood and a little smoke. A glaze like fired clay.'],
    salt: ['Sea Salt', 'Clean and mineral. A glaze like the sea on a grey day.'],
  };

  // nav: solid once you leave the top; over the dark burn it goes light; a menu on phones
  const nav = $('#nav'), burn = $('#burn');
  const solid = () => {
    nav.classList.toggle('solid', scrollY > 40 && !(burn && burn.getBoundingClientRect().bottom > 70 && +getComputedStyle(burn).getPropertyValue('--lit') > 0.5));
    const dark = !!burn && burn.getBoundingClientRect().bottom > 70 && +getComputedStyle(burn).getPropertyValue('--lit') > 0.5;
    nav.style.color = dark ? '#f2ebe0' : ''; nav.classList.toggle('on-dark', dark);
  };
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

  // the burn: chapters swap, the hours count, the scents light one by one; buttons go light once it is dark
  if (burn) {
    const chs = $$('.ch', burn), notes = $$('.ch li', burn);
    let active = -1;
    F.scrub(burn, p => {
      chs.forEach((c, i) => {
        const on = still ? i === 0 : p >= +c.dataset.from && p < +c.dataset.to;
        c.classList.toggle('on', on); $('.split', c)?.classList.toggle('in', on);
        if (on && active !== i) {
          const b = $('.big', c);
          if (b) { const to = +b.dataset.to, t0 = performance.now(); const run = now => { const k = Math.min(1, (now - t0) / 1300); b.firstChild.textContent = Math.round(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(run); }; still ? (b.firstChild.textContent = to) : requestAnimationFrame(run); }
        }
        if (on) active = i;
      });
      notes.forEach((n, i) => n.classList.toggle('on', p >= +n.dataset.at && (i === notes.length - 1 || p < +notes[i + 1].dataset.at)));
      burn.classList.toggle('lit', +getComputedStyle(burn).getPropertyValue('--lit') > 0.5);
      solid();
    });
  }

  // scent picker: the glaze changes in 3D, the note changes, the form follows
  $$('[data-scent]').forEach(b => b.addEventListener('click', () => {
    $$('[data-scent]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.dispatchEvent(new CustomEvent('vela:glaze', { detail: b.dataset.scent }));
    const [h, p] = NOTES[b.dataset.scent], note = $('#note');
    if (note) { note.innerHTML = `<h3>${h}</h3><p class="muted">${p}</p>`; if (!still) note.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' }); }
    const sel = $('#f-scent'); if (sel) sel.value = h;
  }));

  // little drawings draw themselves
  $$('.draw').forEach(p => {
    p.style.strokeDasharray = 1; p.style.strokeDashoffset = still ? 0 : 1;
    if (!still) seen(p.ownerSVGElement, () => { p.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = 0; }, 0.5);
  });

  // refill page: the wax pours into the vessel and the level rises, on a 9 second loop
  const pourSvg = $('#pour-loop');
  if (pourSvg) {
    const stream = $('#stream', pourSvg), level = $('#level', pourSvg);
    F.loop(pourSvg, (t, st) => {
      const c = st ? 6 : t % 9, flow = c > 0.8 && c < 5.5 ? 1 : 0, k = st ? 1 : Math.min(1, Math.max(0, (c - 1) / 4.5));
      stream.style.opacity = flow; level.setAttribute('y', 300 - 150 * k); level.setAttribute('height', 150 * k);
    });
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
