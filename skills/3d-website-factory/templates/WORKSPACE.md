# Website Factory workspace

Put your material in the folders, then tell Claude Code what you want.

| Folder | Put here |
|---|---|
| `content/` | What the site should say. One file per site: a brief (copy `_TEMPLATE.md`), or any text, PDF or Word file. |
| `assets/logo/` | Your logo. SVG is best: it can be turned into a 3D object. |
| `assets/images/` | Photos, product shots, screenshots to use on the site. |
| `assets/models/` | 3D models you own (`.glb`), if any. |
| `assets/style/` | Screenshots of sites you like, brand colours, fonts. Anything that shows the look you want. |
| `sites/` | Finished websites, one folder each. Do not edit by hand while a build runs. |
| `_work/` | The plan and screenshots for each site. Not part of the website. |

## What to say to Claude Code
- "Build me this as a website" builds every new file in `content/`.
- "Build the site for `<file name>`" builds one.
- "Change `<thing>` on `<site>`" edits a finished site, e.g. "make the logo follow the cursor".
- "Add a scroll film to `<site>`" adds the AI video layer. Claude quotes the cost first.
- "Make my existing website 3D" (run this inside your website's own folder, not here).

## Getting your site out
Each folder in `sites/` is a complete website. Preview it:

    python3 -m http.server 8080 --directory sites/<name>

then open http://localhost:8080. To publish, upload that folder to any web host.
