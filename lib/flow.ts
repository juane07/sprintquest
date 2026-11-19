// Shared ceremony flow — the single source of truth for "where the team is".
//
// Why this exists: the ceremony used to keep its phase in one browser's
// React state. `Ceremony.round` was written but never broadcast, the vote
// screen was never persisted, and the advance gate read local flags — so two
// phones in the same room were two different ceremonies. That is the silo.
//
// How it works: every flow change is appended as an immutable row (a
// `Comment` with the reserved FLOW_CAT category, holding a tiny JSON payload).
// Comment INSERTs are already realtime-synced for this ceremony, so the whole
// team sees the change at the same moment, with no new table, no new
// publication, and no polling. Each client folds the same append-only log, so
// concurrent writes converge instead of conflicting. Late joiners read the
// same log and land on the same phase — no resume hack, no lost progress.

import { boardStepFor, advanceGate, type GateResult } from "./board"

// Reserved category. Rows in it never render in the entry feed and never
// count as player entries.
export const FLOW_CAT = "⚙️ Flow"

export type FlowStage = "board" | "vote" | "done"

export interface FlowActor {
  by?: string
  at?: number
}

export type SuggestedAction = { title: string; why: string }

export type FlowEvent = FlowActor &
  (
    | { e: "round"; v: number }
    | { e: "recall" }
    | { e: "reflect"; r: number }
    | { e: "stage"; v: Exclude<FlowStage, "done"> }
    | { e: "finish"; score: number; bonus: number; level: number; leveledUp: boolean; streak: string | null }
    // Emitted after the AI facilitator answers, so the reflection is shown on
    // every device instead of only on the one that clicked Finish.
    | { e: "summary"; text: string; actions: SuggestedAction[] }
  )

export interface FlowResult {
  score: number
  bonus: number
  level: number
  leveledUp: boolean
  streak: string | null
  summary: string | null
  actions: SuggestedAction[]
}

export function emptyResult(): FlowResult {
  return { score: 0, bonus: 0, level: 0, leveledUp: false, streak: null, summary: null, actions: [] }
}

export interface FlowState {
  round: number
  stage: FlowStage
  recallDone: boolean
  reflected: number[]
  result: FlowResult | null
  events: number
}

export interface FlowRow {
  id: string
  content: string
  category?: string | null
  createdAt?: string | null
}

const EVENT_KINDS = new Set(["round", "recall", "reflect", "stage", "finish", "summary"])

export function emptyFlow(): FlowState {
  return { round: 1, stage: "board", recallDone: false, reflected: [], result: null, events: 0 }
}

export function encodeFlowEvent(ev: FlowEvent): string {
  return JSON.stringify(ev)
}

