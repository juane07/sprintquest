// Team Journey Board — functional board-game logic (pure, testable).
// Single team token. Advance is gated by each square's completion rule.
// Booster effects are persisted as ceremony Comments (realtime-synced,
// cross-device) so "used" state is derived from data, never local flags.

export const LUPA_CAT = "🔍 Lupa"
export const POURQUOI_CAT = "❓ Porqué"
export const PUENTE_CAT = "🌉 Puente"

// Categories that are not player entries (system / booster output).
export const NON_ENTRY_CATS = ["🎮 Burst", "🗺️ Board", LUPA_CAT, POURQUOI_CAT, PUENTE_CAT]

export interface BoardComment {
  id: string
  content: string
  category: string
}

export function isPlayerEntry(c: BoardComment): boolean {
  return !NON_ENTRY_CATS.includes(c.category)
}

export function playerEntries(comments: BoardComment[]): BoardComment[] {
  return comments.filter(isPlayerEntry)
}

// Board step: 0 Salida · 1 Compartir · 2 Profundizar · 3 Votar · 4 Quest.
// Voting screen / finished flow counts as the Quest square.
export function boardStepFor(round: number, totalRounds: number, voting: boolean): number {
  if (voting) return 4
  if (totalRounds <= 1) return 0
  const r = Math.min(Math.max(round, 1), totalRounds)
  return Math.min(3, r - 1)
}

export interface GateState {
  recallDone: boolean
  entries: number
  reflectionDone: boolean
}

export interface GateResult {
  ok: boolean
  reason: string | null
}

// Advancing FROM step N requires that square's completion rule.
export function advanceGate(step: number, s: GateState): GateResult {
  if (step <= 0 && !s.recallDone)
    return { ok: false, reason: "🏁 Complete the recall warm-up first — the team token can't leave Salida without it." }
  if (step === 1 && s.entries < 3)
    return { ok: false, reason: "💬 Share at least 3 team entries before advancing — slow is deep." }
  if ((step === 2 || step === 3) && !s.reflectionDone)
    return { ok: false, reason: "🔍 Complete the guided reflection first — depth over speed." }
  return { ok: true, reason: null }
}

const STOPWORDS = new Set(
  "a,an,the,and,or,but,of,to,in,on,for,with,our,we,you,they,that,this,these,those,is,are,was,were,be,been,have,has,had,do,does,did,not,no,yes,as,at,by,from,about,into,over,after,before,up,down,out,off,again,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,only,own,same,so,than,too,very,can,will,just,should,now,de,la,el,en,y,que,los,las,un,una,del,al,como,con,por,para,esto,esta,este,estos,estas,ese,esa,hay,tiene,tienen,muy,más,pero,porque,sus,nuestro,nuestra,nuestros,nuestras,qué,cómo,cuando,donde,hay,son,está,están,fue,fueron,ser,tener".split(","),
)

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-záéíóúñü]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

// Lupa: surface the dominant theme + most repeated word as a suggestion.
// Returns null when there is not enough signal (< 2 entries).
export function lupaInsight(comments: BoardComment[]): string | null {
  const entries = playerEntries(comments)
  if (entries.length < 2) return null
  const byCat = new Map<string, number>()
  const wordCount = new Map<string, number>()
  for (const e of entries) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + 1)
    for (const t of new Set(tokens(e.content))) wordCount.set(t, (wordCount.get(t) ?? 0) + 1)
  }
  const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]
  const topWord = [...wordCount.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])[0]
  let out = `🔍 Lupa insight (suggestion only — the team decides): most entries are in ${topCat[0]} (${topCat[1]} of ${entries.length}).`
  if (topWord) out += ` The word "${topWord[0]}" keeps coming up (${topWord[1]}×). Ask: why does this persist?`
  else out += ` Ask: what pattern connects them?`
  return out
}

export interface PuentePair {
  a: BoardComment
  b: BoardComment
  score: number
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

// Puente: find the most similar pair of entries (candidate for grouping).
// Returns null when fewer than 2 entries or no shared vocabulary.
export function findPuentePair(comments: BoardComment[]): PuentePair | null {
  const entries = playerEntries(comments)
  if (entries.length < 2) return null
  const sets = entries.map((e) => new Set(tokens(e.content)))
  let best: PuentePair | null = null
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const score = jaccard(sets[i], sets[j])
      if (score > 0 && (!best || score > best.score)) best = { a: entries[i], b: entries[j], score }
    }
  }
  return best
}

// Proposal codec: IDs embedded in the comment so any device can confirm.
export function encodePuenteProposal(aId: string, bId: string, summary: string): string {
  return `🌉 Puente proposal — these two entries look like the same theme. Confirm to group them under one category.\n${summary}\nIDs: ${aId}|${bId}`
}

export function decodePuenteProposal(content: string): { aId: string; bId: string } | null {
  const m = content.match(/IDs:\s*(\S+)\|(\S+)/)
  if (!m) return null
  return { aId: m[1], bId: m[2] }
}

export interface BoosterUsage {
  lupa: boolean
  pourquoi: boolean
  puente: boolean
}

export function boosterUsageFrom(comments: BoardComment[]): BoosterUsage {
  return {
    lupa: comments.some((c) => c.category === LUPA_CAT),
    pourquoi: comments.some((c) => c.category === POURQUOI_CAT),
    puente: comments.some((c) => c.category === PUENTE_CAT),
  }
}

const POURQUOI_BANK = [
  "Why do you think this keeps happening — what's the root cause beneath the symptoms?",
  "If you had to explain this pattern to a new teammate, what would you say causes it?",
  "What would have to change for this to look different next sprint?",
]

export function pourquoiQuestion(comments: BoardComment[], usageCount: number): string {
  const insight = lupaInsight(comments)
  const base = POURQUOI_BANK[usageCount % POURQUOI_BANK.length]
  return insight ? `❓ Doble porqué: ${base}\nContext: ${insight}` : `❓ Doble porqué: ${base}`
}
