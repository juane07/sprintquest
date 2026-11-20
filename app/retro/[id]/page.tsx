"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import {
  RETRO_CATEGORIES,
  canFinish,
  isRetroCategory,
  myPriority,
  orderedEntries,
  priorityCount,
  type RetroAction,
  type RetroEntry,
  type RetroVote,
} from "@/lib/retro"

// Reserved marker row. Comment realtime is confirmed working for this team,
// so finishing is broadcast the same way as the observations themselves.
const FINISH_CAT = "retro-finished"

function mergeById<T extends { id: string }>(prev: T[], row: T): T[] {
  if (!row) return prev
  return prev.some((x) => x.id === row.id)
    ? prev.map((x) => (x.id === row.id ? { ...x, ...row } : x))
    : [...prev, row]
}

export default function RetroPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [ceremony, setCeremony] = useState<Record<string, any> | null>(null)
  const [sprintNumber, setSprintNumber] = useState<number | null>(null)
  const [entries, setEntries] = useState<RetroEntry[]>([])
  const [finishMarker, setFinishMarker] = useState(false)
  const [votes, setVotes] = useState<RetroVote[]>([])
  const [actions, setActions] = useState<RetroAction[]>([])
  const [lastActions, setLastActions] = useState<RetroAction[]>([])
  const [uid] = useState(() => {
    if (typeof window === "undefined") return "server"
    let id = window.localStorage.getItem("sq_uid")
    if (!id) { id = Math.random().toString(36).slice(2); window.localStorage.setItem("sq_uid", id) }
    return id
  })

  const [category, setCategory] = useState<string>(RETRO_CATEGORIES[0].id)
  const [text, setText] = useState("")
  const [anonymous, setAnonymous] = useState(true)
  const [authorName, setAuthorName] = useState("")
  const [improvementTitle, setImprovementTitle] = useState("")
  const [improvementOwner, setImprovementOwner] = useState("")
  const [improvementSource, setImprovementSource] = useState<RetroEntry | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const supabase = getSupabase()
    const fetchAll = async () => {
      const { data: c } = await supabase.from("Ceremony").select("*").eq("id", params.id).single()
      if (!c) return
      setCeremony(c)
      if (c.sprintId) {
        const { data: s } = await supabase.from("Sprint").select("number").eq("id", c.sprintId).single()
        if (s) setSprintNumber(s.number ?? null)
      }
      const { data: prev } = await supabase
        .from("Ceremony")
        .select("id")
        .eq("teamId", c.teamId)
        .eq("status", "completed")
        .neq("id", params.id)
        .order("endedAt", { ascending: false })
        .limit(1)
        .single()
      if (prev) {
        const { data: pa } = await supabase.from("Action").select("*").eq("ceremonyId", prev.id).order("createdAt")
        if (pa) setLastActions(pa)
      }
    }
    const fetchEntries = async () => {
      const { data } = await supabase.from("Comment").select("*").eq("ceremonyId", params.id).order("createdAt")
      if (data) {
        setFinishMarker(data.some((c: any) => c.category === FINISH_CAT))
        setEntries(data.filter((c: any) => isRetroCategory(c.category)))
      }
    }
    const fetchVotes = async () => {
      const { data } = await supabase.from("Vote").select("*").eq("ceremonyId", params.id)
      if (data) setVotes(data)
    }
    const fetchActions = async () => {
      const { data } = await supabase.from("Action").select("*").eq("ceremonyId", params.id).order("createdAt")
      if (data) setActions(data)
    }

    const channel = supabase
      .channel(`retro:${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => {
          if (payload.new?.category === FINISH_CAT) setFinishMarker(true)
          else if (isRetroCategory(payload.new?.category)) setEntries((prev) => mergeById(prev, payload.new))
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setEntries((prev) => mergeById(prev, payload.new)))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "Comment", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setEntries((prev) => prev.filter((e) => e.id !== payload.old?.id)))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setVotes((prev) => mergeById(prev, payload.new)))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "Vote", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => setVotes((prev) => prev.filter((v) => v.id !== payload.old?.id)))
      .on("postgres_changes", { event: "*", schema: "public", table: "Action", filter: `ceremonyId=eq.${params.id}` },
        (payload: any) => {
          if (payload.eventType === "DELETE") setActions((prev) => prev.filter((a) => a.id !== payload.old?.id))
          else setActions((prev) => mergeById(prev, payload.new))
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Ceremony", filter: `id=eq.${params.id}` },
        (payload: any) => setCeremony((prev) => (prev ? { ...prev, ...payload.new } : prev)))
      .subscribe()

    fetchAll()
    fetchEntries()
    fetchVotes()
    fetchActions()
    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  const grouped = useMemo(() => {
    const ordered = orderedEntries(entries, votes)
    return RETRO_CATEGORIES.map((c) => ({ ...c, items: ordered.filter((e) => e.category === c.id) }))
  }, [entries, votes])

  const ready = useMemo(() => canFinish(actions), [actions])
  const isDone = ceremony?.status === "completed" || finishMarker

  const addEntry = async () => {
    setError("")
    if (!text.trim()) return
    const author = anonymous ? "Anonymous" : (authorName.trim() || "Teammate")
    const { data, error: e } = await getSupabase()
      .from("Comment")
      .insert({ ceremonyId: params.id, content: text.trim(), author, anonymous, category })
      .select()
      .single()
    if (e) { setError(e.message); return }
    setEntries((prev) => mergeById(prev, data))
    setText("")
  }

  const togglePriority = async (entryId: string) => {
    const supabase = getSupabase()
    const mine = myPriority(votes, entryId, uid)
    if (mine) {
      const { error } = await supabase.from("Vote").delete().eq("id", mine.id)
      if (!error) setVotes((prev) => prev.filter((v) => v.id !== mine.id))
    } else {
      const { data, error } = await supabase
        .from("Vote")
        .insert({ ceremonyId: params.id, option: `${entryId}:priority`, userId: uid })
        .select()
        .single()
      if (!error && data) setVotes((prev) => mergeById(prev, data))
    }
  }

  const createImprovement = async () => {
    setError("")
    if (!improvementTitle.trim() || !improvementOwner.trim()) return
    const { data, error: e } = await getSupabase()
      .from("Action")
      .insert({
        title: improvementTitle.trim(),
        description: improvementSource?.content ?? "",
        owner: improvementOwner.trim(),
        ceremonyId: params.id,
        status: "pending",
      })
      .select()
      .single()
    if (e) { setError(e.message); return }
    setActions((prev) => mergeById(prev, data))
    setImprovementTitle("")
    setImprovementOwner("")
    setImprovementSource(null)
  }

  const toggleLastAction = async (a: RetroAction) => {
    const done = a.status === "completed"
    const { error } = await getSupabase()
      .from("Action")
      .update({ status: done ? "pending" : "completed", completedAt: done ? null : new Date().toISOString() })
      .eq("id", a.id)
    if (!error) setLastActions((prev) => prev.map((x) => x.id === a.id ? { ...x, status: done ? "pending" : "completed" } : x))
  }

  const finishCeremony = async () => {
    if (finishing || isDone || !ready) return
    setFinishing(true)
    setError("")
    try {
      const supabase = getSupabase()
      const { data, error: e } = await supabase
        .from("Ceremony")
        .update({ status: "completed", endedAt: new Date().toISOString() })
        .eq("id", params.id)
        .eq("status", "active")
        .select()
      if (e) { setError(e.message); return }
      if (data?.[0]) setCeremony((prev) => (prev ? { ...prev, ...data[0] } : prev))
      // Broadcast to devices that are not subscribed to Ceremony changes.
      await supabase.from("Comment").insert({
        ceremonyId: params.id, content: "", author: "Team", anonymous: false, category: FINISH_CAT,
      })
    } catch (e: any) {
      setError(e?.message ?? "Could not finish the retrospective.")
    } finally {
      setFinishing(false)
    }
  }

  const backToDashboard = () => router.push(`/dashboard?team=${ceremony?.teamId ?? ""}`)

  if (isDone) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-xl p-10 max-w-xl w-full">
          <h1 className="text-3xl font-bold text-gradient mb-2">Retrospective complete</h1>
          <p className="text-gray-400 mb-6">
            {entries.length} {entries.length === 1 ? "observation" : "observations"} shared · {actions.length} {actions.length === 1 ? "improvement" : "improvements"} agreed.
          </p>
          <h2 className="font-bold mb-3">Improvements for the next sprint</h2>
          {actions.length === 0 ? (
            <p className="text-gray-400 mb-6">No improvement was recorded.</p>
          ) : (
            <ul className="space-y-2 mb-6">
              {actions.map((a) => (
                <li key={a.id} className="rounded-lg bg-dark/50 p-3">
                  <span className="font-bold">{a.title}</span>
                  <span className="text-sm text-gray-400 ml-2">— {a.owner}</span>
                </li>
              ))}
            </ul>
          )}
          <button onClick={backToDashboard} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400">
            Back to team dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap">
          <a href="/" className="hover:text-teal transition">Home</a><span>/</span>
          {ceremony?.teamId && <><a href={`/dashboard?team=${ceremony.teamId}`} className="hover:text-teal transition">Team</a><span>/</span></>}
          <span className="text-gray-300">Sprint Retrospective</span>
        </nav>

        <h1 className="text-3xl font-bold text-gradient mb-1">Sprint Retrospective</h1>
        <p className="text-gray-400 mb-8">{sprintNumber ? `Sprint ${sprintNumber}` : "Review the sprint and plan the next one."}</p>
        {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

        {lastActions.length > 0 && (
          <section className="glass rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-1">Last sprint&apos;s improvements</h2>
            <p className="text-sm text-gray-400 mb-4">Did the team implement what it committed to?</p>
            <div className="space-y-2">
              {lastActions.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark/50">
                  <button
                    onClick={() => toggleLastAction(a)}
                    className={a.status === "completed" ? "text-teal font-bold" : "w-5 h-5 rounded border border-gray-500 shrink-0"}
                    title={a.status === "completed" ? "Undo" : "Mark done"}
                  >
                    {a.status === "completed" ? "✓" : ""}
                  </button>
                  <span className={a.status === "completed" ? "line-through text-gray-500" : ""}>{a.title}</span>
                  <span className="ml-auto text-xs text-gray-500">{a.owner}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-1">Inspect the sprint</h2>
          <p className="text-sm text-gray-400 mb-4">People, issues, processes, tools and relationships. One idea per entry.</p>
          <div className="flex gap-2 mb-3 flex-wrap">
            {RETRO_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${category === c.id ? "border-gold bg-gold/15 text-gold" : "border-gray-700 text-gray-300 hover:border-gray-500"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-3">{RETRO_CATEGORIES.find((c) => c.id === category)?.hint}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share an observation..."
            className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 h-24 resize-none"
          />
          <label className="flex items-center gap-2 mt-3 mb-2 text-sm text-gray-400">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            Post anonymously
          </label>
          {!anonymous && (
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Display name or alias (optional)"
              className="w-full p-2 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 text-sm"
            />
          )}
          <button onClick={addEntry} disabled={!text.trim()} className="w-full p-3 bg-teal text-white font-bold rounded-lg hover:bg-teal/80 disabled:opacity-50">
            Share observation
          </button>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Shared observations</h2>
          {entries.length === 0 && <p className="text-gray-400">Nothing shared yet.</p>}
          <div className="space-y-6">
            {grouped.map((g) => g.items.length === 0 ? null : (
              <div key={g.id}>
                <h3 className="font-bold mb-3">{g.label}</h3>
                <div className="space-y-3">
                  {g.items.map((e) => (
                    <div key={e.id} className="glass rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-1">{e.anonymous ? "Anonymous" : e.author}</div>
                      <div className="mb-3 whitespace-pre-wrap">{e.content}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => togglePriority(e.id)}
                          className={`text-sm px-2 py-0.5 rounded-full border ${myPriority(votes, e.id, uid) ? "border-gold bg-gold/10 text-gold" : "border-gray-700 hover:border-gray-500"}`}
                          title="Mark as a priority to discuss first"
                        >
                          👍 Discuss first {priorityCount(votes, e.id) > 0 && priorityCount(votes, e.id)}
                        </button>
                        <button
                          onClick={() => { setImprovementSource(e); setImprovementTitle(e.content.slice(0, 120)) }}
                          className="ml-auto text-xs text-teal hover:text-white"
                        >
                          → Turn into improvement
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-1">Improvements for the next sprint</h2>
          <p className="text-sm text-gray-400 mb-4">Agree at least one concrete improvement and who owns it.</p>
          {actions.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark/50 mb-2">
              <span className="font-bold">{a.title}</span>
              <span className="ml-auto text-sm text-gray-400">{a.owner}</span>
            </div>
          ))}
          {improvementSource && (
            <p className="text-xs text-gray-500 mt-3 mb-2">From: “{improvementSource.content.slice(0, 120)}”</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <input
              type="text"
              placeholder="Improvement (what will we change?)"
              value={improvementTitle}
              onChange={(e) => setImprovementTitle(e.target.value)}
              className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Owner (who commits?)"
              value={improvementOwner}
              onChange={(e) => setImprovementOwner(e.target.value)}
              className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={createImprovement}
            disabled={!improvementTitle.trim() || !improvementOwner.trim()}
            className="mt-3 w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
          >
            Add improvement
          </button>
        </section>

        <div className="border-t border-white/10 pt-6">
          <button
            onClick={finishCeremony}
            disabled={!ready || finishing}
            className="w-full p-4 bg-teal text-white font-bold rounded-lg hover:bg-teal/80 disabled:opacity-50"
          >
            {finishing ? "Finishing..." : "Finish retrospective"}
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {ready ? "The plan is ready for the next sprint." : "Scrum needs at least one improvement with an owner before you can close."}
          </p>
        </div>
      </div>
    </main>
  )
}
