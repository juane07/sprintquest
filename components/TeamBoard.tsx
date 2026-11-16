"use client"
import { BOARD_STEPS, DEPTH_BOOSTERS, BOARD_COPY, type DepthBooster } from "../constants"
import type { BoosterUsage } from "../lib/board"

// The shared-flow surface. Everything it shows — the team's square and what
// the team is waiting on — is derived from the shared ceremony log, so every
// device renders the same thing at the same moment. Nothing here is local to
// one browser.

interface TeamBoardProps {
  step: number
  playerEntries: number
  waiting: string | null
  enabled: boolean
  onToggle: (v: boolean) => void
  usage: BoosterUsage
  onUseBooster: (b: DepthBooster) => void
  activeNote: string | null
  onAdvance?: () => void
  advanceLabel?: string
}

export default function TeamBoard({
  step, playerEntries: playerCount, waiting, enabled, onToggle, usage,
  onUseBooster, activeNote, onAdvance, advanceLabel,
}: TeamBoardProps) {
  const pos = Math.min(Math.max(step, 0), BOARD_STEPS.length - 1)
  const usedMap: Record<string, boolean> = { lupa: usage.lupa, "doble-porque": usage.pourquoi, puente: usage.puente }
  const here = BOARD_STEPS[pos]
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
              const isHere = i === pos
              return (
                <li
                  key={s.id}
                  aria-current={isHere ? "step" : undefined}
                  className={`rounded-lg p-2 text-center border text-xs sm:text-sm ${isHere ? "border-gold bg-gold/10 font-bold" : done ? "border-teal/60 text-teal" : "border-gray-700 text-gray-400"}`}
                  title={s.hint}
                >
                  <div className="text-lg" aria-hidden>{isHere ? "👥" : s.emoji}</div>
                  <div>{s.label}</div>
                  {isHere && <div className="text-[10px] text-gold">team here</div>}
                  {done && <div className="text-[10px]">✓</div>}
                </li>
              )
            })}
          </ol>

          {/* Shared status: identical on every device, read from the ceremony log. */}
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-xs flex flex-wrap items-center gap-x-2 gap-y-1 ${waiting ? "border-gold/40 bg-gold/5 text-gold" : "border-teal/40 bg-teal/5 text-teal"}`}
            role="status"
            aria-live="polite"
          >
            <span className="font-bold">{waiting ? "⏳" : "✅"}</span>
            <span className="font-bold">{waiting ?? "Ready — the team can move"}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-300">{here?.label}: {here?.hint}</span>
          </div>

          <p className="text-[11px] text-gray-500 mt-2">One team token · Shared by the whole room · No dice for advancing · Moving gives 0 XP · {playerCount} team entries</p>
          {onAdvance && (
            <div className="mt-3">
              <button onClick={onAdvance} className="w-full sm:w-auto px-5 py-2.5 bg-teal text-white font-bold rounded-lg hover:bg-teal/80">
                {advanceLabel}
              </button>
            </div>
          )}
          <div className="flex gap-2 mt-3 flex-wrap" aria-label="Depth boosters">
            {DEPTH_BOOSTERS.map((b) => {
              const used = !!usedMap[b.id]
              return (
                <button
                  key={b.id}
                  disabled={used}
                  onClick={() => onUseBooster(b)}
                  title={used ? "Already used this ceremony (1 use each)" : b.desc}
                  className={`text-xs px-3 py-1.5 rounded-full border ${used ? "border-gray-700 text-gray-600" : "border-teal text-teal hover:bg-teal hover:text-white"}`}
                >
                  {b.emoji} {b.label}{used ? " ✓" : ""}
                </button>
              )
            })}
          </div>
          {activeNote && (
            <p className="text-xs text-teal mt-2" role="status">{activeNote}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500">Board hidden — classic retro view. Core actions remain available.</p>
          <div
            className={`mt-2 rounded-lg border px-3 py-2 text-xs font-bold flex flex-wrap items-center gap-2 ${waiting ? "border-gold/40 bg-gold/5 text-gold" : "border-teal/40 bg-teal/5 text-teal"}`}
            role="status"
            aria-live="polite"
          >
            <span className="font-bold">{waiting ? "⏳" : "✅"}</span>
            {waiting ? ` ${waiting}` : ` Square ${pos + 1} of ${BOARD_STEPS.length} — ${BOARD_STEPS[pos].label} · Ready — the team can move`}
          </div>
          {onAdvance && (
            <div className="mt-3">
              <button onClick={onAdvance} className="w-full sm:w-auto px-5 py-2.5 bg-teal text-white font-bold rounded-lg hover:bg-teal/80">
                {advanceLabel}
              </button>
            </div>
          )}
          <div className="flex gap-2 mt-3 flex-wrap" aria-label="Depth boosters">
            {DEPTH_BOOSTERS.map((b) => {
              const used = !!usedMap[b.id]
              return (
                <button
                  key={b.id}
                  disabled={used}
                  onClick={() => onUseBooster(b)}
                  title={used ? "Already used this ceremony (1 use each)" : b.desc}
                  className={`text-xs px-3 py-1.5 rounded-full border ${used ? "border-gray-700 text-gray-600" : "border-teal text-teal hover:bg-teal hover:text-white"}`}
                >
                  {b.emoji} {b.label}{used ? " ✓" : ""}
                </button>
              )
            })}
          </div>
          {activeNote && (
            <p className="text-xs text-teal mt-2" role="status">{activeNote}</p>
          )}
        </>
      )}
    </section>
  )
}