"use client"
import { useState } from "react"

export default function ShareRecap({ ceremonyId, xp }: { ceremonyId: string; xp: number }) {
  const [state, setState] = useState<"idle" | "posting" | "posted" | "error">("idle")
  const share = async () => {
    setState("posting")
    try {
      const res = await fetch("/api/slack/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ceremonyId, xp }),
      })
      setState(res.ok ? "posted" : "error")
    } catch {
      setState("error")
    }
  }
  if (state === "posted") return <p className="text-sm text-teal mb-3">📣 Recap posted to Slack!</p>
  return (
    <button onClick={share} disabled={state === "posting"} className="w-full p-3 mb-3 border border-gray-600 rounded-lg text-gray-300 hover:border-gold disabled:opacity-50">
      {state === "posting" ? "Posting…" : state === "error" ? "Slack not connected — retry?" : "📣 Share recap to Slack"}
    </button>
  )
}
