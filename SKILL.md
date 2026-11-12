---
name: 3d-website-factory
description: Build a 3D website from a folder of content and assets, or add 3D to an existing website. Live interactive Spline 3D hero, motion graphics drawn in code, optional AI scroll film. Use when the user says /3d-website-factory, "3D website", "website factory", "set up the website factory", "build me this as a website", "make my website 3D", "add 3D to my site", "add a Spline scene", or "add a scroll film".
---

# 3D Website Factory

Builds websites with three layers that move for a reason:

| Layer | What | Made with | Cost |
|---|---|---|---|
| 1. Live 3D | One showpiece the visitor can play with | Spline scene | Free |
| 2. Motion graphics | Looping diagrams that explain the product | You, in code (SVG, canvas, CSS) | Free |
| 3. Scroll film | One camera move that plays as the visitor scrolls | AI video or the user's own footage | Paid, optional |

`S` below is the folder this file is in. Requirements: Chrome, Python 3, Node 22+. Layer 3 also needs ffmpeg.
Keep your own work files (screenshots, notes) in the workspace's `_work/<slug>/`, never inside `sites/<slug>/`,
so the site folder stays ready to upload.

Pick the job from what the user said:

| They say | Job |
|---|---|
| "set up", first use, or no workspace exists | A. Set up |
| "build me this", "build the site for X" | B. Build |
| "make my website 3D", "add 3D to this site" | C. Upgrade an existing site |
| "add a film", "add video" | D. Film (read `references/film.md`) |

## A. Set up

```sh
sh "$S/scripts/init.sh"        # creates ./website-factory, never overwrites
```

Then tell the user, in plain words: content goes in `content/`, logo in `assets/logo/`, pictures in
`assets/images/`, look-and-feel references in `assets/style/`, and to say "build me this as a website".
Do not build anything until they have added content or asked for a demo.

## B. Build

Work inside the workspace. One site per file in `content/` (skip names starting with `_`, and skip files
that already have a folder in `sites/` unless asked to rebuild). `slug` = file name in kebab-case.
The site goes in `sites/<slug>/`.

1. **Read everything.** The content file, every file in `assets/`. Look at the images.
2. **Fix the look.** Take it from, in order: the reference in the brief, screenshots in `assets/style/`,
   or a real site you pick that suits the brand (calm, big type, big images). Look at the reference
   (`sh "$S/scripts/browser.sh" shot <url> _work/<slug>/ref.png`). Write `sites/<slug>/design.md`: exact colours, fonts
   and weights, type sizes, corner radius, button shape, spacing. Borrow structure and rhythm.
   Never copy the reference's words, images, logo or code.
3. **Lay out the page** as one `index.html` with its CSS inline. Order:
   hero with the 3D, one-sentence statement, three short feature blocks, the motion graphic, a calm closing
   call to action, footer. One thought per section. Copy on one side, visual on the other.
   Never put text on top of a busy scene.
4. **Add the 3D** (Layer 1, rules below).
5. **Draw the motion graphic** (Layer 2, rules below).
6. **Copy the runtime:** `cp "$S"/runtime/factory.* sites/<slug>/` and load both in the page.
   Copy the assets you use into `sites/<slug>/assets/`.
7. **Check it** (gate below). Fix and repeat until it passes and looks right.
8. **Report** in `sites/<slug>/REPORT.md` and in chat: what each layer is, every choice you made that the
   user left open, the check result, what is still open. Give the preview command.

### Layer 1: the 3D

- **One showpiece per site, two at most.** A character or the brand mark, big. Not an abstract blob.
- Get the scene, cheapest first:
  1. **Community scene** (free, no account). From the brief, or search community.spline.design.
     `sh "$S/scripts/browser.sh" embed <community-url>` prints the embeddable URL.
     Credit the scene's author by name in the footer.
     That URL loads Spline's whole editor: about 15 seconds and a dark loading screen on a first visit.
     Fine for a demo. For a real site, tell the user to open the scene in Spline (free account), Remix it,
     then Export > Public URL, and give you the `my.spline.design/...` link. It loads in a second or two.
  2. **The user's own exported scene** (`my.spline.design/...` public URL).
  3. **Build one** through the Spline connector, only if it is connected and the user asks. It has a daily call
     limit: plan the scene, build it in as few calls as you can, and say how many you used.
