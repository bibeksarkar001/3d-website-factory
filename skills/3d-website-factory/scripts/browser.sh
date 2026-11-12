#!/bin/sh
# Headless Chrome helpers. No install needed, uses the Chrome already on the machine.
#   browser.sh embed <spline-community-url>     prints the embeddable scene URL
#   browser.sh shot  <url> <out.png> [W,H]      screenshot (default 1440,900)
for c in "$CHROME_PATH" \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  "$(command -v google-chrome google-chrome-stable chromium chromium-browser 2>/dev/null | head -1)"; do
  [ -n "$c" ] && [ -x "$c" ] && CHROME=$c && break
done
[ -n "$CHROME" ] || { echo "No Chrome found. Install Chrome or set CHROME_PATH." >&2; exit 2; }

case "$1" in
  embed)
    out=$("$CHROME" --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom "$2" 2>/dev/null \
      | grep -o 'https://app\.spline\.design/file/[0-9a-f-]*?view=preview' | head -1)
    [ -n "$out" ] && echo "$out" || { echo "No scene found on that page. Is it a community.spline.design/file/... link?" >&2; exit 1; } ;;
  shot)
    "$CHROME" --headless=new --hide-scrollbars --virtual-time-budget=12000 \
      --window-size="${4:-1440,900}" --screenshot="$3" "$2" >/dev/null 2>&1
    [ -s "$3" ] && echo "saved $3" || { echo "screenshot failed" >&2; exit 1; } ;;
  *) sed -n '2,4p' "$0"; exit 1 ;;
esac
