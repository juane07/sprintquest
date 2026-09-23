"use client"
import { useState } from "react"
import { MASTERY_CARDS, MasteryDeck, MasteryCard, getMasteryLevel, getMasteryLabel } from "./mastery-deck"

interface MasteryDeckProps {
  teamId: string
  initialDeck?: MasteryDeck
}

export default function MasteryDeckDisplay({ teamId, initialDeck }: MasteryDeckProps) {
  const [deck] = useState<MasteryDeck>(initialDeck || { teamId, cards: [...MASTERY_CARDS], sprintCount: 0 })
  const [showUnlocked, setShowUnlocked] = useState(true)
  const unlockedCount = deck.cards.filter(c => c.unlocked).length
  const level = getMasteryLevel(deck)
  const label = getMasteryLabel(level)

  return (
    <div className="glass rounded-xl p-6 mb-6 border-gold/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">🏆 Mastery Deck</h3>
        <span className="text-sm bg-gold/20 text-gold px-3 py-1 rounded-full font-bold">
          {label} ({unlockedCount}/{deck.cards.length})
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">Cards unlock when the team demonstrates specific behaviors — not participation.</p>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowUnlocked(true)}
          className={`px-3 py-1 rounded-lg text-sm font-bold ${showUnlocked ? "bg-gold text-black" : "bg-dark text-gray-400"}`}
        >
          Unlocked ({unlockedCount})
        </button>
        <button
          onClick={() => setShowUnlocked(false)}
          className={`px-3 py-1 rounded-lg text-sm font-bold ${!showUnlocked ? "bg-gold text-black" : "bg-dark text-gray-400"}`}
        >
          All ({deck.cards.length})
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {deck.cards.map(card => {
          const visible = showUnlocked ? card.unlocked : true
          if (!visible) return null
          return (
            <div
              key={card.id}
              className={`rounded-lg p-3 text-center border ${
                card.unlocked ? "border-gold/50 bg-gold/5" : "border-gray-700 bg-dark/30 opacity-40"
              }`}
            >
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="text-xs font-bold">{card.name}</div>
              <div className="text-xs text-gray-500 mt-1">{card.description}</div>
              {card.unlocked && <div className="text-xs text-gold mt-1">✓ Unlocked</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
