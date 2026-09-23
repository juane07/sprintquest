// Hanabi-style Information Asymmetry warm-up
// Grounded in Dunlosky et al. (2013): retrieval practice is most effective
// when effortful and cooperative. Hanabi requires teammates to communicate
// what they CANNOT see — mirrors Scrum's "information sharing" principle.
// Edmondson (1999): psychological safety enables this vulnerability.

export interface AsymmetryCard {
  id: string
  sprintNumber: number
  commitment: string
  outcome: string
  revealed: boolean
}

export interface AsymmetryPlayer {
  playerId: string
  playerName: string
  hand: AsymmetryCard[]
  shownToTeam: boolean
}

export function normalizePlayerCount(playerCount: number): number {
  if (!Number.isFinite(playerCount)) return 3
  return Math.min(6, Math.max(1, Math.floor(playerCount)))
}

export interface AsymmetryRound {
  round: number
  totalRounds: number
  prompt: string
  teamAnswer: string
  timeLeft: number
}

// Hanabi-style warm-up data for retro sessions
// Each player gets cards about past sprints they can't show others
export function generateAsymmetryCards(
  sprintNumber: number,
  playerCount: number
): AsymmetryPlayer[] {
  const commitments = [
    "Deployed the new authentication flow",
    "Fixed the CI pipeline bottleneck",
    "Completed the API documentation",
    "Refactored the database queries",
    "Added integration tests for payments",
    "Improved onboarding flow by 40%",
    "Resolved the memory leak in worker",
    "Shipped the notification system",
    "Updated the design system components",
    "Reduced build time from 8min to 3min",
  ]
  const outcomes = [
    "It worked perfectly on first try",
    "Had to rollback one deployment",
    "Took longer than expected but landed",
    "Blocked by dependency upgrade",
    "Team collaboration made it possible",
    "Learned something unexpected",
    "Required two iterations to get right",
    "Was smooth until the final review",
    "Cascading effects we didn't anticipate",
    "Simpler than we thought it would be",
  ]

  const players: AsymmetryPlayer[] = []
  const usedCommitments = new Set<number>()
  const count = normalizePlayerCount(playerCount)

  for (let i = 0; i < count; i++) {
    const hand: AsymmetryCard[] = []
    const numCards = 2 + Math.floor(Math.random() * 2) // 2-3 cards per player
    const available = commitments
      .map((c, idx) => ({ commitment: c, outcome: outcomes[idx % outcomes.length], idx }))
      .filter(x => !usedCommitments.has(x.idx))
      .sort(() => Math.random() - 0.5)
      .slice(0, numCards)

    available.forEach(a => usedCommitments.add(a.idx))

    hand.push(...available.map((a, cardIdx) => ({
      id: `card-${i}-${cardIdx}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sprintNumber: Math.max(1, sprintNumber - (cardIdx + 1)),
      commitment: a.commitment,
      outcome: a.outcome,
      revealed: false,
    })))

    players.push({
      playerId: `player-${i}`,
      playerName: `Teammate ${i + 1}`,
      hand,
      shownToTeam: false,
    })
  }

  return players
}

// Generate the cooperative prompt for the warm-up round
export function getAsymmetryPrompt(sprintNumber: number): string {
  if (sprintNumber <= 2) {
    return "Each person has cards from last sprint they can't show others. Describe them verbally so the team can guess which commitments were made. No pointing, no showing — words only."
  } else if (sprintNumber <= 5) {
    return "Each person has cards from 2-3 sprints ago. One key commitment per card. Guide your teammates to identify them using only descriptions — what was the challenge, what was the outcome?"
  } else {
    return "Deep recall round. Each person holds cards from 3+ sprints ago. Describe the commitment and its outcome so the team reconstructs the pattern. What kept recurring?"
  }
}
