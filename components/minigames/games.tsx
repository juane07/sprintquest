// Presentational minigame boards. All cooperative: progress is always TEAM progress,
// never an individual leaderboard.
export function SnailGame({ progress, target, entries, onTap }: { progress: number; target: number; entries: number; onTap: () => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1"><span>🐢 team snail · {entries} entries posted</span><span>{progress}/{target}</span></div>
      <div className="h-6 rounded-full bg-dark border border-gray-700 mb-1 relative overflow-hidden">
        <div className="h-full bg-teal transition-all" style={{ width: `${Math.min(100, (progress / target) * 100)}%` }} />
        <span className="absolute left-2 top-0 text-sm">🐢</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">Each entry moves the snail 5 steps. Taps sustain it — the bar drains every second.</p>
      <button onClick={onTap} className="w-full p-4 bg-teal text-white text-xl font-bold rounded-lg active:scale-95">TAP 🐢</button>
    </div>
  )
}

export function WhackGame({ bugs, squashed, onTap }: { bugs: { id: string; label: string }[]; squashed: string[]; onTap: (id: string) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-2"><span>🔨 squash every entry with 👍</span><span>{squashed.length}/{bugs.length} confirmed</span></div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {bugs.map((b) => {
          const done = squashed.includes(b.id)
          return (
            <button key={b.id} onClick={() => !done && onTap(b.id)} className={`text-left p-2 rounded-lg text-xs border ${done ? "border-teal bg-teal/10 line-through text-gray-500" : "border-red-500/60 bg-red-900/20 hover:scale-[1.02] text-gray-200"}`}>
              {done ? "✅ " : "🐞 "}{b.label.slice(0, 60)}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-500">Squashing = a real 👍 on that entry. When all are squashed, the board is prioritized.</p>
    </div>
  )
}

export function TugGame({ a, b, labelA, labelB, target, onPull }: { a: number; b: number; labelA: string; labelB: string; target: number; onPull: (side: "A" | "B") => void }) {
  const total = Math.max(1, a + b)
  const pctA = (a / total) * 100
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button onClick={() => onPull("A")} className="text-left p-2 rounded-lg border border-green-700 bg-green-900/20 hover:border-green-500 text-xs"><span className="font-bold text-green-300">🟩 Pull ({a})</span><br />{labelA.slice(0, 70)}</button>
        <button onClick={() => onPull("B")} className="text-left p-2 rounded-lg border border-purple-700 bg-purple-900/20 hover:border-purple-500 text-xs"><span className="font-bold text-purple-300">🟪 Pull ({b})</span><br />{labelB.slice(0, 70)}</button>
      </div>
      <div className="h-6 rounded-full bg-purple-900/60 border border-gray-700 mb-1 relative overflow-hidden">
        <div className="h-full bg-green-600 transition-all" style={{ width: `${pctA}%` }} />
        <span className="absolute left-1/2 -translate-x-1/2 top-0">🪢</span>
      </div>
      <p className="text-xs text-gray-500 text-center">First side to {target} 👍 with the lead wins — and becomes an action item.</p>
    </div>
  )
}

export function MemoryGame({ deck, revealed, onFlip }: { deck: string[]; revealed: boolean[]; onFlip: (i: number) => void }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">🎁 Flip chests together — a pair stays open only when BOTH are flipped.</p>
      <div className="grid grid-cols-4 gap-2">
        {deck.map((t, i) => (
          <button key={i} onClick={() => !revealed[i] && onFlip(i)} className={`aspect-square rounded-lg text-xs p-1 border overflow-hidden ${revealed[i] ? "border-teal bg-teal/10 text-white" : "border-gray-700 bg-dark hover:border-gold text-3xl"}`}>
            {revealed[i] ? t.slice(0, 40) : "🎁"}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PollGame({ question, opts, counts, onVote, myVote }: { question: string; opts: string[]; counts: number[]; onVote: (i: number) => void; myVote: number | null }) {
  const total = Math.max(1, counts.reduce((s, c) => s + c, 0))
  return (
    <div>
      <p className="font-bold mb-3">⚡ {question}</p>
      <div className="space-y-2">
        {opts.map((o, i) => (
          <button key={i} onClick={() => onVote(i)} className={`w-full text-left p-3 rounded-lg border ${myVote === i ? "border-gold bg-gold/10" : "border-gray-700 hover:border-teal"}`}>
            <div className="flex justify-between text-sm mb-1"><span>{o}</span><span className="text-gold font-bold">{counts[i] ?? 0}</span></div>
            <div className="h-1.5 rounded-full bg-dark"><div className="h-full rounded-full bg-teal" style={{ width: `${((counts[i] ?? 0) / total) * 100}%` }} /></div>
          </button>
        ))}
      </div>
    </div>
  )
}
