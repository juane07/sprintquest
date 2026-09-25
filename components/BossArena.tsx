"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { BOSS_HP } from "../lib/boss"
import {
  fxNow,
  shakeOffset,
  hitStop,
  shakeElement,
  playSfx,
  unlockAudio,
  prefersReducedMotion,
  isMuted,
  setMuted as saveMuted,
} from "../lib/juice"
import { fxBurst } from "./FXLayer"

export interface ArenaBoss {
  id: string
  content: string
  hp: number // 0..BOSS_HP
  defeated: boolean
  myAttacked: boolean
}

interface BossArenaProps {
  bosses: ArenaBoss[]
  onAttack: (id: string, at: { x: number; y: number }) => void
}

interface Projectile {
  x0: number
  y0: number
  x1: number
  y1: number
  t0: number
  dur: number
}

function bossCenter(w: number, h: number): { x: number; y: number; r: number } {
  const r = Math.max(40, Math.min(72, w * 0.11))
  return { x: w / 2, y: h / 2 + 10, r }
}

export function targetBoss(bosses: ArenaBoss[]): ArenaBoss | null {
  const alive = bosses.filter((b) => !b.defeated)
  if (alive.length === 0) return bosses[0] ?? null
  return [...alive].sort((a, b) => a.hp - b.hp)[0]
}

