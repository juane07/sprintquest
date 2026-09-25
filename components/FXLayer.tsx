"use client"
import { useEffect, useRef } from "react"
import {
  spawnBurst,
  stepParticles,
  particleAlpha,
  fxNow,
  prefersReducedMotion,
  unlockAudio,
  type Particle,
  type BurstOptions,
} from "../lib/juice"

// Global fire-and-forget API: fxBurst(clientX, clientY) from anywhere.
// Pointer-events-none overlay, zero layout impact.
type BurstFn = (x: number, y: number, opts?: BurstOptions) => void
const listeners = new Set<BurstFn>()

export function fxBurst(x: number, y: number, opts?: BurstOptions): void {
  if (typeof window === "undefined" || prefersReducedMotion()) return
  listeners.forEach((fn) => {
    try {
      fn(x, y, opts)
    } catch {
      /* ignore */
    }
  })
}

export default function FXLayer() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let particles: Particle[] = []
    let raf = 0
    let last = fxNow()

    const resize = () => {
      try {
        canvas.width = Math.floor(window.innerWidth * Math.min(2, window.devicePixelRatio || 1))
        canvas.height = Math.floor(window.innerHeight * Math.min(2, window.devicePixelRatio || 1))
      } catch {
        /* ignore */
      }
    }
    resize()
    window.addEventListener("resize", resize)
    // Unlock Web Audio on first gesture (autoplay policy), once.
    const unlock = () => {
      unlockAudio()
      window.removeEventListener("pointerdown", unlock)
    }
    window.addEventListener("pointerdown", unlock)

    const onBurst: BurstFn = (x, y, opts) => {
      particles = [...particles, ...spawnBurst(x, y, opts)].slice(-400)
    }
    listeners.add(onBurst)

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const now = fxNow()
      const dt = Math.min(50, Math.max(0, now - last))
      last = now
      if (dt === 0 && particles.length === 0) return
      particles = stepParticles(particles, dt)
      const scale = canvas.width / Math.max(1, window.innerWidth)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        ctx.globalAlpha = particleAlpha(p)
        ctx.fillStyle = p.color
        const s = Math.max(1, p.size * scale)
        ctx.fillRect(p.x * scale - s / 2, p.y * scale - s / 2, s, s)
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointerdown", unlock)
      listeners.delete(onBurst)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="fixed inset-0 w-screen h-screen pointer-events-none"
      style={{ zIndex: 60 }}
    />
  )
}
