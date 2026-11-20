"use client"
import { Suspense, useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

function DashboardInner() {
  const [team, setTeam] = useState<any>(null)
  const [sprint, setSprint] = useState<any>(null)
  const [ceremonies, setCeremonies] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
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
        const { data: s } = await supabase
          .from("Sprint")
          .select("*")
          .eq("teamId", teamId)
          .eq("status", "active")
          .order("number", { ascending: false })
          .limit(1)
          .single()
        setSprint(s ?? null)
        const { data: c } = await supabase.from("Ceremony").select("*").eq("teamId", teamId).order("startedAt", { ascending: false })
        const list = c ?? []
        setCeremonies(list)
        if (list.length > 0) {
          const { data: a } = await supabase
            .from("Action")
            .select("*")
            .in("ceremonyId", list.map((x: any) => x.id))
            .order("createdAt", { ascending: false })
          setActions(a ?? [])
        }
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
    setStarting(true)
    setError("")
    try {
      const supabase = getSupabase()
      let activeSprint = sprint
      if (!activeSprint) {
        const { data: existing } = await supabase
          .from("Sprint")
          .select("*")
          .eq("teamId", teamId)
          .eq("status", "active")
          .order("number", { ascending: false })
          .limit(1)
          .single()
        activeSprint = existing ?? null
      }
      if (!activeSprint) {
        const { data: maxSprint } = await supabase
          .from("Sprint")
          .select("number")
          .eq("teamId", teamId)
          .order("number", { ascending: false })
          .limit(1)
          .single()
        const nextNumber = (maxSprint?.number ?? 0) + 1
        const { data: created, error: se } = await supabase
          .from("Sprint")
          .insert({ number: nextNumber, theme: `Sprint ${nextNumber}`, teamId, status: "active" })
          .select()
          .single()
        if (se || !created) { setError(se?.message ?? "Could not create sprint."); return }
        activeSprint = created
      }
      const { data, error: ce } = await supabase
        .from("Ceremony")
        .insert({ type: "retro", gameMode: "RETRO", teamId, sprintId: activeSprint.id, status: "active" })
        .select()
        .single()
      if (ce || !data) { setError(ce?.message ?? "Could not start the retrospective."); return }
      router.push(`/retro/${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Could not start the retrospective.")
    } finally {
      setStarting(false)
    }
  }

  const toggleAction = async (action: any) => {
    if (completing) return
    setCompleting(action.id)
    const done = action.status === "completed"
    try {
      const { error } = await getSupabase()
        .from("Action")
        .update({ status: done ? "pending" : "completed", completedAt: done ? null : new Date().toISOString() })
        .eq("id", action.id)
      if (!error) {
        setActions((prev) =>
          prev.map((a) =>
            a.id === action.id
              ? { ...a, status: done ? "pending" : "completed", completedAt: done ? null : new Date().toISOString() }
              : a,
          ),
        )
      }
    } finally {
      setCompleting(null)
    }
  }

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

  const open = (actions ?? []).filter((a: any) => a.status !== "completed")
  const done = (actions ?? []).filter((a: any) => a.status === "completed")

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <a href="/" className="hover:text-teal transition">Home</a><span>/</span><span className="text-gray-300">Team</span>
        </nav>
        <h1 className="text-4xl font-bold text-gradient mb-2">{team.name}</h1>
        {sprint && <p className="text-gray-400 mb-6">Sprint {sprint.number}</p>}
        <div className="glass rounded-xl p-4 mb-8 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Invite code</span>
          <span className="font-mono text-2xl tracking-widest text-teal font-bold select-all">{team.joinCode ?? "—"}</span>
          <button onClick={copyCode} className="text-sm px-3 py-1 rounded-lg border border-gray-600 hover:border-gold text-gray-300">
            {copied ? "Copied!" : "Copy"}
          </button>
          <span className="ml-auto text-xs text-gray-500">No account needed to join.</span>
        </div>
        {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Sprint Retrospective</h2>
          <div className="glass rounded-xl p-6 max-w-2xl">
            <p className="text-gray-300 mb-4">
              The team inspects the sprint, orders what matters, and leaves with at least one owned improvement for the next sprint.
            </p>
            <button onClick={startCeremony} disabled={starting} className="btn-primary disabled:opacity-50">
              {starting ? "Starting..." : "Start Sprint Retrospective"}
            </button>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-1">Improvements ({open.length} open)</h2>
          <p className="text-sm text-gray-400 mb-4">Agreed in a retro, to be implemented in the next sprint.</p>
          {actions.length === 0 && <p className="text-gray-400">None yet — finish a retrospective to add one.</p>}
          <div className="space-y-3">
            {open.map((a: any) => (
              <div key={a.id} className="glass rounded-xl p-4 flex items-center gap-3">
                <button
                  onClick={() => toggleAction(a)}
                  disabled={completing !== null}
                  className="w-6 h-6 rounded border border-gray-500 hover:border-gold shrink-0 disabled:opacity-50"
                  title="Mark done"
                />
                <div>
                  <div className="font-bold">{a.title}</div>
                  <div className="text-xs text-gray-500">Owner: {a.owner || "—"}</div>
                </div>
              </div>
            ))}
            {done.slice(0, 8).map((a: any) => (
              <div key={a.id} className="rounded-xl p-4 flex items-center gap-3 border border-gray-800 opacity-80">
                <button onClick={() => toggleAction(a)} disabled={completing !== null} className="text-teal font-bold hover:text-gold" title="Undo">✓</button>
                <div><div className="line-through text-gray-400">{a.title}</div><div className="text-xs text-gray-600">Owner: {a.owner || "—"}</div></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Past retrospectives</h2>
          {ceremonies.length === 0 && <p className="text-gray-400">No retrospectives yet.</p>}
          <div className="space-y-3">
            {ceremonies.map((c: any) => {
              const date = c.endedAt || c.startedAt
              const label = date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""
              return (
                <a key={c.id} href={`/retro/${c.id}`} className="glass rounded-xl p-4 flex justify-between items-center hover:border-gold transition">
                  <span className="font-bold">Sprint Retrospective {label && <span className="ml-2 text-xs text-gray-500">{label}</span>}</span>
                  <span className="text-xs text-teal">{c.status === "completed" ? "Completed" : "In progress"} →</span>
                </a>
              )
            })}
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
