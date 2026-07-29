// The hero console's live half.
//
// The five project briefs, `ls work`, `resume`, `contact` and `git log` are
// answered client-side and never reach this route — those facts are the ones a
// recruiter screens on, so they must be instant, free, and incapable of being
// wrong. Everything else a visitor types comes here.
//
// The key lives only in ANTHROPIC_API_KEY on the server. It is never sent to
// the browser. Every failure path returns { fallback: true } so the console
// falls back to its scripted answers instead of showing an error.

const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const SYSTEM = fs.readFileSync(path.join(__dirname, "persona.md"), "utf8");

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 300;          // the console prints a few lines, not a page
const MAX_CHARS = 400;           // per message from the visitor
const MAX_TURNS = 6;             // conversation depth sent back to the model

// Best-effort, per-instance limits. Serverless instances are ephemeral and
// there may be several, so a determined abuser gets more than these numbers —
// they exist to stop someone holding the prompt down, not to be a hard wall.
// Move to a shared store (Vercel KV, Upstash) if that stops being enough.
const IP_LIMIT = 25;             // requests per IP per window
const IP_WINDOW_MS = 60 * 60e3;  // one hour
const DAY_LIMIT = 500;           // calls per instance per day, then fall back

const ipHits = new Map();
let day = { stamp: 0, count: 0 };

function rateLimited(ip) {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter(t => now - t < IP_WINDOW_MS);
  if (hits.length >= IP_LIMIT) return true;
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) ipHits.clear();   // crude bound on memory
  return false;
}

function overDailyBudget() {
  const today = Math.floor(Date.now() / 864e5);
  if (day.stamp !== today) day = { stamp: today, count: 0 };
  if (day.count >= DAY_LIMIT) return true;
  day.count++;
  return false;
}

// Fallbacks carry a coarse reason so a bad deploy can be diagnosed from the
// browser instead of from the Vercel logs. The client ignores everything but
// `text`, so this is invisible to visitors and reveals nothing sensitive.
const fall = (res, reason, code, status = 200) =>
  res.status(status).json(code ? { fallback: true, reason, code } : { fallback: true, reason });

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fall(res, "method", null, 405);
  }
  if (!process.env.ANTHROPIC_API_KEY) return fall(res, "no-key");

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return res.status(200).json({ text: "Slow down — too many questions from this address in the last hour. Try again later, or email kenanalsarabi@proton.me." });
  }
  if (overDailyBudget()) return fall(res, "budget");

  // Accept only the shape we expect; anything else falls back rather than
  // being coerced into a request.
  const raw = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!raw || !raw.length) return fall(res, "bad-payload", null, 400);

  const messages = raw
    .slice(-MAX_TURNS)
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return fall(res, "bad-payload", null, 400);
  }

  try {
    const client = new Anthropic();   // reads ANTHROPIC_API_KEY
    const reply = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "disabled" },     // short factual answers; keep it quick and cheap
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages,
    });

    if (reply.stop_reason === "refusal") return fall(res, "refusal");

    const text = reply.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("")
      .trim();

    return text ? res.status(200).json({ text }) : fall(res, "empty");
  } catch (err) {
    console.error("session:", err?.status || "", err?.message || err);
    // err.status distinguishes a rejected key (401) from a rate limit (429)
    // from the SDK never being reached at all (undefined).
    return fall(res, "upstream", err?.status ?? null);
  }
};
