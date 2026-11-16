import type { Metadata } from "next"
import "./globals.css"
import { Bricolage_Grotesque, Manrope } from "next/font/google"
import PwaRegister from "@/components/PwaRegister"
import AuthProvider from "@/components/AuthProvider"

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700", "800"],
})

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "SprintQuest — Gamified Agile Ceremonies",
  description: "Convert your Sprint Reviews and Retrospectives into a learning game grounded in neuroscience. Engagement metrics, spaced retrieval, structured reflection.",
  themeColor: "#0b1020",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SprintQuest" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable}`}>
      <body className="bg-dark text-white font-body antialiased">
        <PwaRegister />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
