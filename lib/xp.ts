import { XP_PER_LEVEL } from "../constants"

// Pure Team-XP helpers. Single source of truth for all XP math in the app.
export function levelForXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1
}

export function progressToNext(xp: number): number {
  const normalized = ((Math.max(0, xp) % XP_PER_LEVEL) + XP_PER_LEVEL) % XP_PER_LEVEL
  return Math.min(100, Math.round((normalized / XP_PER_LEVEL) * 100))
}

// XP for finishing a ceremony: base + per entry shared.
export function ceremonyReward(entryCount: number): number {
  return 100 + Math.max(0, entryCount) * 10
}

// Streak bonus: 50 XP per consecutive sprint with all actions completed.
export function streakBonus(streak: number): number {
  return Math.max(0, streak) * 50
}

// XP granted when an action item is completed (schema default is 50).
export function actionXp(xpValue?: number | null): number {
  return xpValue ?? 50
}
