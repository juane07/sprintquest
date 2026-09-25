export const XP_PER_LEVEL = 1000

// Reflection prompt types for structured metacognitive phases
export type ReflectionType = "metacognitive" | "elaborative" | "evaluative" | "exploratory"

export interface ReflectionPrompt {
  question: string
  type: ReflectionType
}

export interface RetrievalPrompt {
  prompt: string
  type: "early" | "mid" | "deep"
}

// Spaced retrieval prompts — adapts based on sprint number
// Grounded in Dunlosky et al. (2013): retrieval practice > re-reading
export const RETRIEVAL_PROMPTS: Record<string, RetrievalPrompt[]> = {
  early: [
    { prompt: "What did your team commit to in the last sprint? Did you follow through?", type: "early" },
    { prompt: "Recall one thing your team accomplished last sprint. What made it work?", type: "early" },
  ],
  mid: [
    { prompt: "What patterns do you notice across your team's recent sprints?", type: "mid" },
    { prompt: "What was the biggest lesson from 2 sprints ago? Does it still apply?", type: "mid" },
  ],
  deep: [
    { prompt: "What did your team learn 3 sprints ago that still applies today?", type: "deep" },
    { prompt: "What pattern has your team been unable to break? What would it take?", type: "deep" },
  ],
}

// Structured reflection prompts per game mode — grounded in Tannenbaum & Cerasoli (2013)
export const REFLECTION_PROMPTS: Record<string, ReflectionPrompt[]> = {
  BOSS_BATTLE: [
    { question: "What surprised us about the bosses we identified?", type: "metacognitive" as const },
    { question: "Why do you think this problem keeps recurring?", type: "elaborative" as const },
    { question: "How confident are we that our chosen fight is the right one?", type: "evaluative" as const },
    { question: "What would we try if we had to approach this differently?", type: "exploratory" as const },
  ],
  SAILBOAT: [
    { question: "What did we underestimate about what pushes us forward?", type: "metacognitive" as const },
    { question: "Why do you think these anchors are holding us back?", type: "elaborative" as const },
    { question: "How accurately did we predict the rocks ahead?", type: "evaluative" as const },
    { question: "What would our island look like if we zoomed out 3 sprints?", type: "exploratory" as const },
  ],
}

export const DEFAULT_REFLECTION_PROMPTS: ReflectionPrompt[] = [
  { question: "What's the most surprising insight from this round?", type: "metacognitive" },
  { question: "Why do you think this pattern emerged?", type: "elaborative" },
  { question: "How well did we capture what actually happened?", type: "evaluative" },
  { question: "What would we question if we looked at this from the outside?", type: "exploratory" },
]

interface ModeCategory { name: string; hint: string }
interface ModeRound { title: string; prompt: string }
export interface ModeConfig {
  name: string
  desc: string
  intro: string
  rounds: ModeRound[]
  categories: ModeCategory[]
  voteTitle: string
  victoryTitle: string
  victoryEmoji: string
}

export const MODE_CONFIG: Record<string, ModeConfig> = {
  BOSS_BATTLE: {
    name: "🔥 Boss Battle",
    desc: "Identify and defeat the biggest problem",
    intro: "Every sprint has a final boss. Name them, find their weakness, vote which one you fight first.",
    rounds: [
      { title: "Spot the bosses", prompt: "What slowed the team down? Name one boss per entry — be specific." },
      { title: "Find weaknesses", prompt: "For each boss: what can we exploit? A tool, a habit, a decision?" },
      { title: "Vote the fight", prompt: "Time to choose. Which boss does the team fight first?" },
      { title: "Claim the loot", prompt: "What did we learn? What do we carry into the next sprint?" },
    ],
    categories: [
      { name: "👹 Boss", hint: "The problem, e.g. 'Flaky CI pipeline'" },
      { name: "🗡️ Weakness", hint: "How to beat it" },
      { name: "🛡️ Loot", hint: "What we learned" },
    ],
    voteTitle: "Which boss does the team fight first?",
    victoryTitle: "Boss Defeated!",
    victoryEmoji: "⚔️",
  },
  SAILBOAT: {
    name: "🏝️ Sailboat",
    desc: "Wind in sails vs anchor holding back",
    intro: "Your team is a sailboat. Catch the wind, cut the anchors, watch for rocks, set the course.",
    rounds: [
      { title: "Catch the wind", prompt: "What pushed the team forward this sprint?" },
      { title: "Cut the anchors", prompt: "What held the team back? Be honest, be kind." },
      { title: "Watch for rocks", prompt: "What risks do you see ahead for next sprint?" },
      { title: "Set the course", prompt: "Where is our island? What does success look like next sprint?" },
    ],
    categories: [
      { name: "🌬️ Wind", hint: "What helped us move fast" },
      { name: "⚓ Anchor", hint: "What slowed us down" },
      { name: "🪨 Rocks", hint: "Risks ahead" },
      { name: "🏝️ Island", hint: "Our goal for next sprint" },
    ],
    voteTitle: "What do we fix first?",
    victoryTitle: "Course Set!",
    victoryEmoji: "⛵",
  },

}

// Team Journey Board — cooperative wrapper skin over existing modes.
// Single team token, no dice for advancement, no XP for moving.
// Boosters add depth (not speed) and are opt-in, 1 use each per ceremony.
export interface BoardStep { id: string; label: string; emoji: string; hint: string }
export const BOARD_STEPS: BoardStep[] = [
  { id: "salida", label: "Salida", emoji: "🏁", hint: "Retrieval + safety: review last commitments" },
  { id: "compartir", label: "Compartir", emoji: "💬", hint: "Share entries, one idea each" },
  { id: "profundizar", label: "Profundizar", emoji: "🔍", hint: "Guided reflection prompts" },
  { id: "votar", label: "Votar", emoji: "🗳️", hint: "Team decides together" },
  { id: "quest", label: "Quest", emoji: "⚔️", hint: "Commit with owner + date" },
]

export interface DepthBooster { id: "lupa" | "doble-porque" | "puente"; label: string; emoji: string; desc: string }
export const DEPTH_BOOSTERS: DepthBooster[] = [
  { id: "lupa", label: "Lupa", emoji: "🔍", desc: "Reveal one pattern from past sprints (suggestion only)" },
  { id: "doble-porque", label: "Doble porqué", emoji: "❓", desc: "Add one extra 'why?' elaborative prompt" },
  { id: "puente", label: "Puente", emoji: "🌉", desc: "Suggest grouping two similar ideas (team confirms)" },
]

export const BOARD_COPY = {
  tagline: "Tu retro de siempre, en tablero de equipo.",
  advanceBlocked: "Add at least 3 team entries before advancing — slow is deep.",
} as const
export const DEFAULT_MODE: ModeConfig = {
  name: "Retro",
  desc: "Classic retrospective",
  intro: "Share honestly. Every voice counts.",
  rounds: [
    { title: "Share", prompt: "What happened this sprint?" },
    { title: "Dig deeper", prompt: "What's behind those entries?" },
    { title: "Vote", prompt: "What matters most?" },
    { title: "Commit", prompt: "What do we change next sprint?" },
  ],
  categories: [
    { name: "Positive", hint: "What went well" },
    { name: "Challenge", hint: "What was hard" },
    { name: "Action", hint: "What we'll do" },
    { name: "Insight", hint: "What we learned" },
    { name: "Idea", hint: "What we could try" },
  ],
  voteTitle: "What matters most?",
  victoryTitle: "Quest Complete!",
  victoryEmoji: "🎉",
}
