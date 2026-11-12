/* 3D Website Factory runtime. MIT licence. No dependencies. Load with <script src="factory.js" defer>.

   <div class="f-3d" data-spline="https://app.spline.design/file/ID?view=preview"></div>
        Loads the Spline scene only when it is near the screen, then fades it in.
        The page always scrolls over it and the scene still follows the cursor.
        Add data-shield to stop the scene reacting to the cursor at all.
   <h2 data-reveal>   Fades up once when it scrolls into view.
   Factory.loop(el, draw)
        Calls draw(seconds, still) every frame, only while el is on screen.
        With reduced motion it calls draw(0, true) once: draw the finished picture.
   Factory.scrub(track, p => ...)
        Calls draw(p) as the visitor scrolls through `track` (a tall element with a sticky child), p from 0 to 1.
   Factory.film(canvas, { track, count, src: i => `frames/f_${String(i).padStart(4, '0')}.jpg` })
        Plays an image sequence as the visitor scrolls through `track` (a tall element). */
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('f-still', still);

  const watch = (el, cb, rootMargin = '0px') => {
    const o = new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting, o)), { rootMargin, threshold: 0.15 });
    o.observe(el);
  };

  function loop(el, draw) {
    if (still) return draw(0, true);
    let on = false, t = 0, last = 0;
    const tick = now => {
      if (!on) return;
      t += Math.min(now - last, 100) / 1000; last = now; // clock stops off screen, resumes where it was
      draw(t, false);
      requestAnimationFrame(tick);
    };
    watch(el, vis => { if (vis && !on) { on = true; last = performance.now(); requestAnimationFrame(tick); } else if (!vis) on = false; });
  }

  // Progress of a tall "track" element through the screen: 0 when its top reaches the top of the screen,
  // 1 when its bottom reaches the bottom. Put a position:sticky child inside the track. Reduced motion: draw(1) once.
  function scrub(track, draw) {
    if (still) return draw(1);
    let queued = false, last = -1;
    const paint = () => {
      queued = false;
      const r = track.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      if (p !== last) { last = p; draw(p); }
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); ask();
  }

  function film(canvas, { track, count, src }) {
    const ctx = canvas.getContext('2d'), imgs = [];
    let want = 0, shown = -1, queued = false;
    const paint = () => {
      queued = false;
      const r = track.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      want = still ? count - 1 : Math.round(p * (count - 1));
      let i = want; while (i > 0 && !(imgs[i] && imgs[i].complete && imgs[i].naturalWidth)) i--; // nearest loaded frame
      const im = imgs[i];
      if (!im || !im.naturalWidth || i === shown) return;
      const w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = canvas.clientHeight * devicePixelRatio;
      const s = Math.max(w / im.naturalWidth, h / im.naturalHeight); // cover
      ctx.drawImage(im, (w - im.naturalWidth * s) / 2, (h - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      shown = i;
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    watch(track, (vis, o) => {
      if (!vis) return;
      o.disconnect();
      for (let i = 0; i < count; i++) { const im = imgs[i] = new Image(); im.onload = ask; im.src = src(i + 1); }
      addEventListener('scroll', ask, { passive: true });
      addEventListener('resize', () => { shown = -1; ask(); });
    }, '800px');
  }

  function start() {
    document.querySelectorAll('[data-spline]').forEach(box => watch(box, (vis, o) => {
      if (!vis) return;
      o.disconnect();
      const f = document.createElement('iframe');
      f.src = box.dataset.spline; f.title = box.dataset.title || '3D scene'; f.loading = 'lazy'; f.allow = 'autoplay; fullscreen';
      f.onload = () => box.classList.add('f-on');
      box.append(f);
      // A Spline iframe swallows the mouse wheel, so a clear shield sits over it and the page scrolls.
      // The shield steps aside for 400 ms after each mouse move, so the scene still feels the cursor.
      // data-shield keeps it up all the time (scene animates, ignores the cursor).
      const shield = Object.assign(document.createElement('div'), { className: 'f-shield' });
      box.append(shield);
      if (box.hasAttribute('data-shield')) return;
      let back, wheeled = 0, x, y;
      shield.addEventListener('wheel', () => { wheeled = performance.now(); }, { passive: true });
      shield.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || (e.clientX === x && e.clientY === y) || performance.now() - wheeled < 500) return;
        x = e.clientX; y = e.clientY;
        shield.style.pointerEvents = 'none';
        clearTimeout(back); back = setTimeout(() => { shield.style.pointerEvents = ''; }, 400);
      });
    }, '800px'));
    document.querySelectorAll('[data-reveal]').forEach(el => watch(el, (vis, o) => { if (vis) { el.classList.add('f-in'); o.disconnect(); } }));
    window.__ready = true;
  }

  window.Factory = { loop, scrub, film, still };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
})();
