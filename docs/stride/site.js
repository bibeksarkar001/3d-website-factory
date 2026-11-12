// Page-wide life: words that arrive, magnetic buttons, counters, the nav, the waitlist form.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = (el, cb, margin = '0px 0px -12% 0px') => {
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { cb(e.target); o.unobserve(e.target); } }), { rootMargin: margin });
    o.observe(el);
  };

  // headlines arrive word by word
  document.querySelectorAll('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) return frag.append(w);
          const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++);
          const inner = document.createElement('span'); inner.textContent = w; s.append(inner); frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
    if (still) el.classList.add('in'); else seen(el, t => t.classList.add('in'));
  });

  // numbers count up once when they arrive
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, dec = (el.dataset.count.split('.')[1] || '').length;
    if (still) return void (el.textContent = to.toFixed(dec));
    el.textContent = (0).toFixed(dec);
    seen(el, () => {
      const t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 1400), e = 1 - (1 - k) ** 3; el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  });

  // buttons lean toward the cursor
  if (!still && matchMedia('(pointer: fine)').matches) document.querySelectorAll('.btn, [data-magnet]').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  // nav: solid once the page moves, menu on phones
  const nav = document.querySelector('.nav');
  if (nav) {
    const set = () => nav.classList.toggle('solid', scrollY > 40);
    addEventListener('scroll', set, { passive: true }); set();
    const btn = nav.querySelector('.menu');
    btn?.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    nav.querySelectorAll('.links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); btn?.setAttribute('aria-expanded', false); }));
  }

  // waitlist: front-end only, shows a success state
  document.querySelectorAll('form[data-waitlist]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    if (!f.checkValidity()) return f.reportValidity();
    f.classList.add('done');
    const ok = f.querySelector('.ok'); ok.hidden = false; ok.focus();
  }));

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
