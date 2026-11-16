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

// Structured reflection prompts — grounded in Tannenbaum & Cerasoli (2013)
export const REFLECTION_PROMPTS: Record<string, ReflectionPrompt[]> = {
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

export const SAILBOAT_MODE: ModeConfig = {
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
}

export const MODE_CONFIG: Record<string, ModeConfig> = {
  SAILBOAT: SAILBOAT_MODE,
}

// Team Journey Board — cooperative wrapper skin over existing modes.
// Single team token, no dice for advancement, no XP for moving.
// Boosters add depth (not speed) and are opt-in, 1 use each per ceremony.
export interface BoardStep { id: string; label: string; emoji: string; hint: string }
export const BOARD_STEPS: BoardStep[] = [
  { id: "salida", label: "Start", emoji: "🏁", hint: "Retrieval + safety: review last commitments" },
  { id: "compartir", label: "Share", emoji: "💬", hint: "Share entries, one idea each" },
  { id: "profundizar", label: "Deepen", emoji: "🔍", hint: "Guided reflection prompts" },
  { id: "votar", label: "Vote", emoji: "🗳️", hint: "Team decides together" },
  { id: "quest", label: "Quest", emoji: "⚔️", hint: "Commit with owner + date" },
]

export interface DepthBooster { id: "lupa" | "doble-porque" | "puente"; label: string; emoji: string; desc: string }
export const DEPTH_BOOSTERS: DepthBooster[] = [
  { id: "lupa", label: "Magnifier", emoji: "🔍", desc: "Reveal one pattern from past sprints (suggestion only)" },
  { id: "doble-porque", label: "Why Twice", emoji: "❓", desc: "Add one extra 'why?' elaborative prompt" },
  { id: "puente", label: "Bridge", emoji: "🌉", desc: "Suggest grouping two similar ideas (team confirms)" },
]

export const BOARD_COPY = {
  tagline: "Your usual retro, on a team board.",
  advanceBlocked: "Add at least 3 team entries before advancing — slow is deep.",
} as const
// Single-mode app: Sailboat is the default and only ceremony mode.
export const DEFAULT_MODE: ModeConfig = SAILBOAT_MODE
