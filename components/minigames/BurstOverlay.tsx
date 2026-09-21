// Burst overlay: shared-state container for the 5 cooperative minigames.
// Reads taps from the ceremony Vote stream; one tap = one Vote row.
// Win → onEnd(result). "Too chaotic" → onDismiss() (local only, game continues for others).
"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { BurstPayload, burstVotes, distinctTappers, snailProgress, teamOf, tugScore, memoryPairs, memoryRevealed, memoryDone, flipAction } from "@/lib/gamestate"
import { POLL_QUESTIONS } from "@/lib/deck"
import { SnailGame, WhackGame, TugGame, MemoryGame, PollGame } from "./games"

export const BURST_REWARD: Record<string, number> = { snail: 20, whack: 20, tug: 20, memory: 20, poll: 10 }

export default function BurstOverlay({ burst, votes, uid, entries, onAction, onEnd, onDismiss }: {
  burst: { comment: any; payload: BurstPayload }
  votes: any[]
  uid: string
  entries: string[]
  onAction: (action: string) => void
  onEnd: (result: string) => void
  onDismiss: () => void
}) {
  const { comment, payload } = burst
  const [now, setNow] = useState(Date.now())
  const ended = useRef(false)
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])
  const finish = (result: string) => {
    if (ended.current) return
    ended.current = true
    onEnd(result)
  }

  const taps = useMemo(() => burstVotes(votes, comment.id, "tap"), [votes, comment.id])
  const elapsed = Math.floor((now - payload.startedAt) / 1000)

  const snail = snailProgress(taps.length, elapsed, payload.target || 60)
  useEffect(() => { if (payload.type === "snail" && snail >= (payload.target || 60)) finish(`🐢 Snail crossed! ${taps.length} team taps`) }, [snail]) // eslint-disable-line
  useEffect(() => { if (payload.type === "whack" && taps.length >= (payload.target || 30)) finish(`🔨 ${taps.length} bugs squashed by the team`) }, [taps.length]) // eslint-disable-line

  const pullsA = useMemo(() => burstVotes(votes, comment.id, "pullA").length, [votes, comment.id])
  const pullsB = useMemo(() => burstVotes(votes, comment.id, "pullB").length, [votes, comment.id])
  const tug = tugScore(pullsA, pullsB, payload.target || 25)
  useEffect(() => { if (payload.type === "tug" && tug.winner) finish(`🪢 Team ${tug.winner === "A" ? "Sprout" : "Comet"} pulled it off ${Math.max(pullsA, pullsB)}–${Math.min(pullsA, pullsB)}`) }, [tug.winner]) // eslint-disable-line

  const deck = useMemo(() => (payload.type === "memory" ? memoryPairs(entries, payload.seed) : []), [payload.type, payload.seed, entries])
  const flips = useMemo(() => (payload.type === "memory" ? votes.filter((v) => typeof v.option === "string" && v.option.startsWith(`${comment.id}:flip:`)).map((v) => parseInt(v.option.split(":")[2], 10)).filter((n) => !isNaN(n)) : []), [votes, comment.id, payload.type])
  const revealed = useMemo(() => (payload.type === "memory" ? memoryRevealed(deck, flips) : []), [deck, flips])
  useEffect(() => { if (payload.type === "memory" && memoryDone(revealed)) finish(`🎁 All ${deck.length / 2} pairs matched in ${flips.length} team flips`) }, [revealed]) // eslint-disable-line

  const pollQ = useMemo(() => {
    if (payload.type !== "poll") return null
    const idx = Math.abs(payload.seed) % POLL_QUESTIONS.length
    return POLL_QUESTIONS[idx]
  }, [payload.type, payload.seed])
  const pollCounts = [0, 1, 2].map((i) => burstVotes(votes, comment.id, `poll:${i}`).length)
  const myPollVote = [0, 1, 2].find((i) => burstVotes(votes, comment.id, `poll:${i}`).some((v) => v.userId === uid)) ?? null
  const revealPoll = () => {
    const best = pollCounts.indexOf(Math.max(...pollCounts))
    finish(`⚡ Poll: “${pollQ?.opts[best]}” wins (${pollCounts[best]} votes)`)
  }

  return (
    <div className="glass rounded-xl p-5 mb-6 border-gold/60">
      <div className="flex justify-between items-center mb-1">
        <p className="font-bold text-lg">{payload.title} <span className="text-xs font-normal text-gray-500">minigame burst · team play</span></p>
        <button onClick={onDismiss} className="text-xs text-gray-500 hover:text-white" title="Hide for me — the game continues for the team">too chaotic? hide ✕</button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {payload.type === "snail" && "Tap together — the bar drains every second."}
        {payload.type === "whack" && "Squash bugs together until the team target."}
        {payload.type === "tug" && "You're auto-split in two teams. First side to the target with the lead wins — prize shared by all."}
        {payload.type === "memory" && "Flip chests together, match every pair."}
        {payload.type === "poll" && "One fast question — vote, then reveal together."}
      </p>
      {payload.type === "snail" && <SnailGame progress={snail} target={payload.target || 60} tappers={distinctTappers(taps)} onTap={() => onAction("tap")} />}
      {payload.type === "whack" && <WhackGame squashed={taps.length} target={payload.target || 30} seed={payload.seed} onTap={() => onAction("tap")} />}
      {payload.type === "tug" && <TugGame a={pullsA} b={pullsB} target={payload.target || 25} myTeam={teamOf(uid)} onPull={() => onAction(teamOf(uid) === "A" ? "pullA" : "pullB")} />}
      {payload.type === "memory" && <MemoryGame deck={deck} revealed={revealed} onFlip={(i) => onAction(flipAction(i))} />}
      {payload.type === "poll" && pollQ && <PollGame question={pollQ.q} opts={[...pollQ.opts]} counts={pollCounts} myVote={myPollVote} onVote={(i) => onAction(`poll:${i}`)} />}
      <div className="flex gap-2 mt-4">
        {payload.type === "poll"
          ? <button onClick={revealPoll} className="text-xs px-3 py-1 rounded-full bg-gold text-black font-bold">Reveal & close 🎉</button>
          : <button onClick={() => finish("Ended by the team")} className="text-xs px-3 py-1 rounded-full border border-gray-600 hover:border-gold">End burst</button>}
        <span className="text-xs text-gray-600 self-center">win = +{BURST_REWARD[payload.type] ?? 10} team XP</span>
      </div>
    </div>
  )
}
