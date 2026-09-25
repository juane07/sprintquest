"use client"
import { useState, useEffect, useRef } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { MODE_CONFIG, DEFAULT_MODE } from "@/constants"
import { engagementMetric, streakIndicator, levelForXp, actionValue, engagementLabel } from "@/lib/xp"
import { getReflectionPrompts, getAdaptiveRoundDuration, shouldExtendRound } from "@/lib/learning-science"
import { BOSS_HP, bossHp, isDefeated, ATTACK_EMOJI } from "@/lib/boss"
import { rankSuspects, majorityThreshold, ACCUSE_EMOJI } from "@/lib/detective"
import Presence from "@/components/Presence"
import Navbar from "@/components/Navbar"
import ShareRecap from "@/components/ShareRecap"
import SpacedRetrieval from "@/components/SpacedRetrieval"
import ReflectionPhase from "@/components/ReflectionPhase"
import SafetyCheckIn from "@/components/SafetyCheckIn"
import AIFacilitator from "@/components/AIFacilitator"
import PeerRecognition from "@/components/PeerRecognition"
import AsymmetryWarmup from "@/components/AsymmetryWarmup"
import FXLayer from "@/components/FXLayer"
import BossArena from "@/components/BossArena"
import SailboatSea from "@/components/SailboatSea"
import TeamBoard from "@/components/TeamBoard"
import type { DepthBooster } from "@/constants"
import {
  boardStepFor,
  advanceGate,
  lupaInsight,
  findPuentePair,
  encodePuenteProposal,
  decodePuenteProposal,
  boosterUsageFrom,
  pourquoiQuestion,
  playerEntries,
  isPlayerEntry,
  LUPA_CAT,
  POURQUOI_CAT,
  PUENTE_CAT,
} from "@/lib/board"
import { fxBurst } from "@/components/FXLayer"
import { playSfx } from "@/lib/juice"

const REACTION_EMOJIS = ["❤️", "🔥", "👍"]
const ROUND_SECONDS = 5 * 60

async function awardBadge(supabase: any, teamId: string, name: string, description: string) {
  const { data } = await supabase.from("Badge").select("id").eq("teamId", teamId).eq("name", name).limit(1)
  if (!data || data.length === 0) {
    await supabase.from("Badge").insert({ name, description, teamId })
  }
}

