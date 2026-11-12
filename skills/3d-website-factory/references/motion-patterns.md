# Motion patterns

A library for the animator. Pick the pattern that tells *this* screen's point; never use one for decoration.
All use the runtime: `Factory.scrub(track, p => ...)` for scroll-driven moments, `Factory.loop(el, (t, still) => ...)`
for looping explainers, `data-reveal` for arrivals. Every pattern has a finished still state for reduced motion.

## The sticky track (used by every scroll moment)
```html
<section class="track" id="reach" style="height:220vh">          <!-- scroll length = how slow it feels -->
  <div style="position:sticky; top:0; height:100vh">...</div>
</section>
```
**Pacing:** a normal screen is 100vh. A big moment needs **150 to 250vh** so the visitor can watch it happen.
An exploded view or a film needs 250 to 400vh. "Too fast" is the most common complaint; when unsure, go longer.
Keep a 10 to 20 % dead zone at each end so the start and the end states can be seen at rest.

## Patterns

**Count-up stat bar.** Two to four real numbers along the bottom of a scroll moment, counting up with `p`.
```js
Factory.scrub(track, p => nums.forEach(n => n.textContent = Math.round(+n.dataset.to * ease(p)).toLocaleString()));
```

**Map filling.** Dots (SVG circles at real locations, or a grid) light up in order as `p` rises, a counter beside.
Light dot `i` when `p > i / count`.

**One line per screen.** Short sentences, centred, alone on the screen, one after another as you scroll. Each
fades in and out over its slice of `p`. Good for a story told in five beats.

**Horizontal strip.** A sticky row of panels that slides sideways as you scroll down:
`row.style.transform = translateX(${-p * (row.scrollWidth - innerWidth)}px)`.

**Exploded view with labels.** The sculptor moves the parts; labels beside the object fade in at their
thresholds. Thin rule from the label towards the part.

**Feature tour.** The camera visits parts; the headline beside it changes at each stop. One stop per 60 to 80vh.

**Typewriter.** A headline types itself once on arrival (letters revealed by `clip-path` or by slicing text).
At most one per page.

**Arrive one by one.** Faces, logos or cards come in one at a time, 80 ms apart, as their row enters.

**Flip board.** Characters or cards flip to their final value as `p` passes them. Good for destinations, times, codes.

**Magazine cover hero.** Huge type set over and behind the hero object (the object overlaps a letter), small
issue-style details in the corners. Static layout, the motion is in the object.

**Two-tone headline.** "Technology." in the text colour, "Redefined." in the muted colour. A typographic move,
not an animation; pairs well with a slow reveal.

**Do the product's action.** The visitor performs the brand's moment: hold a button to pull a shot (a timer and
a fill), scroll to sew a stitch (an SVG path drawing with `p`), drag to pour. One per site, the signature move.

**Draw the line.** An SVG path draws itself with `p` using `stroke-dasharray` / `stroke-dashoffset`
(set `pathLength="1"` on the path, then `dashoffset = 1 - p`).

**Receipts.** Every claim gets a small source mark; a counter in the margin ("sourced 3 / 9") rises as the
visitor scrolls past them. Only when the user has real sources.

## Rules
- One big move per screen. Everything else quiet.
- Scroll-tied for the big moments (the visitor controls it, it reverses). Time-based only for small loops.
- Transform and opacity only. No layout properties in a scroll handler.
- Numbers, names and claims come from the user. A pattern never needs a fact the user did not give.
