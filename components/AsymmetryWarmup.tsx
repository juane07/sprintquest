"use client"
import { useState } from "react"
import { generateAsymmetryCards, getAsymmetryPrompt, normalizePlayerCount } from "./asymmetry"
import type { AsymmetryPlayer } from "./asymmetry"

interface AsymmetryWarmupProps {
  sprintNumber: number
  playerCount: number
  onComplete: (answers: string[]) => void
}

export default function AsymmetryWarmup({ sprintNumber, playerCount, onComplete }: AsymmetryWarmupProps) {
  const [players] = useState<AsymmetryPlayer[]>(() => generateAsymmetryCards(sprintNumber, playerCount))
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [description, setDescription] = useState("")
  const [entries, setEntries] = useState<string[]>([])
  const [prompt] = useState(getAsymmetryPrompt(sprintNumber))
  const [phase, setPhase] = useState<"describe" | "guess" | "complete">("describe")
  const [completed, setCompleted] = useState(false)

  const safeCount = normalizePlayerCount(playerCount)
  const current = players[currentPlayer]

  const finish = (all: string[]) => {
    if (completed) return
    setCompleted(true)
    setPhase("complete")
    onComplete(all)
  }

  const handleDescribe = () => {
    const text = description.trim()
    if (!text || phase !== "describe") return
    const next = [...entries, text]
    setEntries(next)
    setDescription("")
    if (currentPlayer < safeCount - 1) {
      setCurrentPlayer(prev => prev + 1)
    } else {
      setPhase("guess")
    }
  }

  const handleGuess = () => {
    const text = description.trim()
    if (!text || phase !== "guess") return
    const next = [...entries, text]
    setEntries(next)
    setDescription("")
    if (next.length >= safeCount * 2) finish(next)
  }

  return (
    <div className="glass rounded-xl p-6 mb-6 border-gold/20">
      <h3 className="font-bold text-lg mb-2">🃏 Hanabi Warm-Up</h3>
      <p className="text-sm text-gray-400 mb-4">
        Each teammate holds cards from past sprints they can&apos;t show others. Describe them verbally so the team can reconstruct what was committed.
      </p>
      <div className="bg-dark/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gold font-bold">📋 Round {Math.min(currentPlayer + 1, safeCount)}/{safeCount}</p>
        <p className="text-sm text-gray-300 mt-2">{prompt}</p>
      </div>
      {phase === "describe" && current && (
        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            <span className="text-gold font-bold">{current.playerName}</span> — Describe your card without revealing the commitment:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the challenge, outcome, or context..."
              className="flex-1 p-3 rounded bg-dark border border-gray-600 text-white placeholder-gray-400"
              onKeyDown={e => e.key === "Enter" && handleDescribe()}
            />
            <button onClick={handleDescribe} className="p-3 px-5 bg-gold text-black font-bold rounded-lg hover:bg-yellow-400 transition">
              Describe
            </button>
          </div>
        </div>
      )}
      {phase === "guess" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Team, what commitments do you recall from the descriptions?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What commitment do you recall?"
              className="flex-1 p-3 rounded bg-dark border border-gray-600 text-white placeholder-gray-400"
              onKeyDown={e => e.key === "Enter" && handleGuess()}
            />
            <button onClick={handleGuess} className="p-3 px-5 bg-teal text-white font-bold rounded-lg hover:bg-teal/80 transition">
              Submit Guess
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {entries.map((g, i) => (
              <div key={i} className="text-sm bg-dark/50 rounded p-2">
                <span className="text-gold">💬</span> {g}
              </div>
            ))}
          </div>
        </div>
      )}
      {phase === "complete" && (
        <div className="text-center p-4">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-teal">Spaced retrieval complete! Team reconstructed {entries.length} past commitments.</p>
        </div>
      )}
    </div>
  )
}