export function decodeFlowEvent(content: string): FlowEvent | null {
  if (typeof content !== "string" || content.charCodeAt(0) !== 123 /* { */) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null
  const ev = parsed as Record<string, unknown>
  if (typeof ev.e !== "string" || !EVENT_KINDS.has(ev.e)) return null
  switch (ev.e) {
    case "round":
      return typeof ev.v === "number" && Number.isFinite(ev.v)
        ? { e: "round", v: Math.max(1, Math.floor(ev.v)) }
        : null
    case "recall":
      return { e: "recall" }
    case "reflect":
      return typeof ev.r === "number" && Number.isFinite(ev.r)
        ? { e: "reflect", r: Math.max(1, Math.floor(ev.r)) }
        : null
    case "stage":
      return ev.v === "vote" || ev.v === "board" ? { e: "stage", v: ev.v } : null
    case "finish":
      return {
        e: "finish",
        score: num(ev.score),
        bonus: num(ev.bonus),
        level: num(ev.level),
        leveledUp: ev.leveledUp === true,
        streak: typeof ev.streak === "string" ? ev.streak : null,
      }
    case "summary": {
      const actions = Array.isArray(ev.actions)
        ? ev.actions
            .filter((a): a is { title: string; why: string } => !!a && typeof a === "object" && typeof (a as any).title === "string")
            .slice(0, 3)
            .map((a) => ({ title: String(a.title).slice(0, 200), why: String(a.why ?? "").slice(0, 300) }))
        : []
      return { e: "summary", text: typeof ev.text === "string" ? ev.text.slice(0, 4000) : "", actions }
    }
    default:
      return null
  }
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

// Append-only fold. Idempotent per event kind, so a duplicated or replayed
// row can never corrupt the shared state.
export function applyFlowEvent(s: FlowState, ev: FlowEvent): FlowState {
  const next: FlowState = {
    ...s,
    reflected: [...s.reflected],
    events: s.events + 1,
  }
  switch (ev.e) {
    case "round":
      next.round = Math.max(1, Math.floor(ev.v))
      break
    case "recall":
      next.recallDone = true
      break
    case "reflect":
      if (!next.reflected.includes(ev.r)) next.reflected.push(ev.r)
      next.reflected.sort((a, b) => a - b)
      break
    case "stage":
      next.stage = ev.v
      break
    case "finish":
      next.stage = "done"
      next.result = {
        ...(next.result ?? emptyResult()),
        score: ev.score,
        bonus: ev.bonus,
        level: ev.level,
        leveledUp: ev.leveledUp,
        streak: ev.streak,
      }
      break
    case "summary":
      next.result = { ...(next.result ?? emptyResult()), summary: ev.text, actions: ev.actions }
      break
  }
  return next
}

export function foldFlow(events: FlowEvent[]): FlowState {
  let s = emptyFlow()
  for (const ev of events) s = applyFlowEvent(s, ev)
  return s
}

// Deterministic total order across devices: server-assigned createdAt first,
// row id as tiebreaker for same-millisecond writes.
export function flowEventsFrom(rows: FlowRow[]): FlowEvent[] {
  return rows
    .map((r) => ({ ev: decodeFlowEvent(r.content), at: r.createdAt ?? "", id: r.id ?? "" }))
    .filter((x): x is { ev: FlowEvent; at: string; id: string } => x.ev !== null)
    .sort((a, b) => (a.at === b.at ? a.id.localeCompare(b.id) : a.at.localeCompare(b.at)))
    .map((x) => x.ev)
}

export function flowFromRows(rows: FlowRow[]): FlowState {
  return foldFlow(flowEventsFrom(rows))
}

// Flow rows only — the entry feed must not treat them as player entries.
export function flowRows(comments: FlowRow[]): FlowRow[] {
  return comments.filter((c) => c.category === FLOW_CAT)
}

export function isFlowRow(c: FlowRow): boolean {
  return c.category === FLOW_CAT
}

// Ceremonies started before the shared flow existed have no log. Seed their
// phase from whatever durable progress we do have, then let live events take
// over from there.
export function seedFlowFromCeremony(c: { round?: number | null; status?: string | null } | null | undefined, totalRounds: number): FlowState {
  const base = emptyFlow()
  // The first render happens before the ceremony fetch resolves. Without this
  // guard the whole page throws while server-rendering and again on hydration,
  // so a freshly started ceremony dies before anyone can use it.
  if (!c) return base
  if (c.status === "completed") return { ...base, stage: "done" }
  const stored = typeof c.round === "number" ? Math.floor(c.round) : 0
  if (stored <= 0) return base
  const round = Math.min(Math.max(stored, 1), Math.max(1, totalRounds))
  return {
    ...base,
    round,
    // Recall gated leaving the Start square, so a ceremony past round 1 has it.
    recallDone: round > 1,
    stage: round >= totalRounds ? "vote" : "board",
  }
}

export function flowBoardStep(flow: FlowState, totalRounds: number): number {
  return boardStepFor(flow.round, totalRounds, flow.stage === "vote")
}

// The cooperative gate, evaluated against SHARED state — every device reaches
// the same verdict from the same log, so nobody is blocked while others move.
export function flowGate(flow: FlowState, totalRounds: number, entries: number): GateResult {
  if (flow.stage === "done") return { ok: true, reason: null }
  return advanceGate(flowBoardStep(flow, totalRounds), {
    recallDone: flow.recallDone,
    entries,
    reflectionDone: flow.reflected.includes(flow.round),
  })
}

// What the team is collectively waiting on, as a shared status line rather
// than an instruction to whoever clicked. Mirrors flowGate's conditions
// square-for-square; tests/flow.test.ts pins the two together.
export function flowWaiting(flow: FlowState, totalRounds: number, entries: number): string | null {
  if (flow.stage === "done") return null
  const step = flowBoardStep(flow, totalRounds)
  if (step <= 0 && !flow.recallDone) return "Waiting on the recall warm-up"
  if (step === 1 && entries < 3) return `Waiting on entries — ${entries} of 3 shared`
  if ((step === 2 || step === 3) && !flow.reflected.includes(flow.round)) return "Waiting on the guided reflection"
  return null
}

export function flowAdvanceLabel(flow: FlowState, totalRounds: number): string {
  return flow.round < totalRounds ? "Advance team token ➜" : "Go to Vote 🗳️"
}

// The event to append when the team advances. Returns null when the shared
// phase is already where it should be (duplicate taps are no-ops).
export function flowAdvanceEvent(flow: FlowState, totalRounds: number): FlowEvent | null {
  if (flow.stage === "vote" || flow.stage === "done") return null
  if (flow.round < totalRounds) return { e: "round", v: flow.round + 1 }
  return { e: "stage", v: "vote" }
}

// Total engagement level = base score + streak bonus, as the finishing device
// recorded it. Everyone else reads this instead of recomputing (which would
// award team XP twice).
export function flowTotal(result: FlowResult | null): number {
  if (!result) return 0
  return result.score + result.bonus
}