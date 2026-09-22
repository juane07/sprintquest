"use client"
import { useEffect, useState } from "react"
import { detectPatterns, getFacilitationSuggestion } from "@/lib/ai"

interface Entry {
  category: string
  content: string
}

interface AIFacilitatorProps {
  entries: Entry[]
  round: number
  totalRounds: number
}

export default function AIFacilitator({ entries, round, totalRounds }: AIFacilitatorProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [patterns, setPatterns] = useState<{ topic: string; count: number; suggestion: string }[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (entries.length < 2) return
    const detected = detectPatterns(entries)
    setPatterns(detected)
    const suggestion = getFacilitationSuggestion(entries, round, totalRounds)
    if (suggestion) setSuggestions([suggestion])
  }, [entries, round, totalRounds])

  if (entries.length < 2 && !collapsed) {
    return (
      <div className="glass rounded-xl p-4 mb-4 border-gray-700 opacity-50">
        <p className="text-sm text-gray-500">🤖 AI will appear when 2+ entries are shared</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-4 mb-4 border-gold/20">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex justify-between items-center">
        <p className="text-sm text-gold font-bold">🤖 Game Master Insights</p>
        <span className="text-xs text-gray-500">{collapsed ? "Show" : "Hide"}</span>
      </button>
      {!collapsed && (
        <div className="mt-3 space-y-2">
          {suggestions.map((s, i) => (
            <div key={i} className="text-sm text-gray-300 bg-dark/50 rounded p-2">{s}</div>
          ))}
          {patterns.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Detected patterns:</p>
              {patterns.map((p, i) => (
                <div key={i} className="text-xs text-gray-400 bg-dark/30 rounded p-1 mb-1">
                  <span className="text-gold font-bold">{p.topic}</span> ({p.count}x) — {p.suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
