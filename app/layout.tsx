import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SprintQuest — Gamified Agile Ceremonies",
  description: "Convert your Sprint Reviews and Retrospectives into a game. Earn Team XP, level up, unlock quests.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark text-white">{children}</body>
    </html>
  )
}
