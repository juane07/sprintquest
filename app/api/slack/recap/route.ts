import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { buildCeremonyRecap, postToSlack } from "@/lib/slack"
import { MODE_CONFIG } from "@/constants"

// POST { ceremonyId, xp } → posts ceremony recap to Slack.
export async function POST(req: Request) {
  try {
    const { ceremonyId, xp } = await req.json()
    if (!ceremonyId) return NextResponse.json({ error: "ceremonyId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data: ceremony } = await supabase.from("Ceremony").select("id,type,gameMode,summary,teamId").eq("id", ceremonyId).single()
    if (!ceremony) return NextResponse.json({ error: "not found" }, { status: 404 })
    const { data: team } = await supabase.from("Team").select("name").eq("id", ceremony.teamId).single()
    const { count: entries } = await supabase.from("Comment").select("id", { count: "exact", head: true }).eq("ceremonyId", ceremonyId)
    const { count: openActions } = await supabase.from("Action").select("id", { count: "exact", head: true }).eq("ceremonyId", ceremonyId).neq("status", "completed")
    const label = ((MODE_CONFIG as any)[ceremony.gameMode]?.name ?? "Retro")
    await postToSlack(buildCeremonyRecap({
      teamName: team?.name ?? "Team",
      label,
      xp: xp ?? 0,
      entries: entries ?? 0,
      summary: ceremony.summary,
      openActions: openActions ?? 0,
    }))
    return NextResponse.json({ posted: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "slack recap failed" }, { status: 500 })
  }
}
