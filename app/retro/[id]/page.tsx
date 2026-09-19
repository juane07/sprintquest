"use client"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { GAME_MODES, CATEGORIES } from "@/constants"

export default function RetroPage({ params }: { params: { id: string } }) {
  const [ceremony, setCeremony] = useState<any>(null)
  const [round, setRound] = useState(1)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [category, setCategory] = useState("Positive")
  const [anonymous, setAnonymous] = useState(false)
  const [voting, setVoting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [reward, setReward] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = getSupabase()
    const fetchCeremony = async () => { const { data } = await supabase.from("Ceremony").select("*").eq("id", params.id).single(); if (data) setCeremony(data) }
    const fetchComments = async () => { const { data } = await supabase.from("Comment").select("*").eq("ceremonyId", params.id).order("createdAt"); if (data) setComments(data) }
    const channel = supabase.channel(`ceremony:${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` }, (payload: any) => setComments(prev => [...prev, payload.new]))
      .subscribe()
    fetchCeremony()
    fetchComments()
    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  const addComment = async () => {
    if (!newComment.trim()) return
    const supabase = getSupabase()
    const { data, error } = await supabase.from("Comment").insert({ ceremonyId: params.id, content: newComment, author: "User", anonymous, category }).select().single()
    if (!error && data) { setComments(prev => [...prev, data]); setNewComment("") }
  }

  const finishCeremony = async () => {
    if (finishing || ceremony?.status === "completed") return
    setFinishing(true)
    try {
      const supabase = getSupabase()
      const xpEarned = 100 + comments.length * 10
      await supabase.from("Ceremony").update({ status: "completed", endedAt: new Date().toISOString() }).eq("id", params.id)
      const { data: t } = await supabase.from("Team").select("xp").eq("id", ceremony.teamId).single()
      if (t) await supabase.from("Team").update({ xp: (t.xp ?? 0) + xpEarned }).eq("id", ceremony.teamId)
      setReward(xpEarned)
    } catch (e) {
      alert("Could not finish the ceremony. Try again.")
    } finally {
      setFinishing(false)
    }
  }

  if (reward !== null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Quest Complete!</h1>
          <p className="text-gray-400 mb-4">Your team earned</p>
          <div className="text-5xl font-bold text-gold mb-4">+{reward} XP</div>
          <p className="text-sm text-gray-400 mb-6">{comments.length} {comments.length === 1 ? "entry" : "entries"} shared · every voice counts, no leaderboards</p>
          <button onClick={() => router.push(`/dashboard?team=${ceremony?.teamId}`)} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Back to team dashboard</button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-4 text-sm">
          <a href="/" className="text-gray-400 hover:text-teal transition">← Home</a>
          {ceremony?.teamId && <a href={`/dashboard?team=${ceremony.teamId}`} className="text-gray-400 hover:text-teal transition">← Team dashboard</a>}
        </div>
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-gradient">{GAME_MODES[ceremony?.gameMode as keyof typeof GAME_MODES]?.name ?? "Retro"}</h1><p className="text-gray-400">Round {round} of 4</p></div>
          <span className="bg-gold/20 text-gold px-4 py-2 rounded-full font-bold">{comments.length} entries</span>
        </div>
        {!voting ? (
          <>
            <div className="glass rounded-xl p-6 mb-6">
              <h3 className="font-bold mb-3">Add Entry</h3>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded bg-dark border border-gray-600 text-white mb-3">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your thoughts..." className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 h-24 resize-none" />
              <label className="flex items-center gap-2 mb-3 text-sm text-gray-400"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Anonymous</label>
              <button onClick={addComment} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Post Entry</button>
            </div>
            <div className="space-y-6">{CATEGORIES.map(cat => {
              const catComments = comments.filter((c: any) => c.category === cat)
              if (catComments.length === 0) return null
              return <div key={cat}><h3 className="text-lg font-bold mb-3">{cat}</h3><div className="space-y-3">{catComments.map((c: any) => <div key={c.id} className="glass rounded-xl p-4"><div className="text-sm text-gray-400 mb-1">{anonymous ? "Anonymous" : c.author}</div><div>{c.content}</div></div>)}</div></div>
            })}</div>
            <div className="flex justify-between mt-8"><button onClick={() => setRound(round + 1)} className="p-3 bg-teal text-white font-bold rounded-lg">Next Round →</button>{ceremony?.status === "completed" ? <span className="p-3 bg-gold/20 text-gold font-bold rounded-lg">Completed ✓</span> : <button onClick={finishCeremony} disabled={finishing} className="p-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50">{finishing ? "Finishing..." : "Finish + Earn XP"}</button>}</div>
          </>
        ) : (
          <div className="glass rounded-xl p-8 text-center"><h2 className="text-2xl font-bold mb-6">Cast Your Vote</h2><div className="space-y-4">{CATEGORIES.map(cat => <button key={cat} onClick={() => setVoting(false)} className="w-full glass rounded-xl p-4 hover:border-gold transition">{cat} ({comments.filter((c: any) => c.category === cat).length})</button>)}</div></div>
        )}
      </div>
    </main>
  )
}
