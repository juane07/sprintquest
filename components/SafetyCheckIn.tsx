"use client"
import { useState } from "react"

interface SafetyCheckInProps {
  onComplete: (safetyScore: number) => void
}

export default function SafetyCheckIn({ onComplete }: SafetyCheckInProps) {
  const [score, setScore] = useState<number>(3)
  const [shown, setShown] = useState(false)

  if (!shown) {
    return (
      <button
        onClick={() => setShown(true)}
        className="w-full glass rounded-xl p-4 mb-6 text-left hover:border-teal transition cursor-pointer"
      >
        <p className="text-sm text-teal font-bold">🛡️ Psychological Safety Check</p>
        <p className="text-sm text-gray-400">How safe do you feel sharing? (optional)</p>
      </button>
    )
  }

  return (
    <div className="glass rounded-xl p-6 mb-6 border-teal/30">
      <h3 className="font-bold mb-2 text-sm">🛡️ Psychological Safety Check-In</h3>
      <p className="text-sm text-gray-400 mb-4">
        Private to you (not shared or stored). Use it to guide how you participate.
      </p>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setScore(s)}
            className={`w-10 h-10 rounded-lg text-sm font-bold border ${
              score === s ? "bg-teal text-white border-teal" : "border-gray-600 text-gray-400 hover:border-teal"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div className="text-xs text-gray-400 max-w-md">
          {score <= 2
            ? "⚠️ Low safety — prefer anonymous sharing, focus on facts/systems (not people), and keep entries specific but kind."
            : score <= 3
            ? "😐 Moderate — proceed with care: anonymous posting is available and reflection can stay concrete."
            : "✅ Good — you can share openly, while still respecting others' choice to stay anonymous."}
        </div>
        <button onClick={() => onComplete(score)} className="p-2 px-4 bg-teal text-white font-bold rounded-lg text-sm hover:bg-teal/80">
          Continue
        </button>
      </div>
    </div>
  )
}
