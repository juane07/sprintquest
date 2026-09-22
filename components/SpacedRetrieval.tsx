"use client"
import { useState } from "react"
import { RETRIEVAL_PROMPTS } from "@/constants"
import { getRetrievalPrompt } from "@/lib/learning-science"

interface SpacedRetrievalProps {
  sprintNumber: number
  onComplete: (answer: string) => void
}

export default function SpacedRetrieval({ sprintNumber, onComplete }: SpacedRetrievalProps) {
  const [answer, setAnswer] = useState("")
  const [shown, setShown] = useState(false)
  const data = getRetrievalPrompt(sprintNumber)
  const prompts = RETRIEVAL_PROMPTS[data.type] ?? RETRIEVAL_PROMPTS.early
  const prompt = prompts[Math.min(prompts.length - 1, sprintNumber - 1)]?.prompt ?? data.prompt

  if (shown) {
    return (
      <div className="glass rounded-xl p-6 mb-6 border-gold/30">
        <h3 className="font-bold mb-2 text-sm">🧠 Spaced Retrieval Warm-Up</h3>
        <p className="text-sm text-gray-400 mb-3">
          {sprintNumber <= 2
            ? "First time here? No prior sprint to recall — let's start fresh."
            : `Sprint ${sprintNumber}. Recall what matters.`}
        </p>
        {sprintNumber > 1 && (
          <>
            <p className="text-lg text-gray-100 mb-4">{prompt}</p>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Jot your recall here..."
              className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-3 h-20 resize-none"
            />
            <button
              onClick={() => { onComplete(answer); setShown(false) }}
              className="w-full p-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400"
            >
              Done — Continue to retro
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setShown(true)}
      className="w-full glass rounded-xl p-4 mb-6 text-left hover:border-gold transition cursor-pointer"
    >
      <p className="text-sm text-gold font-bold">🧠 Recall First</p>
      <p className="text-sm text-gray-400">
        {sprintNumber <= 2
          ? "Click to skip warm-up — first sprint"
          : `Sprint ${sprintNumber}: Quick recall before we dive in`}
      </p>
    </button>
  )
}
