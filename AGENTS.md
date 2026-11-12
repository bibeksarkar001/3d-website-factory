# AGENTS.md

This repository is **3D Website Factory**, an agent skill that builds 3D websites.

- **Using the skill** (any agent): read `skills/3d-website-factory/SKILL.md` and follow it. It points to the role
  briefs in `skills/3d-website-factory/roles/` and the references in `skills/3d-website-factory/references/`.
  If you can start sub-agents, give each role its own; if not, play the roles in order.
- **Working on the skill itself:**
  - Keep the runtime dependency-free (`runtime/*.js` load three.js from a CDN through an import map; nothing else).
  - After changing `scripts/check.py`, run `python3 skills/3d-website-factory/scripts/check.py --selftest`.
  - After changing the runtime or a demo, serve `docs/` and run
    `node skills/3d-website-factory/scripts/probe.mjs http://127.0.0.1:<port>/<demo>/ <outdir>`; it must print PASS.
  - Demos in `docs/` are fictional brands, every 3D object built in code. Copy the latest `runtime/` files into a
    demo when you change them.
  - Write plain, short English. No credits for ideas; keep only credits an asset's licence requires.
