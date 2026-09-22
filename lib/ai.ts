// Server-only AI helpers (GROQ_API_KEY must never reach the browser —
// this module is imported exclusively by API routes).
const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]

export interface SuggestedAction {
  title: string
  why: string
}

export interface Pattern {
  topic: string
  count: number
  entries: string[]
  suggestion: string
}

export interface CeremonySummary {
  summary: string
  actions: SuggestedAction[]
}

export function truncateEntries(text: string, max = 6000): string {
  return text.length > max ? text.slice(0, max) + "\n[truncated]" : text
}

// System prompt for AI as Learning Facilitator — grounded in Tannenbaum & Cerasoli (2013)
// and Edmondson (1999) psychological safety principles
export function buildFacilitatorPrompt(
  modeName: string,
  entries: { category: string; content: string; author: string }[]
): { system: string; user: string } {
  const system =
    "You are an AI Learning Facilitator for an Agile retrospective. " +
    "Your role is to help the team learn, not to evaluate or judge. " +
    "Frame all results as engagement metrics — never as rewards or prizes. " +
    "Never single out or blame individuals. " +
    "Detect patterns, ask probing questions, and help the team reflect deeply. " +
    "Reply with STRICT JSON only: {\"summary\": \"2-3 sentences\", \"patterns\": [{topic, count, suggestion}], \"actions\": [{\"title\": \"concrete action\", \"why\": \"one line\"}]}. Max 3 actions."
  const lines = entries.map((e) => `[${e.category}] ${e.author}: ${e.content}`).join("\n")
  const user = `Retrospective mode: ${modeName}\nEntries:\n${lines}`
  return { system, user }
}

// Build real-time pattern detection prompt
export function buildPatternPrompt(entries: { category: string; content: string }[]): { system: string; user: string } {
  const system =
    "You are an AI pattern detector for team retrospectives. " +
    "Analyze entries to find recurring themes, unexpected connections, and areas needing facilitation. " +
    "Reply with STRICT JSON only: {\"patterns\": [{topic, count, entries: [2-3 samples], suggestion}]}"
  const lines = entries.map((e) => `[${e.category}] ${e.content}`).join("\n")
  const user = `Entries so far:\n${lines}\n\nWhat patterns do you detect? What should the team pay attention to?`
  return { system, user }
}

// Build elaborative interrogation prompt for reflection
export function buildElaborativePrompt(entries: { category: string; content: string }[], question: string): { system: string; user: string } {
  const system =
    "You are an AI metacognitive facilitator. Ask ONE probing question that helps the team reflect deeply. " +
    "Questions should encourage elaborative interrogation ('why'), evaluation ('how well'), or exploration ('what if'). " +
    "Reply with STRICT JSON only: {\"question\": \"one probing question\", \"rationale\": \"why this question helps\"}"
  const lines = entries.map((e) => `[${e.category}] ${e.content}`).join("\n")
  const user = `Entries:\n${lines}\n\nTeam question: ${question}`
  return { system, user }
}

export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf("{")
  const end = candidate.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try { return JSON.parse(candidate.slice(start, end + 1)) as T } catch { return null }
}

export async function callGroq(system: string, user: string, maxTokens = 800): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY not configured")
  let lastErr = "unknown"
  for (const model of GROQ_MODELS) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: maxTokens, temperature: 0.4 }),
    })
    if (res.ok) {
      const json = await res.json()
      const content: string = json.choices?.[0]?.message?.content ?? ""
      if (content.trim()) return content
      lastErr = "empty response"
    } else {
      lastErr = `HTTP ${res.status}`
      if (res.status === 401 || res.status === 403) break
    }
  }
  throw new Error(`Groq failed: ${lastErr}`)
}

// Detect patterns from entries — for real-time facilitation
export function detectPatterns(entries: { category: string; content: string }[]): Pattern[] {
  const categoryCounts: Record<string, number> = {}
  entries.forEach(e => { categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1 })
  return Object.entries(categoryCounts)
    .filter(([, count]) => count >= 2)
    .map(([topic, count]) => ({
      topic,
      count,
      entries: entries.filter(e => e.category === topic).slice(0, 3).map(e => e.content.slice(0, 50)),
      suggestion: `Consider discussing "${topic}" — it appeared ${count} times`,
    }))
}

// Generate adaptive facilitation suggestions
export function getFacilitationSuggestion(entries: { category: string; content: string }[], round: number, totalRounds: number): string | null {
  if (entries.length < 2) return null
  const patterns = detectPatterns(entries)
  if (patterns.length > 0) {
    const top = patterns.sort((a, b) => b.count - a.count)[0]
    return `🔍 I notice "${top.topic}" came up ${top.count} times. Consider exploring why.`
  }
  if (round === Math.ceil(totalRounds / 2)) {
    return "🔄 You're at the midpoint. Take a moment to reflect on what's emerging."
  }
  return null
}
