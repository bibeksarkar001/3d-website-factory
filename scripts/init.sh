#!/bin/sh
# init.sh [folder]   Creates the Website Factory workspace (default: ./website-factory). Never overwrites.
S=$(cd "$(dirname "$0")/.." && pwd)
W=${1:-website-factory}
mkdir -p "$W/content" "$W/assets/logo" "$W/assets/images" "$W/assets/style" "$W/sites"
[ -e "$W/README.md" ] || cp "$S/templates/WORKSPACE.md" "$W/README.md"
[ -e "$W/content/_TEMPLATE.md" ] || cp "$S/templates/brief.md" "$W/content/_TEMPLATE.md"
echo "Workspace ready: $(cd "$W" && pwd)"
