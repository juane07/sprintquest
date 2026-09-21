// Presentational minigame boards. All cooperative: progress is always TEAM progress,
// never an individual leaderboard.
export function SnailGame({ progress, target, tappers, onTap }: { progress: number; target: number; tappers: number; onTap: () => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1"><span>🐢 team snail</span><span>{tappers} tapping · {progress}/{target}</span></div>
      <div className="h-6 rounded-full bg-dark border border-gray-700 mb-1 relative overflow-hidden">
        <div className="h-full bg-teal transition-all" style={{ width: `${Math.min(100, (progress / target) * 100)}%` }} />
        <span className="absolute left-2 top-0 text-sm">🐢</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">The bar drains every second — only sustained tapping by everyone wins.</p>
      <button onClick={onTap} className="w-full p-4 bg-teal text-white text-xl font-bold rounded-lg active:scale-95">TAP 🐢</button>
    </div>
  )
}

export function WhackGame({ squashed, target, seed, onTap }: { squashed: number; target: number; seed: number; onTap: (cell: number) => void }) {
  // deterministic bug placement from seed + progress: the grid feels alive on every tap
  const bugs = new Set<number>()
  let s = (seed * 31 + squashed * 101) | 0
  const rnd = () => { s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) | 0; return Math.abs(s) % 12 }
  while (bugs.size < 5) bugs.add(rnd())
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-2"><span>🔨 bugs squashed together</span><span>{squashed}/{target}</span></div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Array.from({ length: 12 }, (_, i) => (
          <button key={i} onClick={() => bugs.has(i) && onTap(i)} className={`aspect-square rounded-lg text-3xl border ${bugs.has(i) ? "border-red-500 bg-red-900/30 hover:scale-105" : "border-gray-800 bg-dark/50"}`}>
            {bugs.has(i) ? "🐞" : ""}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">Tap the bugs — every squash counts for the whole team.</p>
    </div>
  )
}

export function TugGame({ a, b, target, myTeam, onPull }: { a: number; b: number; target: number; myTeam: "A" | "B"; onPull: () => void }) {
  const total = Math.max(1, a + b)
  const pctA = (a / total) * 100
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1"><span>🟩 Team Sprout (you: {myTeam})</span><span>🟪 Team Comet</span></div>
      <div className="h-6 rounded-full bg-purple-900/60 border border-gray-700 mb-1 relative overflow-hidden">
        <div className="h-full bg-green-600 transition-all" style={{ width: `${pctA}%` }} />
        <span className="absolute left-1/2 -translate-x-1/2 top-0">🪢</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 text-center">{a} vs {b} · first side to {target} with the lead wins — prize shared by all.</p>
      <button onClick={onPull} className="w-full p-4 bg-gold text-black text-xl font-bold rounded-lg active:scale-95">PULL 🪢</button>
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
