// Extra pages: Block's checklist ticks itself off on an 8 second loop (how.html).
const list = document.querySelector('#checklist');
if (list) {
  const items = [...list.children], bar = document.querySelector('#checkbar');
  const ends = [0.1, 0.7, 0.9, 1];                    // the same split as the lesson: 0:30, 3:00, 1:00, 0:30
  Factory.loop(list, (t, still) => {
    const k = still ? 1 : Math.min(1, (t % 8) / 6.5);   // run for 6.5 s, rest on the finished list, then again
    items.forEach((li, i) => {
      const from = i ? ends[i - 1] : 0;
      li.classList.toggle('done', k >= ends[i]); li.classList.toggle('on', k >= from && k < ends[i]);
    });
    bar.style.transform = `scaleX(${k})`;
  });
}
