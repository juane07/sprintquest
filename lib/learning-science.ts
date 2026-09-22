// Learning science module: Spaced retrieval and structured reflection
// Grounded in Dunlosky et al. (2013), Nature Reviews Psychology (2022),
// Tannenbaum & Cerasoli (2013), Bjork (1994)

import { DEFAULT_REFLECTION_PROMPTS } from "../constants"

export interface ReflectionPrompt {
  question: string
  type: "metacognitive" | "elaborative" | "evaluative" | "exploratory"
}

export interface RetrievalData {
  sprintNumber: number
  prompt: string
  type: string
}

// Spaced retrieval prompts adapt based on sprint history
// Follows the spacing effect: longer intervals = more durable memory
const RETRIEVAL_PROMPTS = {
  early: [
    "What did your team commit to in the last sprint? Did you follow through?",
    "Recall one thing your team accomplished last sprint. What made it work?",
    "Think back: what was the biggest challenge last sprint? How did you handle it?",
  ],
  mid: [
    "What patterns do you notice in your team's last few sprints?",
    "Recall your team's commitments from 2 sprints ago. Were they completed?",
    "What has been consistent in your retros? What has changed?",
  ],
  deep: [
    "What did your team learn 3 sprints ago that still applies today?",
    "Reflect: what pattern has your team been unable to break? What would it take?",
    "Recall the last time your team hit a goal. What was the sequence of actions?",
  ],
}

const REFLECTION_PROMPTS = {
  BOSS_BATTLE: [
    { question: "What surprised us about the bosses we identified?", type: "metacognitive" },
    { question: "Why do you think this problem keeps recurring?", type: "elaborative" },
    { question: "How confident are we that our chosen fight is the right one?", type: "evaluative" },
    { question: "What would we try if we had to approach this differently?", type: "exploratory" },
  ],
  SAILBOAT: [
    { question: "What did we underestimate about what pushes us forward?", type: "metacognitive" },
    { question: "Why do you think these anchors are holding us back?", type: "elaborative" },
    { question: "How accurately did we predict the rocks ahead?", type: "evaluative" },
    { question: "What would our island look like if we zoomed out 3 sprints?", type: "exploratory" },
  ],
  DEFAULT: [
    { question: "What's the most surprising insight from this round?", type: "metacognitive" },
    { question: "Why do you think this pattern emerged?", type: "elaborative" },
    { question: "How well did we capture what actually happened?", type: "evaluative" },
    { question: "What would we question if we looked at this from the outside?", type: "exploratory" },
  ],
}

export function getRetrievalPrompt(sprintNumber: number): RetrievalData {
  if (sprintNumber <= 2) {
    const prompts = RETRIEVAL_PROMPTS.early
    return { sprintNumber, prompt: prompts[0], type: "early" }
  } else if (sprintNumber <= 5) {
    const prompts = RETRIEVAL_PROMPTS.mid
    const idx = Math.min(prompts.length - 1, sprintNumber - 3)
    return { sprintNumber, prompt: prompts[idx], type: "mid" }
  } else {
    const prompts = RETRIEVAL_PROMPTS.deep
    const idx = Math.min(prompts.length - 1, sprintNumber - 6)
    return { sprintNumber, prompt: prompts[idx], type: "deep" }
  }
}

export function getReflectionPrompts(gameMode: string): ReflectionPrompt[] {
  const key = gameMode as keyof typeof REFLECTION_PROMPTS
  return (REFLECTION_PROMPTS[key] ?? DEFAULT_REFLECTION_PROMPTS) as ReflectionPrompt[]
}

// Generate elaborative interrogation prompts for deeper learning
export function getElaborativePrompts(count: number = 2): string[] {
  const prompts = [
    "Why did this happen rather than the opposite?",
    "What evidence would disprove our current theory?",
    "How does this connect to what we learned 3 sprints ago?",
    "If a new team member asked about this, how would we explain it?",
    "What's the hidden assumption behind this conclusion?",
    "What would need to be true for the opposite to be the case?",
  ]
  return prompts.slice(0, count)
}

// Adaptive pacing: suggest round duration based on activity level
export function getAdaptiveRoundDuration(entryCount: number, round: number): number {
  const base = 4 // minutes minimum
  const perEntry = Math.min(2, Math.ceil(entryCount / 5)) // up to 2 min per entry
  const roundBonus = round > 2 ? 1 : 0 // extra time for deeper rounds
  return base + perEntry + roundBonus
}

export function shouldExtendRound(hasNewEntries: boolean, secondsLeft: number): boolean {
  if (secondsLeft > 60 && !hasNewEntries) return false // time to stop
  if (hasNewEntries && secondsLeft < 120) return true // keep going
  return false
}
