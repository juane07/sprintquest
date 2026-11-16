"use client"
import { useState } from "react"

interface NavTeam {
  id: string
  name?: string
  mascot?: string
}

import Logo from "./Logo"

export default function Navbar({ team }: { team?: NavTeam | null }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-dark/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <a href="/" aria-label="SprintQuest home" className="inline-flex items-center">
          <Logo size="sm" />
        </a>
        {team && (
          <>
            <span className="text-white/20">/</span>
            <a href={`/dashboard?team=${team.id}`} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">
              {team.mascot && <span className="text-lg">{team.mascot}</span>}
              <span className="font-semibold hidden sm:inline max-w-[180px] truncate">{team.name ?? "Team"}</span>
            </a>
          </>
        )}
        <div className="ml-auto flex items-center gap-1 text-sm">
          {team && (
            <>
              <a href={`/dashboard?team=${team.id}`} className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 hidden sm:inline">Dashboard</a>
              <button onClick={() => setOpen(!open)} className="sm:hidden px-3 py-1.5 rounded-lg text-gray-200 border border-white/15 bg-white/5">☰</button>
            </>
          )}
          <a href="/" className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 hidden sm:inline">Home</a>
        </div>
      </div>
      {open && team && (
        <div className="sm:hidden border-t border-white/10 px-4 py-2 flex flex-col gap-1 text-sm bg-dark/80 backdrop-blur-xl">
          <a href={`/dashboard?team=${team.id}`} className="px-3 py-2 rounded-lg text-gray-200 hover:bg-white/5">Dashboard</a>
          <a href="/" className="px-3 py-2 rounded-lg text-gray-200 hover:bg-white/5">Home</a>
        </div>
      )}
    </header>
  )
}
