// Animator: every moving thing on the Vanta pages that is not the 3D itself. One rhythm: .8s cubic-bezier(.16,1,.3,1).
(() => {
  const F = window.Factory, still = F.still;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const fmt = (v, dec) => dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-GB');
  const seen = (el, cb, threshold = 0.4) => new IntersectionObserver(([e], o) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { threshold }).observe(el);

  // nav: solid once you leave the top, menu on phones
  const nav = $('#nav');
  const solid = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solid, { passive: true }); solid();
  $('.menu', nav).addEventListener('click', e => { const o = nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  // headlines: split into words that rise out of a mask
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

  // magnetic buttons: they lean toward the cursor
  if (!still) $$('.btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
      b.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });

  // numbers that count when they arrive
  if (!still) $$('[data-count]').forEach(n => {
    const to = +n.dataset.count, dec = +(n.dataset.dec || 0);
    n.textContent = fmt(0, dec);
    seen(n, () => {
      const t0 = performance.now();
      const run = now => { const k = Math.min(1, (now - t0) / 1400); n.textContent = fmt(to * (1 - (1 - k) ** 3), dec); if (k < 1) requestAnimationFrame(run); };
      requestAnimationFrame(run);
    }, 0.6);
  });

  // lines that draw themselves as you scroll past
  const drawn = $$('.draw, .road');
  if (drawn.length) {
    drawn.forEach(p => { p.style.strokeDasharray = 1; p.style.strokeDashoffset = still ? 0 : 1; });
    if (!still) {
      const paint = () => drawn.forEach((p, i) => {
        const r = p.ownerSVGElement.getBoundingClientRect();
        p.style.strokeDashoffset = 1 - sm(innerHeight * 0.95, innerHeight * 0.3, r.top + i * 14);
      });
      addEventListener('scroll', paint, { passive: true }); paint();
    }
  }

  // ---- home: the run, five chapters on one track ----
  const run = $('#run');
  if (run) {
    const chapters = $$('.chapter', run), idx = $$('.index li', run), line = $('.index', run), stats = $$('.stat', run), kmh = $('#kmh');
    F.scrub(run, p => {
      chapters.forEach((c, i) => {
        const on = p >= +c.dataset.from && p < +c.dataset.to;
        c.classList.toggle('on', on); $('.split', c)?.classList.toggle('in', on);
        idx[i]?.classList.toggle('on', on);
      });
      line.style.setProperty('--p', p);
      stats.forEach(s => {
        const k = sm(+s.dataset.from, +s.dataset.to, p), b = $('b', s);
        s.style.setProperty('--p', k);
        b.firstChild.textContent = fmt(+b.dataset.to * k, +(b.dataset.dec || 0));
      });
      // the speed readout follows the same curve as the road in the 3D
      kmh.textContent = String(Math.round(250 * sm(0.13, 0.42, p) * (1 - sm(0.58, 0.74, p)))).padStart(3, '0');
    });
  }

  // ---- home: configurator, tells the 3D what changed ----
  const studio = $('#studio-car');
  if (studio) {
    const state = { paint: 'Copper Flare', rims: 'satin black' };
    const say = () => { $('#spec-line').textContent = `${state.paint}, ${state.rims} wheels`; $('#paint-name').textContent = state.paint; };
    const press = (btn) => $$('button', btn.parentElement).forEach(b => b.setAttribute('aria-pressed', b === btn));
    const send = (type, detail) => studio.dispatchEvent(new CustomEvent(type, { detail }));
    $$('[data-paint]').forEach(b => b.addEventListener('click', () => {
      press(b); state.paint = b.dataset.name; say(); send('vanta:paint', b.dataset.paint);
      const sel = $('#f-paint'); if (sel) sel.value = b.dataset.name;
    }));
    $$('[data-rims]').forEach(b => b.addEventListener('click', () => { press(b); state.rims = b.textContent.toLowerCase(); say(); send('vanta:rims', b.dataset.rims); }));
    $$('[data-lights]').forEach(b => b.addEventListener('click', () => { press(b); send('vanta:lights', b.dataset.lights === '1'); }));
  }

  // ---- forms: front end only, with a success state ----
  $$('form').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const sec = f.closest('section'), done = $('.done', sec), name = f.elements.name?.value.trim().split(' ')[0];
    sec.classList.add('sent');
    if (name) $('h3', done).textContent = `Thanks, ${name}. You're on the list.`;
    done.setAttribute('tabindex', '-1'); done.focus();
  }));

  // ---- design page: the wheel's finish toggle, and quotes of the line ----
  $$('[data-finish]').forEach(b => b.addEventListener('click', () => {
    $$('[data-finish]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('#wheel')?.dispatchEvent(new CustomEvent('vanta:rims', { detail: b.dataset.finish }));
  }));

  // ---- charging page: the charge curve fills with scroll ----
  const charge = $('#charge');
  if (charge) {
    const pct = $('#pct'), min = $('#min'), dot = $('#dot'), path = $('#curve'), fill = $('#fill'), len = path.getTotalLength();
    F.scrub(charge, p => {
      const k = sm(0.1, 0.85, p), pt = path.getPointAtLength(len * k);
      path.style.strokeDashoffset = 1 - k;
      fill.style.clipPath = `inset(0 ${100 - k * 100}% 0 0)`;
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      pct.textContent = Math.round(10 + 70 * k); min.textContent = Math.round(18 * k);
      $$('.step', charge).forEach((s, i) => s.classList.toggle('on', k >= i / 3 - 0.001));
    });
  }
})();