export default function RetroPage({ params }: { params: { id: string } }) {
  const [ceremony, setCeremony] = useState<any>(null)
  const [round, setRound] = useState(1)
  const [comments, setComments] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [category, setCategory] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [voting, setVoting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [engagementScore, setEngagementScore] = useState<number | null>(null)
  const [leveledUp, setLeveledUp] = useState(false)
  const [streakInfo, setStreakInfo] = useState<string | null>(null)
  const [nextQuests, setNextQuests] = useState<any[]>([])
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiActions, setAiActions] = useState<{ title: string; why: string; done?: boolean }[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [coachShow, setCoachShow] = useState(false)
  const [retrievalDone, setRetrievalDone] = useState(false)
  const [retrievalAnswer, setRetrievalAnswer] = useState("")
  const [reflectionDone, setReflectionDone] = useState<Record<number, boolean>>({})
  const [safetyScore, setSafetyScore] = useState<number | null>(null)
  const [safetyComplete, setSafetyComplete] = useState(false)
  const [asymmetryDone, setAsymmetryDone] = useState(false)
  const [asymmetryAnswers, setAsymmetryAnswers] = useState<string[]>([])
  const [boardEnabled, setBoardEnabled] = useState(true)
  const [usedBoosters, setUsedBoosters] = useState<Record<string, boolean>>({})
  const [boosterNote, setBoosterNote] = useState<string | null>(null)
  const [blockNote, setBlockNote] = useState<string | null>(null)
  const [pourquoiAnswers, setPourquoiAnswers] = useState<Record<string, string>>({})
  const [pourquoiSaved, setPourquoiSaved] = useState<Record<string, boolean>>({})
  const [confirmingPuente, setConfirmingPuente] = useState(false)
  useEffect(() => {
    try { if (window.localStorage.getItem("sq_board") === "off") setBoardEnabled(false) } catch { /* ignore */ }
  }, [])
  const toggleBoard = (v: boolean) => {
    setBoardEnabled(v)
    try { window.localStorage.setItem("sq_board", v ? "on" : "off") } catch { /* ignore */ }
  }

  const insertGameMasterEntry = async (category: string, content: string) => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("Comment")
      .insert({ ceremonyId: params.id, content, author: "Game Master", anonymous: false, category })
      .select()
      .single()
    if (!error && data) setComments((prev) => [...prev, data])
    return !error
  }

  const useBooster = async (b: DepthBooster) => {
    setBoosterNote(null)
    setBlockNote(null)
    if (b.id === "lupa") {
      const insight = lupaInsight(comments)
      if (!insight) { setBoosterNote("🔍 Lupa needs at least 2 team entries first — share, then reveal.") ; return }
      const ok = await insertGameMasterEntry(LUPA_CAT, insight)
      if (ok) setBoosterNote("🔍 Lupa revealed a pattern in the feed — discuss it, then advance.")
    } else if (b.id === "doble-porque") {
      const count = comments.filter((c: any) => c.category === POURQUOI_CAT).length
      const q = pourquoiQuestion(comments, count)
      const ok = await insertGameMasterEntry(POURQUOI_CAT, q)
      if (ok) setBoosterNote("❓ Doble porqué added below — answer it to deepen reflection.")
    } else {
      const pair = findPuentePair(comments)
      if (!pair) { setBoosterNote("🌉 Puente needs 2 entries sharing some words — nothing to group yet.") ; return }
      const summary = `A: "${pair.a.content.slice(0, 80)}" (${pair.a.category})\nB: "${pair.b.content.slice(0, 80)}" (${pair.b.category})`
      const ok = await insertGameMasterEntry(PUENTE_CAT, encodePuenteProposal(pair.a.id, pair.b.id, summary))
      if (ok) setBoosterNote("🌉 Puente proposed a grouping below — confirm it together to merge.")
    }
  }

  const confirmPuente = async () => {
    const proposal = comments.find((c: any) => c.category === PUENTE_CAT)
    if (!proposal) return
    const ids = decodePuenteProposal(proposal.content)
    if (!ids) return
    const a = comments.find((c: any) => c.id === ids.aId)
    const b = comments.find((c: any) => c.id === ids.bId)
    if (!a || !b || a.category === b.category) return
    setConfirmingPuente(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("Comment").update({ category: a.category }).eq("id", b.id)
      if (!error) setComments((prev) => prev.map((c) => (c.id === b.id ? { ...c, category: a.category } : c)))
    } finally {
      setConfirmingPuente(false)
    }
  }

  const savePourquoiAnswer = async (commentId: string, question: string) => {
    const answer = (pourquoiAnswers[commentId] ?? "").trim()
    if (!answer) return
    const supabase = getSupabase()
    const { error } = await supabase.from("Reflection").insert({
      ceremonyId: params.id, round, prompt: question, response: answer, type: "elaborative",
    })
    if (!error) {
      setPourquoiSaved((prev) => ({ ...prev, [commentId]: true }))
      setReflectionDone((prev) => ({ ...prev, [round]: true }))
    }
  }
  useEffect(() => {
    try { if (!window.localStorage.getItem("sq_coach_seen")) setCoachShow(true) } catch { /* private mode */ }
  }, [])
  const dismissCoach = () => { try { window.localStorage.setItem("sq_coach_seen", "1") } catch { /* ignore */ }; setCoachShow(false) }

  const [actionFor, setActionFor] = useState<any>(null)
  const [actionTitle, setActionTitle] = useState("")
  const [actionOwner, setActionOwner] = useState("")
  const [actionDue, setActionDue] = useState("")
  const [savingAction, setSavingAction] = useState(false)
  const [prevCeremony, setPrevCeremony] = useState<any>(null)
  const [prevActions, setPrevActions] = useState<any[]>([])
  const [uid] = useState(() => {
    if (typeof window === "undefined") return "server"
    let id = window.localStorage.getItem("sq_uid")
    if (!id) { id = Math.random().toString(36).slice(2); window.localStorage.setItem("sq_uid", id) }
    return id
  })
  const router = useRouter()
  const victoryCelebrated = useRef(false)
  useEffect(() => {
    if (engagementScore !== null && !victoryCelebrated.current) {
      victoryCelebrated.current = true
      try {
        fxBurst(window.innerWidth / 2, window.innerHeight / 3, { count: 70, speed: 0.35 })
      } catch { /* ignore */ }
      playSfx("fanfare")
    }
  }, [engagementScore])

  const mode = ceremony ? (MODE_CONFIG[ceremony.gameMode] ?? DEFAULT_MODE) : DEFAULT_MODE
  const isBoss = ceremony?.gameMode === "BOSS_BATTLE"
  const isDetective = ceremony?.gameMode === "DETECTIVE"
  const totalRounds = mode.rounds.length
  const currentRound = mode.rounds[Math.min(round, totalRounds) - 1]
  const LEGACY_SYSTEM_CATS = ["🎮 Burst", "🗺️ Board"]
  const visible = comments.filter((c: any) => !LEGACY_SYSTEM_CATS.includes(c.category))

  useEffect(() => {
    const supabase = getSupabase()
    const fetchCeremony = async () => {
      const { data } = await supabase.from("Ceremony").select("*").eq("id", params.id).single()
      if (data) {
        setCeremony(data)
        const m = MODE_CONFIG[data.gameMode] ?? DEFAULT_MODE
        setCategory(m.categories[0]?.name ?? "")
        if (typeof data.round === "number" && data.round >= 2) {
          // Resume a ceremony already in progress: token keeps its square,
          // warm-up counts as done (it gated leaving Salida).
          setRound(Math.min(data.round, m.rounds.length))
          setRetrievalDone(true)
        }
        const { data: prev } = await supabase.from("Ceremony").select("*").eq("teamId", data.teamId).eq("status", "completed").neq("id", params.id).order("endedAt", { ascending: false }).limit(1).single()
        if (prev) {
          setPrevCeremony(prev)
          const { data: pa } = await supabase.from("Action").select("*").eq("ceremonyId", prev.id).order("createdAt")
          if (pa) setPrevActions(pa)
        }
      }
    }
    const fetchComments = async () => { const { data } = await supabase.from("Comment").select("*").eq("ceremonyId", params.id).order("createdAt"); if (data) setComments(data) }
    const fetchVotes = async () => { const { data } = await supabase.from("Vote").select("*").eq("ceremonyId", params.id); if (data) setVotes(data) }
    const channel = supabase.channel(`ceremony:${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` }, (payload: any) => setComments(prev => [...prev, payload.new]))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` }, (payload: any) => setVotes(prev => [...prev, payload.new]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` }, (payload: any) => setVotes(prev => prev.filter(v => v.id !== payload.old.id)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` }, (payload: any) => setComments(prev => prev.map(c => (c.id === payload.new.id ? payload.new : c))))
      .subscribe()
    fetchCeremony()
    fetchComments()
    fetchVotes()
    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  useEffect(() => {
    setSecondsLeft(ROUND_SECONDS)
    const iv = setInterval(() => setSecondsLeft(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(iv)
  }, [round])

  const addComment = async () => {
    if (!newComment.trim() || !category) return
    const supabase = getSupabase()
    const { data, error } = await supabase.from("Comment").insert({ ceremonyId: params.id, content: newComment.trim(), author: "Teammate", anonymous, category }).select().single()
    if (!error && data) { setComments(prev => [...prev, data]); setNewComment("") }
  }

  const toggleReaction = async (commentId: string, emoji: string) => {
    const supabase = getSupabase()
    const mine = votes.find(v => v.option === `${commentId}:${emoji}` && v.userId === uid)
    if (mine) {
      await supabase.from("Vote").delete().eq("id", mine.id)
      setVotes(prev => prev.filter(v => v.id !== mine.id))
    } else {
      const { data } = await supabase.from("Vote").insert({ ceremonyId: params.id, option: `${commentId}:${emoji}`, userId: uid }).select().single()
      if (data) setVotes(prev => [...prev, data])
    }
  }

  const reactionCount = (commentId: string, emoji: string) => votes.filter(v => v.option === `${commentId}:${emoji}`).length
  const myReaction = (commentId: string, emoji: string) => votes.some(v => v.option === `${commentId}:${emoji}` && v.userId === uid)

  const createAction = async () => {
    if (!actionFor || !actionTitle.trim() || !actionOwner.trim()) return
    setSavingAction(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("Action").insert({
        title: actionTitle.trim(), description: actionFor.content, owner: actionOwner.trim(),
        ceremonyId: params.id, dueDate: actionDue ? new Date(actionDue).toISOString() : null,
        xpValue: 100,
      })
      if (!error) { setActionFor(null); setActionTitle(""); setActionOwner(""); setActionDue("") }
      else alert(error.message)
    } finally { setSavingAction(false) }
  }

  const createSuggestedAction = async (s: { title: string; why: string }) => {
    const supabase = getSupabase()
    const { error } = await supabase.from("Action").insert({ title: s.title, description: s.why || "Suggested by Game Master", owner: "Unassigned", ceremonyId: params.id, xpValue: 100 })
    if (!error) setAiActions(prev => prev.map(x => (x.title === s.title ? { ...x, done: true } : x)))
  }

  const completeAction = async (action: any, teamId: string) => {
    const supabase = getSupabase()
    await supabase.from("Action").update({ status: "completed", completedAt: new Date().toISOString() }).eq("id", action.id)
    const { data: t } = await supabase.from("Team").select("xp").eq("id", teamId).single()
    if (t) await supabase.from("Team").update({ xp: (t.xp ?? 0) + actionValue(action.xpValue) }).eq("id", teamId)
    await awardBadge(supabase, teamId, "Closer", "Completed your first action item")
    setPrevActions(prev => prev.map(a => (a.id === action.id ? { ...a, status: "completed" } : a)))
  }

  // The team token advances ONLY through here: gated by the current
  // square's completion rule and persisted to Ceremony.round.
  const advanceTeam = async () => {
    const step = boardStepFor(round, totalRounds, false)
    const gate = advanceGate(step, {
      recallDone: retrievalDone,
      entries: playerEntries(comments).length,
      reflectionDone: !!reflectionDone[round],
    })
    if (!gate.ok) {
      setBlockNote(gate.reason)
      setBoosterNote(null)
      return
    }
    setBlockNote(null)
    const supabase = getSupabase()
    if (round < totalRounds) {
      const next = round + 1
      setRound(next)
      supabase.from("Ceremony").update({ round: next }).eq("id", params.id).then(() => {}, () => {})
    } else {
      setVoting(true)
      supabase.from("Ceremony").update({ round: totalRounds }).eq("id", params.id).then(() => {}, () => {})
    }
  }

  const finishCeremony = async () => {
    if (finishing || ceremony?.status === "completed") return
    setFinishing(true)
    try {
      const supabase = getSupabase()
      const score = engagementMetric(visible.length)
      setEngagementScore(score)
      await supabase.from("Ceremony").update({ status: "completed", endedAt: new Date().toISOString() }).eq("id", params.id)
      const { data: t } = await supabase.from("Team").select("xp, streak").eq("id", ceremony.teamId).single()
      const before = t?.xp ?? 0
      let bonus = 0
      let streakMsg: string | null = null
      if (prevCeremony && prevActions.length > 0) {
        if (prevActions.every(a => a.status === "completed")) {
          const streak = (t?.streak ?? 0) + 1
          bonus = streakIndicator(streak)
          await supabase.from("Team").update({ streak }).eq("id", ceremony.teamId)
          streakMsg = `🔥 ${streak}-sprint improvement streak`
          if (streak >= 3) await awardBadge(supabase, ceremony.teamId, "Streak Mindset", "3-sprint improvement streak with reflection")
        } else {
          await supabase.from("Team").update({ streak: 0 }).eq("id", ceremony.teamId)
        }
      }
      const after = before + score + bonus
      await supabase.from("Team").update({ xp: after, level: levelForXp(after) }).eq("id", ceremony.teamId)
      if (levelForXp(after) > levelForXp(before)) setLeveledUp(true)
      setStreakInfo(streakMsg)
      const { data: done } = await supabase.from("Ceremony").select("id").eq("teamId", ceremony.teamId).eq("status", "completed")
      if (done && done.length <= 1) await awardBadge(supabase, ceremony.teamId, "Retrospective Explorer", "Completed first ceremony with reflection")
      const { data: nq } = await supabase.from("Action").select("*").eq("ceremonyId", params.id).neq("status", "completed").order("createdAt")
      if (nq) setNextQuests(nq)
      if (asymmetryAnswers.length >= 3) {
        await awardBadge(supabase, ceremony.teamId, "Recall Master", "mastery:recall-master — Spaced retrieval warm-up: correctly identified 3+ past commitments")
      }
      try {
        const openCount = (nq ?? []).length
        await fetch("/api/sprintmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ceremonyId: params.id,
            type: openCount > 0 ? "quest" : "insight",
            title: `${mode.name} reflection pinned`,
            description: `${visible.length} entries shared · engagement ${score + bonus} · ${openCount} open quests`,
          }),
        })
      } catch { /* map pin is optional */ }
      setEngagementScore(score + bonus)
      setAiLoading(true)
      try {
        const res = await fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ceremonyId: params.id }) })
        const sj = await res.json()
        if (res.ok) {
          setAiSummary(sj.summary ?? null)
          setAiActions((sj.actions ?? []).map((a: any) => ({ title: a.title, why: a.why })))
          setCeremony((prev: any) => (prev ? { ...prev, summary: sj.summary ?? prev.summary } : prev))
        }
      } catch { /* AI is optional */ }
      setAiLoading(false)
    } catch (e) {
      alert("Could not finish the ceremony. Try again.")
    } finally {
      setFinishing(false)
    }
  }

  const openPrevActions = prevActions.filter(a => a.status !== "completed")
  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, "0")
  const reflectionPrompts = getReflectionPrompts(ceremony?.gameMode ?? "DEFAULT")

  if (engagementScore !== null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <FXLayer />
        <div className="glass rounded-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{mode.victoryEmoji}</div>
          <h1 className="text-3xl font-bold text-gradient mb-2">{mode.victoryTitle}</h1>
          {leveledUp && <div className="bg-gold/20 text-gold font-bold rounded-lg p-2 mb-3">⬆️ {engagementLabel(levelForXp(ceremony?.teamId ? 0 : 0))} — New team level reached!</div>}
          <p className="text-gray-400 mb-4">Team engagement level</p>
          <div className="text-5xl font-bold text-gold mb-4">{engagementScore}</div>
          <p className="text-sm text-gray-400 mb-2">{visible.length} {visible.length === 1 ? "entry" : "entries"} shared</p>
          {streakInfo && <p className="text-sm text-teal mb-3">{streakInfo}</p>}
          <div className="text-left bg-dark/50 rounded-xl p-4 mb-4">
            <p className="font-bold mb-2">🤖 Game Master insights</p>
            {aiLoading && <p className="text-sm text-gray-400">Writing insights…</p>}
            {!aiLoading && aiSummary && <p className="text-sm text-gray-300 mb-3">{aiSummary}</p>}
            {!aiLoading && !aiSummary && <p className="text-sm text-gray-500">AI insights unavailable.</p>}
            {aiActions.map(a => (
              <div key={a.title} className="flex items-center gap-2 py-1">
                {a.done ? <span className="text-teal text-sm font-bold">✓</span> : <button onClick={() => createSuggestedAction(a)} className="text-xs px-2 py-0.5 rounded-full border border-gold text-gold hover:bg-gold hover:text-black">+ action</button>}
                <span className="text-sm">{a.title} <span className="text-gray-500">· {a.why}</span></span>
              </div>
            ))}
          </div>
          {nextQuests.length > 0 && (
            <div className="text-left bg-dark/50 rounded-xl p-4 mb-6">
              <p className="font-bold mb-2">⚔️ Next sprint quests</p>
              {nextQuests.map(q => <div key={q.id} className="flex justify-between text-sm py-1"><span>{q.title} <span className="text-gray-500">· {q.owner}</span></span><span className="text-gold font-bold">{q.xpValue ?? 50}</span></div>)}
            </div>
          )}
          <p className="text-sm text-gray-400 mb-6">Every voice counts · No leaderboards · Team learning focused</p>
          <ShareRecap ceremonyId={params.id} />
          <button onClick={() => router.push(`/dashboard?team=${ceremony?.teamId}`)} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Back to team dashboard</button>
        </div>
      </main>
    )
  }

  if (voting) {
    return (
      <main className="min-h-screen p-8">
        <FXLayer />
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-4 mb-6 text-sm">
            <a href="/" className="text-gray-400 hover:text-teal transition">← Home</a>
            {ceremony?.teamId && <a href={`/dashboard?team=${ceremony.teamId}`} className="text-gray-400 hover:text-teal transition">← Team dashboard</a>}
          </div>
          <div className="glass rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🗳️</div>
            <h2 className="text-2xl font-bold mb-2">{mode.voteTitle}</h2>
            <p className="text-xs text-gold mb-1">⚔️ Quest square — lock in to finish: winners become owned action items for next sprint.</p>
            <p className="text-sm text-gray-400 mb-6">Discuss out loud, then lock it in — the team decides together. Turn the winners into action items for next sprint.</p>
            <div className="space-y-3 mb-6">
              {mode.categories.map(cat => {
                const count = comments.filter((c: any) => c.category === cat.name).length
                return (
                  <div key={cat.name} className="glass rounded-xl p-4 flex justify-between items-center">
                    <span className="font-bold">{cat.name}</span>
                    <span className="text-gold font-bold">{count} {count === 1 ? "entry" : "entries"}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setVoting(false)} className="flex-1 p-3 border border-gray-600 rounded-lg text-gray-300 hover:border-teal">← Back to board</button>
              {ceremony?.status === "completed"
                ? <span className="flex-1 p-3 bg-gold/20 text-gold font-bold rounded-lg">Completed ✓</span>
                : <button onClick={finishCeremony} disabled={finishing} className="flex-1 p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50">{finishing ? "Finishing..." : "Lock it in — Finish + Share"}</button>}
            </div>
          </div>
        </div>
      </main>
    )
  }

  const matched = mode.categories.map(cat => ({ cat, items: visible.filter((c: any) => c.category === cat.name) }))
  const others = visible.filter((c: any) => !mode.categories.some(cat => cat.name === c.category))
  const bossFeed = visible
    .filter((c: any) => c.category === "👹 Boss")
    .map((c: any) => {
      const attacks = reactionCount(c.id, ATTACK_EMOJI)
      return { id: c.id, content: c.content, hp: bossHp(attacks), defeated: isDefeated(attacks), myAttacked: myReaction(c.id, ATTACK_EMOJI) }
    })
  const activeHint = mode.categories.find(c => c.name === category)?.hint ?? ""
  const commentCard = (c: any) => (
    <div key={c.id} className="glass rounded-xl p-4">
      <div className="text-sm text-gray-400 mb-1">{c.anonymous ? "Anonymous" : c.author}</div>
      <div className="mb-2">{c.content}</div>
      {isBoss && c.category === "👹 Boss" && (() => {
        const attacks = reactionCount(c.id, ATTACK_EMOJI)
        const hp = bossHp(attacks)
        const dead = isDefeated(attacks)
        return (
          <div className="mt-1 mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>👹 Boss HP</span><span>{hp}/{BOSS_HP}</span></div>
            <div className="h-2 rounded-full bg-dark border border-gray-700 mb-2"><div className={`h-full rounded-full transition-all ${dead ? "bg-teal" : "bg-red-500"}`} style={{ width: `${hp}%` }} /></div>
            <div className="flex gap-2 flex-wrap">
              {!dead && <span className="text-xs text-gray-500">↑ drag a blade from the arena above</span>}
              {dead && <span className="text-xs text-teal font-bold">💀 DEFEATED</span>}
              {dead && <button onClick={() => { setActionFor(c); setActionTitle(`Defeat: ${c.content.slice(0, 60)}`); setActionOwner(""); setActionDue("") }} className="text-xs text-teal hover:text-white">⚔️ Forge quest</button>}
            </div>
          </div>
        )
      })()}
      <div className="flex items-center gap-2 flex-wrap">
        {REACTION_EMOJIS.map(e => (
          <button key={e} onClick={() => toggleReaction(c.id, e)} className={`text-sm px-2 py-0.5 rounded-full border ${myReaction(c.id, e) ? "border-gold bg-gold/10" : "border-gray-700 hover:border-gray-500"}`}>
            {e} {reactionCount(c.id, e) > 0 && reactionCount(c.id, e)}
          </button>
        ))}
        {isDetective && c.category === "❓ Suspect" && (
          <button onClick={() => toggleReaction(c.id, ACCUSE_EMOJI)} className={`text-xs px-2 py-0.5 rounded-full border ${myReaction(c.id, ACCUSE_EMOJI) ? "border-gold bg-gold/10" : "border-gray-700 hover:border-gray-500"}`}>
            ⚖️ Accuse{reactionCount(c.id, ACCUSE_EMOJI) > 0 && ` (${reactionCount(c.id, ACCUSE_EMOJI)})`}
          </button>
        )}
        <button onClick={() => { setActionFor(c); setActionTitle(c.content.slice(0, 80)); setActionOwner(""); setActionDue("") }} className="ml-auto text-xs text-teal hover:text-white">→ Make action</button>
      </div>
    </div>
  )

  return (
    <>
      <FXLayer />
      <Navbar team={ceremony ? { id: ceremony.teamId } : null} />
      <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-4 text-sm">
          <a href="/" className="text-gray-400 hover:text-teal transition">← Home</a>
          {ceremony?.teamId && <a href={`/dashboard?team=${ceremony.teamId}`} className="text-gray-400 hover:text-teal transition">← Team dashboard</a>}
        </div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div><h1 className="text-3xl font-bold text-gradient">{mode.name}</h1><p className="text-gray-400">Round {Math.min(round, totalRounds)} of {totalRounds}: {currentRound.title}</p></div>
          <div className="flex gap-2 flex-wrap">
            <Presence channel={params.id} />
            <span className={`px-4 py-2 rounded-full font-bold ${secondsLeft === 0 ? "bg-red-900/60 text-red-200" : "bg-navy-800 border border-gray-700 text-gray-300"}`}>⏱ {secondsLeft === 0 ? "Time!" : `${mm}:${ss}`}</span>
            {shouldExtendRound(visible.length > 0, secondsLeft) && (
              <span className="px-3 py-2 rounded-full font-bold bg-teal/20 text-teal text-xs">Keep going</span>
            )}
            <span className="bg-gold/20 text-gold px-4 py-2 rounded-full font-bold">{visible.length} entries</span>
          </div>
        </div>
        {coachShow && (
          <div className="glass rounded-xl p-4 mb-4 border-teal/50">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold">👋 First time here? 60-second tour</p>
              <button onClick={dismissCoach} className="text-xs text-gray-500 hover:text-white">Got it ✕</button>
            </div>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li><b>Recall</b> — review what your team committed last sprint.</li>
              <li><b>Share</b> — post entries below, one idea per entry, anonymous if you like.</li>
              <li><b>Reflect</b> — guided prompts deepen team learning.</li>
              <li><b>Finish</b> — lock in, share engagement level, actions become next sprint&apos;s quests.</li>
            </ol>
          </div>
        )}
        {/* Team Journey Board — the token advances only via advanceTeam (gated + persisted) */}
        {(() => {
          const step = boardStepFor(round, totalRounds, false)
          const usage = boosterUsageFrom(comments)
          const proposal = comments.find((c: any) => c.category === PUENTE_CAT)
          const pourquoiOpen = comments.filter((c: any) => c.category === POURQUOI_CAT && !pourquoiSaved[c.id])
          let puenteCard: { a: any; b: any; merged: boolean } | null = null
          if (proposal) {
            const ids = decodePuenteProposal(proposal.content)
            if (ids) {
              const a = comments.find((c: any) => c.id === ids.aId)
              const b = comments.find((c: any) => c.id === ids.bId)
              if (a && b) puenteCard = { a, b, merged: a.category === b.category }
            }
          }
          return (
            <>
              <TeamBoard
                step={step}
                playerEntries={playerEntries(comments).length}
                enabled={boardEnabled}
                onToggle={toggleBoard}
                usage={usage}
                onUseBooster={useBooster}
                activeNote={boosterNote}
                blockNote={blockNote}
                onAdvance={advanceTeam}
                advanceLabel={round < totalRounds ? "Advance team token ➜" : "Go to Vote 🗳️"}
              />
              {puenteCard && !puenteCard.merged && (
                <div className="glass rounded-xl p-4 mb-6 border-teal/40" role="status">
                  <p className="font-bold text-sm mb-1">🌉 Puente proposal — confirm together to group</p>
                  <p className="text-sm text-gray-300 mb-1">A ({puenteCard.a.category}): “{(puenteCard.a.content ?? "").slice(0, 90)}”</p>
                  <p className="text-sm text-gray-300 mb-3">B ({puenteCard.b.category}): “{(puenteCard.b.content ?? "").slice(0, 90)}”</p>
                  <button onClick={confirmPuente} disabled={confirmingPuente} className="px-4 py-2 bg-teal text-white font-bold rounded-lg text-sm hover:bg-teal/80 disabled:opacity-50">
                    {confirmingPuente ? "Merging..." : `Group B under ${puenteCard.a.category}`}
                  </button>
                </div>
              )}
              {puenteCard?.merged && (
                <p className="text-xs text-teal mb-6" role="status">🌉 Puente merged ✓ — grouped under {puenteCard.a.category}.</p>
              )}
              {pourquoiOpen.map((c: any) => (
                <div key={c.id} className="glass rounded-xl p-4 mb-6 border-gold/30">
                  <p className="font-bold text-sm mb-1">❓ Doble porqué — depth booster</p>
                  <p className="text-sm text-gray-200 mb-3 whitespace-pre-wrap">{c.content}</p>
                  <textarea
                    value={pourquoiAnswers[c.id] ?? ""}
                    onChange={(e) => setPourquoiAnswers((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="Answer as a team..."
                    className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 h-20 resize-none"
                  />
                  <button onClick={() => savePourquoiAnswer(c.id, c.content)} className="px-4 py-2 bg-gold text-black font-bold rounded-lg text-sm hover:bg-yellow-400">
                    Save reflection ✓
                  </button>
                </div>
              ))}
            </>
          )
        })()}
        {/* Psychological Safety Check-In */}
        {!safetyComplete && round === 1 && (
          <SafetyCheckIn onComplete={(score) => { setSafetyScore(score); setSafetyComplete(true) }} />
        )}
        {safetyComplete && safetyScore !== null && (
          <div className="text-xs text-gray-500 mb-2">🛡️ Safety: {safetyScore}/5</div>
        )}
        {/* Hanabi-style warm-up: information asymmetry before recall */}
        {round === 1 && !asymmetryDone && (
          <AsymmetryWarmup
            sprintNumber={ceremony?.sprint?.number ?? 1}
            playerCount={3}
            onComplete={(answers) => {
              setAsymmetryAnswers(answers)
              setAsymmetryDone(true)
              const sprintId = ceremony?.sprintId
              if (sprintId) {
                fetch("/api/retrieval", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sprintId, promptType: "asymmetry-hanabi", answered: answers.length > 0, answer: answers.join(" | ").slice(0, 500) }),
                }).catch(() => { /* retrieval history is optional */ })
              }
            }}
          />
        )}
        {/* Spaced Retrieval Warm-Up — Step 0 */}
        <SpacedRetrieval
          sprintNumber={ceremony?.sprint?.number ?? 1}
          onComplete={(answer) => { setRetrievalAnswer(answer); setRetrievalDone(true) }}
        />
        {/* AI Facilitator — Real-time insights */}
        <AIFacilitator entries={visible.map((c: any) => ({ category: c.category, content: c.content }))} round={round} totalRounds={totalRounds} />
        {/* Previous ceremony follow-up */}
        {round === 1 && prevCeremony && prevActions.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <h3 className="font-bold mb-1">📋 Last ceremony&apos;s commitments ({openPrevActions.length} open)</h3>
            <p className="text-sm text-gray-400 mb-3">Review first — check off what got done.</p>
            <div className="space-y-2">
              {prevActions.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark/50">
                  {a.status === "completed" ? <span className="text-teal font-bold">✓</span> : <button onClick={() => completeAction(a, ceremony.teamId)} className="w-5 h-5 rounded border border-gray-500 hover:border-gold shrink-0" title="Mark done" />}
                  <span className={a.status === "completed" ? "line-through text-gray-500" : ""}>{a.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Current round prompt */}
        <div className="border-l-4 border-teal pl-4 mb-6"><p className="text-lg text-gray-100">{currentRound.prompt}</p></div>
        {/* Structured Reflection between rounds */}
        {round > 1 && !reflectionDone[round] && (
          <ReflectionPhase
            prompts={reflectionPrompts}
            round={round}
            onComplete={() => { setReflectionDone({ ...reflectionDone, [round]: true }) }}
          />
        )}
        {/* Boss Arena — drag blades onto the boss (Flash-style interaction) */}
        {isBoss && bossFeed.length > 0 && (
          <BossArena bosses={bossFeed} onAttack={(id) => toggleReaction(id, ATTACK_EMOJI)} />
        )}
        {/* Sailboat Sea — reactive voyage canvas */}
        {ceremony?.gameMode === "SAILBOAT" && (
          <SailboatSea
            wind={visible.filter((c: any) => c.category === "🌬️ Wind").length}
            anchor={visible.filter((c: any) => c.category === "⚓ Anchor").length}
            rocks={visible.filter((c: any) => c.category === "🪨 Rocks").length}
            step={boardStepFor(round, totalRounds, false)}
            islandLabel={visible.find((c: any) => c.category === "🏝️ Island")?.content ?? "Island"}
          />
        )}
        {/* Entry form */}
        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="font-bold mb-3">Add Entry</h3>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded bg-dark border border-gray-600 text-white mb-3">{mode.categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={activeHint || "Share your thoughts..."} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 h-24 resize-none" />
          <label className="flex items-center gap-2 mb-3 text-sm text-gray-400"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Anonymous</label>
          <button onClick={addComment} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Post Entry</button>
        </div>
        {/* Comment cards */}
        <div className="space-y-6">
          {/* Peer Recognition */}
          <PeerRecognition teamId={ceremony?.teamId} ceremonyId={params.id} />
          {isDetective && (() => {
            const acc = votes.filter(v => typeof v.option === "string" && v.option.endsWith(`:${ACCUSE_EMOJI}`)).map(v => ({ commentId: v.option.split(":")[0], userId: v.userId }))
            const suspects = comments.filter((c: any) => c.category === "❓ Suspect").map((c: any) => ({ id: c.id, content: c.content }))
            const ranked = rankSuspects(suspects, acc)
            const voters = new Set(acc.map(a => a.userId)).size
            const need = majorityThreshold(voters)
            const shown = ranked.filter(r => r.accusations > 0)
            if (shown.length === 0) return null
            return (
              <div className="glass rounded-xl p-4">
                <p className="font-bold mb-2">🔎 Case board <span className="text-xs font-normal text-gray-500">conviction needs {need} vote{voters === 1 ? "" : "s"}</span></p>
                {shown.map((r, i) => (
                  <div key={r.id} className="flex justify-between text-sm py-1 gap-2">
                    <span className="truncate">{i === 0 && r.accusations >= need ? "👑 " : ""}{r.content}</span>
                    <span className="text-gold font-bold shrink-0">{r.accusations} ⚖️</span>
                  </div>
                ))}
              </div>
            )
          })()}
          {matched.map(({ cat, items }) => {
            if (items.length === 0) return null
            return <div key={cat.name}><h3 className="text-lg font-bold mb-1">{cat.name}</h3><p className="text-xs text-gray-500 mb-3">{cat.hint}</p><div className="space-y-3">{items.map(commentCard)}</div></div>
          })}
          {others.length > 0 && <div><h3 className="text-lg font-bold mb-3">Other</h3><div className="space-y-3">{others.map(commentCard)}</div></div>}
        </div>
        <div className="flex justify-between mt-8">
          <button onClick={advanceTeam} className="p-3 bg-teal text-white font-bold rounded-lg">{round < totalRounds ? "Advance team token →" : "Go to Vote 🗳️"}</button>
          {ceremony?.status === "completed"
            ? <span className="p-3 bg-gold/20 text-gold font-bold rounded-lg">Completed ✓</span>
            : <button onClick={finishCeremony} disabled={finishing} className="p-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50">{finishing ? "Finishing..." : "Lock it in — Finish + Share"}</button>}
        </div>
      </div>
      {actionFor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setActionFor(null)}>
          <div className="glass rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">⚔️ New action item</h3>
            <p className="text-xs text-gray-400 mb-4">From: "{(actionFor.content ?? "").slice(0, 100)}"</p>
            <div className="space-y-3">
              <input type="text" placeholder="Action title" value={actionTitle} onChange={e => setActionTitle(e.target.value)} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400" />
              <input type="text" placeholder="Owner (who commits?)" value={actionOwner} onChange={e => setActionOwner(e.target.value)} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400" />
              <input type="date" value={actionDue} onChange={e => setActionDue(e.target.value)} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white" />
              <p className="text-xs text-gray-500">Tracked on your engagement dashboard.</p>
              <div className="flex gap-3">
                <button onClick={() => setActionFor(null)} className="flex-1 p-3 border border-gray-600 rounded-lg text-gray-300">Cancel</button>
                <button onClick={createAction} disabled={savingAction || !actionTitle.trim() || !actionOwner.trim()} className="flex-1 p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50">{savingAction ? "Saving..." : "Create action"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  )
}
