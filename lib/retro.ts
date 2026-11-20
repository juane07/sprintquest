// Minimal Scrum retrospective model.
//
// Source: Scrum Guide 2020, "Sprint Retrospective": inspect how the last sprint
// went (individuals, issues, processes, tools, relationship quality), identify
// and order what went well and potential improvements, and create a plan with
// at least one improvement to implement in the next Sprint.
//
// Nothing in this module implements XP, levels, badges, quests, game modes,
// boosters or AI. Those are not part of a Scrum retrospective.

export const RETRO_CATEGORIES = [
  {
    id: "went-well",
    label: "What went well",
    hint: "People, issues, processes, tools, relationships — what helped?",
  },
  {
    id: "to-improve",
    label: "What to improve",
    hint: "What slowed us down or should change next sprint?",
  },
] as const

export type RetroCategoryId = (typeof RETRO_CATEGORIES)[number]["id"]

export function isRetroCategory(value: unknown): value is RetroCategoryId {
  return RETRO_CATEGORIES.some((c) => c.id === value)
}

export interface RetroEntry {
  id: string
  content: string
  category: string
  anonymous?: boolean | null
  author?: string | null
  createdAt?: string | null
}

export interface RetroAction {
  id: string
  title: string
  owner?: string | null
  status?: string | null
  createdAt?: string | null
}

export interface RetroVote {
  id: string
  option: string
  userId: string
}

const priorityOption = (entryId: string) => `${entryId}:priority`

export function priorityCount(votes: RetroVote[], entryId: string): number {
  const option = priorityOption(entryId)
  let n = 0
  for (const v of votes) if (v && v.option === option) n += 1
  return n
}

export function myPriority(votes: RetroVote[], entryId: string, uid: string): RetroVote | null {
  const option = priorityOption(entryId)
  for (const v of votes) if (v && v.option === option && v.userId === uid) return v
  return null
}

// "Identify and order" — the team orders the items it shared. One priority
// mark per device; the count is the order. No winners, no individual scoring.
export function orderedEntries(entries: RetroEntry[], votes: RetroVote[]): RetroEntry[] {
  return [...entries].sort((a, b) => {
    const diff = priorityCount(votes, b.id) - priorityCount(votes, a.id)
    if (diff !== 0) return diff
    return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""))
  })
}

// Scrum requires at least one concrete improvement planned for the next
// Sprint. An unnamed idea is a topic, not a plan: it needs an owner.
export function canFinish(actions: RetroAction[]): boolean {
  return actions.some(
    (a) =>
      !!a &&
      typeof a.title === "string" &&
      a.title.trim().length > 0 &&
      typeof a.owner === "string" &&
      a.owner.trim().length > 0,
  )
}
