// Mastery Deck progression system
// Grounded in Sailer et al. (2020): mastery-based badges have g = 0.277 vs participation g = 0.06
// Deci & Ryan (1999): competence requires perceived mastery, not participation
// Deci et al. (1999): extrinsic rewards undermine intrinsic motivation unless informational

export interface MasteryCard {
  id: string
  name: string
  description: string
  icon: string
  category: "pattern" | "bridge" | "deep" | "safety"
  unlocked: boolean
  unlockedAt?: Date
  criteria: string
}

export interface MasteryDeck {
  teamId: string
  cards: MasteryCard[]
  sprintCount: number
  lastUnlocked?: string
}

// All possible mastery cards — each requires demonstrated behavior
export const MASTERY_CARDS: MasteryCard[] = [
  {
    id: "pattern-spotter",
    name: "Pattern Spotter",
    description: "Identified a recurring pattern across 3+ retros",
    icon: "🔍",
    category: "pattern",
    unlocked: false,
    criteria: "AI detected the same topic appearing across 3+ retros",
  },
  {
    id: "bridge-builder",
    name: "Bridge Builder",
    description: "Connected a past commitment to a current action",
    icon: "🌉",
    category: "bridge",
    unlocked: false,
    criteria: "Reflected on how a past commitment evolved into a current action",
  },
  {
    id: "deep-thinker",
    name: "Deep Thinker",
    description: "Completed all reflection prompts in a session",
    icon: "🧠",
    category: "deep",
    unlocked: false,
    criteria: "Answered all elaborative/evaluative reflection prompts",
  },
  {
    id: "safety-builder",
    name: "Safety Builder",
    description: "Team scored 4+ on psychological safety check-in",
    icon: "🛡️",
    category: "safety",
    unlocked: false,
    criteria: "Team averaged 4+ on safety check-in for 2+ consecutive sprints",
  },
  {
    id: "recall-master",
    name: "Recall Master",
    description: "Correctly recalled 3+ past commitments in warm-up",
    icon: "🎯",
    category: "pattern",
    unlocked: false,
    criteria: "Spaced retrieval warm-up: correctly identified 3+ past commitments",
  },
  {
    id: "facilitator",
    name: "Facilitator",
    description: "Used AI suggestions to guide team reflection",
    icon: "🤖",
    category: "deep",
    unlocked: false,
    criteria: "Followed AI facilitation suggestions during a retro session",
  },
  {
    id: "honest-share",
    name: "Honest Sharer",
    description: "Shared anonymously and received team validation",
    icon: "💬",
    category: "safety",
    unlocked: false,
    criteria: "Anonymous entry validated by team vote as most insightful",
  },
  {
    id: "pattern-breaker",
    name: "Pattern Breaker",
    description: "Identified and addressed a pattern that persisted 3+ sprints",
    icon: "⚡",
    category: "pattern",
    unlocked: false,
    criteria: "Team acknowledged breaking a persistent pattern in reflection",
  },
]

export function getMasteryDeck(teamId: string): MasteryDeck {
  return {
    teamId,
    cards: [...MASTERY_CARDS],
    sprintCount: 0,
  }
}

export function unlockCard(deck: MasteryDeck, cardId: string): MasteryDeck {
  const card = deck.cards.find(c => c.id === cardId)
  if (!card || card.unlocked) return deck
  return {
    ...deck,
    cards: deck.cards.map(c =>
      c.id === cardId ? { ...c, unlocked: true, unlockedAt: new Date() } : c
    ),
    lastUnlocked: cardId,
  }
}

export function getUnlockedCards(deck: MasteryDeck): MasteryCard[] {
  return deck.cards.filter(c => c.unlocked)
}

export function getMasteryLevel(deck: MasteryDeck): number {
  const unlocked = getUnlockedCards(deck).length
  if (unlocked === 0) return 1
  if (unlocked <= 2) return 2
  if (unlocked <= 4) return 3
  if (unlocked <= 6) return 4
  return 5
}

export function getMasteryLabel(level: number): string {
  const labels = ["", "Apprentice", "Journeyman", "Expert", "Master", "Legend"]
  return labels[Math.min(level, labels.length - 1)]
}

export function masteryStorageDescription(card: MasteryCard): string {
  return `mastery:${card.id} — ${card.criteria}`
}

export function isMasteryBadge(badge: { name?: string | null; description?: string | null }, card: MasteryCard): boolean {
  return badge.name === card.name || (badge.description ?? "").includes(card.id)
}

// Build a MasteryDeck from Badge rows stored in Supabase.
// The Badge table only has name/description, so mastery cards are matched
// by canonical name or by the `mastery:<cardId>` marker in description.
export function buildDeckFromBadges(teamId: string, badges: { name?: string | null; description?: string | null }[]): MasteryDeck {
  const cards = MASTERY_CARDS.map(card => ({
    ...card,
    unlocked: badges.some(b => isMasteryBadge(b, card)),
  }))
  return {
    teamId,
    cards,
    sprintCount: 0,
    lastUnlocked: cards.find(c => c.unlocked)?.id,
  }
}
