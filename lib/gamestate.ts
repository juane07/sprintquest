// Shared game-state contracts for minigame bursts + quest trail.
// Transport: system comments (BURST_CAT / BOARD_CAT) carry JSON payloads;
// player actions travel as Vote rows. Zero schema changes, $0.
export const BURST_CAT = "🎮 Burst"
export const BOARD_CAT = "🗺️ Board"
export const SYSTEM_CATS = [BURST_CAT, BOARD_CAT]

export type BurstType = "snail" | "whack" | "tug" | "memory" | "poll"

export interface BurstPayload {
  kind: "burst"
  type: BurstType
  target: number
  status: "active" | "done"
  startedAt: number
  seed: number
  title: string
  detail?: string
  result?: string
}

export const BURST_META: Record<BurstType, { title: string; desc: string; target: number }> = {
  snail: { title: "🐢 Snail Race", desc: "Only seconded entries (with a reaction) move it 5 steps. Taps sustain, bar drains 1/sec.", target: 30 },
  whack: { title: "🔨 Whack-a-bug", desc: "Every bug IS a real entry — the team marks each reviewed (👁). No 👍 spent.", target: 0 },
  tug: { title: "🎯 Tug of War", desc: "The top-2 entries face off with 🪢 pulls (game votes, not 👍). Winner is proposed as an action.", target: 5 },
  memory: { title: "🎁 Memory Chests", desc: "Flip chests together, match every pair.", target: 0 },
  poll: { title: "⚡ Instant Poll", desc: "One fast question, three answers — the result posts itself as an entry.", target: 0 },
}

export function buildBurst(type: BurstType, detail = "", target?: number): BurstPayload {
  return {
    kind: "burst",
    type,
    target: target ?? BURST_META[type].target,
    status: "active",
    startedAt: Date.now(),
    seed: Math.floor(Math.random() * 1e9),
    title: BURST_META[type].title,
    detail,
  }
}

export function parseBurst(content: string): BurstPayload | null {
  try {
    const p = JSON.parse(content)
    if (p && p.kind === "burst" && typeof p.type === "string" && BURST_META[p.type as BurstType]) return p as BurstPayload
    return null
  } catch {
    return null
  }
}

export function activeBurst(comments: any[]): { comment: any; payload: BurstPayload } | null {
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i]
    if (c.category !== BURST_CAT) continue
    const p = parseBurst(c.content)
    if (p && p.status === "active") return { comment: c, payload: p }
  }
  return null
}

// --- tap counting (Vote rows with option `${burstId}:${action}`) ---
export function burstVotes(votes: any[], burstId: string, action: string): any[] {
  return votes.filter((v) => v.option === `${burstId}:${action}`)
}

export function distinctTappers(vs: any[]): number {
  return new Set(vs.map((v) => v.userId)).size
}

// --- snail: entries move 5 steps, taps sustain, 1 step/sec drains. Deterministic. ---
export const SNAIL_DECAY_PER_SEC = 1
export const SNAIL_STEPS_PER_ENTRY = 5

export function snailSteps(newEntries: number, taps: number, elapsedSec: number, target: number): number {
  return Math.min(target, Math.max(0, newEntries * SNAIL_STEPS_PER_ENTRY + taps - Math.floor(Math.max(0, elapsedSec)) * SNAIL_DECAY_PER_SEC))
}

// --- top-N entries by score (for tug-of-war face-offs) ---
export function topContenders<T extends { id: string }>(items: T[], score: (id: string) => number, n = 2): string[] {
  return [...items].sort((a, b) => score(b.id) - score(a.id)).slice(0, n).map((i) => i.id)
}

// --- tug of war: deterministic team split, no individual records ---
export function teamOf(userId: string): "A" | "B" {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0
  return Math.abs(h) % 2 === 0 ? "A" : "B"
}

export function tugScore(a: number, b: number, target: number): { a: number; b: number; winner: "A" | "B" | null } {
  const winner = a >= target && a > b ? "A" : b >= target && b > a ? "B" : null
  return { a, b, winner }
}

// --- memory: deterministic pairs from seed ---
function mulberry(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const MEMORY_FALLBACKS = ["Flaky CI", "Slow reviews", "Great teamwork", "Unclear specs", "Deploys", "Focus time"]

export function memoryPairs(entryTexts: string[], seed: number, pairs = 4): string[] {
  const src = entryTexts.length >= pairs ? entryTexts : [...entryTexts, ...MEMORY_FALLBACKS]
  const picked = [...src].slice(0, pairs)
  const deck = picked.flatMap((t) => [t, t])
  const rnd = mulberry(seed)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function memoryRevealed(deck: string[], flippedCards: number[]): boolean[] {
  const flipped = new Set(flippedCards)
  return deck.map((_, i) => {
    if (!flipped.has(i)) return false
    const twin = deck.findIndex((t, j) => j !== i && t === deck[i])
    return flipped.has(twin)
  })
}

export function memoryDone(revealed: boolean[]): boolean {
  return revealed.length > 0 && revealed.every(Boolean)
}

export function flipAction(card: number): string {
  return `flip:${card}`
}

// --- quest trail board ---
export interface TrailTile {
  icon: string
  label: string
  kind: "start" | "xp" | "burst" | "chance" | "boss" | "star" | "finish"
  amount?: number
}

export const TRAIL: TrailTile[] = [
  { icon: "🚩", label: "Start", kind: "start" },
  { icon: "🪙", label: "+10 XP", kind: "xp", amount: 10 },
  { icon: "🎲", label: "Chance card", kind: "chance" },
  { icon: "🪙", label: "+10 XP", kind: "xp", amount: 10 },
  { icon: "🎮", label: "Minigame burst", kind: "burst" },
  { icon: "👹", label: "Boss ambush", kind: "boss" },
  { icon: "🪙", label: "+15 XP", kind: "xp", amount: 15 },
  { icon: "🎲", label: "Chance card", kind: "chance" },
  { icon: "⭐", label: "Star +25 XP", kind: "star", amount: 25 },
  { icon: "🎮", label: "Minigame burst", kind: "burst" },
  { icon: "👹", label: "Final boss", kind: "boss" },
  { icon: "🏁", label: "Finish", kind: "finish" },
]

export function rollDice(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export interface BoardPayload {
  kind: "board"
  pos: number
  log: string[]
}

export function parseBoard(content: string): BoardPayload | null {
  try {
    const p = JSON.parse(content)
    if (p && p.kind === "board" && typeof p.pos === "number") return p as BoardPayload
    return null
  } catch {
    return null
  }
}

export function boardState(comments: any[]): BoardPayload {
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i]
    if (c.category !== BOARD_CAT) continue
    const p = parseBoard(c.content)
    if (p) return p
  }
  return { kind: "board", pos: 0, log: [] }
}
