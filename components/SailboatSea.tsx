"use client"
import { useEffect, useRef } from "react"
import { fxNow, prefersReducedMotion, playSfx } from "../lib/juice"
import { fxBurst } from "./FXLayer"

interface SailboatSeaProps {
  wind: number
  anchor: number
  rocks: number
  step: number // 0..4 board step drives voyage progress
  islandLabel?: string
}

// Voyage progress: the boat earns distance from ceremony progress; wind
// fills the sails (+), anchors drag (−). Pure and testable.
export function boatProgress(step: number, wind: number, anchor: number): number {
  const p = 0.06 + step * 0.16 + (wind - anchor) * 0.03
  return Math.min(0.96, Math.max(0.04, p))
}

export default function SailboatSea({ wind, anchor, rocks, step, islandLabel = "Island" }: SailboatSeaProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const celebrated = useRef(false)

  useEffect(() => {
    if (step >= 4 && !celebrated.current) {
      celebrated.current = true
      playSfx("fanfare")
      try {
        const c = ref.current?.getBoundingClientRect()
        if (c) fxBurst(c.left + c.width * 0.9, c.top + c.height * 0.4, { count: 50, speed: 0.32 })
      } catch {
        /* ignore */
      }
    }
  }, [step])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0
    const still = prefersReducedMotion()

    const frame = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== Math.floor(w * dpr)) canvas.width = Math.floor(w * dpr)
      if (canvas.height !== Math.floor(h * dpr)) canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const now = still ? 0 : fxNow()
      const t = now * 0.001

      // Sky + sea
      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, "#0f0f23")
      sky.addColorStop(0.55, "#1a1a2e")
      sky.addColorStop(0.56, "#0e3a4a")
      sky.addColorStop(1, "#082832")
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)
      // Moon
      ctx.fillStyle = "#f5e6b8"
      ctx.beginPath()
      ctx.arc(w * 0.85, h * 0.18, 14, 0, Math.PI * 2)
      ctx.fill()

      const horizon = h * 0.56
      // Waves (two sine layers)
      for (const [amp, speed, col] of [[6, 1.1, "rgba(45,156,219,0.5)"], [9, 0.6, "rgba(45,156,219,0.25)"]] as const) {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w; x += 8) {
          ctx.lineTo(x, horizon + Math.sin(x * 0.03 + t * speed) * amp + Math.sin(x * 0.011 - t * speed * 0.7) * amp)
        }
        ctx.lineTo(w, h)
        ctx.closePath()
        ctx.fill()
      }

      // Island (goal) at right edge
      const ix = w - 46
      ctx.fillStyle = "#14532d"
      ctx.beginPath()
      ctx.ellipse(ix, horizon + 6, 44, 16, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#16a34a"
      ctx.font = "22px system-ui"
      ctx.textAlign = "center"
      ctx.fillText("🏝️", ix, horizon - 2)
      ctx.fillStyle = "#9ca3af"
      ctx.font = "10px system-ui"
      ctx.fillText(islandLabel.slice(0, 18), ix, horizon + 26)

      // Rocks (risks) ahead of the boat
      const prog = boatProgress(step, wind, anchor)
      const bx = 40 + prog * (w - 130)
      for (let i = 0; i < Math.min(rocks, 5); i++) {
        const rx = Math.min(w - 70, bx + 60 + i * 44)
        const bobR = still ? 0 : Math.sin(t * 1.3 + i) * 2
        ctx.fillStyle = "#4b5563"
        ctx.beginPath()
        ctx.moveTo(rx - 12, horizon + 8 + bobR)
        ctx.lineTo(rx, horizon - 14 + bobR)
        ctx.lineTo(rx + 12, horizon + 8 + bobR)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = "#9ca3af"
        ctx.font = "10px system-ui"
        ctx.fillText("🪨", rx, horizon - 16 + bobR)
      }

      // Boat: tilt grows with anchors, sail fills with wind
      const tilt = Math.max(-0.28, Math.min(0.28, (anchor - wind) * 0.05)) + (still ? 0 : Math.sin(t * 1.6) * 0.02)
      const by = horizon + (still ? 0 : Math.sin(t * 1.6 + 1) * 4)
      ctx.save()
      ctx.translate(bx, by)
      ctx.rotate(tilt)
      const sailFull = Math.min(1, wind / Math.max(1, wind + anchor))
      // Hull
      ctx.fillStyle = "#8b5a2b"
      ctx.beginPath()
      ctx.moveTo(-26, 0)
      ctx.lineTo(26, 0)
      ctx.lineTo(16, 14)
      ctx.lineTo(-16, 14)
      ctx.closePath()
      ctx.fill()
      // Mast + sail (belly grows with wind)
      ctx.strokeStyle = "#d1d5db"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -44)
      ctx.stroke()
      ctx.fillStyle = sailFull > 0.33 ? "#f8fafc" : "rgba(248,250,252,0.45)"
      ctx.beginPath()
      ctx.moveTo(0, -44)
      ctx.quadraticCurveTo(30 * (0.4 + sailFull), -24, 0, -4)
      ctx.closePath()
      ctx.fill()
      // Wind streaks
      if (wind > 0 && !still) {
        ctx.strokeStyle = "rgba(186,230,253,0.7)"
        ctx.lineWidth = 2
        for (let i = 0; i < Math.min(wind, 4); i++) {
          const yy = -34 + i * 9
          const xx = -((t * 60 + i * 26) % 60)
          ctx.beginPath()
          ctx.moveTo(-30 + xx, yy)
          ctx.lineTo(-12 + xx, yy)
          ctx.stroke()
        }
      }
      ctx.restore()

      // Caption
      ctx.fillStyle = "#9ca3af"
      ctx.font = "11px system-ui"
      ctx.textAlign = "left"
      ctx.fillText(`🌬️ ${wind} wind · ⚓ ${anchor} anchor · voyage ${Math.round(prog * 100)}%`, 8, h - 8)

      if (!still) raf = requestAnimationFrame(frame)
    }
    frame()
    if (still) return
    const loop = () => {
      frame()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [wind, anchor, rocks, step, islandLabel])

  return (
    <div className="glass rounded-xl p-4 mb-6">
      <p className="font-bold text-sm mb-2">⛵ Voyage <span className="font-normal text-gray-400 text-xs">— winds fill the sail, anchors list the boat</span></p>
      <canvas ref={ref} className="w-full h-52 rounded-lg border border-gray-800" aria-label={`Voyage at ${Math.round(boatProgress(step, wind, anchor) * 100)} percent`} />
    </div>
  )
}
