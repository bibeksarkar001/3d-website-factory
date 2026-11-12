// Builder + animator: what every Ristretto page shares. Nav, words that rise, chapters, magnetic buttons, cursor, forms.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = v => Math.min(1, Math.max(0, v));

// split [data-words] into one span per word, so CSS can raise them one by one from --in
export function splitWords(root = document) {
  root.querySelectorAll('[data-words]').forEach(el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(part);
          const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el); el.style.setProperty('--n', i);
  });
}

// chapters inside a sticky track: each .chap has data-in / data-out (0..1 of the track); CSS reads --in and --out
export function chapters(track, onP) {
  const chaps = [...track.querySelectorAll('.chap')], rail = [...track.querySelectorAll('[data-rail]')];
  const bar = track.querySelector('.rail-fill');
  window.Factory.scrub(track, p => {
    chaps.forEach(c => {
      const a = +c.dataset.in, b = +(c.dataset.out ?? 2);
      const vin = clamp((p - a) / 0.05), vout = clamp((p - b) / 0.04);
      c.style.setProperty('--in', vin); c.style.setProperty('--out', vout);
      c.toggleAttribute('inert', vin - vout < 0.5);
    });
    rail.forEach(r => r.classList.toggle('on', p >= +r.dataset.rail));
    if (bar) bar.style.transform = `scaleX(${p})`;
    onP?.(p);
  });
}

// nav: the phone menu button, and a hairline that appears once the page has scrolled
const nav = document.querySelector('.nav');
document.querySelector('.menu-btn')?.addEventListener('click', e => {
  const open = nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', open);
});
nav?.querySelectorAll('.links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
addEventListener('scroll', () => nav?.classList.toggle('scrolled', scrollY > 40), { passive: true });

// magnetic buttons: they lean toward the cursor
if (fine && !still) document.querySelectorAll('.btn, .mag').forEach(b => {
  b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
  });
  b.addEventListener('pointerleave', () => { b.style.transform = ''; });
});

// cursor: a small brass ring that trails the pointer and opens over things you can press
if (fine && !still) {
  const ring = Object.assign(document.createElement('div'), { className: 'cursor' }); ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; ring.classList.add('show');
    ring.classList.toggle('big', !!e.target.closest('a, button, summary, input, label, [role=slider]')); }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('show'));
  const tick = () => { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; ring.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(tick); };
  tick();
}

// forms are front-end only: check the fields, then swap the form for its success message
document.querySelectorAll('form[data-form]').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault();
  if (!f.reportValidity()) return;
  const ok = f.parentElement.querySelector('.ok');
  f.hidden = true; ok.hidden = false; ok.focus();
}));

export { still, fine, clamp };
