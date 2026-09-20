import type { Metadata } from "next"
import "./globals.css"
import PwaRegister from "@/components/PwaRegister"

export const metadata: Metadata = {
  title: "SprintQuest — Gamified Agile Ceremonies",
  description: "Convert your Sprint Reviews and Retrospectives into a game. Earn Team XP, level up, unlock quests.",
  themeColor: "#0f0f23",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SprintQuest" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark text-white"><PwaRegister />{children}</body>
    </html>
  )
}
