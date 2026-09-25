import { describe, it, expect } from "vitest"
import {
  rng,
  spawnBurst,
  stepParticles,
  particleAlpha,
  shakeOffset,
  SFX_SCORE,
} from "../lib/juice"
import { targetBoss } from "../components/BossArena"
import { boatProgress } from "../components/SailboatSea"

describe("juice particles", () => {
  it("spawns deterministic bursts with a seed", () => {
    const a = spawnBurst(10, 20, { count: 12, seed: 42 })
    const b = spawnBurst(10, 20, { count: 12, seed: 42 })
    expect(a).toHaveLength(12)
    expect(a).toEqual(b)
    expect(spawnBurst(10, 20, { count: 12, seed: 7 })).not.toEqual(a)
  })
  it("steps physics and expires dead particles", () => {
    let ps = spawnBurst(0, 0, { count: 10, seed: 1, life: 100 })
    expect(ps.every((p) => p.life > 0)).toBe(true)
    ps = stepParticles(ps, 50)
    expect(ps.length).toBeGreaterThan(0)
    expect(ps.every((p) => p.life <= 100)).toBe(true)
    ps = stepParticles(ps, 10_000)
    expect(ps).toHaveLength(0)
  })
  it("moves particles along velocity with gravity", () => {
    const ps = stepParticles(
      [{ x: 0, y: 0, vx: 0.1, vy: 0, life: 1000, maxLife: 1000, size: 3, color: "#fff", gravity: 0.001 }],
      100,
    )
    expect(ps[0].x).toBeCloseTo(10)
    expect(ps[0].vy).toBeCloseTo(0.1)
  })
  it("fades alpha with remaining life", () => {
    expect(particleAlpha({ x: 0, y: 0, vx: 0, vy: 0, life: 50, maxLife: 100, size: 1, color: "", gravity: 0 })).toBeCloseTo(0.5)
    expect(particleAlpha({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 100, size: 1, color: "", gravity: 0 })).toBe(0)
  })
  it("rng is deterministic per seed", () => {
    const a = rng(99)
    const b = rng(99)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})

describe("shakeOffset", () => {
  it("is zero without trauma and bounded with trauma", () => {
    expect(shakeOffset(0, 1234)).toEqual({ dx: 0, dy: 0 })
    for (const t of [0, 500, 1234, 9999]) {
      const { dx, dy } = shakeOffset(1, t)
      expect(Math.abs(dx)).toBeLessThanOrEqual(10)
      expect(Math.abs(dy)).toBeLessThanOrEqual(10)
    }
    const half = shakeOffset(0.5, 777, 10)
    expect(Math.abs(half.dx)).toBeLessThanOrEqual(2.5 + 1e-9)
  })
})

describe("targetBoss", () => {
  const mk = (id: string, hp: number, defeated: boolean) => ({ id, content: id, hp, defeated, myAttacked: false })
  it("picks the weakest alive boss, prefers any alive over defeated", () => {
    expect(targetBoss([])).toBeNull()
    expect(targetBoss([mk("a", 100, false), mk("b", 25, false), mk("c", 0, true)])!.id).toBe("b")
    expect(targetBoss([mk("a", 0, true)])!.id).toBe("a")
  })
})
describe("boatProgress", () => {
  it("advances with steps and wind, drags with anchors, stays bounded", () => {
    expect(boatProgress(0, 0, 0)).toBeGreaterThan(0)
    expect(boatProgress(4, 0, 0)).toBeGreaterThan(boatProgress(0, 0, 0))
    expect(boatProgress(2, 5, 0)).toBeGreaterThan(boatProgress(2, 0, 0))
    expect(boatProgress(2, 0, 5)).toBeLessThan(boatProgress(2, 0, 0))
    expect(boatProgress(4, 99, 0)).toBeLessThanOrEqual(0.96)
    expect(boatProgress(0, 0, 99)).toBeGreaterThanOrEqual(0.04)
  })
})
describe("SFX_SCORE", () => {
  it("defines every effect with sane frequencies", () => {
    for (const [name, notes] of Object.entries(SFX_SCORE)) {
      expect(notes.length, name).toBeGreaterThan(0)
      for (const n of notes) {
        expect(n.freq).toBeGreaterThanOrEqual(20)
        expect(n.freq).toBeLessThanOrEqual(4000)
        expect(n.dur).toBeGreaterThan(0)
      }
    }
  })
})
