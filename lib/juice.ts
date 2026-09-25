// Juice system: game-feel primitives with zero dependencies ($0).
// Canvas 2D + requestAnimationFrame + Web Animations API + Pointer Events
// + synthesized Web Audio. No libraries, no assets, all controllable via CLI.
//
// Accessibility contract (Vlambeer lesson): every effect honors
// prefers-reduced-motion and a persisted mute flag. Motion effects degrade
// to instant state changes; sound degrades to silence.

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // ms remaining
  maxLife: number
  size: number
  color: string
  gravity: number // px per ms^2
}

export interface BurstOptions {
  count?: number
  speed?: number // px per ms
  life?: number // ms
  size?: number
  colors?: string[]
  gravity?: number
  seed?: number
}

// Deterministic PRNG (mulberry32) so bursts are reproducible in tests.
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEFAULT_COLORS = ["#f5a623", "#ff5a5a", "#2d9cdb", "#ffffff"]

export function spawnBurst(x: number, y: number, opts: BurstOptions = {}): Particle[] {
  const {
    count = 24,
    speed = 0.25,
    life = 700,
    size = 4,
    colors = DEFAULT_COLORS,
    gravity = 0.0009,
    seed = (Math.random() * 1e9) | 0,
  } = opts
  const rand = rng(seed)
  const out: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2
    const v = speed * (0.35 + rand() * 0.85)
    const l = life * (0.6 + rand() * 0.7)
    out.push({
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - speed * 0.35,
      life: l,
      maxLife: l,
      size: size * (0.6 + rand() * 0.8),
      color: colors[(rand() * colors.length) | 0],
      gravity,
    })
  }
  return out
}

export function stepParticles(ps: Particle[], dtMs: number): Particle[] {
  const out: Particle[] = []
  for (const p of ps) {
    const life = p.life - dtMs
    if (life <= 0) continue
    out.push({
      ...p,
      life,
      x: p.x + p.vx * dtMs,
      y: p.y + p.vy * dtMs,
      vy: p.vy + p.gravity * dtMs,
    })
  }
  return out
}

export function particleAlpha(p: Particle): number {
  return Math.max(0, Math.min(1, p.life / p.maxLife))
}

// Screenshake offset: decaying random displacement. Pure (testable);
// the DOM layer applies it via transform each frame.
export function shakeOffset(trauma: number, timeMs: number, maxPx = 10): { dx: number; dy: number } {
  if (trauma <= 0) return { dx: 0, dy: 0 }
  const t = Math.min(1, Math.max(0, trauma))
  const s = t * t * maxPx
  return {
    dx: s * Math.sin(timeMs * 0.09) * Math.cos(timeMs * 0.031),
    dy: s * Math.cos(timeMs * 0.11) * Math.sin(timeMs * 0.043),
  }
}

// --- Browser effectors (guarded for SSR/tests) ---

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

export function isMuted(): boolean {
  try {
    return window.localStorage.getItem("sq_mute") === "1"
  } catch {
    return false
  }
}

export function setMuted(m: boolean): void {
  try {
    window.localStorage.setItem("sq_mute", m ? "1" : "0")
  } catch {
    /* ignore */
  }
}

// Element shake via Web Animations API. Returns immediately when reduced motion.
export function shakeElement(el: HTMLElement | null, strength = 1): void {
  if (!el || prefersReducedMotion()) return
  try {
    el.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${-7 * strength}px,${4 * strength}px)` },
        { transform: `translate(${6 * strength}px,${-5 * strength}px)` },
        { transform: `translate(${-4 * strength}px,${-3 * strength}px)` },
        { transform: `translate(${3 * strength}px,${2 * strength}px)` },
        { transform: "translate(0,0)" },
      ],
      { duration: 320, easing: "ease-out" },
    )
  } catch {
    /* WAAPI unavailable */
  }
}

export function flashElement(el: HTMLElement | null): void {
  if (!el || prefersReducedMotion()) return
  try {
    el.animate([{ filter: "brightness(2.2)" }, { filter: "brightness(1)" }], {
      duration: 220,
      easing: "ease-out",
    })
  } catch {
    /* ignore */
  }
}

// Hit-stop clock: game loops read now() instead of performance.now().
// freeze(ms) halts the clock briefly so impacts land harder.
let frozenUntil = 0
export function fxNow(): number {
  try {
    if (typeof performance === "undefined") return Date.now()
    const now = performance.now()
    if (now < frozenUntil) return frozenUntil
    return now
  } catch {
    return Date.now()
  }
}

export function hitStop(ms = 60): void {
  if (prefersReducedMotion()) return
  try {
    frozenUntil = performance.now() + Math.max(0, Math.min(ms, 120))
  } catch {
    /* ignore */
  }
}

// --- Synthesized SFX (Web Audio, zero assets) ---

type SfxName = "click" | "pop" | "hit" | "defeat" | "fanfare" | "splash" | "merge"

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null
    if (isMuted()) return null
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, durMs: number, type: OscillatorType, gain = 0.12, whenMs = 0, slideTo?: number): void {
  const ac = audio()
  if (!ac) return
  try {
    const t0 = ac.currentTime + whenMs / 1000
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + durMs / 1000)
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000)
    osc.connect(g)
    g.connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + durMs / 1000 + 0.02)
  } catch {
    /* ignore */
  }
}

// Base frequencies per effect (testable map, avoids magic numbers in UI).
export const SFX_SCORE: Record<SfxName, { freq: number; dur: number; type: OscillatorType; slide?: number }[]> = {
  click: [{ freq: 660, dur: 60, type: "triangle", slide: 880 }],
  pop: [{ freq: 520, dur: 90, type: "square", slide: 780 }],
  hit: [
    { freq: 160, dur: 140, type: "sawtooth", slide: 60 },
    { freq: 90, dur: 180, type: "sine", slide: 40 },
  ],
  defeat: [
    { freq: 220, dur: 160, type: "sawtooth", slide: 55 },
    { freq: 330, dur: 200, type: "square", slide: 82 },
    { freq: 440, dur: 260, type: "square", slide: 110 },
  ],
  fanfare: [
    { freq: 523, dur: 120, type: "triangle" },
    { freq: 659, dur: 120, type: "triangle" },
    { freq: 784, dur: 240, type: "triangle" },
  ],
  splash: [{ freq: 300, dur: 200, type: "sine", slide: 120 }],
  merge: [
    { freq: 392, dur: 100, type: "triangle", slide: 523 },
    { freq: 523, dur: 140, type: "triangle", slide: 659 },
  ],
}

export function playSfx(name: SfxName): void {
  const notes = SFX_SCORE[name]
  if (!notes) return
  let at = 0
  for (const n of notes) {
    tone(n.freq, n.dur, n.type, 0.1, at, n.slide)
    if (name === "fanfare") at += n.dur * 0.9
  }
}

// Call once on first user gesture to unlock audio (autoplay policy).
export function unlockAudio(): void {
  audio()
}
