// Boss Battle mechanics: each Boss entry has HP, team votes are damage.
// Tuned so a unanimous small team kills a boss (100 HP / 25 per attacker).
export const BOSS_HP = 100
export const ATTACK_DMG = 25
export const ATTACK_EMOJI = "🗡️"

export function bossHp(attackCount: number): number {
  return Math.max(0, BOSS_HP - Math.max(0, attackCount) * ATTACK_DMG)
}

export function isDefeated(attackCount: number): boolean {
  return bossHp(attackCount) <= 0
}
