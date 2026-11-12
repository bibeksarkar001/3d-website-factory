---
name: 3d-website-factory
description: Build a 3D website from a folder of content and assets, or turn an existing website into a 3D one. A five-role pipeline (scout, sculptor, animator, builder, critic) makes real 3D objects in code (three.js, the user's logo or models, Spline), studio-style motion graphics, and stitches them into the site with the interactions the user asks for. Use when the user says /3d-website-factory, "3D website", "website factory", "set up the website factory", "build me this as a website", "make my website 3D", "add 3D to my site", "make my logo 3D", "make it react to the cursor", "add a Spline scene", or "add a scroll film".
---

# 3D Website Factory

`S` below is the folder this file is in. Requirements: Chrome, Python 3, Node 22+. The film also needs ffmpeg.

## The pipeline

```
           ┌──> Sculptor (3D objects) ──┐
Scout ─────┤                            ├──> Builder (stitch) ──> Critic ──┐
(plan)     └──> Animator (motion) ──────┘        ^                         │
   ^ user approves the plan                      └──── fixes, max 3 rounds ┘
```

| Role | Brief | Makes |
|---|---|---|
| Scout | `roles/scout.md` | The plan: facts, design system from a gold-standard reference, screens, 3D object list |
| Sculptor | `roles/sculptor.md` | One three.js module per 3D object (or a Spline scene) |
| Animator | `roles/animator.md` | Explainer loops, scroll choreography, arrivals |
| Builder | `roles/builder.md` | The website, everything stitched in, the user's interactions wired up |
| Critic | `roles/critic.md` | Pass or fail against ten fixed questions, with fixes |

The roles talk only through files in the workspace: the plan in `_work/<slug>/`, the code in `sites/<slug>/`.
So any role can be redone alone ("make the 3D glossier" is a sculptor job, then builder and critic).

**Running the roles.** If your tool can start sub-agents (Claude Code, Codex, Cursor and others), start one
per role with this prompt, and run the sculptor and the animator at the same time:

> You are the <role> of 3D Website Factory. Read `<S>/roles/<role>.md` and `<S>/references/taste.md`,
> then do your role for the site `<slug>` in the workspace `<absolute path>`. The skill folder is `<S>`.
> Report what you wrote and anything you could not do.

If not, play the roles yourself in order, reading each brief just before you start it.
Either way you are the conductor: you talk to the user, check each hand-off exists, and stop at the gates.

**Gates where the user decides:** the scout's interview and its summary (reference, look, hero concept, screens,
objects with costs), before anything paid, and at the end. Everything else runs without asking.

**Progress.** A build can take an hour. Before each role starts, tell the user in one line what it is doing
("Sculptor: building the clay logo, free"), and after it, what it made.

## Jobs

| They say | Job |
|---|---|
| "set up", first use, or no workspace exists | A. Set up |
| "build me this", "build the site for X" | B. Build |
| "make my website 3D", "add 3D to this site" | C. Upgrade an existing site |
| "make the robot follow the cursor", "change the 3D", any change to a built site | D. Change |
| "add a film", "add video" | E. Film (`references/film.md`) |

### A. Set up
```sh
sh "$S/scripts/init.sh"        # creates ./website-factory, never overwrites
```
Tell the user in plain words: words go in `content/`, the logo in `assets/logo/` (SVG is best, it can become 3D),
pictures in `assets/images/`, 3D models in `assets/models/`, sites they like in `assets/style/`.
Then say "build me this as a website". Do not build until there is content or they ask for a demo.

### B. Build
One site per file in `content/` (skip names starting with `_`, and files that already have a folder in
`sites/` unless asked to rebuild). `slug` = the file name in kebab-case.
Run the full pipeline. At the end, write `sites/<slug>/REPORT.md` and tell the user: what each 3D object and
motion is, every choice you made that they left open, the copy changes (`copy.md`), credits spent, the critic's
verdict, what is still open, and how to preview: `python3 -m http.server 8080 --directory sites/<slug>`.
Then offer to publish (see Publishing).

### C. Upgrade an existing site
Run this inside the user's own website folder. The site stays theirs: same design, same words.
1. Scout scans the code and writes the plan. Propose: which objects go where, what moves, which files change.
   **Wait for a yes.**
2. If it is a git repo, make a branch. Change as few files as possible. No restyling, rewording,
   reordering or dependency upgrades.
3. Sculptor and animator make their parts. Builder adds them the site's native way:
   - Plain HTML: as in `roles/builder.md`.
   - React, Next, Vue, Svelte, Astro: a client-only component that renders the box and imports the object
     module after mount. Put `stage.js` and the modules in the static or source folder the framework uses.
     If the project already uses three.js or react-three-fiber, use that instead of the import map.
   - WordPress: a child theme or a custom HTML block. Never a parent theme or a live site.
4. Gate: the site's own build and tests still pass. With its dev server running,
   `node "$S/scripts/probe.mjs" <url> _work/before` before the change and `_work/after` after it
   (keep `_work/` out of git). The critic compares. `check.py` is for job B pages only.
5. Show the diff and how to preview. Never push or deploy unless the user asks (see Publishing).

### D. Change
Find the role that owns the change, redo only that role's part, then the builder's gate and the critic.

## Spline scenes
A Spline scene is one source of 3D among several (see `roles/sculptor.md`).
- **Community scene** (free, no account): `sh "$S/scripts/browser.sh" embed <community-url>` prints the
  embeddable URL. It loads Spline's whole editor, about 15 seconds and a dark screen on a first visit.
  Fine for a demo. For a real site, the user opens it in a free Spline account, Remixes it, then
  Export > Public URL, and gives you the `my.spline.design/...` link, which loads in a second or two.
- On the page: `<div class="f-3d" data-spline="URL" data-title="What it is" style="height:100vh"></div>`.
  `factory.js` loads it lazily, fades it in and oversizes it to hide the viewer's buttons.
- Credit the scene's author in the footer only if the scene's licence asks for it.
- The page must still scroll with the cursor over it (`probe.mjs` tests this). If it does not, add `data-shield`.
- The Spline connector (`claude mcp add --transport http spline https://mcp.spline.design/mcp`) can build
  new scenes. It has a daily call limit: use it only when the user asks, and say how many calls you used.

## Assets and money
Where 3D, images and films come from, which providers to use (Higgsfield connector or CLI, other connected
generators, or the free manual route), and the paid-generation rules: `references/assets.md`.

## Publishing
Only when the user asks. Use what is connected: a hosting connector (Hostinger, Netlify, Vercel and others
expose deploy tools), or the GitHub CLI for GitHub Pages, or tell the user which folder to upload.
Confirm the target (domain or repo) before the first deploy. After that, redeploy changes only when asked.

## Rules that always hold
- **Money.** Code-built 3D, Spline community scenes and motion are free. Anything paid (AI images, video or
  3D, a Spline plan) needs the user's yes to a quoted cost in this conversation, every time. Pilot one screen first.
- **Truth.** Only the user's facts. Never invented numbers, prices, customers, quotes, awards or logos.
- **Taste.** Nothing from the slop list in `references/taste.md`.
- **Access.** Reduced motion gets a finished still page. Images have alt text. Text has readable contrast.
- **Other people's work.** Never copy a reference site's words, images or code. Keep any credit an asset's
  licence requires; add no other credits.
- **Clean up.** Stop every server and browser you started.
