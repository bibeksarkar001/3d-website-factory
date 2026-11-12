#!/usr/bin/env python3
"""check.py <index.html>   The gate for a finished page. Prints each test, then PASS or FAIL (exit 1).
check.py --selftest       Checks the checker."""
import html, os, re, sys, tempfile


def visible_text(src):
    s = re.sub(r'(?is)<(script|style|svg|noscript)\b.*?</\1>', ' ', src)
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'(?s)<!--.*?-->|<[^>]+>', ' ', s)))


def run(path):
    src = open(path, encoding='utf-8').read()
    root = os.path.dirname(os.path.abspath(path))
    text = visible_text(src)
    local = [u for u in re.findall(r'(?:src|href|poster)="([^"#?]+)', src)
             if not re.match(r'(?i)[a-z][a-z0-9+.-]*:|//|/', u)]
    missing = sorted({u for u in local if not os.path.exists(os.path.join(root, u))})
    scenes = re.findall(r'data-spline="[^"]+"|<spline-viewer\b', src)
    raw_scroll = [m for m in re.finditer(r"addEventListener\(\s*['\"](?:scroll|wheel)['\"]", src)
                  if 'passive' not in src[m.start():m.start() + 200]]
    no_alt = [t for t in re.findall(r'<img\b[^>]*>', src) if not re.search(r'\balt=', t)]
    return [
        ('3D scene on the page', bool(scenes), f'{len(scenes)} found'),
        ('at most two 3D scenes', len(scenes) <= 2, ''),
        ('motion graphic drawn in code (Factory.loop)', 'Factory.loop(' in src, ''),
        ('runtime loaded (factory.js + factory.css)', 'factory.js' in src and 'factory.css' in src, ''),
        ('every local file exists', not missing, ', '.join(missing[:4])),
        ('no passive-less scroll or wheel listeners', not raw_scroll, ''),
        ('every image has alt text', not no_alt, f'{len(no_alt)} without'),
        ('mobile viewport set', 'name="viewport"' in src, ''),
        ('no placeholder content', not re.search(r'(?i)lorem ipsum|placeholder\.(png|jpe?g)|via\.placeholder', src), ''),
        ('no hint text over the 3D', not re.search(r'(?i)move your (cursor|mouse)|click to (play|explore)|drag to rotate', text), ''),
        ('brand is marked real or fictional', 'data-real-brand' in src or 'fictional' in text.lower(),
         'add data-real-brand to <html>, or a footer line saying the brand is fictional'),
    ]


def main(path):
    res = run(path)
    w = max(len(n) for n, _, _ in res)
    for name, ok, note in res:
        print(f"  {'ok  ' if ok else 'FAIL'}  {name.ljust(w)}  {note if not ok or 'found' in note else ''}".rstrip())
    fails = sum(not ok for _, ok, _ in res)
    print('PASS' if not fails else f'FAIL ({fails})')
    return 1 if fails else 0


def selftest():
    good = ('<html data-real-brand><meta name="viewport" content="width=device-width">'
            '<link rel="stylesheet" href="factory.css"><script src="factory.js"></script>'
            '<div data-spline="https://app.spline.design/file/x?view=preview"></div>'
            '<img src="a.png" alt="a"><script>Factory.loop(el, d)</script></html>')
    with tempfile.TemporaryDirectory() as d:
        for f in ('factory.css', 'factory.js', 'a.png'):
            open(os.path.join(d, f), 'w').close()
        p = os.path.join(d, 'index.html')
        open(p, 'w').write(good)
        assert all(ok for _, ok, _ in run(p)), [n for n, ok, _ in run(p) if not ok]
        open(p, 'w').write(good.replace('alt="a"', '').replace('a.png', 'gone.png') + 'Lorem ipsum')
        failed = {n for n, ok, _ in run(p) if not ok}
        assert failed == {'every local file exists', 'every image has alt text', 'no placeholder content'}, failed
    print('selftest ok')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    selftest() if sys.argv[1] == '--selftest' else sys.exit(main(sys.argv[1]))
