"use client"
import { Suspense, useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { MODE_CONFIG } from "@/constants"
import { progressToNext, actionXp } from "@/lib/xp"

async function awardBadge(supabase: any, teamId: string, name: string, description: string) {
  const { data } = await supabase.from("Badge").select("id").eq("teamId", teamId).eq("name", name).limit(1)
  if (!data || data.length === 0) {
    await supabase.from("Badge").insert({ name, description, teamId })
  }
}

function DashboardInner() {
  const [team, setTeam] = useState<any>(null)
  const [ceremonies, setCeremonies] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [activeSprint, setActiveSprint] = useState<any>(null)
  const [sprintQuests, setSprintQuests] = useState<any[]>([])
  const [recentComments, setRecentComments] = useState<any[]>([])
  const [qTitle, setQTitle] = useState("")
  const [qDesc, setQDesc] = useState("")
  const [qXp, setQxp] = useState("300")
  const [savingQuest, setSavingQuest] = useState(false)
  const [pulses, setPulses] = useState<any[]>([])
  const [pAuthor, setPAuthor] = useState("")
  const [pYesterday, setPYesterday] = useState("")
  const [pToday, setPToday] = useState("")
  const [pBlockers, setPBlockers] = useState("")
  const [savingPulse, setSavingPulse] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get("team")

  useEffect(() => {
    if (!teamId) { setLoading(false); return }
    const supabase = getSupabase()
    const fetchData = async () => {
      try {
        const { data: t, error: te } = await supabase.from("Team").select("*").eq("id", teamId).single()
        if (te || !t) { setError("Team not found."); return }
        setTeam(t)
        const { data: c } = await supabase.from("Ceremony").select("*").eq("teamId", teamId).order("startedAt", { ascending: false })
        if (c) {
          setCeremonies(c)
          const ids = c.map((x: any) => x.id)
          if (ids.length > 0) {
            const { data: a } = await supabase.from("Action").select("*").in("ceremonyId", ids).order("createdAt", { ascending: false })
            if (a) setActions(a)
            const recentIds = c.slice(0, 5).map((x: any) => x.id)
            const { data: rc } = await supabase.from("Comment").select("category").in("ceremonyId", recentIds)
            if (rc) setRecentComments(rc)
          }
        }
        const { data: b } = await supabase.from("Badge").select("*").eq("teamId", teamId).order("earnedAt", { ascending: false })
        if (b) setBadges(b)
        const { data: sp } = await supabase.from("Sprint").select("*").eq("teamId", teamId).eq("status", "active").order("number", { ascending: false }).limit(1).single()
        if (sp) {
          setActiveSprint(sp)
          const { data: sq } = await supabase.from("Quest").select("*").eq("sprintId", sp.id).order("createdAt")
          if (sq) setSprintQuests(sq)
          const { data: pu } = await supabase.from("DailyPulse").select("*").eq("sprintId", sp.id).order("createdAt", { ascending: false }).limit(50)
          if (pu) setPulses(pu)
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load team.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teamId])

  const startCeremony = async (gameMode: string, type = "retro") => {
    if (!teamId) return
    setStarting(gameMode)
    setError("")
    try {
      const supabase = getSupabase()
      // get-or-create an active sprint for this team (Ceremony requires sprintId)
      let sprintId: string | null = null
      const { data: existing } = await supabase.from("Sprint").select("id").eq("teamId", teamId).eq("status", "active").order("number", { ascending: false }).limit(1).single()
      if (existing) {
        sprintId = existing.id
      } else {
        const { data: maxSprint } = await supabase.from("Sprint").select("number").eq("teamId", teamId).order("number", { ascending: false }).limit(1).single()
        const nextNumber = (maxSprint?.number ?? 0) + 1
        const { data: created, error: se } = await supabase
          .from("Sprint")
          .insert({ number: nextNumber, theme: `Sprint ${nextNumber}`, teamId, status: "active" })
          .select()
          .single()
        if (se || !created) { setError(se?.message ?? "Could not create sprint."); return }
        sprintId = created.id
      }
      const { data, error: ce } = await supabase
        .from("Ceremony")
        .insert({ type, gameMode, teamId, sprintId, status: "active" })
        .select()
        .single()
      if (ce || !data) { setError(ce?.message ?? "Could not start ceremony."); return }
      router.push(type === "review" ? `/review/${data.id}` : `/retro/${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Could not start ceremony.")
    } finally {
      setStarting(null)
    }
  }

  const completeAction = async (action: any) => {
    if (!teamId || completing) return
    setCompleting(action.id)
    try {
      const supabase = getSupabase()
      await supabase.from("Action").update({ status: "completed", completedAt: new Date().toISOString() }).eq("id", action.id)
      const { data: t } = await supabase.from("Team").select("xp").eq("id", teamId).single()
      const gain = actionXp(action.xpValue)
      if (t) {
        await supabase.from("Team").update({ xp: (t.xp ?? 0) + gain }).eq("id", teamId)
        setTeam({ ...team, xp: (t.xp ?? 0) + gain })
      }
      await awardBadge(supabase, teamId, "Closer", "Completed your first action item")
      setActions(prev => prev.map(a => (a.id === action.id ? { ...a, status: "completed" } : a)))
      const { data: b } = await supabase.from("Badge").select("*").eq("teamId", teamId).order("earnedAt", { ascending: false })
      if (b) setBadges(b)
    } finally {
      setCompleting(null)
    }
  }

  const createQuest = async () => {
    if (!teamId || !activeSprint || !qTitle.trim()) return
    setSavingQuest(true)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("Quest").insert({
        title: qTitle.trim(),
        description: qDesc.trim() || "Sprint quest",
        xpValue: Math.max(10, parseInt(qXp, 10) || 300),
        sprintId: activeSprint.id,
      }).select().single()
      if (!error && data) { setSprintQuests(prev => [...prev, data]); setQTitle(""); setQDesc(""); setQxp("300") }
      else if (error) setError(error.message)
    } finally {
      setSavingQuest(false)
    }
  }

  const completeQuest = async (quest: any) => {
    if (!teamId || completing) return
    setCompleting(quest.id)
    try {
      const supabase = getSupabase()
      await supabase.from("Quest").update({ status: "completed", completedAt: new Date().toISOString() }).eq("id", quest.id)
      const { data: t } = await supabase.from("Team").select("xp").eq("id", teamId).single()
      const gain = quest.xpValue ?? 300
      if (t) {
        await supabase.from("Team").update({ xp: (t.xp ?? 0) + gain }).eq("id", teamId)
        setTeam({ ...team, xp: (t.xp ?? 0) + gain })
      }
      await awardBadge(supabase, teamId, "Quest Crusher", "Completed your first quest")
      setSprintQuests(prev => prev.map(q => (q.id === quest.id ? { ...q, status: "completed" } : q)))
    } finally {
      setCompleting(null)
    }
  }

  const gameMasterTips = () => {
    const tips: string[] = []
    if (ceremonies.length === 0) return ["Run your first retro — Sailboat is a great warm-up. The team will get it in minutes."]
    const open = actions.filter(a => a.status !== "completed").length
    const used = new Set(ceremonies.map((c: any) => c.gameMode))
    const unused = Object.keys(MODE_CONFIG).filter(k => !used.has(k))
    if (open >= 5) tips.push(`You have ${open} open actions piling up — run a 🔥 Boss Battle to fight the biggest one first.`)
    else if (unused.length > 0) tips.push(`Try a fresh format next: ${(MODE_CONFIG as any)[unused[0]]?.name ?? unused[0]} — variety keeps retros sharp.`)
    if (recentComments.length > 0) {
      const counts: Record<string, number> = {}
      recentComments.forEach((c: any) => { counts[c.category] = (counts[c.category] ?? 0) + 1 })
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      if (top && top[1] >= 3) tips.push(`Recurring theme: "${top[0]}" came up ${top[1]} times recently — worth a dedicated action item.`)
    }
    if (actions.length > 0) {
      const rate = Math.round((actions.filter(a => a.status === "completed").length / actions.length) * 100)
      if (rate < 50) tips.push(`Action completion is at ${rate}% — consider fewer, smaller commitments per retro.`)
      else if (rate === 100 && actions.length >= 3) tips.push(`Flawless ${rate}% action completion — this team delivers. Protect the streak. 🔥`)
    }
    const times = ceremonies.map((c: any) => new Date(c.startedAt).getTime()).filter(Boolean).sort((a: number, b: number) => b - a)
    if (times.length > 0) {
      const days = Math.floor((Date.now() - times[0]) / 86400000)
      if (days >= 14) tips.push(`It's been ${days} days since your last ceremony — momentum fades. Schedule the next one.`)
    }
    return tips.slice(0, 3)
  }

  const submitPulse = async () => {
    if (!teamId || !activeSprint || !pAuthor.trim() || !pToday.trim()) return
    const today = new Date().toDateString()
    if (pulses.some(p => p.author.toLowerCase() === pAuthor.trim().toLowerCase() && new Date(p.createdAt).toDateString() === today)) {
      setError("You already checked in today — see you tomorrow! ☀️")
      return
    }
    setSavingPulse(true)
    try {
      const supabase = getSupabase()
      const { data, error: e } = await supabase.from("DailyPulse").insert({
        sprintId: activeSprint.id,
        author: pAuthor.trim(),
        yesterday: pYesterday.trim() || "—",
        today: pToday.trim(),
        blockers: pBlockers.trim() || "None 🎉",
      }).select().single()
      if (e) { setError(e.message); return }
      if (data) {
        setPulses(prev => [data, ...prev])
        const { data: t } = await supabase.from("Team").select("xp").eq("id", teamId).single()
        if (t) {
          await supabase.from("Team").update({ xp: (t.xp ?? 0) + 10 }).eq("id", teamId)
          setTeam({ ...team, xp: (t.xp ?? 0) + 10 })
        }
        setPYesterday(""); setPToday(""); setPBlockers("")
      }
    } finally {
      setSavingPulse(false)
    }
  }

  const ceremonyHref = (c: any) => c.type === "review" ? `/review/${c.id}` : c.type === "planning" ? `/planning/${c.id}` : `/retro/${c.id}`
  const ceremonyName = (c: any) => c.type === "review" ? "📊 Sprint Review" : c.type === "planning" ? "🃏 Planning Poker" : ((MODE_CONFIG as any)[c.gameMode]?.name ?? c.gameMode)

  const copyCode = async () => {
    const code = team?.joinCode ?? ""
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="text-center p-20 text-gray-400">Loading...</div>
  if (!teamId) return <div className="text-center p-20 text-gray-400">No team selected. <a href="/" className="text-teal underline">Go home</a></div>
  if (!team) return <div className="text-center p-20 text-gray-400">{error || "Team not found."} <a href="/" className="text-teal underline">Go home</a></div>

  const level = team.level ?? 1
  const xp = team.xp ?? 0
  const progress = progressToNext(xp)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <a href="/" className="text-sm text-gray-400 hover:text-teal transition">← Home</a>
        {teamId && <a href={`/history?team=${teamId}`} className="ml-4 text-sm text-gray-400 hover:text-teal transition">📜 Team history</a>}
        <div className="flex items-center gap-6 mb-6 mt-2">
          <div className="text-6xl">{team.mascot}</div>
          <div>
            <h1 className="text-4xl font-bold text-gradient">{team.name}</h1>
            <div className="flex gap-2 mt-1 flex-wrap items-center">
              <span className="bg-gold/20 text-gold px-4 py-1 rounded-full font-bold">Level {level}</span>
              {(team.streak ?? 0) > 0 && <span className="bg-teal/20 text-teal px-4 py-1 rounded-full font-bold">🔥 {team.streak}-sprint streak</span>}
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4 mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2"><span>Team XP: {xp}</span><span>{progress}% to Level {level + 1}</span></div>
          <div className="h-3 rounded-full bg-dark border border-gray-700"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-xs text-gray-500">Invite code:</span>
            <span className="font-mono text-2xl tracking-widest text-teal font-bold select-all">{team.joinCode ?? "—"}</span>
            <button onClick={copyCode} className="text-sm px-3 py-1 rounded-lg border border-gray-600 hover:border-gold text-gray-300">{copied ? "Copied! ✓" : "Copy"}</button>
          </div>
        </div>
        {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
        {ceremonies.length === 0 && (
          <div className="glass rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-3">🧭 Your first quest in 3 steps</h2>
            <ol className="space-y-2 text-gray-300">
              <li><span className="font-bold text-gold">1.</span> Invite your team — share code <span className="font-mono text-teal font-bold">{team.joinCode}</span> (they join here, no account needed)</li>
              <li><span className="font-bold text-gold">2.</span> Pick a game mode below and start your first ceremony</li>
              <li><span className="font-bold text-gold">3.</span> Press Finish at the end to earn Team XP 🎉</li>
            </ol>
          </div>
        )}
        {(() => {
          const tips = gameMasterTips()
          if (tips.length === 0) return null
          return (
            <div className="glass rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-1">🧠 Game Master</h2>
              <p className="text-xs text-gray-500 mb-3">Rule-based insights from your team data (AI facilitation comes later).</p>
              <ul className="space-y-2 text-gray-300">{tips.map((t, i) => <li key={i}>• {t}</li>)}</ul>
            </div>
          )
        })()}
        <h2 className="text-2xl font-bold mb-4">🎮 Start a Ceremony</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {Object.entries(MODE_CONFIG).map(([key, mode]) => (
            <button key={key} onClick={() => startCeremony(key)} disabled={starting !== null} className="glass rounded-xl p-6 text-left hover:border-gold transition cursor-pointer disabled:opacity-50">
              <div className="text-3xl mb-2">{mode.name.split(" ")[0]}</div>
              <div className="text-gray-200 font-bold">{starting === key ? "Starting..." : mode.name}</div>
              <div className="text-sm text-gray-400 mt-1">{mode.desc}</div>
            </button>
          ))}
          <button onClick={() => startCeremony("REVIEW", "review")} disabled={starting !== null} className="glass rounded-xl p-6 text-left hover:border-gold transition cursor-pointer disabled:opacity-50 border-dashed">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-gray-200 font-bold">{starting === "REVIEW" ? "Starting..." : "📊 Sprint Review"}</div>
            <div className="text-sm text-gray-400 mt-1">Demo the increment, quiz stakeholders, gather feedback</div>
          </button>
          <button onClick={() => startCeremony("PLANNING", "planning")} disabled={starting !== null} className="glass rounded-xl p-6 text-left hover:border-gold transition cursor-pointer disabled:opacity-50 border-dashed">
            <div className="text-3xl mb-2">🃏</div>
            <div className="text-gray-200 font-bold">{starting === "PLANNING" ? "Starting..." : "🃏 Planning Poker"}</div>
            <div className="text-sm text-gray-400 mt-1">Estimate stories together, reveal at the same time</div>
          </button>
        </div>
        {badges.length > 0 && (
          <section className="mb-8"><h2 className="text-xl font-bold mb-3">🏅 Badges</h2>
            <div className="flex gap-3 flex-wrap">{badges.map((b: any) => <div key={b.id} title={b.description} className="glass rounded-xl px-4 py-2 text-sm"><span className="font-bold">{b.name}</span> <span className="text-gray-400">· {b.description}</span></div>)}
            </div>
          </section>
        )}
        {(() => {
          const open = actions.filter(a => a.status !== "completed")
          const done = actions.filter(a => a.status === "completed")
          if (actions.length === 0) return null
          return (
            <section className="mb-12"><h2 className="text-2xl font-bold mb-4">⚔️ Action Items ({open.length} open)</h2>
              <p className="text-sm text-gray-400 mb-3">Commitments from your retros. Completing one earns its XP immediately.</p>
              <div className="space-y-3">
                {open.map((a: any) => (
                  <div key={a.id} className="glass rounded-xl p-4 flex items-center gap-3">
                    <button onClick={() => completeAction(a)} disabled={completing !== null} className="w-6 h-6 rounded border border-gray-500 hover:border-gold shrink-0 disabled:opacity-50" title="Mark done">{completing === a.id ? "..." : ""}</button>
                    <div><div className="font-bold">{a.title}</div><div className="text-xs text-gray-500">{a.owner}{a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString()}` : ""}</div></div>
                    <span className="ml-auto text-gold font-bold shrink-0">+{a.xpValue ?? 50} XP</span>
                  </div>
                ))}
                {done.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="rounded-xl p-4 flex items-center gap-3 border border-gray-800 opacity-60">
                    <span className="text-teal font-bold">✓</span>
                    <div><div className="line-through text-gray-400">{a.title}</div><div className="text-xs text-gray-600">{a.owner}</div></div>
                  </div>
                ))}
              </div>
            </section>
          )
        })()}
        {activeSprint && (
          <section className="mb-12"><h2 className="text-2xl font-bold mb-1">🎯 Sprint {activeSprint.number} Quests</h2>
            <p className="text-sm text-gray-400 mb-3">Big team commitments for this sprint. Finish one to claim its XP.</p>
            <div className="space-y-3 mb-4">
              {sprintQuests.filter(q => q.status !== "completed").map((q: any) => (
                <div key={q.id} className="glass rounded-xl p-4 flex items-center gap-3">
                  <button onClick={() => completeQuest(q)} disabled={completing !== null} className="w-6 h-6 rounded border border-gray-500 hover:border-gold shrink-0 disabled:opacity-50" title="Complete quest" />
                  <div><div className="font-bold">{q.title}</div><div className="text-xs text-gray-500">{q.description}</div></div>
                  <span className="ml-auto text-gold font-bold shrink-0">+{q.xpValue ?? 300} XP</span>
                </div>
              ))}
              {sprintQuests.filter(q => q.status === "completed").map((q: any) => (
                <div key={q.id} className="rounded-xl p-4 flex items-center gap-3 border border-gray-800 opacity-60">
                  <span className="text-teal font-bold">✓</span>
                  <div className="line-through text-gray-400">{q.title}</div>
                </div>
              ))}
              {sprintQuests.length === 0 && <p className="text-gray-500 text-sm">No quests yet — plan the first one below.</p>}
            </div>
            <div className="glass rounded-xl p-4 flex gap-2 flex-wrap">
              <input type="text" placeholder="Quest title (e.g. Zero flaky tests)" value={qTitle} onChange={e => setQTitle(e.target.value)} className="flex-1 min-w-[200px] p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
              <input type="text" placeholder="Description" value={qDesc} onChange={e => setQDesc(e.target.value)} className="flex-1 min-w-[200px] p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
              <input type="number" min="10" value={qXp} onChange={e => setQxp(e.target.value)} className="w-24 p-2 rounded-lg bg-dark border border-gray-600 text-white text-sm" title="XP value" />
              <button onClick={createQuest} disabled={savingQuest || !qTitle.trim()} className="px-4 py-2 bg-gold text-black font-bold rounded-lg text-sm hover:bg-yellow-400 disabled:opacity-50">{savingQuest ? "..." : "+ Add quest"}</button>
            </div>
          </section>
        )}
        {activeSprint && (
          <section className="mb-12"><h2 className="text-2xl font-bold mb-1">☀️ Daily Pulse</h2>
            <p className="text-sm text-gray-400 mb-3">Async standup for sprint {activeSprint.number}. Check in once a day, earn +10 XP.</p>
            <div className="glass rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input type="text" placeholder="Your name" value={pAuthor} onChange={e => setPAuthor(e.target.value)} className="p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
              <input type="text" placeholder="Blockers? (or None 🎉)" value={pBlockers} onChange={e => setPBlockers(e.target.value)} className="p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
              <input type="text" placeholder="Yesterday I…" value={pYesterday} onChange={e => setPYesterday(e.target.value)} className="p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
              <input type="text" placeholder="Today I will…" value={pToday} onChange={e => setPToday(e.target.value)} className="p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
              <button onClick={submitPulse} disabled={savingPulse || !pAuthor.trim() || !pToday.trim()} className="md:col-span-2 p-2 bg-teal text-white font-bold rounded-lg text-sm disabled:opacity-50">{savingPulse ? "Checking in..." : "Check in +10 XP"}</button>
            </div>
            <div className="space-y-2">
              {pulses.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).map((p: any) => (
                <div key={p.id} className="glass rounded-xl p-3 text-sm">
                  <span className="font-bold">{p.author}</span>
                  <span className="text-gray-400"> · ✅ {p.yesterday} → 🎯 {p.today}</span>
                  {p.blockers && !p.blockers.startsWith("None") && <span className="text-red-300"> · 🚧 {p.blockers}</span>}
                </div>
              ))}
              {pulses.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length === 0 && <p className="text-gray-500 text-sm">No check-ins today yet — be the first.</p>}
            </div>
          </section>
        )}
        <section className="mb-12"><h2 className="text-2xl font-bold mb-4">📋 Past Ceremonies</h2>
          <div className="space-y-4">{ceremonies.length === 0 && <p className="text-gray-400">No ceremonies yet — start your first mission above!</p>}
            {ceremonies.map((c: any) => <a key={c.id} href={ceremonyHref(c)} className="glass rounded-xl p-4 flex justify-between items-center hover:border-gold transition block"><span className="font-bold">{ceremonyName(c)}</span><span className="text-gray-400">{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : ""}</span></a>)}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-center p-20 text-gray-400">Loading...</div>}>
      <DashboardInner />
    </Suspense>
  )
}
