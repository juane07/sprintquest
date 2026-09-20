import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { buildActionReminders, postToSlack } from "@/lib/slack"

// POST { teamId } → posts open action items digest to Slack.
export async function POST(req: Request) {
  try {
    const { teamId } = await req.json()
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data: team } = await supabase.from("Team").select("name").eq("id", teamId).single()
    if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 })
    const { data: ceremonies } = await supabase.from("Ceremony").select("id").eq("teamId", teamId)
    const ids = (ceremonies ?? []).map((c: any) => c.id)
    if (ids.length === 0) return NextResponse.json({ error: "no ceremonies yet" }, { status: 400 })
    const { data: actions } = await supabase
      .from("Action")
      .select("title,owner,dueDate,xpValue")
      .in("ceremonyId", ids)
      .neq("status", "completed")
      .order("dueDate", { ascending: true })
    if (!actions || actions.length === 0) return NextResponse.json({ error: "no open actions to remind" }, { status: 400 })
    await postToSlack(buildActionReminders(team.name, actions))
    return NextResponse.json({ posted: true, count: actions.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "slack remind failed" }, { status: 500 })
  }
}
