import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SprintQuest — Sprint Retrospective",
  description: "Inspect the sprint, agree on improvements, and carry them into the next sprint.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark text-white font-body antialiased">{children}</body>
    </html>
  )
}
