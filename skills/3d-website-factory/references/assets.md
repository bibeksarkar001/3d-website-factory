# Assets: where 3D, images and films come from

Free routes first. Every paid step needs the user's yes to a quoted cost **in this conversation**, every time.

## The routes

| Route | What you get | Cost | Interactive |
|---|---|---|---|
| **code** | three.js objects built by the sculptor (logo extrude, product from shapes) | Free | Yes |
| **spline** | A Spline community scene or the user's public URL | Free | Yes |
| **model** | The user's own `.glb`, or a CC0 model (Poly Pizza, Khronos samples) | Free | Yes |
| **model-gen** | A `.glb` generated from one product image (image-to-3D) | Paid | Yes |
| **film** | The user's own footage, cut to frames, scrubbed by scroll | Free | Scroll only |
| **film-gen** | AI start frame → AI clip → frames | Paid | Scroll only |
| **film-manual** | You write the prompts, the user generates the clips in a free tool, drops them in | Free | Scroll only |
| **image-gen** | Stills for sections, start frames, product shots | Paid (cheap) | No |

Code 3D is sharp at any size, light, and reacts to the visitor. Films are photoreal but heavy and only play.
Choose per object, not per site: a code hero and one film section is a strong mix.

## Providers
Detect what is available, in this order, and use the first that works. Never ask for a key in chat;
the user sets it up themselves.

1. **Higgsfield, as a connector** (MCP tools whose names contain `higgsfield`) or **CLI**
   (`higgsfield` / `hf` on the PATH, logged in with `higgsfield auth login` and a workspace set).
   Learn the current models and flags from `higgsfield --help`, `higgsfield model list`. They change;
   do not trust memory. **Before every create, run `higgsfield generate cost <model> ...` and quote it.**
   Check the balance with `higgsfield account`.
2. **Any other generator the user has connected** (an MCP connector, or an API key already in the project's
   environment, e.g. `KIE_API_KEY`). Read its docs, quote the cost the same way.
3. **Manual (free):** write the prompts and stop. The user pastes them into a free tool
   (Google Flow for video, Google Whisk for images, or any tool they like), downloads the results into
   `assets/generated/`, and says "done". Then continue as if you had generated them.

If nothing is available and the user does not want the manual route, fall back to code 3D.

## Paid generation rules
- **Stills before clips.** Images are cheap; make and approve stills first.
- **Pick one of three.** Make three candidates for a hero still, show them, the user picks.
- **Start frame, then clip.** The clip is made from the approved still, never from scratch.
- **Show cost and balance** before each step: "3 hero stills, about 20 credits. You have 240. Go?"
- **Pilot first.** Make the hero screen's assets and build the hero before generating the rest.
- Log every spend in `_work/<slug>/ledger.tsv`: date, what, provider, model, credits.

## Recipes

### Product still (start frame)
Subject: the user's product photo as the reference. Ask for: the product alone on a seamless backdrop in the
site's background colour, soft rim light, gentle gradient falloff, sharp focus, shallow depth of field, a
long-lens product-photo look, no text, no logos added, no clutter. **Horizontal (16:9) for a hero.**

### Exploded still (end frame)
Same subject, same backdrop, same light, same camera. Ask for: every component separated along one axis and
floating in alignment, internal parts visible, nothing broken, no labels or annotations.
If parts fly everywhere, ask for a smaller separation.

### Product reveal clip
Start frame plus end frame, both pinned. Ask for a **calm, slow, part-by-part disassembly**, the camera locked,
no cuts. Never say "explosion": video models take it literally. Two candidates, pick one, keep the higher
resolution download. Then frames: see `references/film.md`.

### One-moment hero film
The brand's moment in one continuous shot: the pour, the drop, the push through a tunnel. Start frame first,
then the clip from it. 6 to 10 seconds, no text in the footage, no sound.

### Image to 3D model (model-gen)
Input: a clean product still (the start frame above is ideal: one object, plain backdrop, whole product in view).
Output: a `.glb`. Offer two candidates if the price allows, preview them with `load()` on a blank stage, the
user picks. Keep it under 5 MB; if larger, ask the provider for a lower polygon count or use
`npx @gltf-transform/cli optimize in.glb out.glb` (free, local).
