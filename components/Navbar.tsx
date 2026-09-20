"use client"
import { useState } from "react"

export interface NavTeam {
  id: string
  name?: string
  mascot?: string
}

export default function Navbar({ team }: { team?: NavTeam | null }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 bg-dark/90 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <a href="/" className="font-bold text-lg"><span className="text-gradient">SprintQuest</span></a>
        {team && (
          <>
            <span className="text-gray-600">/</span>
            <a href={`/dashboard?team=${team.id}`} className="flex items-center gap-2 hover:opacity-80">
              {team.mascot && <span className="text-xl">{team.mascot}</span>}
              <span className="font-bold hidden sm:inline">{team.name ?? "Team"}</span>
            </a>
          </>
        )}
        <div className="ml-auto flex items-center gap-1 text-sm">
          {team && (
            <>
              <a href={`/dashboard?team=${team.id}`} className="px-3 py-1.5 rounded-lg text-gray-300 hover:bg-navy-800 hidden sm:inline">Dashboard</a>
              <a href={`/history?team=${team.id}`} className="px-3 py-1.5 rounded-lg text-gray-300 hover:bg-navy-800 hidden sm:inline">History</a>
              <button onClick={() => setOpen(!open)} className="sm:hidden px-3 py-1.5 rounded-lg text-gray-300 border border-gray-700">☰</button>
            </>
          )}
          <a href="/" className="px-3 py-1.5 rounded-lg text-gray-300 hover:bg-navy-800 hidden sm:inline">Home</a>
        </div>
      </div>
      {open && team && (
        <div className="sm:hidden border-t border-gray-800 px-4 py-2 flex flex-col gap-1 text-sm">
          <a href={`/dashboard?team=${team.id}`} className="px-3 py-2 rounded-lg text-gray-300 hover:bg-navy-800">Dashboard</a>
          <a href={`/history?team=${team.id}`} className="px-3 py-2 rounded-lg text-gray-300 hover:bg-navy-800">History</a>
          <a href="/" className="px-3 py-2 rounded-lg text-gray-300 hover:bg-navy-800">Home</a>
        </div>
      )}
    </header>
  )
}
