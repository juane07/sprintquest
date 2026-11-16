"use client"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { MODE_CONFIG, DEFAULT_MODE } from "@/constants"
import { engagementMetric, streakIndicator, levelForXp, actionValue, engagementLabel } from "@/lib/xp"
import { getReflectionPrompts } from "@/lib/learning-science"
import { BOSS_HP, bossHp, isDefeated, ATTACK_EMOJI } from "@/lib/boss"
import { rankSuspects, majorityThreshold, ACCUSE_EMOJI } from "@/lib/detective"
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
import RoundTimer from "@/components/RoundTimer"
import type { DepthBooster } from "@/constants"
import {
  lupaInsight,
  findPuentePair,
  encodePuenteProposal,
  decodePuenteProposal,
  boosterUsageFrom,
  pourquoiQuestion,
  playerEntries,
  LUPA_CAT,
  POURQUOI_CAT,
  PUENTE_CAT,
} from "@/lib/board"
import {
  FLOW_CAT,
  encodeFlowEvent,
  flowFromRows,
  flowRows,
  seedFlowFromCeremony,
  flowBoardStep,
  flowGate,
  flowWaiting,
  flowAdvanceLabel,
  flowAdvanceEvent,
  flowTotal,
  type FlowEvent,
} from "@/lib/flow"
import { fxBurst } from "@/components/FXLayer"
import { playSfx } from "@/lib/juice"

const REACTION_EMOJIS = ["❤️", "🔥", "👍"]
// Persisted category values. Never rename these — existing ceremonies hold
// rows with these exact strings and they are matched with `===`.
const LEGACY_SYSTEM_CATS = ["🎮 Burst", "🗺️ Board"]

async function awardBadge(supabase: any, teamId: string, name: string, description: string) {
  const { data } = await supabase.from("Badge").select("id").eq("teamId", teamId).eq("name", name).limit(1)
  if (!data || data.length === 0) {
    await supabase.from("Badge").insert({ name, description, teamId })
  }
}

// Comment rows arrive twice: once from the INSERT we optimistically merge and
// once from the realtime stream. Dedupe by id so nobody sees their own entry
// twice, and so a long feed never doubles in size.
function mergeComment(prev: any[], row: any): any[] {
  if (!row) return prev
  return prev.some((c) => c.id === row.id) ? prev.map((c) => (c.id === row.id ? { ...c, ...row } : c)) : [...prev, row]
}

