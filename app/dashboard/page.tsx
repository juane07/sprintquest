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
          }
        }
        const { data: b } = await supabase.from("Badge").select("*").eq("teamId", teamId).order("earnedAt", { ascending: false })
        if (b) setBadges(b)
      } catch (e: any) {
        setError(e?.message ?? "Failed to load team.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teamId])

  const startCeremony = async (gameMode: string) => {
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
        .insert({ type: "retro", gameMode, teamId, sprintId, status: "active" })
        .select()
        .single()
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
        <h2 className="text-2xl font-bold mb-4">🎮 Start a Ceremony</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {Object.entries(MODE_CONFIG).map(([key, mode]) => (
            <button key={key} onClick={() => startCeremony(key)} disabled={starting !== null} className="glass rounded-xl p-6 text-left hover:border-gold transition cursor-pointer disabled:opacity-50">
              <div className="text-3xl mb-2">{mode.name.split(" ")[0]}</div>
              <div className="text-gray-200 font-bold">{starting === key ? "Starting..." : mode.name}</div>
              <div className="text-sm text-gray-400 mt-1">{mode.desc}</div>
            </button>
          ))}
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
        <section className="mb-12"><h2 className="text-2xl font-bold mb-4">📋 Past Ceremonies</h2>
          <div className="space-y-4">{ceremonies.length === 0 && <p className="text-gray-400">No ceremonies yet — start your first mission above!</p>}
            {ceremonies.map((c: any) => <a key={c.id} href={`/retro/${c.id}`} className="glass rounded-xl p-4 flex justify-between items-center hover:border-gold transition block"><span className="font-bold">{(MODE_CONFIG as any)[c.gameMode]?.name ?? c.gameMode}</span><span className="text-gray-400">{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : ""}</span></a>)}
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
