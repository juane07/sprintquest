"use client"
import { useMemo } from "react"
import { MapTile, MapTileType, SprintMap, getSprintMapSummary } from "./legacy-sprint-map"

const TILE_EMOJIS: Record<MapTileType, string> = {
  wind: "🌬️",
  anchor: "⚓",
  boss: "👹",
  bridge: "🌉",
  insight: "💡",
  quest: "🎯",
  rock: "🪨",
  star: "⭐",
}

const TILE_COLORS: Record<MapTileType, string> = {
  wind: "border-green-500/30 bg-green-500/5",
  anchor: "border-blue-500/30 bg-blue-500/5",
  boss: "border-red-500/30 bg-red-500/5",
  bridge: "border-purple-500/30 bg-purple-500/5",
  insight: "border-yellow-500/30 bg-yellow-500/5",
  quest: "border-teal-500/30 bg-teal-500/5",
  rock: "border-gray-500/30 bg-gray-500/5",
  star: "border-gold/30 bg-gold/5",
}

interface LegacySprintMapProps {
  map: SprintMap
}

export default function LegacySprintMap({ map }: LegacySprintMapProps) {
  const summary = useMemo(() => getSprintMapSummary(map), [map])

  return (
    <div className="glass rounded-xl p-6 mb-6 border-gold/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">🗺️ Legacy Sprint Map</h3>
        <span className="text-sm text-gray-400">{map.sprintsCompleted} sprints mapped</span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: "Winds", value: summary.winds, emoji: "🌬️" },
          { label: "Anchors", value: summary.anchors, emoji: "⚓" },
          { label: "Bosses", value: summary.bosses, emoji: "👹" },
          { label: "Bridges", value: summary.bridges, emoji: "🌉" },
          { label: "Insights", value: summary.insights, emoji: "💡" },
          { label: "Quests", value: summary.quests, emoji: "🎯" },
          { label: "Risks", value: summary.rocks, emoji: "🪨" },
          { label: "Stars", value: summary.stars, emoji: "⭐" },
        ].map(item => (
          <div key={item.label} className="text-center bg-dark/30 rounded-lg p-2">
            <div className="text-xl">{item.emoji}</div>
            <div className="text-lg font-bold">{item.value}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
      {summary.recurringThemes.length > 0 && (
        <div className="mb-4 bg-dark/50 rounded-lg p-4 border border-gold/20">
          <p className="text-sm text-gold font-bold mb-2">🔄 Recurring Patterns Detected:</p>
          {summary.recurringThemes.map((theme, i) => (
            <div key={i} className="text-sm text-gray-300">• {theme}</div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {map.tiles.slice(-12).reverse().map(tile => (
          <div key={tile.id} className={`rounded-lg p-3 border ${TILE_COLORS[tile.type]}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{TILE_EMOJIS[tile.type]}</span>
              <span className="font-bold text-sm">{tile.title}</span>
              <span className="text-xs text-gray-500 ml-auto">Sprint {tile.sprintNumber}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{tile.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
