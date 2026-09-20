"use client"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Presence from "@/components/Presence"

const REVIEW_CATS = ["🎤 Demo", "❓ Question", "💬 Feedback"]

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [ceremony, setCeremony] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [newEntry, setNewEntry] = useState("")
  const [entryCat, setEntryCat] = useState("🎤 Demo")
  const [author, setAuthor] = useState("")
  const [qPrompt, setQPrompt] = useState("")
  const [qOptions, setQOptions] = useState("")
  const [qCorrect, setQCorrect] = useState("0")
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
      const { data: cm } = await supabase.from("Comment").select("*").eq("ceremonyId", params.id).order("createdAt")
      if (cm) setComments(cm)
      const { data: q } = await supabase.from("ReviewQuestion").select("*").eq("ceremonyId", params.id).order("createdAt")
      if (q) setQuestions(q)
      const { data: v } = await supabase.from("Vote").select("*").eq("ceremonyId", params.id)
      if (v) setVotes(v)
    }
    const channel = supabase.channel(`review:${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` }, (p: any) => setComments(prev => [...prev, p.new]))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ReviewQuestion", filter: `ceremonyId=eq.${params.id}` }, (p: any) => setQuestions(prev => [...prev, p.new]))
      .on("postgres_changes", { event: "*", schema: "public", table: "ReviewQuestion", filter: `ceremonyId=eq.${params.id}` }, (p: any) => {
        if (p.eventType === "DELETE") setQuestions(prev => prev.filter(q => q.id !== p.old.id))
        else if (p.new) setQuestions(prev => prev.map(q => (q.id === p.new.id ? p.new : q)))
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` }, (p: any) => setVotes(prev => [...prev, p.new]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` }, (p: any) => setVotes(prev => prev.filter(v => v.id !== p.old.id)))
      .subscribe()
    fetchAll()
    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  const addEntry = async () => {
    if (!newEntry.trim()) return
    const supabase = getSupabase()
    const { data } = await supabase.from("Comment").insert({ ceremonyId: params.id, content: newEntry.trim(), author: author.trim() || "Guest", category: entryCat }).select().single()
    if (data) { setComments(prev => [...prev, data]); setNewEntry("") }
  }

  const addQuestion = async () => {
    const options = qOptions.split("\n").map(o => o.trim()).filter(Boolean)
    if (!qPrompt.trim() || options.length < 2) return
    const supabase = getSupabase()
    const { data } = await supabase.from("ReviewQuestion").insert({
      prompt: qPrompt.trim(),
      options,
      correctIdx: Math.min(Math.max(0, parseInt(qCorrect, 10) || 0), options.length - 1),
      ceremonyId: params.id,
    }).select().single()
    if (data) { setQuestions(prev => [...prev, data]); setQPrompt(""); setQOptions(""); setQCorrect("0") }
  }

  const answer = async (qid: string, idx: number) => {
    const supabase = getSupabase()
    const mine = votes.find(v => v.option.startsWith(`${qid}:`) && v.userId === uid && !v.option.includes("👏"))
    if (mine) await supabase.from("Vote").delete().eq("id", mine.id)
    const { data } = await supabase.from("Vote").insert({ ceremonyId: params.id, option: `${qid}:${idx}`, userId: uid }).select().single()
    if (data) setVotes(prev => [...prev.filter(v => v.id !== mine?.id), data])
  }

  const reveal = async (q: any) => {
    const supabase = getSupabase()
    const next = q.status === "revealed" ? "open" : "revealed"
    await supabase.from("ReviewQuestion").update({ status: next }).eq("id", q.id)
    setQuestions(prev => prev.map(x => (x.id === q.id ? { ...x, status: next } : x)))
  }

  const toggleApplause = async (commentId: string) => {
    const supabase = getSupabase()
    const mine = votes.find(v => v.option === `${commentId}:👏` && v.userId === uid)
    if (mine) {
      await supabase.from("Vote").delete().eq("id", mine.id)
      setVotes(prev => prev.filter(v => v.id !== mine.id))
    } else {
      const { data } = await supabase.from("Vote").insert({ ceremonyId: params.id, option: `${commentId}:👏`, userId: uid }).select().single()
      if (data) setVotes(prev => [...prev, data])
    }
  }

  const applause = (commentId: string) => votes.filter(v => v.option === `${commentId}:👏`).length
  const answerCount = (qid: string, idx: number) => votes.filter(v => v.option === `${qid}:${idx}`).length
  const myAnswer = (qid: string) => {
    const v = votes.find(x => x.option.startsWith(`${qid}:`) && x.userId === uid && !x.option.includes("👏"))
    return v ? parseInt(v.option.split(":")[1], 10) : null
  }

  const finishReview = async () => {
    if (finishing || ceremony?.status === "completed") return
    setFinishing(true)
    try {
      const supabase = getSupabase()
      const xpEarned = 100 + comments.length * 10
      await supabase.from("Ceremony").update({ status: "completed", endedAt: new Date().toISOString() }).eq("id", params.id)
      const { data: t } = await supabase.from("Team").select("xp").eq("id", ceremony.teamId).single()
      if (t) await supabase.from("Team").update({ xp: (t.xp ?? 0) + xpEarned }).eq("id", ceremony.teamId)
      const { data: b } = await supabase.from("Badge").select("id").eq("teamId", ceremony.teamId).eq("name", "Showtime").limit(1)
      if (!b || b.length === 0) await supabase.from("Badge").insert({ name: "Showtime", description: "Ran your first sprint review", teamId: ceremony.teamId })
      setReward(xpEarned)
    } finally {
      setFinishing(false)
    }
  }

  if (reward !== null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">👏</div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Review Wrapped!</h1>
          <div className="text-5xl font-bold text-gold mb-4">+{reward} XP</div>
          <p className="text-sm text-gray-400 mb-6">{comments.length} demos & questions · stakeholders engaged, no status-report coma</p>
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
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gradient">📊 Sprint Review</h1>
          <div className="flex gap-2"><Presence channel={params.id} /><span className="bg-gold/20 text-gold px-4 py-2 rounded-full font-bold">{comments.length} entries</span></div>
        </div>
        <p className="text-gray-300 mb-6 glass rounded-xl p-4">Demo the increment, quiz your stakeholders, gather feedback. No slides marathons — show, don&apos;t tell.</p>

        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="font-bold mb-3">Add demo, question or feedback</h3>
          <div className="flex gap-2 mb-3 flex-wrap">
            <input type="text" placeholder="Your name (optional)" value={author} onChange={e => setAuthor(e.target.value)} className="p-2 rounded bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm" />
            <select value={entryCat} onChange={e => setEntryCat(e.target.value)} className="p-2 rounded bg-dark border border-gray-600 text-white text-sm">{REVIEW_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <textarea value={newEntry} onChange={e => setNewEntry(e.target.value)} placeholder="What did you ship? What do you want to know?" className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 h-20 resize-none" />
          <button onClick={addEntry} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">Post</button>
        </div>

        {REVIEW_CATS.map(cat => {
          const items = comments.filter(c => c.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat} className="mb-6"><h3 className="text-lg font-bold mb-3">{cat}</h3>
              <div className="space-y-3">{items.map(c => (
                <div key={c.id} className="glass rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-1">{c.author}</div>
                  <div className="mb-2">{c.content}</div>
                  <button onClick={() => toggleApplause(c.id)} className="text-sm px-2 py-0.5 rounded-full border border-gray-700 hover:border-gold">👏 {applause(c.id) > 0 && applause(c.id)}</button>
                </div>
              ))}</div>
            </div>
          )
        })}

        <section className="mb-6"><h3 className="text-lg font-bold mb-1">🧠 Stakeholder Quiz</h3>
          <p className="text-xs text-gray-500 mb-3">Check if anyone was awake. Tap an answer — results update live.</p>
          <div className="space-y-4 mb-4">
            {questions.map(q => {
              const total = q.options.reduce((n: number, _: string, i: number) => n + answerCount(q.id, i), 0)
              const mine = myAnswer(q.id)
              return (
                <div key={q.id} className="glass rounded-xl p-4">
                  <div className="font-bold mb-2">{q.prompt}</div>
                  <div className="space-y-2">
                    {q.options.map((opt: string, i: number) => {
                      const n = answerCount(q.id, i)
                      const pct = total > 0 ? Math.round((n / total) * 100) : 0
                      const isMine = mine === i
                      const isRight = q.status === "revealed" && q.correctIdx === i
                      return (
                        <button key={i} onClick={() => answer(q.id, i)} className={`w-full text-left p-2 rounded-lg border transition ${isMine ? "border-gold bg-gold/10" : "border-gray-700 hover:border-gray-500"} ${isRight ? "border-teal bg-teal/10" : ""}`}>
                          <div className="flex justify-between text-sm"><span>{isRight ? "✅ " : ""}{opt}</span><span className="text-gray-400">{q.status === "revealed" || isMine ? `${pct}% (${n})` : ""}</span></div>
                          {(q.status === "revealed" || isMine) && <div className="h-1.5 rounded-full bg-dark mt-1"><div className={`h-full rounded-full ${isRight ? "bg-teal" : "bg-gold"}`} style={{ width: `${pct}%` }} /></div>}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={() => reveal(q)} className="mt-2 text-xs text-teal hover:text-white">{q.status === "revealed" ? "Hide answer" : "Reveal answer"}</button>
                </div>
              )
            })}
          </div>
          <div className="glass rounded-xl p-4">
            <h4 className="font-bold mb-2 text-sm">New quiz question</h4>
            <input type="text" placeholder="Question" value={qPrompt} onChange={e => setQPrompt(e.target.value)} className="w-full p-2 rounded bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm mb-2" />
            <textarea value={qOptions} onChange={e => setQOptions(e.target.value)} placeholder={"One option per line (min 2)\nShipped on time\nSlipped a week"} className="w-full p-2 rounded bg-dark border border-gray-600 text-white placeholder-gray-500 text-sm mb-2 h-20" />
            <div className="flex gap-2">
              <input type="number" min="0" value={qCorrect} onChange={e => setQCorrect(e.target.value)} className="w-24 p-2 rounded bg-dark border border-gray-600 text-white text-sm" title="Index of correct option (0-based)" />
              <button onClick={addQuestion} className="px-4 py-2 bg-teal text-white font-bold rounded-lg text-sm">+ Add question</button>
            </div>
          </div>
        </section>

        <div className="flex justify-end mt-8">
          {ceremony?.status === "completed"
            ? <span className="p-3 bg-gold/20 text-gold font-bold rounded-lg">Completed ✓</span>
            : <button onClick={finishReview} disabled={finishing} className="p-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50">{finishing ? "Wrapping..." : "Wrap up + Earn XP"}</button>}
        </div>
      </div>
    </main>
  )
}
