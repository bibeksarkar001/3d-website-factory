# Layer 3: the scroll film

A film that plays forward and back as the visitor scrolls. Optional. Read this only when the user asks for it.

## What makes it work
- **One continuous camera move.** Push in, pull back, or orbit. Never a slideshow of scenes: if two moments
  could swap places and nobody would notice, it is not a shot.
- 8 to 15 seconds is plenty. No sound. No text inside the footage (generated text is mush).
- It gets its own section. Captions sit beside the film, never on top of it.
- End on something the next section shows, so the page feels like one world.

## Where the footage comes from
1. **The user's own video.** Free. A slow, steady shot from `assets/` works well. Skip to "Turn it into frames".
2. **AI video.** Costs money. Any tool that takes a start image and an end image works. If the Higgsfield CLI
   is installed (`npm install -g @higgsfield/cli`, the user logs in themselves), use it:
   run `higgsfield --help` and its cost command to learn the current commands and prices. They change.
   Do not rely on memory.

   **Quote the total and wait for a yes before generating anything.** Log each spend in `sites/<slug>/ledger.tsv`.

   Method that avoids wasted money:
   - Make 3 to 5 still keyframes first (cheap). Each new keyframe uses the one before it as its reference:
     same place, same light, same camera direction, one change per step (usually distance).
   - Look at them side by side. Remake any that turn the camera or change the room. Stills are cheap, clips are not.
   - One clip per pair of keyframes, start and end both pinned, audio off. Start each clip on the previous
     clip's exact last frame: `ffmpeg -sseof -0.1 -i c1.mp4 -frames:v 1 c1-last.png`.
   - Watch every clip. A clip with a hidden jump cut is not used: move its keyframes closer and remake it.
   - Join: `ffmpeg -f concat -safe 0 -i list.txt -an -c:v libx264 -crf 18 film.mp4`.

## Turn it into frames

```sh
mkdir -p sites/<slug>/frames
ffmpeg -i film.mp4 -vf "fps=24,scale=1600:-2" -q:v 4 sites/<slug>/frames/f_%04d.jpg
ls sites/<slug>/frames | wc -l        # this is `count`
```

Keep the total under about 25 MB. Lower the fps or the width before lowering quality.

## Put it on the page

```html
<section id="film" style="height:400vh">
  <div style="position:sticky;top:0;height:100vh;display:grid;grid-template-columns:1fr 1.6fr;align-items:center;gap:4vw;padding:0 6vw">
    <div><h2 data-reveal>Short heading</h2><p data-reveal>One line.</p></div>
    <canvas id="film-canvas" style="width:100%;aspect-ratio:16/9;border-radius:16px"></canvas>
  </div>
</section>
<script>
  addEventListener('DOMContentLoaded', () => Factory.film(document.querySelector('#film-canvas'), {
    track: document.querySelector('#film'), count: 240,
    src: i => `frames/f_${String(i).padStart(4, '0')}.jpg`,
  }));
</script>
```

The taller the section, the slower the film. With reduced motion the runtime shows the last frame.
On a phone, stack the caption above the canvas.

## Gate
Scroll slowly through the whole section: no jump, no frozen stretch, no blank canvas. Check a phone-sized screenshot.
