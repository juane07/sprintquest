"use client"
import { Suspense, useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useSearchParams } from "next/navigation"
import { MODE_CONFIG } from "@/constants"
import Navbar from "@/components/Navbar"

function HistoryInner() {
  const [team, setTeam] = useState<any>(null)
  const [ceremonies, setCeremonies] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [quests, setQuests] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [entryCount, setEntryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const teamId = searchParams.get("team")

  useEffect(() => {
    if (!teamId) { setLoading(false); return }
    const supabase = getSupabase()
    const load = async () => {
      try {
        const { data: t } = await supabase.from("Team").select("*").eq("id", teamId).single()
        if (t) setTeam(t)
        const { data: c } = await supabase.from("Ceremony").select("*").eq("teamId", teamId).order("startedAt", { ascending: false })
        const list = c ?? []
        setCeremonies(list)
        if (list.length > 0) {
          const ids = list.map((x: any) => x.id)
          const { data: a } = await supabase.from("Action").select("id,status").in("ceremonyId", ids)
          if (a) setActions(a)
          const { data: cm } = await supabase.from("Comment").select("id").in("ceremonyId", ids)
          if (cm) setEntryCount(cm.length)
        }
        const { data: sprints } = await supabase.from("Sprint").select("id").eq("teamId", teamId)
        if (sprints && sprints.length > 0) {
          const { data: q } = await supabase.from("Quest").select("id,status").in("sprintId", sprints.map((s: any) => s.id))
          if (q) setQuests(q)
        }
        const { data: b } = await supabase.from("Badge").select("*").eq("teamId", teamId).order("earnedAt")
        if (b) setBadges(b)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [teamId])

  if (loading) return <div className="text-center p-20 text-gray-400">Loading...</div>
  if (!teamId) return <div className="text-center p-20 text-gray-400">No team selected. <a href="/" className="text-teal underline">Go home</a></div>
  if (!team) return <div className="text-center p-20 text-gray-400">Team not found. <a href="/" className="text-teal underline">Go home</a></div>

  const doneActions = actions.filter(a => a.status === "completed").length
  const doneQuests = quests.filter(q => q.status === "completed").length
  const completion = actions.length > 0 ? Math.round((doneActions / actions.length) * 100) : 100

  const stats = [
    { label: "Ceremonies", value: ceremonies.length, emoji: "🎮" },
    { label: "Entries shared", value: entryCount, emoji: "💬" },
    { label: "Actions done", value: `${doneActions}/${actions.length}`, emoji: "⚔️" },
    { label: "Completion rate", value: `${completion}%`, emoji: "📈" },
    { label: "Quests done", value: `${doneQuests}/${quests.length}`, emoji: "🎯" },
    { label: "Best streak", value: `🔥 ${team.streak ?? 0}`, emoji: "" },
  ]

  return (
    <>
      <Navbar team={team ? { id: team.id, name: team.name, mascot: team.mascot } : null} />
      <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 mb-4 text-sm">
          <a href="/" className="text-gray-400 hover:text-teal transition">← Home</a>
          <a href={`/dashboard?team=${teamId}`} className="text-gray-400 hover:text-teal transition">← Team dashboard</a>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="text-5xl">{team.mascot}</div>
          <div><h1 className="text-3xl font-bold text-gradient">{team.name} — History</h1><p className="text-gray-400">Level {team.level ?? 1} · {team.xp ?? 0} Team XP</p></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {stats.map(s => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl">{s.emoji}</div>
              <div className="text-2xl font-bold text-gold">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
        <section className="mb-10"><h2 className="text-2xl font-bold mb-4">🎮 Ceremonies</h2>
          <div className="space-y-3">
            {ceremonies.length === 0 && <p className="text-gray-400">No ceremonies yet.</p>}
            {ceremonies.map((c: any) => (
              <a key={c.id} href={`/retro/${c.id}`} className="glass rounded-xl p-4 flex justify-between items-center hover:border-gold transition block">
                <span className="font-bold">{((MODE_CONFIG as any)[c.gameMode]?.name ?? c.gameMode)}</span>
                <span className="flex gap-3 items-center text-sm">
                  <span className={c.status === "completed" ? "text-teal" : "text-gold"}>{c.status === "completed" ? "✓ done" : "● live"}</span>
                  <span className="text-gray-400">{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : ""}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
        {badges.length > 0 && (
          <section className="mb-10"><h2 className="text-2xl font-bold mb-4">🏅 Badges</h2>
            <div className="flex gap-3 flex-wrap">{badges.map((b: any) => <div key={b.id} title={b.description} className="glass rounded-xl px-4 py-2 text-sm"><span className="font-bold">{b.name}</span> <span className="text-gray-400">· {new Date(b.earnedAt).toLocaleDateString()}</span></div>)}
            </div>
          </section>
        )}
      </div>
      </main>
    </>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-center p-20 text-gray-400">Loading...</div>}>
      <HistoryInner />
    </Suspense>
  )
}
