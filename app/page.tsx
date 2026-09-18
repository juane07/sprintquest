"use client"
import { useState } from "react"
import { getSupabase } from "@/lib/supabase"

export default function Home() {
  const [step, setStep] = useState<"home" | "create" | "join">("home")
  const [teamName, setTeamName] = useState("")
  const [mascot, setMascot] = useState("🐉")
  const [joinCode, setJoinCode] = useState("")
  const [teamId, setTeamId] = useState<string | null>(null)

  const createTeam = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("Team").insert({ name: teamName, mascot, ownerId: "user-1" }).select().single()
      if (error) { alert(error.message); return }
      setTeamId(data.id); setStep("create")
    } catch (e) { alert("Check Supabase config") }
  }

  const joinTeam = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("Team").select("*").eq("id", joinCode).single()
      if (error || !data) { alert("Team not found"); return }
      setTeamId(data.id); setStep("create")
    } catch (e) { alert("Connection error") }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-dark">
      <div className="text-center mb-12"><h1 className="text-6xl font-bold text-gradient mb-4">SprintQuest</h1><p className="text-xl text-gray-400">Turn every sprint into a mission</p></div>
      <div className="flex gap-6">
        <button onClick={() => setStep("create")} className="px-8 py-4 bg-gold text-black font-bold rounded-lg text-xl hover:bg-yellow-400 transition">Create Team</button>
        <button onClick={() => setStep("join")} className="px-8 py-4 bg-navy-800 border border-gray-600 rounded-lg text-xl hover:bg-dark text-white transition">Join Team</button>
      </div>
      <p className="text-gray-500 mt-8 text-sm">No account needed</p>
    </main>
  )
}
