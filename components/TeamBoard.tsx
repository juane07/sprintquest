"use client"
import { BOARD_STEPS, DEPTH_BOOSTERS, BOARD_COPY, type DepthBooster } from "../constants"

interface TeamBoardProps {
  round: number
  totalRounds: number
  entriesCount: number
  enabled: boolean
  onToggle: (v: boolean) => void
  usedBoosters: Record<string, boolean>
  onUseBooster: (b: DepthBooster) => void
  activeBoosterNote: string | null
}

export function boardPositionForRound(round: number, totalRounds: number): number {
  // Map N mode rounds onto 5 board steps. Clamp, never throws.
  if (totalRounds <= 1) return 0
  const t = Math.min(Math.max(round, 1), totalRounds)
  return Math.min(BOARD_STEPS.length - 1, Math.floor(((t - 1) / (totalRounds - 1)) * (BOARD_STEPS.length - 1)))
}

export function canAdvance(entriesCount: number): boolean {
  return entriesCount >= 3
}

export default function TeamBoard({
  round, totalRounds, entriesCount, enabled, onToggle, usedBoosters, onUseBooster, activeBoosterNote,
}: TeamBoardProps) {
  const pos = boardPositionForRound(round, totalRounds)
  return (
    <section aria-label="Team journey board" className="glass rounded-xl p-4 mb-6">
      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
        <p className="font-bold">🗺️ Team Journey Board <span className="text-xs font-normal text-gray-400">· {BOARD_COPY.tagline}</span></p>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} aria-label="Toggle board view" />
          Board view
        </label>
      </div>
      {enabled ? (
        <>
          <ol className="grid grid-cols-5 gap-1 sm:gap-2" role="list">
            {BOARD_STEPS.map((s, i) => {
              const done = i < pos
              const here = i === pos
              return (
                <li
                  key={s.id}
                  aria-current={here ? "step" : undefined}
                  className={`rounded-lg p-2 text-center border text-xs sm:text-sm ${here ? "border-gold bg-gold/10 font-bold" : done ? "border-teal/60 text-teal" : "border-gray-700 text-gray-400"}`}
                  title={s.hint}
                >
                  <div className="text-lg" aria-hidden>{here ? "👥" : s.emoji}</div>
                  <div>{s.label}</div>
                  {here && <div className="text-[10px] text-gold">team here</div>}
                  {done && <div className="text-[10px]">✓</div>}
                </li>
              )
            })}
          </ol>
          <p className="text-[11px] text-gray-500 mt-2">One team token · No dice for advancing · Moving gives 0 XP · {entriesCount} team entries</p>
          {!canAdvance(entriesCount) && round < totalRounds && (
            <p className="text-[11px] text-gold mt-1">{BOARD_COPY.advanceBlocked}</p>
          )}
          <div className="flex gap-2 mt-3 flex-wrap" aria-label="Depth boosters">
            {DEPTH_BOOSTERS.map((b) => {
              const used = !!usedBoosters[b.id]
              return (
                <button
                  key={b.id}
                  disabled={used}
                  onClick={() => onUseBooster(b)}
                  title={b.desc}
                  className={`text-xs px-3 py-1.5 rounded-full border ${used ? "border-gray-700 text-gray-600" : "border-teal text-teal hover:bg-teal hover:text-white"}`}
                >
                  {b.emoji} {b.label}{used ? " ✓" : ""}
                </button>
              )
            })}
          </div>
          {activeBoosterNote && (
            <p className="text-xs text-teal mt-2" role="status">{activeBoosterNote}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-500">Board hidden — classic retro view. Enable anytime, nothing is lost.</p>
      )}
    </section>
  )
}
