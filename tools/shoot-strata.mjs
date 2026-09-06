/**
 * Re-shoot the Strata screenshots in assets/strata/ from the running Strata site.
 *
 *   node tools/shoot-strata.mjs            # both, at the framing the case uses
 *   node tools/shoot-strata.mjs console    # one of them
 *
 * Strata's dev server must be running on :5173 (npm run dev in the Strata repo).
 *
 * Three things this has to get right, and none of them are reachable with a
 * plain `--screenshot`:
 *
 *   the theme   The site reads its seeds out of the address — a link is a theme
 *               — so the hash below asks for the dark pole by its seven numbers
 *               rather than clicking the appearance dot. The site's own ground
 *               is paper now; the case is dark, so it is shot at the case's
 *               appearance.
 *   the reveal  Sections are revealed by IntersectionObserver, so the viewport
 *               is made tall enough to hold the whole page and everything is in
 *               view at once. Scrolling would work too; this is one fewer step.
 *   the framing The originals were taken 1440 CSS wide and exported at 2240, so
 *               the clip is 1440 wide at 1.556 and starts 83px above the
 *               section's kicker. Change those and the new shots stop matching
 *               the ones beside them.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SITE = process.env.STRATA_URL ?? 'http://localhost:5173/'
/** hue,chroma,warmth,energy,density,appearance,lightness — Obsidian, the dark pole. */
const SEEDS = '#s=250,0,0,0.35,1,dark,-1'
const PORT = 9335
const WIDTH = 1440, OUT_W = 2240, OUT_H = 1400, TOP_GAP = 83
const SCALE = OUT_W / WIDTH
const HEIGHT = Math.round(OUT_H / SCALE)

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'strata')
const SHOTS = { console: 'console.webp', components: 'recipes.webp' }
const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const profile = fs.mkdtempSync('/tmp/strata-shot-profile-')
const work = fs.mkdtempSync('/tmp/strata-shot-')
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })

let wsUrl
for (let i = 0; i < 40 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl }
  catch { await sleep(250) }
}
if (!wsUrl) { chrome.kill(); throw new Error('Chrome did not open a devtools endpoint') }

const ws = new WebSocket(wsUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0
const waiting = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) }
})
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id
  waiting.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)))
  ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }))
})

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const S = (m, p) => send(m, p, sessionId)
await S('Page.enable')
await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 20000, deviceScaleFactor: 1, mobile: false })

const nav = await S('Page.navigate', { url: SITE + SEEDS })
if (nav.errorText) { chrome.kill(); throw new Error(`${SITE} — ${nav.errorText}. Is the Strata dev server running?`) }
for (let i = 0; i < 60; i++) {
  await sleep(400)
  const q = await S('Runtime.evaluate', { expression: `!!document.getElementById('${Object.keys(SHOTS).at(-1)}')`, returnByValue: true })
  if (q.result.value) break
}
await sleep(3000)

/** The kicker is the first leaf with text in the section; the crop starts above it. */
const probe = await S('Runtime.evaluate', {
  returnByValue: true,
  expression: `JSON.stringify(${JSON.stringify(Object.keys(SHOTS))}.reduce((o,id)=>{
    const s=document.getElementById(id); if(!s) return o
    const k=[...s.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim())
    o[id]=Math.round(k.getBoundingClientRect().top+scrollY); return o},{}))`,
})
const tops = JSON.parse(probe.result.value)

for (const id of want) {
  if (!(id in SHOTS)) { console.error(`no such section: ${id}`); continue }
  if (!(id in tops)) { console.error(`#${id} is not on the page`); continue }
  const shot = await S('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: tops[id] - TOP_GAP, width: WIDTH, height: HEIGHT, scale: SCALE },
  })
  const png = path.join(work, `${id}.png`)
  fs.writeFileSync(png, Buffer.from(shot.data, 'base64'))
  const webp = path.join(OUT, SHOTS[id])
  const r = spawnSync('cwebp', ['-q', '82', '-quiet', png, '-o', webp], { encoding: 'utf8' })
  if (r.status === 0) console.log(`wrote ${webp} (${fs.statSync(webp).size} bytes)`)
  else console.error(`cwebp failed (${r.error?.message ?? r.status}) — png left at ${png}\n${r.stderr ?? ''}`)
}

ws.close()
chrome.kill()
// The profile is Chrome's; it is still tearing down, so leave it to /tmp.
