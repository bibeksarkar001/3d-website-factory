# 3D Website Factory

A Claude Code skill that builds 3D websites from a folder of your content, or adds 3D to a website you already have.

- **Live 3D hero.** A Spline character or logo that reacts to the visitor.
- **Motion graphics.** Looping diagrams, drawn in code, that explain your product.
- **Scroll film (optional).** One camera move that plays as the visitor scrolls.

No build step. No dependencies. The finished site is a plain folder you can upload anywhere.

## Install

```sh
git clone https://github.com/bibeksarkar001/3d-website-factory ~/.claude/skills/3d-website-factory
```

Needs [Claude Code](https://claude.com/claude-code), Chrome, Python 3 and Node 22+. The optional film also needs ffmpeg.

## Use

Open Claude Code in any folder and say:

| Say | What happens |
|---|---|
| "Set up the website factory" | Creates a `website-factory/` folder with places for your content, logo, images and style references. |
| "Build me this as a website" | Builds a site for every file in `content/`. Result lands in `sites/<name>/`. |
| "Make my existing website 3D" | Run inside your own site's folder. Claude proposes what to add, waits for your yes, and changes as little as possible. |
| "Add a scroll film to `<site>`" | Adds the film layer. Claude quotes any cost first. |

## What it costs

| Layer | Cost |
|---|---|
| 3D with a Spline community scene | Free, no account |
| Motion graphics | Free |
| Custom 3D built through the Spline connector | Spline account. The connector has a daily call limit that depends on your plan. |
| AI scroll film | Paid credits at the video tool you use. Your own footage is free. |

Claude never spends money without showing you the cost and getting a yes.

## Optional connections

```sh
claude mcp add --transport http spline https://mcp.spline.design/mcp -s user   # custom 3D scenes
npm install -g @higgsfield/cli                                                 # AI images and video
```

## What is inside

| Path | What |
|---|---|
| `SKILL.md` | The instructions Claude follows. |
| `references/film.md` | The scroll film method. |
| `runtime/factory.js`, `factory.css` | The small script every built site uses: lazy 3D, reveals, motion loop, film scrubber. |
| `scripts/init.sh` | Creates the workspace. |
| `scripts/browser.sh` | Finds a Spline scene's embed link and screenshots reference sites. |
| `scripts/check.py` | The gate a finished page must pass. `--selftest` checks the checker. |
| `scripts/probe.mjs` | Opens the page in headless Chrome: screenshots, scroll over the 3D, phone width, console errors. |
| `templates/` | The brief template, the workspace readme and an example brief. |

## Credits

The three-layer idea (live 3D, film, motion graphics) comes from Jack Roberts' video
["I Built the Ultimate Website Design Skill"](https://www.youtube.com/watch?v=DCwh7SIfWL4). This skill is an
independent implementation and shares no code or text with his.
3D scenes come from [Spline](https://spline.design) and its community. Scene authors are credited on each site.

## Licence

MIT. See `LICENSE`.
