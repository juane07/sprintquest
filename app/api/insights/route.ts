import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { buildInsightsPrompt, callGroq, extractJson, truncateEntries, TeamInsights } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { teamId } = await req.json()
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data: ceremonies } = await supabase
      .from("Ceremony")
      .select("id,gameMode,endedAt")
      .eq("teamId", teamId)
      .eq("status", "completed")
      .order("endedAt", { ascending: false })
      .limit(3)
    if (!ceremonies || ceremonies.length < 2) {
      return NextResponse.json({ error: "Need at least 2 finished ceremonies to detect patterns" }, { status: 400 })
    }
    const bundle = []
    for (const c of ceremonies) {
      const { data: comments } = await supabase
        .from("Comment")
        .select("category,content")
        .eq("ceremonyId", c.id)
        .order("createdAt")
        .limit(60)
      bundle.push({
        mode: c.gameMode,
        date: c.endedAt ? new Date(c.endedAt).toLocaleDateString() : "",
        entries: (comments ?? []).map((x: any) => ({ category: x.category, content: truncateEntries(x.content, 300) })),
      })
    }
    const { system, user } = buildInsightsPrompt(bundle)
    const raw = await callGroq(system, truncateEntries(user, 9000), 600)
    const parsed = extractJson<TeamInsights>(raw)
    return NextResponse.json({
      recurring: Array.isArray(parsed?.recurring) ? parsed.recurring.slice(0, 5) : [],
      suggestion: parsed?.suggestion ?? "",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "insights failed" }, { status: 500 })
  }
}