export default function BossArena({ bosses, onAttack }: BossArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const trauma = useRef(0)
  const flashUntil = useRef(0)
  const projectiles = useRef<Projectile[]>([])
  const celebrated = useRef<Set<string>>(new Set())
  const targetRef = useRef<ArenaBoss | null>(null)
  targetRef.current = targetBoss(bosses)

  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [muted, setMuted] = useState(() => isMuted())

  // Defeat fanfare on transition (permanence: corpse stays drawn).
  useEffect(() => {
    const t = targetRef.current
    if (t && t.defeated && !celebrated.current.has(t.id)) {
      celebrated.current.add(t.id)
      const c = canvasRef.current
      if (c) {
        const r = c.getBoundingClientRect()
        fxBurst(r.left + r.width / 2, r.top + r.height / 2, { count: 60, speed: 0.4, colors: ["#f5a623", "#ff5a5a", "#ffffff", "#2d9cdb"] })
        shakeElement(wrapRef.current, 1.4)
      }
      playSfx("defeat")
      setTimeout(() => playSfx("fanfare"), 350)
    }
  }, [bosses])

  // Canvas loop: idle bob, projectiles, hit shake/flash, HP bar.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const t = targetRef.current
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== Math.floor(w * dpr)) canvas.width = Math.floor(w * dpr)
      if (canvas.height !== Math.floor(h * dpr)) canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (!t) {
        ctx.fillStyle = "#6b7280"
        ctx.font = "14px system-ui"
        ctx.textAlign = "center"
        ctx.fillText("Name a boss below to summon it 👹", w / 2, h / 2)
        return
      }

      const now = fxNow()
      const c = bossCenter(w, h)
      trauma.current = Math.max(0, trauma.current - 0.03)
      const sh = prefersReducedMotion() ? { dx: 0, dy: 0 } : shakeOffset(trauma.current, now, 9)
      const bob = t.defeated || prefersReducedMotion() ? 0 : Math.sin(now * 0.004) * 5
      const bx = c.x + sh.dx
      const by = c.y + bob + sh.dy
      const hpFrac = Math.max(0, t.hp / BOSS_HP)

      // Body: angry red at full HP, pale gray when near death / defeated.
      const bodyCol = t.defeated ? "#4b5563" : hpFrac > 0.5 ? "#dc2626" : hpFrac > 0.25 ? "#b45309" : "#6b7280"
      ctx.fillStyle = bodyCol
      ctx.beginPath()
      ctx.arc(bx, by, c.r, 0, Math.PI * 2)
      ctx.fill()
      // Spikes
      ctx.fillStyle = t.defeated ? "#374151" : "#7f1d1d"
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.4
        ctx.beginPath()
        ctx.moveTo(bx + Math.cos(a) * c.r * 0.95, by + Math.sin(a) * c.r * 0.95)
        ctx.lineTo(bx + Math.cos(a) * c.r * 1.3, by + Math.sin(a) * c.r * 1.3)
        ctx.lineTo(bx + Math.cos(a + 0.35) * c.r * 0.95, by + Math.sin(a + 0.35) * c.r * 0.95)
        ctx.fill()
      }
      // Hit flash
      if (now < flashUntil.current) {
        ctx.fillStyle = "rgba(255,255,255,0.75)"
        ctx.beginPath()
        ctx.arc(bx, by, c.r, 0, Math.PI * 2)
        ctx.fill()
      }
      // Eyes
      const ex = c.r * 0.36
      const ey = by - c.r * 0.15
      if (t.defeated) {
        ctx.strokeStyle = "#111827"
        ctx.lineWidth = 4
        for (const s of [-1, 1]) {
          const cx = bx + s * ex
          ctx.beginPath()
          ctx.moveTo(cx - 9, ey - 9)
          ctx.lineTo(cx + 9, ey + 9)
          ctx.moveTo(cx + 9, ey - 9)
          ctx.lineTo(cx - 9, ey + 9)
          ctx.stroke()
        }
      } else {
        for (const s of [-1, 1]) {
          ctx.fillStyle = "#fff"
          ctx.beginPath()
          ctx.arc(bx + s * ex, ey, 11, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = "#111"
          ctx.beginPath()
          ctx.arc(bx + s * ex, ey + 3, 5, 0, Math.PI * 2)
          ctx.fill()
        }
        // Snarl
        ctx.strokeStyle = "#450a0a"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(bx, by + c.r * 0.55, c.r * 0.35, Math.PI * 1.15, Math.PI * 1.85)
        ctx.stroke()
      }
      // Name + HP bar
      ctx.fillStyle = "#e5e7eb"
      ctx.font = "bold 13px system-ui"
      ctx.textAlign = "center"
      ctx.fillText(t.defeated ? `💀 ${t.content.slice(0, 34)} — DEFEATED` : `👹 ${t.content.slice(0, 34)}`, w / 2, 20)
      const bw = Math.min(320, w * 0.7)
      ctx.fillStyle = "#1f2937"
      ctx.fillRect(w / 2 - bw / 2, 28, bw, 12)
      ctx.fillStyle = t.defeated ? "#14b8a6" : "#ef4444"
      ctx.fillRect(w / 2 - bw / 2, 28, bw * hpFrac, 12)
      ctx.fillStyle = "#9ca3af"
      ctx.font = "11px system-ui"
      ctx.fillText(`${Math.round(t.hp)}/${BOSS_HP} HP`, w / 2, 52)

      // Projectiles
      projectiles.current = projectiles.current.filter((p) => {
        const k = Math.min(1, (now - p.t0) / p.dur)
        const x = p.x0 + (p.x1 - p.x0) * k
        const y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 24
        ctx.font = "20px system-ui"
        ctx.fillText("🗡️", x, y)
        return k < 1
      })
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [bosses.length])

  const fireAtBoss = useCallback(
    (fromClient: { x: number; y: number }, bossId: string) => {
      const canvas = canvasRef.current
      unlockAudio()
      if (canvas) {
        const r = canvas.getBoundingClientRect()
        const c = bossCenter(r.width, r.height)
        projectiles.current.push({
          x0: fromClient.x - r.left,
          y0: fromClient.y - r.top,
          x1: c.x,
          y1: c.y,
          t0: fxNow(),
          dur: 200,
        })
        window.setTimeout(() => {
          trauma.current = Math.min(1, trauma.current + 0.7)
          flashUntil.current = fxNow() + 180
          hitStop(50)
          shakeElement(wrapRef.current, 0.8)
          fxBurst(r.left + c.x, r.top + c.y, { count: 22, speed: 0.3 })
          playSfx("hit")
        }, 200)
      } else {
        playSfx("hit")
      }
      onAttack(bossId, fromClient)
    },
    [onAttack],
  )

  const onChipDown = (e: React.PointerEvent, id: string) => {
    unlockAudio()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    setDrag({ id, x: e.clientX, y: e.clientY })
  }
  const onChipMove = (e: React.PointerEvent) => {
    if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY })
  }
  const onChipUp = (e: React.PointerEvent) => {
    if (!drag) return
    const canvas = canvasRef.current
    const d = drag
    setDrag(null)
    playSfx("click")
    if (canvas) {
      const r = canvas.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        fireAtBoss({ x: e.clientX, y: e.clientY }, d.id)
        return
      }
    }
    // Dropped outside: treat as tap-attack from the chip (forgiving).
    fireAtBoss({ x: e.clientX, y: e.clientY }, d.id)
  }

  const target = targetBoss(bosses)

  return (
    <div ref={wrapRef} className="glass rounded-xl p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <p className="font-bold text-sm">⚔️ Boss Arena <span className="font-normal text-gray-400 text-xs">— drag a blade onto the boss, or tap it</span></p>
        <button
          onClick={() => {
            const next = !isMuted()
            saveMuted(next)
            setMuted(next)
          }}
          className="text-xs text-gray-400 hover:text-white"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
      <canvas ref={canvasRef} className="w-full h-64 rounded-lg bg-dark/60 border border-gray-800" aria-label={target ? `Boss ${target.content}, ${target.hp} HP` : "Empty boss arena"} />
      <div className="flex gap-2 mt-3 flex-wrap" aria-label="Attack blades">
        {bosses.filter((b) => !b.defeated).map((b) => (
          <button
            key={b.id}
            onPointerDown={(e) => onChipDown(e, b.id)}
            onPointerMove={onChipMove}
            onPointerUp={onChipUp}
            onPointerCancel={() => setDrag(null)}
            style={{ touchAction: "none" }}
            className={`text-xs px-3 py-1.5 rounded-full border cursor-grab active:cursor-grabbing select-none ${
              b.myAttacked ? "border-gold bg-gold/10 text-gold" : "border-red-500 text-red-300 hover:bg-red-500/10"
            }`}
            aria-label={`Attack boss ${b.content}`}
          >
            🗡️ {b.content.slice(0, 28)}
            {b.myAttacked ? " ✓" : ""}
          </button>
        ))}
        {bosses.length > 0 && bosses.every((b) => b.defeated) && (
          <span className="text-xs text-teal font-bold">All bosses defeated — forge quests from the loot below ⚔️</span>
        )}
      </div>
      {drag && (
        <div
          aria-hidden
          className="fixed z-[70] pointer-events-none text-2xl"
          style={{ left: drag.x - 14, top: drag.y - 14 }}
        >
          🗡️
        </div>
      )}
    </div>
  )
}
