"use client"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const GAME_MODES = { BOSS_BATTLE: "🔥 Boss Battle", SAILBOAT: "🏝️ Sailboat", MISSION_CONTROL: "🚀 Mission Control", DETECTIVE: "🕵️ Detective", TEAM_BATTLE: "⚔️ Team Battle" }

export default function DashboardPage({ params }: { params: { id: string } }) {
  const [team, setTeam] = useState<any>(null)
  const [ceremonies, setCeremonies] = useState<any[]>([])
  const [quests, setQuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabase()
    const fetchData = async () => {
      try {
        const { data: t } = await supabase.from("Team").select("*").eq("id", params.id).single()
        if (t) setTeam(t)
        const { data: c } = await supabase.from("Ceremony").select("*").eq("teamId", params.id).order("createdAt", { ascending: false })
        if (c) setCeremonies(c)
        const { data: q } = await supabase.from("Quest").select("*").eq("sprintId", params.id)
        if (q) setQuests(q)
      } catch (e) {} finally { setLoading(false) }
    }
    fetchData()
  }, [params.id])

  const startCeremony = async (gameMode: string) => {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("Ceremony").insert({ type: "retro", gameMode, teamId: params.id, status: "active" }).select().single()
    if (!error && data) router.push(`/retro/${data.id}`)
  }

  if (loading) return <div className="text-center p-20 text-gray-400">Loading...</div>
  if (!team) return <div className="text-center p-20 text-gray-400">Team not found. <a href="/" className="text-teal">Go home</a></div>

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-6 mb-12">
          <div className="text-6xl">{team.mascot}</div>
          <div><h1 className="text-4xl font-bold text-gradient">{team.name}</h1><span className="bg-gold/20 text-gold px-4 py-1 rounded-full font-bold">Level {team.level}</span></div>
        </div>
        <h2 className="text-2xl font-bold mb-4">🎮 Start a Ceremony</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(GAME_MODES).map(([key, name]) => (
            <button key={key} onClick={() => startCeremony(key)} className="glass rounded-xl p-6 text-left hover:border-gold transition cursor-pointer">
              <div className="text-3xl mb-2">{name.split(" ")[0]}</div><div className="text-gray-300">{name}</div>
            </button>
          ))}
        </div>
        <section className="mb-12"><h2 className="text-2xl font-bold mb-4">📋 Past Ceremonies</h2>
          <div className="space-y-4">{ceremonies.length === 0 && <p className="text-gray-400">No ceremonies yet!</p>}
            {ceremonies.map((c: any) => <a key={c.id} href={`/retro/${c.id}`} className="glass rounded-xl p-4 flex justify-between items-center hover:border-gold transition block"><span className="font-bold">{c.gameMode}</span><span className="text-gray-400">{new Date(c.startedAt).toLocaleDateString()}</span></a>)}
          </div>
        </section>
      </div>
    </main>
  )
}
