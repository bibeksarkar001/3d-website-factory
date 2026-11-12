// Shared page behaviour for every Sieve page: nav, magnetic buttons, word reveals, cursor light, forms, FAQ.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

// nav: solid after the first screen, menu button on phones
const nav = document.querySelector('.nav');
const solid = () => nav.classList.toggle('solid', scrollY > 40);
addEventListener('scroll', solid, { passive: true }); solid();
const menu = nav.querySelector('.menu');
menu?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('.links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// headlines arrive word by word: wrap each word, the stagger comes from --i
document.querySelectorAll('[data-words]').forEach(el => {
  let i = 0;
  const wrap = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(w => {
        if (!w.trim()) return frag.append(w);
        const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++);
        s.innerHTML = `<span>${w}</span>`; frag.append(s);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
  });
  wrap(el);
  if (!el.closest('.ch')) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { el.classList.add('on'); o.disconnect(); } }, { threshold: .3 }).observe(el);
});

// magnetic buttons: they lean toward the cursor
if (!still) document.querySelectorAll('.btn').forEach(b => {
  b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`;
  });
  b.addEventListener('pointerleave', () => { b.style.transform = ''; });
});

// a soft light follows the cursor across the page
if (!still) addEventListener('pointermove', e => {
  document.body.style.setProperty('--mx', e.clientX + 'px');
  document.body.style.setProperty('--my', e.clientY + 'px');
}, { passive: true });

// forms are front-end only: show the success state
document.querySelectorAll('form[data-success]').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault();
  if (!f.reportValidity()) return;
  f.classList.add('sent');
  const ok = f.querySelector('.ok'); ok.hidden = false; ok.focus();
}));

// FAQ: one open at a time
document.querySelectorAll('.faq details').forEach(d => d.addEventListener('toggle', () => {
  if (d.open) document.querySelectorAll('.faq details').forEach(o => o !== d && (o.open = false));
}));