export default function RetroPage({ params }: { params: { id: string } }) {
  const [ceremony, setCeremony] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [category, setCategory] = useState("")
  const [anonymous, setAnonymous] = useState(true)
  const [authorName, setAuthorName] = useState("")
  const [showHanabi, setShowHanabi] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [coachShow, setCoachShow] = useState(false)
  const [safetyScore, setSafetyScore] = useState<number | null>(null)
  const [safetyComplete, setSafetyComplete] = useState(false)
  const [asymmetryDone, setAsymmetryDone] = useState(false)
  const [asymmetryAnswers, setAsymmetryAnswers] = useState<string[]>([])
  const [boardEnabled, setBoardEnabled] = useState(true)
  const [online, setOnline] = useState(1)
  const [boosterNote, setBoosterNote] = useState<string | null>(null)
  const [gateNote, setGateNote] = useState<string | null>(null)
  const [pourquoiAnswers, setPourquoiAnswers] = useState<Record<string, string>>({})
  const [pourquoiSaved, setPourquoiSaved] = useState<Record<string, boolean>>({})
  const [confirmingPuente, setConfirmingPuente] = useState(false)
  const [nextQuests, setNextQuests] = useState<any[]>([])
  const [forgedQuests, setForgedQuests] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try { if (window.localStorage.getItem("sq_board") === "off") setBoardEnabled(false) } catch { /* ignore */ }
  }, [])
  const toggleBoard = (v: boolean) => {
    setBoardEnabled(v)
    try { window.localStorage.setItem("sq_board", v ? "on" : "off") } catch { /* ignore */ }
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

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (newComment.trim()) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [newComment])
  const [uid] = useState(() => {
    if (typeof window === "undefined") return "server"
    let id = window.localStorage.getItem("sq_uid")
    if (!id) { id = Math.random().toString(36).slice(2); window.localStorage.setItem("sq_uid", id) }
    return id
  })
  const router = useRouter()

  const mode = ceremony ? (MODE_CONFIG[ceremony.gameMode] ?? DEFAULT_MODE) : DEFAULT_MODE
  const isBoss = ceremony?.gameMode === "BOSS_BATTLE"
  const isDetective = ceremony?.gameMode === "DETECTIVE"
  const totalRounds = mode.rounds.length

  // ---- The shared flow. Every phase value below is folded from the ceremony
  // log, so two devices can never disagree about where the team is.
  const flow = useMemo(() => {
    const rows = flowRows(comments)
    // Ceremonies started before the shared flow existed have no log; adopt
    // whatever durable progress they have and let live events take over.
    return rows.length > 0 ? flowFromRows(rows) : seedFlowFromCeremony(ceremony, totalRounds)
  }, [comments, ceremony, totalRounds])

  const round = flow.round
  const stage = flow.stage
  const reflectionDone = useMemo(() => new Set(flow.reflected), [flow.reflected])

  // Player entries: system rows, boosters and flow rows are not entries.
  const visible = useMemo(
    () => comments.filter((c: any) => !LEGACY_SYSTEM_CATS.includes(c.category) && c.category !== FLOW_CAT),
    [comments],
  )
  const entryCount = useMemo(() => playerEntries(visible).length, [visible])
  const waiting = useMemo(() => flowWaiting(flow, totalRounds, entryCount), [flow, totalRounds, entryCount])
  const advanceLabel = useMemo(() => flowAdvanceLabel(flow, totalRounds), [flow, totalRounds])
  const boardStep = useMemo(() => flowBoardStep(flow, totalRounds), [flow, totalRounds])
  const currentRound = mode.rounds[Math.min(round, totalRounds) - 1]

  const matched = useMemo(
    () => mode.categories.map(cat => ({ cat, items: visible.filter((c: any) => c.category === cat.name) })),
    [mode.categories, visible],
  )
  const others = useMemo(
    () => visible.filter((c: any) => !mode.categories.some(cat => cat.name === c.category)),
    [mode.categories, visible],
  )

  // O(1) reaction lookups. The previous per-render `votes.filter` inside the
  // JSX was O(entries × votes) on every single render.
  const reactionIndex = useMemo(() => {
    const idx = new Map<string, { count: number; mine: boolean }>()
    for (const v of votes) {
      if (typeof v?.option !== "string") continue
      const cur = idx.get(v.option) ?? { count: 0, mine: false }
      cur.count += 1
      if (v.userId === uid) cur.mine = true
      idx.set(v.option, cur)
    }
    return idx
  }, [votes, uid])
  const reactionCount = useCallback((commentId: string, emoji: string) => reactionIndex.get(`${commentId}:${emoji}`)?.count ?? 0, [reactionIndex])
  const myReaction = useCallback((commentId: string, emoji: string) => reactionIndex.get(`${commentId}:${emoji}`)?.mine ?? false, [reactionIndex])

  const bossFeed = useMemo(() => {
    if (!isBoss) return []
    return visible
      .filter((c: any) => c.category === "👹 Boss")
      .map((c: any) => {
        const attacks = reactionCount(c.id, ATTACK_EMOJI)
        return { id: c.id, content: c.content, hp: bossHp(attacks), defeated: isDefeated(attacks), myAttacked: myReaction(c.id, ATTACK_EMOJI) }
      })
  }, [isBoss, visible, reactionCount, myReaction])

  const countsIn = useCallback((name: string) => visible.filter((c: any) => c.category === name).length, [visible])
  const sailCounts = useMemo(
    () => ({
      wind: visible.filter((c: any) => c.category === "🌬️ Wind").length,
      anchor: visible.filter((c: any) => c.category === "⚓ Anchor").length,
      rocks: visible.filter((c: any) => c.category === "🪨 Rocks").length,
      island: visible.find((c: any) => c.category === "🏝️ Island")?.content ?? "Island",
    }),
    [visible],
  )
  const aiEntries = useMemo(() => visible.map((c: any) => ({ category: c.category, content: c.content })), [visible])

  const boosterUsage = useMemo(() => boosterUsageFrom(comments), [comments])
  const puenteProposal = useMemo(() => comments.find((c: any) => c.category === PUENTE_CAT) ?? null, [comments])
  const pourquoiOpen = useMemo(
    () => comments.filter((c: any) => c.category === POURQUOI_CAT && !pourquoiSaved[c.id]),
    [comments, pourquoiSaved],
  )
  const puenteCard = useMemo(() => {
    if (!puenteProposal) return null
    const ids = decodePuenteProposal(puenteProposal.content)
    if (!ids) return null
    const a = comments.find((c: any) => c.id === ids.aId)
    const b = comments.find((c: any) => c.id === ids.bId)
    if (!a || !b) return null
    return { a, b, merged: a.category === b.category }
  }, [puenteProposal, comments])

  const detectiveBoard = useMemo(() => {
    if (!isDetective) return null
    const acc = votes
      .filter((v) => typeof v.option === "string" && v.option.endsWith(`:${ACCUSE_EMOJI}`))
      .map((v) => ({ commentId: v.option.split(":")[0], userId: v.userId }))
    const suspects = comments.filter((c: any) => c.category === "❓ Suspect").map((c: any) => ({ id: c.id, content: c.content }))
    const voters = new Set(acc.map((a) => a.userId)).size
    return {
      need: majorityThreshold(voters),
      shown: rankSuspects(suspects, acc).filter((r) => r.accusations > 0),
    }
  }, [isDetective, votes, comments])

  // ---- Writes. Every flow change is an append to the log; there is no
  // local-only path for anything the whole team must see.
  const appendComment = useCallback(
    async (categoryName: string, content: string, author: string, isAnonymous = false) => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("Comment")
        .insert({ ceremonyId: params.id, content, author, anonymous: isAnonymous, category: categoryName })
        .select()
        .single()
      if (!error && data) setComments((prev) => mergeComment(prev, data))
      return !error
    },
    [params.id],
  )

  const emitFlow = useCallback(
    async (ev: FlowEvent) => {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("Comment")
        .insert({ ceremonyId: params.id, content: encodeFlowEvent(ev), author: "Game Master", anonymous: false, category: FLOW_CAT })
        .select()
        .single()
      if (!error && data) setComments((prev) => mergeComment(prev, data))
      return !error
    },
    [params.id],
  )

  useEffect(() => {
    const supabase = getSupabase()
    const fetchCeremony = async () => {
      const { data } = await supabase.from("Ceremony").select("*").eq("id", params.id).single()
      if (!data) return
      setCeremony(data)
      const m = MODE_CONFIG[data.gameMode] ?? DEFAULT_MODE
      setCategory(m.categories[0]?.name ?? "")
      const { data: prev } = await supabase
        .from("Ceremony")
        .select("*")
        .eq("teamId", data.teamId)
        .eq("status", "completed")
        .neq("id", params.id)
        .order("endedAt", { ascending: false })
        .limit(1)
        .single()
      if (prev) {
        setPrevCeremony(prev)
        const { data: pa } = await supabase.from("Action").select("*").eq("ceremonyId", prev.id).order("createdAt")
        if (pa) setPrevActions(pa)
      }
    }
    const fetchComments = async () => { const { data } = await supabase.from("Comment").select("*").eq("ceremonyId", params.id).order("createdAt"); if (data) setComments(data) }
    const fetchVotes = async () => { const { data } = await supabase.from("Vote").select("*").eq("ceremonyId", params.id); if (data) setVotes(data) }

    // One channel per device: feed changes AND room presence. This used to be
    // two sockets (ceremony + presence), which is real overhead on phones.
    const channel = supabase.channel(`ceremony:${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setComments(prev => mergeComment(prev, payload.new)))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setVotes(prev => (prev.some(v => v.id === payload.new.id) ? prev : [...prev, payload.new])))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setVotes(prev => prev.filter(v => v.id !== payload.old.id)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setComments(prev => mergeComment(prev, payload.new)))
      .on("presence", { event: "sync" }, () => setOnline(Math.max(1, Object.keys(channel.presenceState()).length)))
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") void channel.track({ at: Date.now() })
      })

    fetchCeremony()
    fetchComments()
    fetchVotes()
    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  // Open quests are read on every device once the ceremony is done, so the
  // results screen is the same everywhere — not just on the device that
  // clicked Finish.
  useEffect(() => {
    if (stage !== "done") return
    getSupabase()
      .from("Action")
      .select("*")
      .eq("ceremonyId", params.id)
      .neq("status", "completed")
      .order("createdAt")
      .then(({ data }: { data: any[] | null }) => { if (data) setNextQuests(data) })
  }, [stage, params.id])

  const victoryCelebrated = useRef(false)
  useEffect(() => {
    if (stage === "done" && !victoryCelebrated.current) {
      victoryCelebrated.current = true
      try { fxBurst(window.innerWidth / 2, window.innerHeight / 3, { count: 70, speed: 0.35 }) } catch { /* ignore */ }
      playSfx("fanfare")
    }
  }, [stage])

  const insertGameMasterEntry = useCallback(
    async (categoryName: string, content: string) => appendComment(categoryName, content, "Game Master"),
    [appendComment],
  )

  const useBooster = async (b: DepthBooster) => {
    setBoosterNote(null)
    if (b.id === "lupa") {
      const insight = lupaInsight(visible)
      if (!insight) { setBoosterNote("🔍 Magnifier needs at least 2 team entries first — share, then reveal."); return }
      const ok = await insertGameMasterEntry(LUPA_CAT, insight)
      if (ok) setBoosterNote("🔍 Magnifier revealed a pattern in the feed — discuss it, then advance.")
    } else if (b.id === "doble-porque") {
      const count = visible.filter((c: any) => c.category === POURQUOI_CAT).length
      const ok = await insertGameMasterEntry(POURQUOI_CAT, pourquoiQuestion(visible, count))
      if (ok) setBoosterNote("❓ Why Twice added below — answer it to deepen reflection.")
    } else {
      const pair = findPuentePair(visible)
      if (!pair) { setBoosterNote("🌉 Bridge needs 2 entries sharing some words — nothing to group yet."); return }
      const summary = `A: "${pair.a.content.slice(0, 80)}" (${pair.a.category})\nB: "${pair.b.content.slice(0, 80)}" (${pair.b.category})`
      const ok = await insertGameMasterEntry(PUENTE_CAT, encodePuenteProposal(pair.a.id, pair.b.id, summary))
      if (ok) setBoosterNote("🌉 Bridge proposed a grouping below — confirm it together to merge.")
    }
  }

  const confirmPuente = async () => {
    if (!puenteCard) return
    const { a, b } = puenteCard
    setConfirmingPuente(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("Comment").update({ category: a.category }).eq("id", b.id)
      if (!error) setComments(prev => prev.map((c) => (c.id === b.id ? { ...c, category: a.category } : c)))
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
    if (error) return
    setPourquoiSaved((prev) => ({ ...prev, [commentId]: true }))
    // Team reflection, not personal: whoever answers opens it for everyone.
    await emitFlow({ e: "reflect", r: round })
  }

  const addComment = async () => {
    if (!newComment.trim() || !category) return
    const displayName = anonymous ? "Anonymous" : (authorName.trim() || "Teammate")
    const ok = await appendComment(category, newComment.trim(), displayName, anonymous)
    if (ok) setNewComment("")
  }

  const toggleReaction = async (commentId: string, emoji: string) => {
    const supabase = getSupabase()
    const mine = votes.find(v => v.option === `${commentId}:${emoji}` && v.userId === uid)
    if (mine) {
      await supabase.from("Vote").delete().eq("id", mine.id)
      setVotes(prev => prev.filter(v => v.id !== mine.id))
    } else {
      const { data } = await supabase.from("Vote").insert({ ceremonyId: params.id, option: `${commentId}:${emoji}`, userId: uid }).select().single()
      if (data) setVotes(prev => (prev.some(v => v.id === data.id) ? prev : [...prev, data]))
    }
  }

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
    if (!error) setForgedQuests(prev => ({ ...prev, [s.title]: true }))
  }

  const completeAction = async (action: any, teamId: string) => {
    const supabase = getSupabase()
    await supabase.from("Action").update({ status: "completed", completedAt: new Date().toISOString() }).eq("id", action.id)
    const { data: t } = await supabase.from("Team").select("xp").eq("id", teamId).single()
    if (t) await supabase.from("Team").update({ xp: (t.xp ?? 0) + actionValue(action.xpValue) }).eq("id", teamId)
    await awardBadge(supabase, teamId, "Closer", "Completed your first action item")
    setPrevActions(prev => prev.map(a => (a.id === action.id ? { ...a, status: "completed", completedAt: new Date().toISOString() } : a)))
  }

  const undoCompleteAction = async (action: any, teamId: string) => {
    const supabase = getSupabase()
    await supabase.from("Action").update({ status: "pending", completedAt: null }).eq("id", action.id)
    const { data: t } = await supabase.from("Team").select("xp").eq("id", teamId).single()
    if (t) await supabase.from("Team").update({ xp: Math.max(0, (t.xp ?? 0) - actionValue(action.xpValue)) }).eq("id", teamId)
    setPrevActions(prev => prev.map(a => (a.id === action.id ? { ...a, status: "pending", completedAt: null } : a)))
  }

  // One place moves the team token, and the gate reads SHARED state — so
  // nobody is blocked while somebody else is allowed to advance.
  const advanceTeam = async () => {
    const gate = flowGate(flow, totalRounds, entryCount)
    if (!gate.ok) {
      setGateNote(gate.reason)
      return
    }
    const ev = flowAdvanceEvent(flow, totalRounds)
    if (!ev) return
    setGateNote(null)
    setBoosterNote(null)
    const ok = await emitFlow(ev)
    // Durable checkpoint for the dashboard/history list. The log stays
    // authoritative; this column is a convenience, not the source of truth.
    const nextRound = ev.e === "round" ? Math.min(ev.v, totalRounds) : Math.min(round, totalRounds)
    if (ok) await getSupabase().from("Ceremony").update({ round: nextRound }).eq("id", params.id)
  }

  const finishCeremony = async () => {
    if (finishing || stage === "done" || !ceremony) return
    setFinishing(true)
    try {
      const supabase = getSupabase()
      const score = engagementMetric(visible.length)

      // Compute the whole shared result BEFORE claiming the ceremony, so the
      // window between claiming and publishing is a couple of milliseconds.
      const { data: t } = await supabase.from("Team").select("xp, streak").eq("id", ceremony.teamId).single()
      const before = t?.xp ?? 0
      const hadPrev = !!prevCeremony && prevActions.length > 0
      const streakKept = hadPrev && prevActions.every(a => a.status === "completed")
      const nextStreak = hadPrev ? (streakKept ? (t?.streak ?? 0) + 1 : 0) : (t?.streak ?? 0)
      const bonus = streakKept ? streakIndicator(nextStreak) : 0
      const streakMsg = streakKept ? `🔥 ${nextStreak}-sprint improvement streak` : null
      const after = before + score + bonus

      // Atomic claim. PostgREST only returns rows it actually updated, so
      // exactly one device wins even if the whole room taps Finish at once —
      // team engagement is recorded once, not N times.
      const { data: claimed } = await supabase
        .from("Ceremony")
        .update({ status: "completed", endedAt: new Date().toISOString() })
        .eq("id", params.id)
        .eq("status", "active")
        .select()
      if (!claimed || claimed.length === 0) return

      setCeremony((prev: any) => (prev ? { ...prev, status: "completed" } : prev))
      await emitFlow({
        e: "finish",
        score,
        bonus,
        level: levelForXp(after),
        leveledUp: levelForXp(after) > levelForXp(before),
        streak: streakMsg,
      })

      // Side effects. The team already sees the result screen by now.
      if (hadPrev) await supabase.from("Team").update({ streak: nextStreak }).eq("id", ceremony.teamId)
      await supabase.from("Team").update({ xp: after, level: levelForXp(after) }).eq("id", ceremony.teamId)
      if (streakKept && nextStreak >= 3) await awardBadge(supabase, ceremony.teamId, "Streak Mindset", "3-sprint improvement streak with reflection")
      const { data: done } = await supabase.from("Ceremony").select("id").eq("teamId", ceremony.teamId).eq("status", "completed")
      if (done && done.length <= 1) await awardBadge(supabase, ceremony.teamId, "Retrospective Explorer", "Completed first ceremony with reflection")
      if (asymmetryAnswers.length >= 3) {
        await awardBadge(supabase, ceremony.teamId, "Recall Master", "mastery:recall-master — Spaced retrieval warm-up: correctly identified 3+ past commitments")
      }
      try {
        const { data: nq } = await supabase.from("Action").select("*").eq("ceremonyId", params.id).neq("status", "completed").order("createdAt")
        if (nq) setNextQuests(nq)
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
        // Pin key team-shared themes (winds/anchors/risks/bosses/islands) so Legacy Sprint Map reflects what the team shared.
        const pin = (type: string, title: string, description: string) =>
          fetch("/api/sprintmap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ceremonyId: params.id, type, title: title.slice(0, 120), description: description.slice(0, 500) }),
          }).catch(() => null)
        const byCat = (cat: string) => visible.filter((c: any) => c.category === cat).slice(0, 2)
        if (ceremony?.gameMode === "SAILBOAT") {
          await Promise.all([
            ...byCat("🌬️ Wind").map((c: any) => pin("wind", c.content, "Wind shared by the team")),
            ...byCat("⚓ Anchor").map((c: any) => pin("anchor", c.content, "Anchor shared by the team")),
            ...byCat("🪨 Rocks").map((c: any) => pin("rock", c.content, "Risk/rock shared by the team")),
            ...byCat("🏝️ Island").map((c: any) => pin("star", c.content, "Island/goal shared by the team")),
          ])
        } else if (ceremony?.gameMode === "BOSS_BATTLE") {
          await Promise.all(byCat("👹 Boss").map((c: any) => pin("boss", c.content, "Boss identified by the team")))
        }
      } catch { /* map pin is optional */ }

      setAiLoading(true)
      try {
        const res = await fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ceremonyId: params.id }) })
        const sj = await res.json()
        if (res.ok) {
          // Publish the reflection so every device shows it, not just this one.
          await emitFlow({
            e: "summary",
            text: sj.summary ?? "",
            actions: (sj.actions ?? []).map((a: any) => ({ title: String(a.title ?? "").slice(0, 200), why: String(a.why ?? "").slice(0, 300) })),
          })
          await supabase.from("Ceremony").update({ summary: sj.summary ?? null }).eq("id", params.id)
        }
      } catch { /* AI is optional */ } finally {
        setAiLoading(false)
      }
    } catch {
      alert("Could not finish the ceremony. Try again.")
    } finally {
      setFinishing(false)
    }
  }

  const openPrevActions = useMemo(() => prevActions.filter(a => a.status !== "completed"), [prevActions])
  const reflectionPrompts = useMemo(() => getReflectionPrompts(ceremony?.gameMode ?? "DEFAULT"), [ceremony?.gameMode])
  const activeHint = mode.categories.find(c => c.name === category)?.hint ?? ""

  if (stage === "done") {
    const result = flow.result
    const total = flowTotal(result)
    const doneActions = [...(result?.actions ?? [])].sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <FXLayer />
        <div className="glass rounded-xl p-10 max-w-md w-full text-center">
          <div className="flex gap-3 mb-4 text-sm justify-center">
            <a href="/" className="text-gray-400 hover:text-teal transition">Home</a>
            <span className="text-gray-600">/</span>
            {ceremony?.teamId && <a href={`/dashboard?team=${ceremony.teamId}`} className="text-gray-400 hover:text-teal transition">Dashboard</a>}
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">Ceremony recap</span>
          </div>
          <div className="text-6xl mb-4">{mode.victoryEmoji}</div>
          <h1 className="text-3xl font-bold text-gradient mb-2">{mode.victoryTitle}</h1>
          {result?.leveledUp && <div className="bg-gold/20 text-gold font-bold rounded-lg p-2 mb-3">⬆️ {engagementLabel(result.level)} — New team level reached!</div>}
          <p className="text-gray-400 mb-4">Team engagement level</p>
          <div className="text-5xl font-bold text-gold mb-4">{total}</div>
          <p className="text-sm text-gray-400 mb-2">{visible.length} {visible.length === 1 ? "entry" : "entries"} shared</p>
          {result?.streak && <p className="text-sm text-teal mb-3">{result.streak}</p>}
          <div className="text-left bg-dark/50 rounded-xl p-4 mb-4">
            <p className="font-bold mb-2">🤖 Game Master insights</p>
            {aiLoading && <p className="text-sm text-gray-400">Writing insights…</p>}
            {!aiLoading && result?.summary && <p className="text-sm text-gray-300 mb-3">{result.summary}</p>}
            {!aiLoading && !result?.summary && <p className="text-sm text-gray-500">AI insights unavailable.</p>}
            {doneActions.map(a => (
              <div key={a.title} className="flex items-center gap-2 py-1">
                {forgedQuests[a.title] ? <span className="text-teal text-sm font-bold">✓</span> : <button onClick={() => createSuggestedAction(a)} className="text-xs px-2 py-0.5 rounded-full border border-gold text-gold hover:bg-gold hover:text-black">+ action</button>}
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

  if (stage === "vote") {
    return (
      <>
        <FXLayer />
        <Navbar team={ceremony ? { id: ceremony.teamId } : null} />
        <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-400 mb-4 flex items-center gap-2 flex-wrap">
            <a href="/" className="hover:text-teal transition">Home</a>
            <span>/</span>
            {ceremony?.teamId && <><a href={`/dashboard?team=${ceremony.teamId}`} className="hover:text-teal transition">Dashboard</a><span>/</span></>}
            <span className="text-gray-300">Ceremony (vote)</span>
          </nav>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div><h1 className="text-3xl font-bold text-gradient">{mode.name}</h1><p className="text-gray-400">Quest square — the team has moved here together</p></div>
          </div>
          <TeamBoard
            step={boardStep}
            playerEntries={entryCount}
            online={online}
            waiting={null}
            enabled={boardEnabled}
            onToggle={toggleBoard}
            usage={boosterUsage}
            onUseBooster={useBooster}
            activeNote={boosterNote}
          />
          <div className="glass rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🗳️</div>
            <h2 className="text-2xl font-bold mb-2">{mode.voteTitle}</h2>
            <p className="text-xs text-gold mb-1">⚔️ Quest square — lock in to finish: winners become owned action items for next sprint.</p>
            <p className="text-sm text-gray-400 mb-6">Discuss out loud, then lock it in — the team decides together. Turn the winners into action items for next sprint.</p>
            <div className="space-y-3 mb-6">
              {mode.categories.map(cat => {
                const count = countsIn(cat.name)
                return (
                  <div key={cat.name} className="glass rounded-xl p-4 flex justify-between items-center">
                    <span className="font-bold">{cat.name}</span>
                    <span className="text-gold font-bold">{count} {count === 1 ? "entry" : "entries"}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center">
              <FinishButton finishing={finishing} onFinish={finishCeremony} />
            </div>
            <p className="text-xs text-gray-500 mt-3">Everyone in the room sees this screen. Locking in is recorded once, for the team.</p>
          </div>
        </div>
        </main>
      </>
    )
  }

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
      <div className="max-w-4xl mx-auto" id="board">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-400 mb-4 flex items-center gap-2 flex-wrap">
          <a href="/" className="hover:text-teal transition">Home</a>
          <span>/</span>
          {ceremony?.teamId && <><a href={`/dashboard?team=${ceremony.teamId}`} className="hover:text-teal transition">Dashboard</a><span>/</span></>}
          <span className="text-gray-300">Ceremony</span>
        </nav>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div><h1 className="text-3xl font-bold text-gradient">{mode.name}</h1><p className="text-gray-400">Round {Math.min(round, totalRounds)} of {totalRounds}: {currentRound.title}</p></div>
          <div className="flex gap-2 flex-wrap items-center">
            <RoundTimer round={round} hasEntries={visible.length > 0} running={stage === "board"} />
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
            <p className="text-sm text-gray-300 mt-2 list-inside">The whole team sees the same board. Whoever moves the token, everyone moves.</p>
          </div>
        )}

        <TeamBoard
          step={boardStep}
          playerEntries={entryCount}
          online={online}
          waiting={waiting}
          enabled={boardEnabled}
          onToggle={toggleBoard}
          usage={boosterUsage}
          onUseBooster={useBooster}
          activeNote={boosterNote}
          onAdvance={advanceTeam}
          advanceLabel={advanceLabel}
        />
        {gateNote && <p className="text-xs text-gold -mt-3 mb-6" role="alert">{gateNote}</p>}

        {puenteCard && !puenteCard.merged && (
          <div className="glass rounded-xl p-4 mb-6 border-teal/40" role="status">
            <p className="font-bold text-sm mb-1">🌉 Bridge proposal — confirm together to group</p>
            <p className="text-sm text-gray-300 mb-1">A ({puenteCard.a.category}): “{(puenteCard.a.content ?? "").slice(0, 90)}”</p>
            <p className="text-sm text-gray-300 mb-3">B ({puenteCard.b.category}): “{(puenteCard.b.content ?? "").slice(0, 90)}”</p>
            <button onClick={confirmPuente} disabled={confirmingPuente} className="px-4 py-2 bg-teal text-white font-bold rounded-lg text-sm hover:bg-teal/80 disabled:opacity-50">
              {confirmingPuente ? "Merging..." : `Group B under ${puenteCard.a.category}`}
            </button>
          </div>
        )}
        {puenteCard?.merged && (
          <p className="text-xs text-teal mb-6" role="status">🌉 Bridge merged ✓ — grouped under {puenteCard.a.category}.</p>
        )}
        {pourquoiOpen.map((c: any) => (
          <div key={c.id} className="glass rounded-xl p-4 mb-6 border-gold/30">
            <p className="font-bold text-sm mb-1">❓ Why Twice — depth booster</p>
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

        {/* Psychological safety stays private and per-device by design — it is
            a personal check, never a shared number. */}
        {!safetyComplete && round === 1 && (
          <SafetyCheckIn onComplete={(score) => { setSafetyScore(score); setSafetyComplete(true) }} />
        )}
        {safetyComplete && safetyScore !== null && (
          <div className="text-xs text-gray-500 mb-2">🛡️ Safety: {safetyScore}/5</div>
        )}

        {/* Hanabi-style warm-up: optional hidden action (information asymmetry mechanic, per-device). */}
        {round === 1 && !asymmetryDone && (
          showHanabi ? (
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
          ) : (
            <div className="glass rounded-xl p-4 mb-6 border-gold/20">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-sm">🃏 Hanabi Warm-Up <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                  <p className="text-xs text-gray-400">Cooperative recall warm-up using information asymmetry. Per-device by design.</p>
                </div>
                <button onClick={() => setShowHanabi(true)} className="px-3 py-2 rounded-lg border border-gold text-gold text-sm font-bold hover:bg-gold/10">Start hidden action</button>
              </div>
            </div>
          )
        )}

        <SpacedRetrieval
          sprintNumber={ceremony?.sprint?.number ?? 1}
          done={flow.recallDone}
          onComplete={(answer) => { void answer; void emitFlow({ e: "recall" }) }}
        />

        <AIFacilitator entries={aiEntries} round={round} totalRounds={totalRounds} />

        {round === 1 && prevCeremony && prevActions.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <h3 className="font-bold mb-1">📋 Last ceremony&apos;s commitments ({openPrevActions.length} open)</h3>
            <p className="text-sm text-gray-400 mb-3">Review first — check off what got done.</p>
            <div className="space-y-2">
              {prevActions.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark/50">
                  {a.status === "completed"
                    ? <button onClick={() => undoCompleteAction(a, ceremony.teamId)} className="text-teal font-bold hover:text-gold" title="Undo (mark as not done)">✓</button>
                    : <button onClick={() => completeAction(a, ceremony.teamId)} className="w-5 h-5 rounded border border-gray-500 hover:border-gold shrink-0" title="Mark done" />}
                  <span className={a.status === "completed" ? "line-through text-gray-500" : ""}>{a.title}</span>
                  {a.status === "completed" && <span className="ml-auto text-xs text-gray-500">click ✓ to undo</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-l-4 border-teal pl-4 mb-6"><p className="text-lg text-gray-100">{currentRound.prompt}</p></div>

        {/* Team reflection: the first person to finish it opens it for everyone. */}
        {round > 1 && !reflectionDone.has(round) && (
          <ReflectionPhase
            prompts={reflectionPrompts}
            round={round}
            onComplete={() => { void emitFlow({ e: "reflect", r: round }) }}
          />
        )}

        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="font-bold mb-3">Add Entry</h3>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded bg-dark border border-gray-600 text-white mb-3">{mode.categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={activeHint || "Share your thoughts..."} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 h-24 resize-none" />
          <label className="flex items-center gap-2 mb-2 text-sm text-gray-400"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post anonymously (recommended)</label>
          {!anonymous && (
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Display name or alias (optional)"
              className="w-full p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 text-sm"
            />
          )}
          <button onClick={addComment} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Post Entry</button>
        </div>

        {isBoss && bossFeed.length > 0 && (
          <BossArena bosses={bossFeed} onAttack={(id) => toggleReaction(id, ATTACK_EMOJI)} />
        )}

        {ceremony?.gameMode === "SAILBOAT" && (
          <SailboatSea
            wind={sailCounts.wind}
            anchor={sailCounts.anchor}
            rocks={sailCounts.rocks}
            step={boardStep}
            islandLabel={sailCounts.island}
          />
        )}

        <div className="space-y-6">
          <PeerRecognition teamId={ceremony?.teamId} ceremonyId={params.id} />
          {detectiveBoard && detectiveBoard.shown.length > 0 && (
            <div className="glass rounded-xl p-4">
              <p className="font-bold mb-2">🔎 Case board <span className="text-xs font-normal text-gray-500">conviction needs {detectiveBoard.need} votes</span></p>
              {detectiveBoard.shown.map((r, i) => (
                <div key={r.id} className="flex justify-between text-sm py-1 gap-2">
                  <span className="truncate">{i === 0 && r.accusations >= detectiveBoard.need ? "👑 " : ""}{r.content}</span>
                  <span className="text-gold font-bold shrink-0">{r.accusations} ⚖️</span>
                </div>
              ))}
            </div>
          )}
          {matched.map(({ cat, items }) => {
            if (items.length === 0) return null
            return <div key={cat.name}><h3 className="text-lg font-bold mb-1">{cat.name}</h3><p className="text-xs text-gray-500 mb-3">{cat.hint}</p><div className="space-y-3">{items.map(commentCard)}</div></div>
          })}
          {others.length > 0 && <div><h3 className="text-lg font-bold mb-3">Other</h3><div className="space-y-3">{others.map(commentCard)}</div></div>}
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={advanceTeam} className="p-3 bg-teal text-white font-bold rounded-lg">{advanceLabel}</button>
          <FinishButton finishing={finishing} onFinish={finishCeremony} />
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

function FinishButton({ finishing, onFinish }: { finishing: boolean; onFinish: () => void }) {
  return (
    <button onClick={onFinish} disabled={finishing} className="flex-1 p-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 disabled:opacity-50">
      {finishing ? "Finishing..." : "Lock it in — Finish + Share"}
    </button>
  )
}