// Animator: the signature move. The visitor turns Orbit's dial: drag around it, or use arrow keys. Tap to pause.
const dial = document.querySelector('#dial'), knob = dial.querySelector('.knob'), arc = dial.querySelector('.level');
const read = document.querySelector('#dial-read');
let level = 0.4, playing = true, dragging = false, moved = 0, lastA = null;

const show = () => {
  arc.style.strokeDashoffset = 1 - level * 0.75;                  // the ring covers 270 degrees
  knob.style.transform = `rotate(${-135 + level * 270}deg)`;
  dial.setAttribute('aria-valuenow', Math.round(level * 100));
  dial.setAttribute('aria-valuetext', playing ? `Volume ${Math.round(level * 100)}` : 'Paused');
  read.textContent = playing ? `Volume ${String(Math.round(level * 100)).padStart(2, '0')}` : 'Paused';
  dial.classList.toggle('paused', !playing);
};
const angle = e => { const r = dial.getBoundingClientRect(); return Math.atan2(e.clientX - r.left - r.width / 2, r.top + r.height / 2 - e.clientY); };

dial.addEventListener('pointerdown', e => { dragging = true; moved = 0; lastA = angle(e); dial.setPointerCapture(e.pointerId); });
dial.addEventListener('pointermove', e => {
  if (!dragging) return;
  const a = angle(e); let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
  lastA = a; moved += Math.abs(d);
  level = Math.min(1, Math.max(0, level + d / (Math.PI * 1.5))); show();
});
dial.addEventListener('pointerup', () => { dragging = false; if (moved < 0.05) { playing = !playing; show(); } });
dial.addEventListener('keydown', e => {
  const step = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 }[e.key];
  if (step) { level = Math.min(1, Math.max(0, level + step)); e.preventDefault(); show(); }
  if (e.key === 'Enter' || e.key === ' ') { playing = !playing; e.preventDefault(); show(); }
});
show();
