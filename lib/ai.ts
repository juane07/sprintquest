// Server-only AI helpers (GROQ_API_KEY must never reach the browser —
// this module is imported exclusively by API routes).
const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]

export interface SuggestedAction {
  title: string
  why: string
}

export interface CeremonySummary {
  summary: string
  actions: SuggestedAction[]
}

export function truncateEntries(text: string, max = 6000): string {
  return text.length > max ? text.slice(0, max) + "\n[truncated]" : text
}

export function buildSummaryPrompt(
  modeName: string,
  entries: { category: string; content: string; author: string }[]
): { system: string; user: string } {
  const system =
    "You are the Game Master facilitating an Agile retrospective. " +
    "Summarize honestly and constructively. Team XP only — never single out or blame individuals. " +
    "Reply with STRICT JSON only: {\"summary\": \"2-3 sentences\", \"actions\": [{\"title\": \"concrete action\", \"why\": \"one line\"}]}. Max 3 actions."
  const lines = entries.map((e) => `[${e.category}] ${e.author}: ${e.content}`).join("\n")
  const user = `Retrospective mode: ${modeName}\nEntries:\n${lines}`
  return { system, user }
}

export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf("{")
  const end = candidate.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T
  } catch {
    return null
  }
}

export async function callGroq(system: string, user: string, maxTokens = 800): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY not configured")
  let lastErr = "unknown"
  for (const model of GROQ_MODELS) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
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
