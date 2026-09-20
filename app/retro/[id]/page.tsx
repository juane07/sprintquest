"use client"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { MODE_CONFIG, DEFAULT_MODE } from "@/constants"
import { ceremonyReward, streakBonus, levelForXp, actionXp } from "@/lib/xp"
import { drawWildCard, WildCard } from "@/lib/wildcards"
import Presence from "@/components/Presence"
import Navbar from "@/components/Navbar"
import ShareRecap from "@/components/ShareRecap"

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
  const [reward, setReward] = useState<number | null>(null)
  const [leveledUp, setLeveledUp] = useState(false)
  const [streakInfo, setStreakInfo] = useState<string | null>(null)
  const [nextQuests, setNextQuests] = useState<any[]>([])
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiActions, setAiActions] = useState<{ title: string; why: string; done?: boolean }[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [wild, setWild] = useState<WildCard | null>(null)
  const [drawnWilds, setDrawnWilds] = useState<string[]>([])
  // action-item creation
  const [actionFor, setActionFor] = useState<any>(null)
  const [actionTitle, setActionTitle] = useState("")
  const [actionOwner, setActionOwner] = useState("")
  const [actionDue, setActionDue] = useState("")
  const [savingAction, setSavingAction] = useState(false)
  // previous ceremony review
  const [prevCeremony, setPrevCeremony] = useState<any>(null)
  const [prevActions, setPrevActions] = useState<any[]>([])
  const [uid] = useState(() => {
    if (typeof window === "undefined") return "server"
    let id = window.localStorage.getItem("sq_uid")
    if (!id) { id = Math.random().toString(36).slice(2); window.localStorage.setItem("sq_uid", id) }
    return id
  })
  const router = useRouter()

  const mode = ceremony ? (MODE_CONFIG[ceremony.gameMode] ?? DEFAULT_MODE) : DEFAULT_MODE
  const totalRounds = mode.rounds.length
  const currentRound = mode.rounds[Math.min(round, totalRounds) - 1]

  useEffect(() => {
    const supabase = getSupabase()
    const fetchCeremony = async () => {
      const { data } = await supabase.from("Ceremony").select("*").eq("id", params.id).single()
      if (data) {
        setCeremony(data)
        const m = MODE_CONFIG[data.gameMode] ?? DEFAULT_MODE
        setCategory(m.categories[0]?.name ?? "")
        // previous completed ceremony for follow-through review
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
        title: actionTitle.trim(),
        description: actionFor.content,
        owner: actionOwner.trim(),
        ceremonyId: params.id,
        dueDate: actionDue ? new Date(actionDue).toISOString() : null,
        xpValue: 100,
      })
      if (!error) { setActionFor(null); setActionTitle(""); setActionOwner(""); setActionDue("") }
      else alert(error.message)
    } finally {
      setSavingAction(false)
    }
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
    if (t) await supabase.from("Team").update({ xp: (t.xp ?? 0) + actionXp(action.xpValue) }).eq("id", teamId)
    await awardBadge(supabase, teamId, "Closer", "Completed your first action item")
    setPrevActions(prev => prev.map(a => (a.id === action.id ? { ...a, status: "completed" } : a)))
  }

  const nextStep = () => {
    if (round < totalRounds) setRound(round + 1)
    else setVoting(true)
  }

  const finishCeremony = async () => {
    if (finishing || ceremony?.status === "completed") return
    setFinishing(true)
    try {
      const supabase = getSupabase()
      const xpEarned = ceremonyReward(comments.length)
      await supabase.from("Ceremony").update({ status: "completed", endedAt: new Date().toISOString() }).eq("id", params.id)
      const { data: t } = await supabase.from("Team").select("xp, streak").eq("id", ceremony.teamId).single()
      const before = t?.xp ?? 0
      // streak: previous ceremony's actions all completed?
      let bonus = 0
      let streakMsg: string | null = null
      if (prevCeremony && prevActions.length > 0) {
        if (prevActions.every(a => a.status === "completed")) {
          const streak = (t?.streak ?? 0) + 1
          bonus = streakBonus(streak)
          await supabase.from("Team").update({ streak }).eq("id", ceremony.teamId)
          streakMsg = `🔥 ${streak}-sprint improvement streak! +${bonus} XP`
          if (streak >= 3) await awardBadge(supabase, ceremony.teamId, "On Fire", "3-sprint improvement streak")
        } else {
          await supabase.from("Team").update({ streak: 0 }).eq("id", ceremony.teamId)
        }
      }
      const after = before + xpEarned + bonus
      await supabase.from("Team").update({ xp: after, level: levelForXp(after) }).eq("id", ceremony.teamId)
      if (levelForXp(after) > levelForXp(before)) setLeveledUp(true)
      setStreakInfo(streakMsg)
      // first-ceremony badge
      const { data: done } = await supabase.from("Ceremony").select("id").eq("teamId", ceremony.teamId).eq("status", "completed")
      if (done && done.length <= 1) await awardBadge(supabase, ceremony.teamId, "First Quest", "Completed your first ceremony")
      // next quests born from this retro
      const { data: nq } = await supabase.from("Action").select("*").eq("ceremonyId", params.id).neq("status", "completed").order("createdAt")
      if (nq) setNextQuests(nq)
      setReward(xpEarned + bonus)
      setAiLoading(true)
      try {
        const res = await fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ceremonyId: params.id }) })
        const sj = await res.json()
        if (res.ok) {
          setAiSummary(sj.summary ?? null)
          setAiActions((sj.actions ?? []).map((a: any) => ({ title: a.title, why: a.why })))
          setCeremony((prev: any) => (prev ? { ...prev, summary: sj.summary ?? prev.summary } : prev))
        }
      } catch { /* AI is optional — XP already awarded */ }
      setAiLoading(false)
    } catch (e) {
      alert("Could not finish the ceremony. Try again.")
    } finally {
      setFinishing(false)
    }
  }

  if (ceremony && (ceremony.type === "review" || ceremony.type === "planning")) {
    const dest = ceremony.type === "review" ? `/review/${params.id}` : `/planning/${params.id}`
    const label = ceremony.type === "review" ? "📊 Sprint Review" : "🃏 Planning Poker"
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{ceremony.type === "review" ? "📊" : "🃏"}</div>
          <h1 className="text-2xl font-bold mb-2">This is a {label}</h1>
          <p className="text-gray-400 mb-6">Different stage, different game — take me there.</p>
          <button onClick={() => router.push(dest)} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Go →</button>
        </div>
      </main>
    )
  }

  const openPrevActions = prevActions.filter(a => a.status !== "completed")
  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, "0")

  if (reward !== null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{mode.victoryEmoji}</div>
          <h1 className="text-3xl font-bold text-gradient mb-2">{mode.victoryTitle}</h1>
          {leveledUp && <div className="bg-gold/20 text-gold font-bold rounded-lg p-2 mb-3">⬆️ LEVEL UP! Your team reached a new level!</div>}
          <p className="text-gray-400 mb-4">Your team earned</p>
          <div className="text-5xl font-bold text-gold mb-4">+{reward} XP</div>
          {streakInfo && <p className="text-sm text-teal mb-3">{streakInfo}</p>}
          <div className="text-left bg-dark/50 rounded-xl p-4 mb-4">
            <p className="font-bold mb-2">🤖 Game Master summary</p>
            {aiLoading && <p className="text-sm text-gray-400">Writing summary…</p>}
            {!aiLoading && aiSummary && <p className="text-sm text-gray-300 mb-3">{aiSummary}</p>}
            {!aiLoading && !aiSummary && <p className="text-sm text-gray-500">No AI summary (quota or connection).</p>}
            {aiActions.map(a => (
              <div key={a.title} className="flex items-center gap-2 py-1">
                {a.done
                  ? <span className="text-teal text-sm font-bold">✓</span>
                  : <button onClick={() => createSuggestedAction(a)} className="text-xs px-2 py-0.5 rounded-full border border-gold text-gold hover:bg-gold hover:text-black">+ action</button>}
                <span className="text-sm">{a.title} <span className="text-gray-500">· {a.why}</span></span>
              </div>
            ))}
          </div>
          {nextQuests.length > 0 && (
            <div className="text-left bg-dark/50 rounded-xl p-4 mb-6">
              <p className="font-bold mb-2">⚔️ Your next quests</p>
              {nextQuests.map(q => <div key={q.id} className="flex justify-between text-sm py-1"><span>{q.title} <span className="text-gray-500">· {q.owner}</span></span><span className="text-gold font-bold">+{q.xpValue ?? 50}</span></div>)}
            </div>
          )}
          <p className="text-sm text-gray-400 mb-6">{comments.length} {comments.length === 1 ? "entry" : "entries"} shared · every voice counts, no leaderboards</p>
          <ShareRecap ceremonyId={params.id} xp={reward} />
          <button onClick={() => router.push(`/dashboard?team=${ceremony?.teamId}`)} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Back to team dashboard</button>
        </div>
      </main>
    )
  }

  if (voting) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-4 mb-6 text-sm">
            <a href="/" className="text-gray-400 hover:text-teal transition">← Home</a>
            {ceremony?.teamId && <a href={`/dashboard?team=${ceremony.teamId}`} className="text-gray-400 hover:text-teal transition">← Team dashboard</a>}
          </div>
          <div className="glass rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🗳️</div>
            <h2 className="text-2xl font-bold mb-2">{mode.voteTitle}</h2>
            <p className="text-sm text-gray-400 mb-6">Discuss out loud, then lock it in — the team decides together. Turn the winners into action items back on the board.</p>
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
                : <button onClick={finishCeremony} disabled={finishing} className="flex-1 p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50">{finishing ? "Finishing..." : "Lock it in — Finish + Earn XP"}</button>}
            </div>
          </div>
        </div>
      </main>
    )
  }

  const matched = mode.categories.map(cat => ({ cat, items: comments.filter((c: any) => c.category === cat.name) }))
  const others = comments.filter((c: any) => !mode.categories.some(cat => cat.name === c.category))
  const activeHint = mode.categories.find(c => c.name === category)?.hint ?? ""

  const commentCard = (c: any) => (
    <div key={c.id} className="glass rounded-xl p-4">
      <div className="text-sm text-gray-400 mb-1">{c.anonymous ? "Anonymous" : c.author}</div>
      <div className="mb-2">{c.content}</div>
      <div className="flex items-center gap-2">
        {REACTION_EMOJIS.map(e => (
          <button key={e} onClick={() => toggleReaction(c.id, e)} className={`text-sm px-2 py-0.5 rounded-full border ${myReaction(c.id, e) ? "border-gold bg-gold/10" : "border-gray-700 hover:border-gray-500"}`}>
            {e} {reactionCount(c.id, e) > 0 && reactionCount(c.id, e)}
          </button>
        ))}
        <button onClick={() => { setActionFor(c); setActionTitle(c.content.slice(0, 80)); setActionOwner(""); setActionDue("") }} className="ml-auto text-xs text-teal hover:text-white">→ Make action</button>
      </div>
    </div>
  )

  return (
    <>
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
            <button onClick={() => { const c = drawWildCard(drawnWilds); setWild(c); setDrawnWilds(prev => [...prev, c.id].slice(-6)) }} className="px-3 py-1 rounded-full text-sm font-bold bg-navy-800 border border-gray-700 text-gray-300 hover:border-gold" title="Draw a surprise event">🎲 Wild</button>
            <span className={`px-4 py-2 rounded-full font-bold ${secondsLeft === 0 ? "bg-red-900/60 text-red-200" : "bg-navy-800 border border-gray-700 text-gray-300"}`}>⏱ {secondsLeft === 0 ? "Time!" : `${mm}:${ss}`}</span>
            <span className="bg-gold/20 text-gold px-4 py-2 rounded-full font-bold">{comments.length} entries</span>
          </div>
        </div>
        {round === 1 && <p className="text-gray-300 mb-4 glass rounded-xl p-4">{mode.intro}</p>}
        {round === 1 && ceremony?.summary && (
          <div className="glass rounded-xl p-4 mb-4">
            <p className="font-bold mb-1 text-sm">🤖 Game Master summary</p>
            <p className="text-sm text-gray-300">{ceremony.summary}</p>
          </div>
        )}
        {round === 1 && prevCeremony && prevActions.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <h3 className="font-bold mb-1">📋 Last ceremony&apos;s commitments ({openPrevActions.length} open)</h3>
            <p className="text-sm text-gray-400 mb-3">Review first — check off what got done. Completed actions earn their XP now.</p>
            <div className="space-y-2">
              {prevActions.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark/50">
                  {a.status === "completed"
                    ? <span className="text-teal font-bold">✓</span>
                    : <button onClick={() => completeAction(a, ceremony.teamId)} className="w-5 h-5 rounded border border-gray-500 hover:border-gold shrink-0" title="Mark done" />}
                  <span className={a.status === "completed" ? "line-through text-gray-500" : ""}>{a.title}</span>
                  <span className="ml-auto text-xs text-gray-500">{a.owner} · +{a.xpValue ?? 50} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="border-l-4 border-teal pl-4 mb-6"><p className="text-lg text-gray-100">{currentRound.prompt}</p></div>
        {wild && (
          <div className="glass rounded-xl p-4 mb-6 border-gold/50">
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold">{wild.title} <span className="text-xs font-normal text-gray-500">wild card</span></p>
              <button onClick={() => setWild(null)} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>
            <p className="text-gray-300">{wild.text}</p>
          </div>
        )}
        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="font-bold mb-3">Add Entry</h3>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded bg-dark border border-gray-600 text-white mb-3">{mode.categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={activeHint || "Share your thoughts..."} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 h-24 resize-none" />
          <label className="flex items-center gap-2 mb-3 text-sm text-gray-400"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Anonymous</label>
          <button onClick={addComment} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Post Entry</button>
        </div>
        <div className="space-y-6">
          {matched.map(({ cat, items }) => {
            if (items.length === 0) return null
            return <div key={cat.name}><h3 className="text-lg font-bold mb-1">{cat.name}</h3><p className="text-xs text-gray-500 mb-3">{cat.hint}</p><div className="space-y-3">{items.map(commentCard)}</div></div>
          })}
          {others.length > 0 && <div><h3 className="text-lg font-bold mb-3">Other</h3><div className="space-y-3">{others.map(commentCard)}</div></div>}
        </div>
        <div className="flex justify-between mt-8">
          <button onClick={nextStep} className="p-3 bg-teal text-white font-bold rounded-lg">{round < totalRounds ? "Next Round →" : "Go to Vote 🗳️"}</button>
          {ceremony?.status === "completed"
            ? <span className="p-3 bg-gold/20 text-gold font-bold rounded-lg">Completed ✓</span>
            : <button onClick={finishCeremony} disabled={finishing} className="p-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50">{finishing ? "Finishing..." : "Finish + Earn XP"}</button>}
        </div>
      </div>
      {actionFor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setActionFor(null)}>
          <div className="glass rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">⚔️ New action item</h3>
            <p className="text-xs text-gray-400 mb-4">From: “{actionFor.content.slice(0, 100)}”</p>
            <div className="space-y-3">
              <input type="text" placeholder="Action title" value={actionTitle} onChange={e => setActionTitle(e.target.value)} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400" />
              <input type="text" placeholder="Owner (who commits?)" value={actionOwner} onChange={e => setActionOwner(e.target.value)} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400" />
              <input type="date" value={actionDue} onChange={e => setActionDue(e.target.value)} className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white" />
              <p className="text-xs text-gray-500">Worth +100 XP when completed. Tracked on the team dashboard.</p>
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
