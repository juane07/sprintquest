"use client"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { POKER_CARDS, pokerStats, suggestPoints } from "@/lib/poker"
import { levelForXp } from "@/lib/xp"
import Presence from "@/components/Presence"
import Navbar from "@/components/Navbar"

export default function PlanningPage({ params }: { params: { id: string } }) {
  const [ceremony, setCeremony] = useState<any>(null)
  const [stories, setStories] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [newStory, setNewStory] = useState("")
  const [lockPoints, setLockPoints] = useState<Record<string, string>>({})
  const [finishing, setFinishing] = useState(false)
  const [reward, setReward] = useState<number | null>(null)
  const [uid] = useState(() => {
    if (typeof window === "undefined") return "server"
    let id = window.localStorage.getItem("sq_uid")
    if (!id) { id = Math.random().toString(36).slice(2); window.localStorage.setItem("sq_uid", id) }
    return id
  })
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabase()
    const fetchAll = async () => {
      const { data: c } = await supabase.from("Ceremony").select("*").eq("id", params.id).single()
      if (c) setCeremony(c)
      const { data: s } = await supabase.from("PlanningStory").select("*").eq("ceremonyId", params.id).order("createdAt")
      if (s) setStories(s)
      const { data: v } = await supabase.from("Vote").select("*").eq("ceremonyId", params.id)
      if (v) setVotes(v)
    }
    const channel = supabase.channel(`planning:${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "PlanningStory", filter: `ceremonyId=eq.${params.id}` }, (p: any) => setStories(prev => [...prev, p.new]))
      .on("postgres_changes", { event: "*", schema: "public", table: "PlanningStory", filter: `ceremonyId=eq.${params.id}` }, (p: any) => {
        if (p.eventType === "DELETE") setStories(prev => prev.filter(s => s.id !== p.old.id))
        else if (p.new) setStories(prev => prev.map(s => (s.id === p.new.id ? p.new : s)))
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` }, (p: any) => setVotes(prev => [...prev, p.new]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` }, (p: any) => setVotes(prev => prev.filter(v => v.id !== p.old.id)))
      .subscribe()
    fetchAll()
    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  const addStory = async () => {
    if (!newStory.trim()) return
    const supabase = getSupabase()
    const { data } = await supabase.from("PlanningStory").insert({ title: newStory.trim(), ceremonyId: params.id }).select().single()
    if (data) { setStories(prev => [...prev, data]); setNewStory("") }
  }

  const vote = async (storyId: string, card: string) => {
    const supabase = getSupabase()
    const mine = votes.find(v => v.option.startsWith(`${storyId}:`) && v.userId === uid)
    if (mine) await supabase.from("Vote").delete().eq("id", mine.id)
    const { data } = await supabase.from("Vote").insert({ ceremonyId: params.id, option: `${storyId}:${card}`, userId: uid }).select().single()
    if (data) setVotes(prev => [...prev.filter(v => v.id !== mine?.id), data])
  }

  const setStatus = async (story: any, status: string, points?: number | null) => {
    const supabase = getSupabase()
    const patch: any = { status }
    if (points !== undefined) patch.points = points
    await supabase.from("PlanningStory").update(patch).eq("id", story.id)
    setStories(prev => prev.map(s => (s.id === story.id ? { ...s, ...patch } : s)))
  }

  const storyVotes = (storyId: string) => votes.filter(v => v.option.startsWith(`${storyId}:`)).map(v => v.option.split(":")[1])
  const myVote = (storyId: string) => {
    const v = votes.find(x => x.option.startsWith(`${storyId}:`) && x.userId === uid)
    return v ? v.option.split(":")[1] : null
  }

  const finishPlanning = async () => {
    if (finishing || ceremony?.status === "completed") return
    setFinishing(true)
    try {
      const supabase = getSupabase()
      const xpEarned = 100 + stories.length * 20
      await supabase.from("Ceremony").update({ status: "completed", endedAt: new Date().toISOString() }).eq("id", params.id)
      const { data: t } = await supabase.from("Team").select("xp").eq("id", ceremony.teamId).single()
      if (t) await supabase.from("Team").update({ xp: (t.xp ?? 0) + xpEarned, level: levelForXp((t.xp ?? 0) + xpEarned) }).eq("id", ceremony.teamId)
      const { data: b } = await supabase.from("Badge").select("id").eq("teamId", ceremony.teamId).eq("name", "Sharp Estimator").limit(1)
      if (!b || b.length === 0) await supabase.from("Badge").insert({ name: "Sharp Estimator", description: "Estimated your first planning session", teamId: ceremony.teamId })
      setReward(xpEarned)
    } finally {
      setFinishing(false)
    }
  }

  if (reward !== null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🃏</div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Sprint Planned!</h1>
          <div className="text-5xl font-bold text-gold mb-4">+{reward} XP</div>
          <p className="text-sm text-gray-400 mb-6">{stories.filter(s => s.points !== null).length} of {stories.length} stories estimated — no more 3-hour planning meetings</p>
          <button onClick={() => router.push(`/dashboard?team=${ceremony?.teamId}`)} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Back to team dashboard</button>
        </div>
      </main>
    )
  }

  return (
    <>
      <Navbar team={ceremony ? { id: ceremony.teamId } : null} />
      <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-4 text-sm">
          <a href="/" className="text-gray-400 hover:text-teal transition">← Home</a>
          {ceremony?.teamId && <a href={`/dashboard?team=${ceremony.teamId}`} className="text-gray-400 hover:text-teal transition">← Team dashboard</a>}
        </div>
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-gradient">🃏 Planning Poker</h1>
          <div className="flex gap-2"><Presence channel={params.id} /><span className="bg-gold/20 text-gold px-4 py-1 rounded-full font-bold text-sm">{stories.length} stories</span></div>
        </div>
        <p className="text-gray-300 mb-6 glass rounded-xl p-4">Estimate together: pick a card per story, reveal at the same time, discuss outliers, lock it in. Lowest voice in the room counts the most.</p>

        <div className="glass rounded-xl p-4 mb-6 flex gap-2">
          <input type="text" placeholder="New story (e.g. Login with SSO)" value={newStory} onChange={e => setNewStory(e.target.value)} className="flex-1 p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
          <button onClick={addStory} className="px-4 py-2 bg-gold text-black font-bold rounded-lg text-sm hover:bg-yellow-400">+ Add</button>
        </div>

        <div className="space-y-4 mb-6">
          {stories.length === 0 && <p className="text-gray-500 text-sm">No stories yet — add the first one above.</p>}
          {stories.map(story => {
            const vals = storyVotes(story.id)
            const stats = pokerStats(vals)
            const mine = myVote(story.id)
            const suggestion = suggestPoints(vals)
            return (
              <div key={story.id} className="glass rounded-xl p-4">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <span className="font-bold">{story.title}</span>
                  {story.status === "locked" && story.points !== null
                    ? <span className="bg-teal/20 text-teal px-3 py-1 rounded-full font-bold text-sm">{story.points} pts ✓</span>
                    : <span className="text-xs text-gray-500">{vals.length} voted</span>}
                </div>
                {story.status === "voting" && (
                  <>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {POKER_CARDS.map(card => (
                        <button key={card} onClick={() => vote(story.id, card)} className={`w-11 h-14 rounded-lg border font-bold transition ${mine === card ? "border-gold bg-gold/20 text-gold" : "border-gray-600 hover:border-teal"}`}>{card}</button>
                      ))}
                    </div>
                    <button onClick={() => setStatus(story, "revealed")} disabled={vals.length === 0} className="text-xs text-teal hover:text-white disabled:opacity-40">Reveal votes →</button>
                  </>
                )}
                {story.status === "revealed" && (
                  <div className="bg-dark/50 rounded-lg p-3">
                    <div className="flex gap-4 text-sm mb-2 flex-wrap">
                      <span>Votes: <span className="font-mono">{vals.join(", ") || "—"}</span></span>
                      {stats.average !== null && <span>Avg <b>{stats.average.toFixed(1)}</b></span>}
                      {stats.median !== null && <span>Median <b>{stats.median}</b></span>}
                      {stats.consensus && <span className="text-teal font-bold">Consensus! 🎯</span>}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <input type="number" min="0" placeholder={suggestion ?? "Points"} value={lockPoints[story.id] ?? ""} onChange={e => setLockPoints(p => ({ ...p, [story.id]: e.target.value }))} className="w-24 p-2 rounded bg-dark border border-gray-600 text-white text-sm" />
                      <button onClick={() => setStatus(story, "locked", parseInt(lockPoints[story.id] ?? suggestion ?? "0", 10) || 0)} className="px-3 py-2 bg-gold text-black font-bold rounded-lg text-sm hover:bg-yellow-400">Lock in</button>
                      <button onClick={() => setStatus(story, "voting")} className="text-xs text-gray-400 hover:text-white">Revote</button>
                    </div>
                  </div>
                )}
                {story.status === "locked" && (
                  <button onClick={() => setStatus(story, "voting")} className="text-xs text-gray-400 hover:text-white">Reopen voting</button>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end mt-8">
          {ceremony?.status === "completed"
            ? <span className="p-3 bg-gold/20 text-gold font-bold rounded-lg">Completed ✓</span>
            : <button onClick={finishPlanning} disabled={finishing} className="p-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50">{finishing ? "Wrapping..." : "Wrap up + Earn XP"}</button>}
        </div>
      </div>
      </main>
    </>
  )
}
