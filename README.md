# Kenan Alsarabi — Product Design Portfolio

Single-page portfolio plus an embedded ambient music prototype. Static site — no build step.

## Structure

```
index.html        the portfolio (self-contained; case-study assets inlined)
music/
  index.html      ambient radio — mood parser, crossfading audio, 4 visualizers
  lab.html        visualizer playground (no audio)
  audio/          tracks by mood: flow / overload / cozy / light
project/          working files — context, inspiration, archives (not deployed)
```

## Local dev

```
python3 -m http.server 8471
# → http://localhost:8471
```

Serve over http(s) — the music app's audio-reactive visuals need a same-origin
AudioContext, which browsers block on file://.

## Deploy

Push to GitHub, import into Vercel as a static project (no framework, no build
command, output directory = repo root). `.vercelignore` keeps working files out
of the deployment.

Note: `music/audio/` contains commercial recordings for private
portfolio/demo use.
