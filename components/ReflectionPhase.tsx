"use client"
import { useState } from "react"
import { ReflectionPrompt } from "@/constants"

interface ReflectionPhaseProps {
  prompts: ReflectionPrompt[]
  round: number
  onComplete: () => void
}

export default function ReflectionPhase({ prompts, round, onComplete }: ReflectionPhaseProps) {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState(0)

  const prompt = prompts[currentPrompt]

  if (!prompt) return null

  const handleNext = () => {
    if (currentPrompt < prompts.length - 1) {
      setCurrentPrompt(currentPrompt + 1)
    } else {
      setSubmitted(true)
      setTimeout(onComplete, 500)
    }
  }

  return (
    <div className="glass rounded-xl p-6 mb-6 border-teal/30">
      <h3 className="font-bold mb-1 text-sm">🔍 Structured Reflection</h3>
      <p className="text-xs text-gray-500 mb-3">
        Round {round} · Prompt {currentPrompt + 1} of {prompts.length}
      </p>
      <p className="text-lg text-gray-100 mb-4">{prompt.question}</p>
      <span className="text-xs px-2 py-1 rounded-full bg-teal/20 text-teal mb-3 inline-block">
        {prompt.type === "metacognitive" && "🧠 Metacognitive"}
        {prompt.type === "elaborative" && "🔬 Elaborative"}
        {prompt.type === "evaluative" && "📊 Evaluative"}
        {prompt.type === "exploratory" && "🚀 Exploratory"}
      </span>
      <textarea
        value={responses[prompt.question] ?? ""}
        onChange={(e) => setResponses({ ...responses, [prompt.question]: e.target.value })}
        placeholder="Reflect here..."
        className="w-full p-3 rounded-lg bg-dark border border-gray-600 text-white placeholder-gray-400 mb-4 h-20 resize-none"
      />
      <div className="flex justify-between">
        {currentPrompt > 0 && (
          <button onClick={() => setCurrentPrompt(currentPrompt - 1)} className="p-2 border border-gray-600 rounded-lg text-gray-300 text-sm">← Previous</button>
        )}
        <button onClick={handleNext} className="p-2 px-4 bg-teal text-white font-bold rounded-lg text-sm hover:bg-teal/80">
          {currentPrompt < prompts.length - 1 ? "Next Prompt →" : "Complete Reflection ✓"}
        </button>
      </div>
    </div>
  )
}
