#!/usr/bin/env python3
"""Re-embed the CloudZero sims into index.html.

slack.html / resource.html are the editable sources. index.html carries them
as base64 in <script type="text/plain" id="slackB64|resB64"> payloads.
Edit a source, run this, verify in the browser, commit both.
"""
import base64, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
INDEX = os.path.join(ROOT, "index.html")

PAYLOADS = {"slackB64": "slack.html", "resB64": "resource.html"}

idx = open(INDEX, encoding="utf-8").read()
for pid, fname in PAYLOADS.items():
    b64 = base64.b64encode(open(os.path.join(HERE, fname), "rb").read()).decode()
    pat = r'(<script type="text/plain" id="' + pid + r'">)[^<]*(</script>)'
    idx, n = re.subn(pat, lambda m: m.group(1) + b64 + m.group(2), idx, count=1)
    if n != 1:
        sys.exit(f"payload {pid} not found in index.html")
    print(f"{pid} <- {fname} ({len(b64)} b64 chars)")
open(INDEX, "w", encoding="utf-8").write(idx)
print(f"index.html now {os.path.getsize(INDEX)} bytes")
