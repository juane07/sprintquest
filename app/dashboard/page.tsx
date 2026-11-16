"use client"
import { Suspense, useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

import { progressToNext, actionValue, engagementLabel, levelLabel } from "@/lib/xp"
import Navbar from "@/components/Navbar"
import MasteryDeckDisplay from "@/components/MasteryDeckDisplay"
import LegacySprintMap from "@/components/LegacySprintMap"
import { buildDeckFromBadges } from "@/components/mastery-deck"
import { BOARD_CATEGORY, buildSprintMapFromBoardComments } from "@/components/legacy-sprint-map"
import type { SprintMap } from "@/components/legacy-sprint-map"

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
  const [recentComments, setRecentComments] = useState<any[]>([])
  const [sprintMap, setSprintMap] = useState<SprintMap | null>(null)
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
        const { data: sprints } = await supabase.from("Sprint").select("id,number").eq("teamId", teamId)
        let board: any[] = []
        if (c && c.length > 0) {
          const { data: bc } = await supabase.from("Comment").select("id,content,createdAt,ceremonyId").in("ceremonyId", c.map((x: any) => x.id)).eq("category", BOARD_CATEGORY).order("createdAt", { ascending: true })
          if (bc) board = bc
        }
        setSprintMap(buildSprintMapFromBoardComments(teamId, c ?? [], sprints ?? [], board))
      } catch (e: any) {
        setError(e?.message ?? "Failed to load team.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teamId])

  const startCeremony = async () => {
    if (!teamId) return
    setStarting("SAILBOAT")
    setError("")
    try {
      const supabase = getSupabase()
      let sprintId: string | null = null
      const { data: existing } = await supabase.from("Sprint").select("id").eq("teamId", teamId).eq("status", "active").order("number", { ascending: false }).limit(1).single()
      if (existing) { sprintId = existing.id }
      else {
        const { data: maxSprint } = await supabase.from("Sprint").select("number").eq("teamId", teamId).order("number", { ascending: false }).limit(1).single()
        const nextNumber = (maxSprint?.number ?? 0) + 1
        const { data: created, error: se } = await supabase.from("Sprint").insert({ number: nextNumber, theme: `Sprint ${nextNumber}`, teamId, status: "active" }).select().single()
        if (se || !created) { setError(se?.message ?? "Could not create sprint."); return }
        sprintId = created.id
      }
      const { data, error: ce } = await supabase.from("Ceremony").insert({ type: "retro", gameMode: "SAILBOAT", teamId, sprintId, status: "active" }).select().single()
      if (ce || !data) { setError(ce?.message ?? "Could not start ceremony."); return }
      router.push(`/retro/${data.id}`)
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
      const gain = actionValue(action.xpValue)
      if (t) {
        await supabase.from("Team").update({ xp: (t.xp ?? 0) + gain }).eq("id", teamId)
        setTeam({ ...team, xp: (t.xp ?? 0) + gain })
      }
      await awardBadge(supabase, teamId, "Action Completer", "Completed action items consistently")
      setActions(prev => prev.map(a => (a.id === action.id ? { ...a, status: "completed", completedAt: new Date().toISOString() } : a)))
      const { data: b } = await supabase.from("Badge").select("*").eq("teamId", teamId).order("earnedAt", { ascending: false })
      if (b) setBadges(b)
    } finally {
      setCompleting(null)
    }
  }

  const undoCompleteAction = async (action: any) => {
    if (!teamId || completing) return
    setCompleting(action.id)
    try {
      const supabase = getSupabase()
      await supabase.from("Action").update({ status: "pending", completedAt: null }).eq("id", action.id)
      const { data: t } = await supabase.from("Team").select("xp").eq("id", teamId).single()
      const gain = actionValue(action.xpValue)
      if (t) {
        const nextXp = Math.max(0, (t.xp ?? 0) - gain)
        await supabase.from("Team").update({ xp: nextXp }).eq("id", teamId)
        setTeam({ ...team, xp: nextXp })
      }
      setActions(prev => prev.map(a => (a.id === action.id ? { ...a, status: "pending", completedAt: null } : a)))
    } finally {
      setCompleting(null)
    }
  }

  const gameMasterTips = () => {
    const tips: string[] = []
    if ((ceremonies || []).length === 0) return ["Start your first Sailboat retro — your team will get the flow in minutes."]
    const open = (actions || []).filter((a: any) => a && a.status !== "completed").length
    if (open >= 5) tips.push(`You have ${open} open actions — use the next retro to prioritize the most critical one together.`)
    if (recentComments.length > 0) {
      const counts: Record<string, number> = {}
      recentComments.forEach((c: any) => { if (c?.category) counts[c.category] = (counts[c.category] ?? 0) + 1 })
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      if (top && top[1] >= 3) tips.push(`Recurring theme: "${top[0]}" appeared ${top[1]} times — it deserves an action item.`)
    }
    if (tips.length === 0) tips.push("Keep sharing winds, anchors, rocks, and islands — small honest entries build team learning.")
    return tips.slice(0, 2)
  }

  const ceremonyHref = (c: any) => `/retro/${c.id}`
  const ceremonyName = (_c: any) => "🏝️ Sailboat Retro"

  const copyCode = async () => {
    const code = team?.joinCode ?? ""
    if (!code) return
    try { await navigator.clipboard.writeText(code) } catch {
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
    <>
      <Navbar team={team ? { id: team.id, name: team.name, mascot: team.mascot } : null} />
      <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-400 mb-2 flex items-center gap-2 flex-wrap">
          <a href="/" className="hover:text-teal transition">Home</a>
          <span>/</span>
          <span className="text-gray-300">Dashboard</span>
          {teamId && <><span>/</span><a href={`/history?team=${teamId}`} className="hover:text-teal transition">History</a></>}
        </nav>
        <div className="flex items-center gap-6 mb-6 mt-2">
          <div className="text-6xl">{team.mascot}</div>
          <div>
            <h1 className="text-4xl font-bold text-gradient">{team.name}</h1>
            <div className="flex gap-2 mt-1 flex-wrap items-center">
              <span className="bg-gold/20 text-gold px-4 py-1 rounded-full font-bold">{levelLabel(level)}</span>
              {(team.streak ?? 0) > 0 && <span className="bg-teal/20 text-teal px-4 py-1 rounded-full font-bold">🔥 {team.streak}-sprint consistency</span>}
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4 mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2"><span>Engagement level: {engagementLabel(xp)} ({xp})</span><span>{progress}% to next milestone</span></div>
          <div className="h-3 rounded-full bg-dark border border-gray-700"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-xs text-gray-500">Invite code:</span>
            <span className="font-mono text-2xl tracking-widest text-teal font-bold select-all">{team.joinCode ?? "—"}</span>
            <button onClick={copyCode} className="text-sm px-3 py-1 rounded-lg border border-gray-600 hover:border-gold text-gray-300">{copied ? "Copied! ✓" : "Copy"}</button>
          </div>
        </div>
        {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

        {ceremonies.length === 0 && (
          <div className="glass rounded-xl p-6 mb-8 border-gold/30">
            <h2 className="text-xl font-bold mb-1">🚀 Welcome aboard — your first retro in 4 steps</h2>
            <p className="text-sm text-gray-400 mb-4">One mode, one flow. No setup debate — just sail.</p>
            <ol className="grid gap-3 sm:grid-cols-2 text-sm text-gray-300">
              <li className="rounded-lg bg-dark/40 p-3">
                <span className="text-xs font-bold tracking-widest text-gold">STEP 1</span>
                <div className="font-bold mt-1">Invite your team</div>
                <div className="text-gray-400">Share the code <span className="font-mono text-teal font-bold">{team.joinCode}</span> — players join from any phone, no account.</div>
              </li>
              <li className="rounded-lg bg-dark/40 p-3">
                <span className="text-xs font-bold tracking-widest text-gold">STEP 2</span>
                <div className="font-bold mt-1">Start the Sailboat retro</div>
                <div className="text-gray-400">Everyone lands on the same shared board — whoever moves the team token, everyone follows.</div>
              </li>
              <li className="rounded-lg bg-dark/40 p-3">
                <span className="text-xs font-bold tracking-widest text-gold">STEP 3</span>
                <div className="font-bold mt-1">Sail the 4 rounds</div>
                <div className="text-gray-400">🌬️ Wind → ⚓ Anchor → 🪨 Rocks → 🏝️ Island. One idea per entry, anonymous by default.</div>
              </li>
              <li className="rounded-lg bg-dark/40 p-3">
                <span className="text-xs font-bold tracking-widest text-gold">STEP 4</span>
                <div className="font-bold mt-1">Reflect and commit</div>
                <div className="text-gray-400">Finish with guided reflection and action items — they open the next retro automatically.</div>
              </li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">⏱️ The round timer is a gentle guide, not a deadline — it never closes the ceremony for you.</p>
          </div>
        )}
        {(() => {
          const tips = gameMasterTips()
          if (tips.length === 0) return null
          return (
            <div className="glass rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-1">🧠 Game Master</h2>
              <ul className="space-y-2 text-gray-300">{tips.map((t, i) => <li key={i}>• {t}</li>)}</ul>
            </div>
          )
        })()}

        <section className="mb-12" id="ceremonies"><h2 className="text-2xl font-bold mb-4">🎮 Start your retro</h2>
          <div className="glass rounded-xl p-6 mb-8 max-w-2xl">
            <div className="text-4xl mb-3">🏝️</div>
            <h3 className="text-xl font-bold mb-2">Sailboat Retro</h3>
            <p className="text-gray-300 mb-4">Catch the wind, cut the anchors, watch for rocks, and set the course — one simple flow for the whole team.</p>
            <button onClick={startCeremony} disabled={starting !== null} className="btn-primary disabled:opacity-50">
              {starting ? "Starting..." : "Start Sailboat Retro"}
            </button>
          </div>
        </section>
        {(() => {
          const safeActions = (actions || []).filter(Boolean)
          const open = safeActions.filter((a: any) => a.status !== "completed")
          const done = safeActions.filter((a: any) => a.status === "completed")
          if (safeActions.length === 0) return null
          return (
            <section className="mb-12" id="actions"><h2 className="text-2xl font-bold mb-4">⚔️ Action Items ({open.length} open)</h2>
              <p className="text-sm text-gray-400 mb-3">Commitments from your retros. Completing them tracks on your engagement level.</p>
              <div className="space-y-3">
                {open.map((a: any) => (
                  <div key={a.id} className="glass rounded-xl p-4 flex items-center gap-3">
                    <button onClick={() => completeAction(a)} disabled={completing !== null} className="w-6 h-6 rounded border border-gray-500 hover:border-gold shrink-0 disabled:opacity-50" title="Mark done">{completing === a.id ? "..." : ""}</button>
                    <div><div className="font-bold">{a.title}</div><div className="text-xs text-gray-500">{a.owner}{a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</div></div>
                    <span className="ml-auto text-gray-400 font-bold shrink-0">Tracked</span>
                  </div>
                ))}
                {done.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="rounded-xl p-4 flex items-center gap-3 border border-gray-800 opacity-80">
                    <button onClick={() => undoCompleteAction(a)} disabled={completing !== null} className="text-teal font-bold hover:text-gold" title="Undo (mark as not done)">✓</button>
                    <div><div className="line-through text-gray-400">{a.title}</div><div className="text-xs text-gray-600">{a.owner} · click ✓ to undo</div></div>
                  </div>
                ))}
              </div>
            </section>
          )
        })()}
        <details className="mb-8 glass rounded-xl p-4">
          <summary className="cursor-pointer font-bold text-lg">🏅 Mastery & Team Progress <span className="text-sm font-normal text-gray-400">(expand)</span></summary>
          <div className="mt-4">
            {badges.length === 0 ? (
              <div className="glass rounded-xl p-4 text-sm text-gray-400 mb-4">
                No mastery badges yet. Badges signal team mastery (not participation) — they unlock as your team demonstrates learning patterns over time.
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap mb-4">{badges.map((b: any) => <div key={b.id} title={b.description} className="glass rounded-xl px-4 py-2 text-sm"><span className="font-bold">{b.name}</span> <span className="text-gray-400">· {b.description}</span></div>)}
              </div>
            )}
            {teamId && <MasteryDeckDisplay teamId={teamId} initialDeck={buildDeckFromBadges(teamId, badges)} />}
            {sprintMap && <LegacySprintMap map={sprintMap} />}
          </div>
        </details>
        <section className="mb-12"><h2 className="text-2xl font-bold mb-4">📋 Past ceremonies</h2>
          <div className="space-y-4">{ceremonies.length === 0 && <p className="text-gray-400">No ceremonies yet — start the first one above!</p>}
            {(ceremonies || []).filter(Boolean).map((c: any) => {
              const date = c.endedAt || c.startedAt
              const dateLabel = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""
              return (
                <a key={c.id} href={ceremonyHref(c)} className="glass rounded-xl p-4 flex justify-between items-center hover:border-gold transition block gap-2">
                  <div>
                    <span className="font-bold">{ceremonyName(c)}</span>
                    {dateLabel && <span className="ml-2 text-xs text-gray-500">{dateLabel}</span>}
                  </div>
                  {c?.status !== "completed" ? <span className="text-xs text-teal">🟢 live →</span> : <span className="text-xs text-gray-500">Completed ✓</span>}
                </a>
              )
            })}
          </div>
        </section>
      </div>
      </main>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-center p-20 text-gray-400">Loading...</div>}>
      <DashboardInner />
    </Suspense>
  )
}
