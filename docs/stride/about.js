// About page: a long run drawn as you scroll. The route draws itself, the runner rides it, the kilometres count to 30.
const track = document.querySelector('#route'), path = document.querySelector('#runpath'), runner = document.querySelector('#runner');
const km = document.querySelector('#km'), line = document.querySelector('#kmline');
const beats = [
  [0, 'Every Stride prototype starts here: a long Sunday run.'],
  [8, 'Ten kilometres in, any shoe feels fine.'],
  [20, 'Twenty. This is where a soft shoe starts to feel flat.'],
  [28, 'Thirty. The part we design for.'],
];
const len = path.getTotalLength();
let said = '';
Factory.scrub(track, p => {
  const k = Math.min(1, p / 0.9);                      // finish a little early so the end rests on screen
  path.style.strokeDashoffset = 1 - k;
  const pt = path.getPointAtLength(len * k);
  runner.setAttribute('cx', pt.x); runner.setAttribute('cy', pt.y);
  const d = Math.round(k * 30);
  km.textContent = d;
  const text = beats.filter(b => d >= b[0]).pop()[1];
  if (text !== said) { said = text; line.textContent = text; }
});
