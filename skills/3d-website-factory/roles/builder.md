# Role: Builder

You stitch everything into one website that feels made in one piece: the scout's plan, the sculptor's
objects, the animator's motion, the user's words and images.

**Reads:** everything in `_work/<slug>/`, `sites/<slug>/3d/`, `sites/<slug>/motion.js`, `assets/`.
**Writes:** `sites/<slug>/index.html` and what it loads. For job C: the user's own files, as few as possible.

## Page skeleton

```html
<!doctype html>
<html lang="en" data-real-brand>   <!-- or a footer line saying the brand is fictional -->
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
  <link rel="stylesheet" href="factory.css">
  <script src="factory.js" defer></script>
  <style>/* design.md as CSS custom properties, then the page */</style>
</head>
<body>
  <section class="hero">
    <div class="copy">...</div>
    <div id="hero-mark" class="f-3d" style="height:80vh"><img src="assets/hero-still.png" alt="..."></div>
  </section>
  ...
  <script type="module" src="3d/hero-mark.js"></script>
  <script type="module" src="motion.js"></script>
</body>
</html>
```

Copy `runtime/factory.js`, `factory.css` and `stage.js` from the skill into `sites/<slug>/`.
Scroll moments use a sticky track and `Factory.scrub` (see `references/motion-patterns.md`).
The image inside a 3D box is the fallback if WebGL fails. It is replaced by the canvas when the object is ready.
A Spline scene uses `<div class="f-3d" data-spline="URL" data-title="...">` instead (see SKILL.md).

## A real website, not a one-page demo
- A working nav, the home page journey, features or specs (designed, not a card grid), a configurator or picker
  where the product has variants (it changes the 3D live), FAQ or details, a signup or contact form with a
  success state, and a rich footer (columns, small print).
- The extra pages from `sections.md` share the design system, nav and footer, each with a small 3D or motion moment.
- Check every page in a browser for console errors; probe the home page.

## Stitching rules
- **design.md is law.** Every colour, size and radius comes from its tokens. No new ones.
- **The page takes the 3D's background.** Objects sit on the page, never in a visible box.
- **Never text over a busy 3D object.** Copy on one side, object on the other, or copy above.
- **One screen, one point, one ask.** As planned in `sections.md`.
- **Words:** only the user's facts. Never invent numbers, prices, customers, quotes, awards or logos.
  A section missing its facts is dropped, not filled.
- **Copy pass.** After the page works, go through every line against `references/taste.md` (the tells and the
  principles). Write `_work/<slug>/copy.md`: a table of old line → new line → why, so the user can veto any
  change. In job C, only propose; change the user's words only if they say yes.
- **Phones:** stack copy above the object. Objects get shorter (50 to 60 vh). The headline must work
  without the 3D.
- **Weight:** under 3 MB before the 3D library and models. Images in WebP or AVIF, with width and height.
- If a Spline scene's or a model's licence requires credit, put it in the footer. Otherwise no credits.

## Interactions the user asked for
Do what the user asked even when it is not in the plan, as long as the page still scrolls and reads.
The sculptor's table covers the usual 3D asks. Wire page-level ones here: a button that triggers the
object, a section that changes the object's colour, a cursor-following light.

## Gate
```sh
python3 "$S/scripts/check.py" sites/<slug>/index.html
python3 -m http.server 8765 --bind 127.0.0.1 --directory sites/<slug> &
node "$S/scripts/probe.mjs" http://127.0.0.1:8765 _work/<slug>
```
Both print PASS. Look at `desk.png`, `phone.png` and the journey sheet `journey.png` yourself. Then hand over to the critic.
Stop the server when the critic is done.
