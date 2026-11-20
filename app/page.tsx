"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { generateJoinCode, normalizeCode } from "@/lib/joinCode"
import Logo from "@/components/Logo"

// Kept only because the existing Team table requires these columns. They are
// not part of the retrospective and are never shown.
const DEFAULT_MASCOT = "🐉"
const DEFAULT_OWNER = "owner-1"

interface SavedTeam { id: string; name: string; joinCode: string }

function loadTeams(): SavedTeam[] {
  try {
    return JSON.parse(window.localStorage.getItem("sq_teams") ?? "[]")
  } catch {
    return []
  }
}

function saveTeam(t: SavedTeam) {
  const list = loadTeams().filter((x) => x.id !== t.id)
  window.localStorage.setItem(
    "sq_teams",
    JSON.stringify([{ id: t.id, name: t.name, joinCode: t.joinCode }, ...list].slice(0, 10)),
  )
}

async function uniqueJoinCode(supabase: any) {
  for (let i = 0; i < 5; i++) {
    const code = generateJoinCode()
    const { data } = await supabase.from("Team").select("id").eq("joinCode", code).limit(1)
    if (!data || data.length === 0) return code
  }
  return generateJoinCode() + generateJoinCode(2)
}

export default function Home() {
  const [step, setStep] = useState<"home" | "create" | "join">("home")
  const [teamName, setTeamName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [myTeams, setMyTeams] = useState<SavedTeam[]>([])
  const router = useRouter()

  useEffect(() => { setMyTeams(loadTeams()) }, [])

  const createTeam = async () => {
    setError("")
    if (!teamName.trim()) { setError("Please enter a team name"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      const code = await uniqueJoinCode(supabase)
      const { data, error: e } = await supabase
        .from("Team")
        .insert({ name: teamName.trim(), mascot: DEFAULT_MASCOT, ownerId: DEFAULT_OWNER, joinCode: code })
        .select()
        .single()
      if (e) { setError(e.message); return }
      const saved = { id: data.id, name: data.name, joinCode: data.joinCode }
      saveTeam(saved)
      router.push(`/dashboard?team=${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Connection error. Check Supabase config.")
    } finally {
      setBusy(false)
    }
  }

  const joinTeam = async () => {
    setError("")
    const code = normalizeCode(joinCode)
    if (!code) { setError("Please enter a team code"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      let { data } = await supabase.from("Team").select("*").eq("joinCode", code).single()
      if (!data && code.length > 10) {
        const res = await supabase.from("Team").select("*").eq("id", code).single()
        data = res.data
      }
      if (!data) { setError(`No team found with code "${code}". Check it and try again.`); return }
      saveTeam({ id: data.id, name: data.name, joinCode: data.joinCode })
      router.push(`/dashboard?team=${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Connection error.")
    } finally {
      setBusy(false)
    }
  }

  const startDemo = async () => {
    setError("")
    setBusy(true)
    try {
      const supabase = getSupabase()
      const code = await uniqueJoinCode(supabase)
      const { data: team, error: te } = await supabase
        .from("Team")
        .insert({ name: "Demo Team", mascot: DEFAULT_MASCOT, ownerId: DEFAULT_OWNER, joinCode: code })
        .select()
        .single()
      if (te || !team) { setError(te?.message ?? "Could not create demo."); return }
      const { data: sprint } = await supabase
        .from("Sprint")
        .insert({ number: 1, theme: "Sprint 1", teamId: team.id, status: "active" })
        .select()
        .single()
      const { data: ceremony, error: ce } = await supabase
        .from("Ceremony")
        .insert({ type: "retro", gameMode: "RETRO", teamId: team.id, sprintId: sprint.id, status: "active" })
        .select()
        .single()
      if (ce || !ceremony) { setError(ce?.message ?? "Could not create demo ceremony."); return }
      await supabase.from("Comment").insert([
        { ceremonyId: ceremony.id, content: "We shipped the checkout flow early", author: "Alex", anonymous: false, category: "went-well" },
        { ceremonyId: ceremony.id, content: "Code reviews sat for three days", author: "Sam", anonymous: false, category: "to-improve" },
      ])
      saveTeam({ id: team.id, name: team.name, joinCode: team.joinCode })
      router.push(`/retro/${ceremony.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Could not start demo.")
    } finally {
      setBusy(false)
    }
  }

  if (step === "create" || step === "join") {
    const creating = step === "create"
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-2xl p-8 max-w-md w-full border-white/15">
          <h1 className="text-3xl font-display font-extrabold mb-2 text-center">
            {creating ? "Create a team" : "Join a team"}
          </h1>
          <p className="text-sm text-mist/70 text-center mb-5">
            {creating ? "Your team needs a name. Nothing else." : "Enter the code your facilitator shared — no account needed."}
          </p>
          {error && <div className="bg-red-950/70 border border-red-500/30 text-red-100 p-3 rounded-xl mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              placeholder={creating ? "Team name (e.g. Checkout Squad)" : "e.g. K7Q2XA"}
              value={creating ? teamName : joinCode}
              onChange={(e) => creating ? setTeamName(e.target.value) : setJoinCode(e.target.value.toUpperCase())}
              maxLength={creating ? 80 : 40}
              className="w-full p-3 rounded-xl bg-dark/60 border border-white/15 text-white placeholder-gray-400"
            />
            <button
              onClick={creating ? createTeam : joinTeam}
              disabled={busy}
              className="w-full p-3 bg-gold text-black font-extrabold rounded-xl hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Working..." : creating ? "Create team" : "Join team"}
            </button>
            <button onClick={() => { setStep("home"); setError("") }} className="w-full p-3 bg-white/5 border border-white/15 rounded-xl text-white hover:bg-white/10">Back</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-10 max-w-2xl">
        <Logo size="lg" className="justify-center" />
        <p className="text-xl sm:text-2xl text-mist/80 leading-relaxed mt-5">
          A Sprint Retrospective: inspect the sprint, agree on what to improve, and carry it into the next one.
        </p>
      </div>
      {error && <div className="bg-red-950/70 border border-red-500/30 text-red-100 p-3 rounded-xl mb-4 text-sm max-w-md w-full">{error}</div>}
      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={() => setStep("create")} className="px-8 py-4 bg-gold text-black font-extrabold rounded-xl text-lg hover:brightness-110">Create team</button>
        <button onClick={() => setStep("join")} className="px-8 py-4 bg-white/5 border border-white/15 rounded-xl text-lg text-white font-semibold hover:bg-white/10">Join with code</button>
      </div>
      <button onClick={startDemo} disabled={busy} className="mt-5 text-teal hover:text-white disabled:opacity-50">
        Try an instant demo — no setup
      </button>
      <div className="mt-10 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { n: "1", title: "Inspect", text: "Share what went well and what to improve. Anonymous by default." },
          { n: "2", title: "Order", text: "Mark the items the team wants to discuss first." },
          { n: "3", title: "Improve", text: "Agree at least one owned improvement for the next sprint." },
        ].map((s) => (
          <div key={s.n} className="glass rounded-xl p-4">
            <div className="text-[10px] font-bold tracking-widest text-gold mb-1">STEP {s.n}</div>
            <div className="font-bold text-sm">{s.title}</div>
            <div className="text-xs text-mist/60 mt-1 leading-relaxed">{s.text}</div>
          </div>
        ))}
      </div>
      {myTeams.length > 0 && (
        <div className="mt-8 w-full max-w-md">
          <p className="text-sm text-mist/70 mb-2 text-center uppercase tracking-wider">Teams on this device</p>
          <div className="space-y-2">
            {myTeams.map((t) => (
              <a key={t.id} href={`/dashboard?team=${t.id}`} className="glass rounded-xl p-3 flex items-center gap-3 hover:border-teal/50 transition">
                <span className="font-bold">{t.name}</span>
                <span className="ml-auto font-mono text-teal text-sm">{t.joinCode}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="text-mist/60 mt-8 text-sm">No accounts, no rankings, no XP — just the retrospective.</p>
    </main>
  )
}
