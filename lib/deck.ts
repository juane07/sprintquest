// Chance deck: wild cards with REAL effects (Q9.10 evolved).
// Effects map to actions the retro board can execute (timer, XP, polls...).
export type ChanceKind = "xp" | "timer" | "anon" | "poll" | "shuffle" | "spotlight" | "dice"

export interface ChanceEffect {
  kind: ChanceKind
  amount?: number
  note?: string
}

export interface ChanceCard {
  id: string
  title: string
  text: string
  effect: ChanceEffect
}

export const CHANCE_DECK: ChanceCard[] = [
  { id: "dice", title: "🎲 Dice Storm", text: "The team rolls one die — earn 5 XP per pip, right now.", effect: { kind: "dice" } },
  { id: "treasure", title: "🎁 Treasure", text: "Buried XP! The team banks +25 XP instantly.", effect: { kind: "xp", amount: 25 } },
  { id: "time", title: "⏳ Time Warp", text: "The round timer gains +2:00. Spend it wisely.", effect: { kind: "timer", amount: 120 } },
  { id: "hurry", title: "⚡ Hurry up", text: "The round timer loses 1:00. Pressure makes diamonds.", effect: { kind: "timer", amount: -60 } },
  { id: "zombie", title: "🧟 Zombie round", text: "The next entry from everyone is forced anonymous. Brains optional.", effect: { kind: "anon" } },
  { id: "poll", title: "🗳️ Instant Poll", text: "A lightning poll drops on the board — answer together.", effect: { kind: "poll" } },
  { id: "shuffle", title: "🔄 Shuffle", text: "The board shuffles — entries appear in random order. Fresh eyes.", effect: { kind: "shuffle" } },
  { id: "spotlight", title: "✨ Spotlight", text: "The latest entry gets the spotlight — everyone reads it, then reacts.", effect: { kind: "spotlight" } },
]

export function drawChance(excludeIds: string[] = []): ChanceCard {
  const pool = CHANCE_DECK.filter((c) => !excludeIds.includes(c.id))
  const deck = pool.length > 0 ? pool : CHANCE_DECK
  return deck[Math.floor(Math.random() * deck.length)]
}

export interface PollQuestion {
  q: string
  opts: [string, string, string]
}

export const POLL_QUESTIONS: PollQuestion[] = [
  { q: "Tabs or spaces?", opts: ["Tabs", "Spaces", "Prettier decides"] },
  { q: "Best meeting time?", opts: ["Morning", "After lunch", "Never"] },
  { q: "Deploy on Friday?", opts: ["Ship it", "Never", "Only with cake"] },
  { q: "Ideal sprint length?", opts: ["1 week", "2 weeks", "Continuous"] },
  { q: "Code review style?", opts: ["Nitpick", "LGTM", "Pair it"] },
  { q: "Standup format?", opts: ["Round-robin", "Async", "Walk & talk"] },
]
