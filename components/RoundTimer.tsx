"use client"
import { useEffect, useState } from "react"
import { shouldExtendRound } from "@/lib/learning-science"

const ROUND_SECONDS = 5 * 60

interface RoundTimerProps {
  round: number
  hasEntries: boolean
  running: boolean
}

// Isolated so the 1 Hz tick re-renders this chip only, not the whole session
// page. Driving the countdown from the page was a once-per-second full-tree
// render — the single biggest reason weaker machines felt slow.
export default function RoundTimer({ round, hasEntries, running }: RoundTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)

  useEffect(() => {
    if (!running) return
    setSecondsLeft(ROUND_SECONDS)
    const iv = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(iv)
  }, [round, running])

  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, "0")

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <span className={`px-4 py-2 rounded-full font-bold ${secondsLeft === 0 ? "bg-gold/20 text-gold border border-gold/40" : "bg-navy-800 border border-gray-700 text-gray-300"}`}>
        ⏱ {secondsLeft === 0 ? "Suggested time reached" : `${mm}:${ss}`}
      </span>
      {secondsLeft === 0 && (
        <span className="px-3 py-2 rounded-full font-bold bg-teal/20 text-teal text-xs">Time is a guide — advance when the team is ready</span>
      )}
      {shouldExtendRound(hasEntries, secondsLeft) && secondsLeft > 0 && (
        <span className="px-3 py-2 rounded-full font-bold bg-teal/20 text-teal text-xs">Keep going</span>
      )}
    </div>
  )
}