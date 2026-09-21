// Burst overlay: minigames that MOVE the ceremony, not side quests.
// Every game reads/writes real ceremony content (entries, 👍 votes, actions).
// Reads taps from the ceremony Vote stream. Win → onEnd(result, actionEntryId?).
"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { BurstPayload, burstVotes, snailSteps, tugScore, memoryPairs, memoryRevealed, memoryDone, flipAction } from "@/lib/gamestate"
import { POLL_QUESTIONS } from "@/lib/deck"
import { SnailGame, WhackGame, TugGame, MemoryGame, PollGame } from "./games"

export const BURST_REWARD: Record<string, number> = { snail: 20, whack: 20, tug: 20, memory: 20, poll: 10 }

export default function BurstOverlay({ burst, votes, uid, entries, reactionCount, onAction, onSquash, onPull, onPostEntry, onEnd, onDismiss }: {
  burst: { comment: any; payload: BurstPayload }
  votes: any[]
  uid: string
  entries: { id: string; content: string }[]
  reactionCount: (id: string, emoji: string) => number
  onAction: (action: string) => void
  onSquash: (entryId: string) => void
  onPull: (entryId: string) => void
  onPostEntry: (text: string) => void
  onEnd: (result: string, actionEntryId?: string) => void
  onDismiss: () => void
}) {
  const { comment, payload } = burst
  const [now, setNow] = useState(Date.now())
  const ended = useRef(false)
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])
  const finish = (result: string, actionEntryId?: string) => {
    if (ended.current) return
    ended.current = true
    onEnd(result, actionEntryId)
  }
  const detail: any = useMemo(() => {
    try { return payload.detail ? JSON.parse(payload.detail) : {} } catch { return {} }
  }, [payload.detail])

  const taps = useMemo(() => burstVotes(votes, comment.id, "tap"), [votes, comment.id])
  const elapsed = Math.floor((now - payload.startedAt) / 1000)

  // SNAIL: entries move 5 steps, taps sustain, drains 1/sec
  const snailBase: number = detail.base ?? 0
  const snail = snailSteps(entries.length - snailBase, taps.length, elapsed, payload.target || 30)
  useEffect(() => { if (payload.type === "snail" && snail >= (payload.target || 30)) finish(`🐢 Snail crossed on ${entries.length} team entries`) }, [snail]) // eslint-disable-line

  // WHACK: bugs are real entries; squash = 👍 above baseline
  const bugs: { id: string; label: string }[] = useMemo(() => {
    if (payload.type !== "whack") return []
    const ids: string[] = detail.bugs ?? entries.slice(-12).map((e) => e.id)
    return ids.map((id) => ({ id, label: entries.find((e) => e.id === id)?.content ?? "entry" }))
  }, [payload.type, detail.bugs, entries])
  const squashed = useMemo(() => {
    if (payload.type !== "whack") return []
    const base = detail.base ?? {}
    return bugs.filter((b) => reactionCount(b.id, "👍") > (base[b.id] ?? 0)).map((b) => b.id)
  }, [payload.type, bugs, votes]) // eslint-disable-line
  useEffect(() => { if (payload.type === "whack" && bugs.length > 0 && squashed.length >= bugs.length) finish(`🔨 All ${bugs.length} entries confirmed — board prioritized`) }, [squashed.length]) // eslint-disable-line

  // TUG: top-2 entries face off; pulls are real 👍 votes
  const tugA: string | null = detail.a ?? null
  const tugB: string | null = detail.b ?? null
  const scoreA = tugA ? reactionCount(tugA, "👍") : 0
  const scoreB = tugB ? reactionCount(tugB, "👍") : 0
  const tug = tugScore(scoreA, scoreB, payload.target || 5)
  useEffect(() => {
    if (payload.type === "tug" && tug.winner) {
      const winId = tug.winner === "A" ? tugA : tugB
      finish(`🪢 Face-off decided ${Math.max(scoreA, scoreB)}–${Math.min(scoreA, scoreB)} — winner becomes an action`, winId ?? undefined)
    }
  }, [tug.winner]) // eslint-disable-line

  // MEMORY: pairs from real entry texts
  const deck = useMemo(() => (payload.type === "memory" ? memoryPairs(entries.map((e) => e.content), payload.seed) : []), [payload.type, payload.seed, entries])
  const flips = useMemo(() => (payload.type === "memory" ? votes.filter((v) => typeof v.option === "string" && v.option.startsWith(`${comment.id}:flip:`)).map((v) => parseInt(v.option.split(":")[2], 10)).filter((n) => !isNaN(n)) : []), [votes, comment.id, payload.type])
  const revealed = useMemo(() => (payload.type === "memory" ? memoryRevealed(deck, flips) : []), [deck, flips])
  useEffect(() => { if (payload.type === "memory" && memoryDone(revealed)) finish(`🎁 All ${deck.length / 2} pairs matched in ${flips.length} team flips`) }, [revealed]) // eslint-disable-line

  // POLL: result posts itself as an entry, then closes
  const pollQ = useMemo(() => {
    if (payload.type !== "poll") return null
    return POLL_QUESTIONS[Math.abs(payload.seed) % POLL_QUESTIONS.length]
  }, [payload.type, payload.seed])
  const pollCounts = [0, 1, 2].map((i) => burstVotes(votes, comment.id, `poll:${i}`).length)
  const myPollVote = [0, 1, 2].find((i) => burstVotes(votes, comment.id, `poll:${i}`).some((v) => v.userId === uid)) ?? null
  const revealPoll = () => {
    const best = pollCounts.indexOf(Math.max(...pollCounts))
    onPostEntry(`⚡ Poll: ${pollQ?.q} → ${pollQ?.opts[best]} (${pollCounts[best]} votes)`)
    finish(`⚡ Poll closed: “${pollQ?.opts[best]}” — posted as an entry`)
  }

  const labelOf = (id: string | null) => entries.find((e) => e.id === id)?.content ?? "…"

  return (
    <div className="glass rounded-xl p-5 mb-6 border-gold/60">
      <div className="flex justify-between items-center mb-1">
        <p className="font-bold text-lg">{payload.title} <span className="text-xs font-normal text-gray-500">plays the ceremony, not beside it</span></p>
        <button onClick={onDismiss} className="text-xs text-gray-500 hover:text-white" title="Hide for me — the game continues for the team">too chaotic? hide ✕</button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {payload.type === "snail" && "Post entries to move the snail (5 steps each). Taps keep it alive."}
        {payload.type === "whack" && "Each bug is a real entry — squash them all with 👍 to prioritize the board."}
        {payload.type === "tug" && "Two entries face off. Your 👍 pulls — the winner becomes an action item."}
        {payload.type === "memory" && "Flip chests together, match every pair."}
        {payload.type === "poll" && "One fast question — vote, reveal, and the result joins the board."}
      </p>
      {payload.type === "snail" && <SnailGame progress={snail} target={payload.target || 30} entries={entries.length} onTap={() => onAction("tap")} />}
      {payload.type === "whack" && <WhackGame bugs={bugs} squashed={squashed} onTap={onSquash} />}
      {payload.type === "tug" && tugA && tugB && <TugGame a={scoreA} b={scoreB} labelA={labelOf(tugA)} labelB={labelOf(tugB)} target={payload.target || 5} onPull={(side) => onPull(side === "A" ? tugA : tugB)} />}
      {payload.type === "memory" && <MemoryGame deck={deck} revealed={revealed} onFlip={(i) => onAction(flipAction(i))} />}
      {payload.type === "poll" && pollQ && <PollGame question={pollQ.q} opts={[...pollQ.opts]} counts={pollCounts} myVote={myPollVote} onVote={(i) => onAction(`poll:${i}`)} />}
      <div className="flex gap-2 mt-4">
        {payload.type === "poll"
          ? <button onClick={revealPoll} className="text-xs px-3 py-1 rounded-full bg-gold text-black font-bold">Reveal, post & close 🎉</button>
          : <button onClick={() => finish("Ended by the team")} className="text-xs px-3 py-1 rounded-full border border-gray-600 hover:border-gold">End burst</button>}
        <span className="text-xs text-gray-600 self-center">win = +{BURST_REWARD[payload.type] ?? 10} team XP</span>
      </div>
    </div>
  )
}
