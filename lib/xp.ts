import { XP_PER_LEVEL } from "../constants"

// Pure Team-XP helpers. Single source of truth for all engagement math.
// NOTE: These metrics are informational — like a fitness tracker shows steps.
// They are NEVER framed as rewards. Use "engagement level" not "earned XP".

export function levelForXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1
}

export function progressToNext(xp: number): number {
  const normalized = ((Math.max(0, xp) % XP_PER_LEVEL) + XP_PER_LEVEL) % XP_PER_LEVEL
  return Math.min(100, Math.round((normalized / XP_PER_LEVEL) * 100))
}

// Engagement metric for finishing a ceremony: base + per entry shared.
// Informational only — not a reward. Frames participation as a dashboard metric.
export function engagementMetric(entryCount: number): number {
  return 100 + Math.max(0, entryCount) * 10
}

// Streak indicator: consecutive sprints with all actions reviewed.
// Informational — tracks team consistency, never a prize.
export function streakIndicator(streak: number): number {
  return Math.max(0, streak) * 50
}

// Action completion value — tracked on engagement dashboard.
export function actionValue(xpValue?: number | null): number {
  return xpValue ?? 50
}

// Informational label generator for UI display
export function engagementLabel(score: number): string {
  if (score >= 500) return "High engagement"
  if (score >= 300) return "Strong engagement"
  if (score >= 100) return "Moderate engagement"
  return "Building engagement"
}

export function levelLabel(level: number): string {
  return `Level ${level} — Team Maturity`
}
