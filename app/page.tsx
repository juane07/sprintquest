"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"

const MASCOTS = ["🐉", "🦊", "🚀", "🤖", "🐙"]
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

function randomCode(len = 6) {
  let s = ""
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return s
}

async function uniqueJoinCode(supabase: any) {
  for (let i = 0; i < 5; i++) {
    const code = randomCode()
    const { data } = await supabase.from("Team").select("id").eq("joinCode", code).limit(1)
    if (!data || data.length === 0) return code
  }
  return randomCode() + randomCode(2)
}

export default function Home() {
  const [step, setStep] = useState<"home" | "create" | "join">("home")
  const [teamName, setTeamName] = useState("")
  const [mascot, setMascot] = useState("🐉")
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const router = useRouter()

  const createTeam = async () => {
    setError("")
    if (!teamName.trim()) { setError("Please enter a team name"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      const code = await uniqueJoinCode(supabase)
      const { data, error: e } = await supabase
        .from("Team")
        .insert({ name: teamName.trim(), mascot, ownerId: "owner-1", joinCode: code })
        .select()
        .single()
      if (e) { setError(e.message); return }
      router.push(`/dashboard?team=${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Connection error. Check Supabase config.")
    } finally {
      setBusy(false)
    }
  }

  const joinTeam = async () => {
    setError("")
    const code = joinCode.trim().toUpperCase()
    if (!code) { setError("Please enter a team code"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      // short code first, fall back to full team ID for older teams
      let { data } = await supabase.from("Team").select("*").eq("joinCode", code).single()
      if (!data && code.length > 10) {
        const res = await supabase.from("Team").select("*").eq("id", joinCode.trim()).single()
        data = res.data
      }
      if (!data) { setError(`No team found with code "${code}". Check it and try again.`); return }
      router.push(`/dashboard?team=${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Connection error.")
    } finally {
      setBusy(false)
    }
  }

  const startDemo = async () => {
    setError("")
    setDemoBusy(true)
    try {
      const supabase = getSupabase()
      const code = await uniqueJoinCode(supabase)
      const { data: team, error: te } = await supabase
        .from("Team")
        .insert({ name: "Demo Questers", mascot: MASCOTS[Math.floor(Math.random() * MASCOTS.length)], ownerId: "owner-1", joinCode: code })
        .select()
        .single()
      if (te || !team) { setError(te?.message ?? "Could not create demo."); return }
      const { data: sprint } = await supabase
        .from("Sprint")
        .insert({ number: 1, theme: "Demo Sprint", teamId: team.id, status: "active" })
        .select()
        .single()
      const { data: ceremony } = await supabase
        .from("Ceremony")
        .insert({ type: "retro", gameMode: "SAILBOAT", teamId: team.id, sprintId: sprint.id, status: "active" })
        .select()
        .single()
      await supabase.from("Comment").insert([
        { ceremonyId: ceremony.id, content: "We shipped the checkout flow two days early 🚀", author: "Alex (demo)", category: "Positive" },
        { ceremonyId: ceremony.id, content: "Code reviews are sitting for 3+ days on average", author: "Sam (demo)", category: "Challenge" },
        { ceremonyId: ceremony.id, content: "Try a 15-minute review SLA for urgent PRs", author: "Alex (demo)", category: "Idea" },
      ])
      router.push(`/retro/${ceremony.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Could not start demo.")
    } finally {
      setDemoBusy(false)
    }
  }

  if (step === "create") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-dark">
        <div className="glass rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">Create your team</h2>
          {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Team name (e.g. Checkout Squad)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400"
            />
            <div>
              <p className="text-sm text-gray-400 mb-2">Choose a mascot</p>
              <div className="flex gap-2">
                {MASCOTS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMascot(m)}
                    className={`text-3xl p-2 rounded-lg border ${mascot === m ? "border-gold bg-gold/10" : "border-transparent hover:border-gray-600"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createTeam} disabled={busy} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50">
              {busy ? "Creating..." : "Create Team"}
            </button>
            <button onClick={() => { setStep("home"); setError("") }} className="w-full p-3 bg-navy-800 border border-gray-600 rounded-lg text-white hover:bg-dark">Back</button>
          </div>
        </div>
      </main>
    )
  }

  if (step === "join") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-dark">
        <div className="glass rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-2 text-center">Join a team</h2>
          <p className="text-sm text-gray-400 text-center mb-4">Ask your facilitator for the 6-letter code — no account needed.</p>
          {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="e.g. K7Q2XA"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={40}
              className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 text-center text-2xl tracking-widest font-mono"
            />
            <button onClick={joinTeam} disabled={busy} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50">
              {busy ? "Joining..." : "Join the quest ⚔️"}
            </button>
            <button onClick={() => { setStep("home"); setError("") }} className="w-full p-3 bg-navy-800 border border-gray-600 rounded-lg text-white hover:bg-dark">Back</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-dark">
      <div className="text-center mb-10"><h1 className="text-6xl font-bold text-gradient mb-4">SprintQuest</h1><p className="text-xl text-gray-400">Turn every sprint into a mission</p></div>
      {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm max-w-md w-full">{error}</div>}
      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={() => setStep("create")} className="px-8 py-4 bg-gold text-black font-bold rounded-lg text-xl hover:bg-yellow-400 transition">Create Team</button>
        <button onClick={() => setStep("join")} className="px-8 py-4 bg-navy-800 border border-gray-600 rounded-lg text-xl hover:bg-dark text-white transition">Join Team</button>
      </div>
      <button onClick={startDemo} disabled={demoBusy} className="mt-4 text-teal hover:text-white transition disabled:opacity-50">
        {demoBusy ? "Preparing your demo..." : "⚡ Just looking? Try an instant demo — no setup"}
      </button>
      <p className="text-gray-500 mt-6 text-sm">No account needed — join with a team code</p>
    </main>
  )
}
