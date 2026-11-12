#!/usr/bin/env node
// probe.mjs <url> <outdir>
// Opens the page in headless Chrome the way a visitor would and reports what a screenshot alone cannot:
//   - desk.png (1440x900) and phone.png (390x844, real phone emulation), taken after the 3D has loaded (second visit)
//   - whether the mouse wheel still scrolls the page while the cursor is over each 3D scene
//   - journey-<depth>.jpg at 0/25/50/75/100 % of the page and journey.png, a contact sheet of them
//   - sideways overflow on the phone, and console errors
// Exit 1 if anything fails. Needs Node 22+ and Chrome. No packages.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out] = process.argv.slice(2);
if (!url || !out) { console.error('usage: node probe.mjs <url> <outdir>'); process.exit(2); }
const chrome = [process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p => p && existsSync(p));
if (!chrome) { console.error('No Chrome found. Install Chrome or set CHROME_PATH.'); process.exit(2); }

mkdirSync(out, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'probe-'));
const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars',
  '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
const SEL = "'[data-spline], .f-3d'"; // every 3D box, quoted for use inside page code: Spline scenes and code-built objects
// Ready = the runtime started, or the page has loaded and has no runtime (a site before the upgrade).
const READY = `window.__ready === true || (document.readyState === 'complete' && !window.Factory)`;

try {
  const wsUrl = await new Promise((ok, no) => {
    let buf = ''; setTimeout(() => no(new Error('Chrome did not start')), 20000);
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/ws:\/\/\S+/); if (m) ok(m[0]); });
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const waiting = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && m.params.entry.url?.startsWith(new URL(url).origin) && !m.params.entry.url.endsWith('/favicon.ico')) errors.push(`${m.params.entry.text} ${m.params.entry.url}`);
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, no) => {
    waiting.set(++id, m => m.error ? no(new Error(`${method}: ${m.error.message}`)) : ok(m.result));
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (m, p) => send(m, p, s);
  const js = async expr => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable');

  const load = async (width, height, mobile) => {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await cdp('Page.navigate', { url });
    for (let i = 0; i < 60 && !(await js(READY)); i++) await sleep(250);
    const has3d = await js(`document.querySelectorAll(${SEL}).length`);
    for (let i = 0; i < 100 && has3d && !(await js(`[...document.querySelectorAll(${SEL})].every(e => e.classList.contains('f-on'))`)); i++) await sleep(250);
    await sleep(has3d ? +(process.env.PROBE_WAIT || 8000) : 1200); // let the scene draw; raise PROBE_WAIT on a slow machine
  };
  const shot = async name => {
    const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(out, name), Buffer.from(data, 'base64')); console.log(`  saved ${join(out, name)}`);
  };

  await load(1440, 900, false);
  // A first visit downloads the whole Spline viewer (slow, dark loading screen). Load again so the shots show the scene.
  if (await js(`document.querySelectorAll(${SEL}).length`)) { console.log('  loaded once to warm the 3D cache'); await load(1440, 900, false); }
  if (!(await js(READY))) fails.push('page never finished loading (or factory.js never set window.__ready)');
  await shot('desk.png');

  const scenes = await js(`document.querySelectorAll(${SEL}).length`);
  for (let i = 0; i < scenes; i++) {
    const p = JSON.parse(await js(`(async () => {
      const el = document.querySelectorAll(${SEL})[${i}];
      el.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise(r => setTimeout(r, 400));
      const r = el.getBoundingClientRect();
      return JSON.stringify({ x: r.left + r.width / 2, y: Math.min(innerHeight - 40, Math.max(40, r.top + r.height / 2)), y0: scrollY,
        room: document.documentElement.scrollHeight - innerHeight - scrollY, loaded: el.classList.contains('f-on') });
    })()`));
    if (!p.loaded) { fails.push(`3D scene ${i + 1} did not load`); continue; }
    if (p.room < 50) { console.log(`  scene ${i + 1}: no room below it to test the wheel`); continue; }
    await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await sleep(300);
    for (let k = 0; k < 3; k++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: p.x, y: p.y, deltaX: 0, deltaY: 200 }); await sleep(250); }
    await sleep(600);
    const moved = (await js('scrollY')) - p.y0;
    console.log(`  scene ${i + 1}: wheel over the 3D moved the page ${Math.round(moved)}px`);
    if (moved < 50) fails.push(`3D scene ${i + 1} traps the scroll: add data-shield to its box`);
  }

  // The journey: shots down the page, then one contact sheet so the whole scroll story can be judged at a glance.
  const depths = [0, 0.25, 0.5, 0.75, 1], journey = [];
  for (const d of depths) {
    await js(`scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * ${d}, behavior: 'instant' })`);
    await sleep(900);
    const { data } = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
    journey.push(data);
    writeFileSync(join(out, `journey-${Math.round(d * 100)}.jpg`), Buffer.from(data, 'base64'));
  }
  await js(`document.open(); document.write('<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:6px;align-content:start">' +
    ${JSON.stringify(journey)}.map((d, i) => '<figure style="margin:0;font:12px system-ui;color:#fff"><img style="width:100%;display:block" src="data:image/jpeg;base64,' + d + '">' + ['0', '25', '50', '75', '100'][i] + ' %</figure>').join('') + '</body>'); document.close(); 1`);
  await sleep(600);
  await shot('journey.png');
  console.log(`  saved journey-0..100.jpg (${depths.length} depths)`);

  await load(390, 844, true);
  await shot('phone.png');
  const over = await js('document.documentElement.scrollWidth - innerWidth');
  if (over > 2) fails.push(`phone layout is ${over}px wider than the screen`);
  [...new Set(errors)].forEach(e => fails.push(`console error: ${String(e).slice(0, 200)}`));
  ws.close();
} catch (e) { fails.push(String(e.message || e)); }
finally { proc.kill(); await sleep(300); rmSync(profile, { recursive: true, force: true }); }

fails.forEach(f => console.log(`  FAIL  ${f}`));
console.log(fails.length ? `FAIL (${fails.length})` : 'PASS');
process.exit(fails.length ? 1 : 0);
