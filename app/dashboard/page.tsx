"use client"
import { Suspense, useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

const GAME_MODES = { BOSS_BATTLE: "🔥 Boss Battle", SAILBOAT: "🏝️ Sailboat", MISSION_CONTROL: "🚀 Mission Control", DETECTIVE: "🕵️ Detective", TEAM_BATTLE: "⚔️ Team Battle" }

function DashboardInner() {
  const [team, setTeam] = useState<any>(null)
  const [ceremonies, setCeremonies] = useState<any[]>([])
  const [quests, setQuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState("")
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
        if (c) setCeremonies(c)
        const { data: sprints } = await supabase.from("Sprint").select("id").eq("teamId", teamId)
        if (sprints && sprints.length > 0) {
          const { data: q } = await supabase.from("Quest").select("*").in("sprintId", sprints.map((s: any) => s.id))
          if (q) setQuests(q)
        }
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

  if (loading) return <div className="text-center p-20 text-gray-400">Loading...</div>
  if (!teamId) return <div className="text-center p-20 text-gray-400">No team selected. <a href="/" className="text-teal underline">Go home</a></div>
  if (!team) return <div className="text-center p-20 text-gray-400">{error || "Team not found."} <a href="/" className="text-teal underline">Go home</a></div>

  const level = team.level ?? 1
  const xp = team.xp ?? 0
  const xpForNext = 1000
  const progress = Math.min(100, Math.round(((xp % xpForNext) / xpForNext) * 100))

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-6 mb-6">
          <div className="text-6xl">{team.mascot}</div>
          <div>
            <h1 className="text-4xl font-bold text-gradient">{team.name}</h1>
            <span className="bg-gold/20 text-gold px-4 py-1 rounded-full font-bold">Level {level}</span>
          </div>
        </div>
        <div className="glass rounded-xl p-4 mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2"><span>Team XP: {xp}</span><span>{progress}% to Level {level + 1}</span></div>
          <div className="h-3 rounded-full bg-dark border border-gray-700"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="text-xs text-gray-500 mt-2">Share this team code so others can join: <span className="text-teal font-mono select-all">{team.id}</span></p>
        </div>
        {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
        <h2 className="text-2xl font-bold mb-4">🎮 Start a Ceremony</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {Object.entries(GAME_MODES).map(([key, name]) => (
            <button key={key} onClick={() => startCeremony(key)} disabled={starting !== null} className="glass rounded-xl p-6 text-left hover:border-gold transition cursor-pointer disabled:opacity-50">
              <div className="text-3xl mb-2">{name.split(" ")[0]}</div>
              <div className="text-gray-300">{starting === key ? "Starting..." : name}</div>
            </button>
          ))}
        </div>
        <section className="mb-12"><h2 className="text-2xl font-bold mb-4">📋 Past Ceremonies</h2>
          <div className="space-y-4">{ceremonies.length === 0 && <p className="text-gray-400">No ceremonies yet — start your first mission above!</p>}
            {ceremonies.map((c: any) => <a key={c.id} href={`/retro/${c.id}`} className="glass rounded-xl p-4 flex justify-between items-center hover:border-gold transition block"><span className="font-bold">{(GAME_MODES as any)[c.gameMode] ?? c.gameMode}</span><span className="text-gray-400">{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : ""}</span></a>)}
          </div>
        </section>
        {quests.length > 0 && (
          <section className="mb-12"><h2 className="text-2xl font-bold mb-4">⚔️ Active Quests</h2>
            <div className="space-y-3">{quests.map((q: any) => <div key={q.id} className="glass rounded-xl p-4 flex justify-between items-center"><span>{q.title}</span><span className="text-gold font-bold">+{q.xpValue} XP</span></div>)}
            </div>
          </section>
        )}
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
