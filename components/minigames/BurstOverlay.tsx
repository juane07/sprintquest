// Burst overlay: minigames that MOVE the ceremony, never corrupt it.
// - Snail: only SECONDED entries (with a reaction) advance it — no volume spam.
// - Whack: review marks (squash: votes), never touches 👍.
// - Tug: 🪢 game votes, never 👍. Winner is PROPOSED as action; a human assigns owner.
// - Poll: result posts only if the team opts in.
"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { BurstPayload, burstVotes, snailSteps, tugScore, memoryPairs, memoryRevealed, memoryDone, flipAction } from "@/lib/gamestate"
import { POLL_QUESTIONS } from "@/lib/deck"
import { SnailGame, WhackGame, TugGame, MemoryGame, PollGame } from "./games"

export const BURST_REWARD: Record<string, number> = { snail: 20, whack: 20, tug: 20, memory: 20, poll: 10 }
const ENDORSE = ["❤️", "🔥", "👍"]

export default function BurstOverlay({ burst, votes, uid, entries, onAction, onSquash, onPull, onPoll, onPostEntry, onEnd, onDismiss }: {
  burst: { comment: any; payload: BurstPayload }
  votes: any[]
  uid: string
  entries: { id: string; content: string }[]
  onAction: (action: string) => void
  onSquash: (entryId: string) => void
  onPull: (side: "A" | "B") => void
  onPoll: (i: number) => void
  onPostEntry: (text: string) => void
  onEnd: (result: string, actionEntryId?: string) => void
  onDismiss: () => void
}) {
  const { comment, payload } = burst
  const [now, setNow] = useState(Date.now())
  const [pollRevealed, setPollRevealed] = useState(false)
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

  // SNAIL: seconded entries (any endorsement reaction) move it; taps sustain
  const seconded = useMemo(() => {
    if (payload.type !== "snail") return 0
    return entries.filter((e) => votes.some((v) => typeof v.option === "string" && ENDORSE.some((em) => v.option === `${e.id}:${em}`))).length
  }, [payload.type, entries, votes])
  const snailBase: number = detail.base ?? 0
  const snail = snailSteps(seconded - snailBase, taps.length, elapsed, payload.target || 30)
  useEffect(() => { if (payload.type === "snail" && snail >= (payload.target || 30)) finish(`🐢 Snail crossed on ${seconded} seconded team entries`) }, [snail]) // eslint-disable-line

  // WHACK: review marks live in game-only squash: votes — 👍 untouched
  const bugs: { id: string; label: string }[] = useMemo(() => {
    if (payload.type !== "whack") return []
    const ids: string[] = detail.bugs ?? entries.slice(-12).map((e) => e.id)
    return ids.map((id) => ({ id, label: entries.find((e) => e.id === id)?.content ?? "entry" }))
  }, [payload.type, detail.bugs, entries])
  const squashed = useMemo(() => {
    if (payload.type !== "whack") return []
    return bugs.filter((b) => votes.some((v) => v.option === `${comment.id}:squash:${b.id}`)).map((b) => b.id)
  }, [payload.type, bugs, votes, comment.id])
  useEffect(() => { if (payload.type === "whack" && bugs.length > 0 && squashed.length >= bugs.length) finish(`🔨 All ${bugs.length} entries reviewed by the team`) }, [squashed.length]) // eslint-disable-line

  // TUG: 🪢 game votes only — real 👍 balances stay clean
  const tugA: string | null = detail.a ?? null
  const tugB: string | null = detail.b ?? null
  const scoreA = useMemo(() => (tugA ? burstVotes(votes, comment.id, "pull:A").length : 0), [votes, comment.id, tugA])
  const scoreB = useMemo(() => (tugB ? burstVotes(votes, comment.id, "pull:B").length : 0), [votes, comment.id, tugB])
  const tug = tugScore(scoreA, scoreB, payload.target || 5)
  useEffect(() => {
    if (payload.type === "tug" && tug.winner) {
      const winId = tug.winner === "A" ? tugA : tugB
      finish(`🪢 Face-off decided ${Math.max(scoreA, scoreB)}–${Math.min(scoreA, scoreB)} — winner proposed as action`, winId ?? undefined)
    }
  }, [tug.winner]) // eslint-disable-line

  // MEMORY: pairs from real entry texts
  const deck = useMemo(() => (payload.type === "memory" ? memoryPairs(entries.map((e) => e.content), payload.seed) : []), [payload.type, payload.seed, entries])
  const flips = useMemo(() => (payload.type === "memory" ? votes.filter((v) => typeof v.option === "string" && v.option.startsWith(`${comment.id}:flip:`)).map((v) => parseInt(v.option.split(":")[2], 10)).filter((n) => !isNaN(n)) : []), [votes, comment.id, payload.type])
  const revealed = useMemo(() => (payload.type === "memory" ? memoryRevealed(deck, flips) : []), [deck, flips])
  useEffect(() => { if (payload.type === "memory" && memoryDone(revealed)) finish(`🎁 All ${deck.length / 2} pairs matched in ${flips.length} team flips`) }, [revealed]) // eslint-disable-line

  // POLL: staged reveal, posting is opt-in
  const pollQ = useMemo(() => {
    if (payload.type !== "poll") return null
    return POLL_QUESTIONS[Math.abs(payload.seed) % POLL_QUESTIONS.length]
  }, [payload.type, payload.seed])
  const pollCounts = [0, 1, 2].map((i) => burstVotes(votes, comment.id, `poll:${i}`).length)
  const myPollVote = [0, 1, 2].find((i) => burstVotes(votes, comment.id, `poll:${i}`).some((v) => v.userId === uid)) ?? null
  const pollBest = pollCounts.indexOf(Math.max(...pollCounts))
  const closePoll = (post: boolean) => {
    if (post && pollQ) onPostEntry(`⚡ Poll: ${pollQ.q} → ${pollQ.opts[pollBest]} (${pollCounts[pollBest]} votes)`)
    finish(post ? `⚡ Poll closed: “${pollQ?.opts[pollBest]}” — posted as an entry` : "⚡ Poll closed without posting")
  }

  const labelOf = (id: string | null) => entries.find((e) => e.id === id)?.content ?? "…"

  return (
    <div className="glass rounded-xl p-5 mb-6 border-gold/60">
      <div className="flex justify-between items-center mb-1">
        <p className="font-bold text-lg">{payload.title} <span className="text-xs font-normal text-gray-500">plays the ceremony, corrupts nothing</span></p>
        <button onClick={onDismiss} className="text-xs text-gray-500 hover:text-white" title="Hide for me — the game continues for the team">too chaotic? hide ✕</button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {payload.type === "snail" && "Only seconded entries (with a reaction) move the snail — 5 steps each. Taps keep it alive."}
        {payload.type === "whack" && "Each bug is a real entry — mark each reviewed (👁). Your 👍 stay yours."}
        {payload.type === "tug" && "Two entries face off with 🪢 pulls — game votes, not 👍. Winner is proposed as an action."}
        {payload.type === "memory" && "Flip chests together, match every pair."}
        {payload.type === "poll" && "One fast question — vote, reveal, post only if the team wants it on the board."}
      </p>
      {payload.type === "snail" && <SnailGame progress={snail} target={payload.target || 30} entries={seconded} onTap={() => onAction("tap")} />}
      {payload.type === "whack" && <WhackGame bugs={bugs} squashed={squashed} onTap={onSquash} />}
      {payload.type === "tug" && tugA && tugB && <TugGame a={scoreA} b={scoreB} labelA={labelOf(tugA)} labelB={labelOf(tugB)} target={payload.target || 5} onPull={onPull} />}
      {payload.type === "memory" && <MemoryGame deck={deck} revealed={revealed} onFlip={(i) => onAction(flipAction(i))} />}
      {payload.type === "poll" && pollQ && !pollRevealed && <PollGame question={pollQ.q} opts={[...pollQ.opts]} counts={pollCounts} myVote={myPollVote} onVote={onPoll} />}
      {payload.type === "poll" && pollQ && pollRevealed && (
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🏆 {pollQ.opts[pollBest]}</p>
          <p className="text-sm text-gray-400 mb-3">{pollCounts[pollBest]} votes · post it to the board, or leave it as warm-up?</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => closePoll(true)} className="text-xs px-3 py-1 rounded-full bg-gold text-black font-bold">📌 Post as entry & close</button>
            <button onClick={() => closePoll(false)} className="text-xs px-3 py-1 rounded-full border border-gray-600 hover:border-gold">Close without posting</button>
          </div>
        </div>
      )}
      <div className="flex gap-2 mt-4">
        {payload.type === "poll" && !pollRevealed
          ? <button onClick={() => setPollRevealed(true)} className="text-xs px-3 py-1 rounded-full bg-gold text-black font-bold">Reveal 🎉</button>
          : payload.type !== "poll" && <button onClick={() => finish("Ended by the team")} className="text-xs px-3 py-1 rounded-full border border-gray-600 hover:border-gold">End burst</button>}
        <span className="text-xs text-gray-600 self-center">win = +{BURST_REWARD[payload.type] ?? 10} team XP</span>
      </div>
    </div>
  )
}
