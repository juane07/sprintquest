import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { buildFacilitatorPrompt, callGroq, extractJson, truncateEntries, CeremonySummary } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { ceremonyId } = await req.json()
    if (!ceremonyId) return NextResponse.json({ error: "ceremonyId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data: ceremony } = await supabase.from("Ceremony").select("id,status,gameMode,summary").eq("id", ceremonyId).single()
    if (!ceremony) return NextResponse.json({ error: "not found" }, { status: 404 })
    if (ceremony.status !== "completed") return NextResponse.json({ error: "ceremony not finished" }, { status: 400 })
    if (ceremony.summary) return NextResponse.json({ summary: ceremony.summary, actions: [], cached: true })
    const { data: comments } = await supabase
      .from("Comment")
      .select("category,content,author,anonymous")
      .eq("ceremonyId", ceremonyId)
      .order("createdAt")
      .limit(100)
    if (!comments || comments.length === 0) return NextResponse.json({ error: "no entries to summarize" }, { status: 400 })
    const { system, user } = buildFacilitatorPrompt(
      ceremony.gameMode,
      comments.map((c: any) => ({ category: c.category, content: truncateEntries(c.content, 400), author: c.anonymous ? "Anonymous" : c.author }))
    )
    const raw = await callGroq(system, truncateEntries(user, 8000))
    const parsed = extractJson<CeremonySummary>(raw)
    const summary = parsed?.summary ?? raw.slice(0, 1000)
    const actions = Array.isArray(parsed?.actions) ? parsed.actions.filter((a) => a && a.title).slice(0, 3) : []
    await supabase.from("Ceremony").update({ summary }).eq("id", ceremonyId)
    return NextResponse.json({ summary, actions })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "summarize failed" }, { status: 500 })
  }
}
