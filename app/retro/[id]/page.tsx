"use client"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { GAME_MODES, CATEGORIES } from "@/constants"

export default function RetroPage({ params }: { params: { id: string } }) {
  const [ceremony, setCeremony] = useState<any>(null)
  const [round, setRound] = useState(1)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [category, setCategory] = useState("Positive")
  const [anonymous, setAnonymous] = useState(false)
  const [voting, setVoting] = useState(false)

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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
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
            <div className="flex justify-between mt-8"><button onClick={() => setRound(round + 1)} className="p-3 bg-teal text-white font-bold rounded-lg">Next Round →</button><button onClick={() => alert("End ceremony")} className="p-3 bg-red-600 text-white font-bold rounded-lg">End</button></div>
          </>
        ) : (
          <div className="glass rounded-xl p-8 text-center"><h2 className="text-2xl font-bold mb-6">Cast Your Vote</h2><div className="space-y-4">{CATEGORIES.map(cat => <button key={cat} onClick={() => setVoting(false)} className="w-full glass rounded-xl p-4 hover:border-gold transition">{cat} ({comments.filter((c: any) => c.category === cat).length})</button>)}</div></div>
        )}
      </div>
    </main>
  )
}