- Put it on the page:
  ```html
  <div class="f-3d" data-spline="SCENE_URL" data-title="Robot that follows the cursor" style="height:100vh"></div>
  ```
  `factory.js` loads it lazily, fades it in, and oversizes it so the viewer's corner buttons stay out of sight.
- **The page takes the scene's background colour,** not the other way round. Look at the scene first, then pick
  the page colours. A scene in a box of a different colour looks pasted on.
- **The page must always scroll.** Put the cursor over the scene and use the wheel. If the page does not move,
  add `data-shield` to the box (the scene keeps animating but stops reacting to the cursor). Tell the user you did.
- No "move your cursor" or "click to play" labels.
- On phones the scene may be heavy. Keep the headline readable without it.

### Layer 2: the motion graphic

- Write the story in one sentence first. It must be true only for this product ("you say the order, the bill
  writes itself, the total counts up"). If the sentence fits any company, it is decoration: think again.
- Draw it in SVG or canvas inside the page. No libraries, no images of diagrams.
- Drive it with the runtime so it pauses off screen and respects reduced motion:
  ```js
  Factory.loop(document.querySelector('#how'), (t, still) => {
    // t = seconds on screen. If still is true, draw the finished picture once.
  });
  ```
- Loop of 8 to 16 seconds. Something visibly changes every 1 to 2 seconds. At most 6 words visible inside it.
- Animate only transform, opacity and stroke offsets. Ease in and out. Nothing flashes.
- Headings, cards and buttons get `data-reveal` for a soft arrival. Nothing else needs animating.

### The words

- Only facts from the user's content. Never invent numbers, prices, customers, quotes, awards or partner logos.
  If a section needs a fact you do not have, drop the section.
- Short and specific. Headings of 3 to 7 words. Buttons say what happens ("Join the waitlist").
- Real brand: add `data-real-brand` to `<html>`. Demo brand: the footer says it is fictional.

### The gate

```sh
python3 "$S/scripts/check.py" sites/<slug>/index.html                       # must print PASS
python3 -m http.server 8765 --bind 127.0.0.1 --directory sites/<slug> &     # stop it when done
node "$S/scripts/probe.mjs" http://127.0.0.1:8765 _work/<slug>              # must print PASS
```

`probe.mjs` waits for the 3D, saves `desk.png` and `phone.png`, scrolls with the mouse over each scene,
and checks the phone width and the console. If the 3D is still loading in the screenshots, set `PROBE_WAIT=15000`.
Look at both screenshots. Fix the three worst things. Repeat until it would not embarrass the reference.
Stop the server. Never leave one running.

## C. Upgrade an existing site

The user runs this inside their own website's folder. The site stays theirs: same design, same words.

1. **Understand it first.** Find the stack (plain HTML, React or Next, Vue, Astro, WordPress theme, other),
   how it runs, and where the hero and the "how it works" section live. Read the brand colours and fonts
   from the code.
2. **Propose before touching anything:** which scene goes where, what the motion graphic will show, which
   files change. Wait for a yes.
3. **Work safely.** If it is a git repo, make a branch. Change as few files as possible. Do not restyle,
   reword, reorder or upgrade dependencies.
4. **Add the layers the native way:**
   - Copy `runtime/factory.js` and `factory.css` into the site's static folder and load them once.
   - Plain HTML: the same `data-spline` box as above.
   - React, Next, Vue, Astro: a small component that renders the same box. Client-side only.
     The runtime starts on page load; in a single-page app call the same markup after mount.
   - WordPress: add it in a child theme or a custom HTML block. Never edit a live site or a parent theme directly.
   - Match the scene's background and the graphic's colours to the existing brand.
5. **Gate:** the site's own build and tests still pass. Start its dev server and run
   `node "$S/scripts/probe.mjs" <its url> _work/before` before your change and `_work/after` after it
   (put `_work/` outside the repo or in `.gitignore`). Compare the screenshots. `check.py` is for job B pages only.
6. **Never deploy or push.** Show the diff and how to preview. The user ships it.

## Rules that always hold

- **Money.** Layers 1 and 2 are free. Anything paid (AI images, AI video, a Spline plan) needs the user's yes
  to a quoted cost in this conversation, every time.
- **Truth.** Nothing invented. See "The words".
- **Access.** Reduced motion gets a still page. Images have alt text. Text keeps readable contrast.
- **Other people's work.** Credit Spline scene authors. Do not copy a reference site's content.
- **Clean up.** Stop every server and browser you started.
