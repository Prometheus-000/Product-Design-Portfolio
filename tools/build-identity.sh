#!/bin/sh
# Rebuild assets/strata/identity.js from the Strata repository.
#
# The Strata section's hero is Strata's own identity, running: the append-only
# record projected as a field. That needs three things from the other repo — the
# identity engine, the theme engine, and the record itself — so they are bundled
# into one file here rather than fetched at runtime, which would make the mark
# depend on a network call. Run this whenever the record or either engine moves.
#
# Only Strata's shipped modules are bundled. The explorations lab is explicitly
# "not a projection, not shipped", and its frame ignores presence and breath, so
# the page paints the shipped frame — which honours both — and nothing else.
set -e
STRATA="${STRATA:-$HOME/strata}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/strata/identity.js"
ENTRY="$(mktemp -t strata-identity).ts"

cat > "$ENTRY" <<ENTRYFILE
export { frameAt, toUnit, toWorld, levelCount, lerp, clamp01, gridWidth } from '$STRATA/identity/src/field.ts'
export { parseRecord, stateFrom } from '$STRATA/identity/src/record.ts'
export { draw, drawContours } from '$STRATA/identity/src/render.ts'
export { generateTheme, PRESETS, OBSIDIAN, flipAppearance } from '$STRATA/engine/src/generateTheme.ts'
import record from '$STRATA/.strata/decisions.jsonl'
export const RECORD: string = record as unknown as string
ENTRYFILE

"$STRATA/node_modules/.bin/esbuild" "$ENTRY" \
  --bundle --format=iife --global-name=StrataIdentity \
  --loader:.jsonl=text --minify --outfile="$OUT"

rm -f "$ENTRY"
echo "wrote $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes) from $(wc -l < "$STRATA/.strata/decisions.jsonl" | tr -d ' ') decisions"
