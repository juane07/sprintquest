"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"

const MASCOTS = ["🐉", "🦊", "🚀", "🤖", "🐙"]

export default function Home() {
  const [step, setStep] = useState<"home" | "create" | "join">("home")
  const [teamName, setTeamName] = useState("")
  const [mascot, setMascot] = useState("🐉")
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const createTeam = async () => {
    setError("")
    if (!teamName.trim()) { setError("Please enter a team name"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      const { data, error: e } = await supabase
        .from("Team")
        .insert({ name: teamName.trim(), mascot, ownerId: "owner-1" })
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
    if (!joinCode.trim()) { setError("Please enter a team code"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      const { data, error: e } = await supabase.from("Team").select("*").eq("id", joinCode.trim()).single()
      if (e || !data) { setError("Team not found. Check the code."); return }
      router.push(`/dashboard?team=${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Connection error.")
    } finally {
      setBusy(false)
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
              placeholder="Team name"
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
          <h2 className="text-2xl font-bold mb-4 text-center">Join a team</h2>
          {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Team code (paste the team ID)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400"
            />
            <button onClick={joinTeam} disabled={busy} className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50">
              {busy ? "Joining..." : "Join"}
            </button>
            <button onClick={() => { setStep("home"); setError("") }} className="w-full p-3 bg-navy-800 border border-gray-600 rounded-lg text-white hover:bg-dark">Back</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-dark">
      <div className="text-center mb-12"><h1 className="text-6xl font-bold text-gradient mb-4">SprintQuest</h1><p className="text-xl text-gray-400">Turn every sprint into a mission</p></div>
      <div className="flex gap-6">
        <button onClick={() => setStep("create")} className="px-8 py-4 bg-gold text-black font-bold rounded-lg text-xl hover:bg-yellow-400 transition">Create Team</button>
        <button onClick={() => setStep("join")} className="px-8 py-4 bg-navy-800 border border-gray-600 rounded-lg text-xl hover:bg-dark text-white transition">Join Team</button>
      </div>
      <p className="text-gray-500 mt-8 text-sm">No account needed — join with a team code</p>
    </main>
  )
}
