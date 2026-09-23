import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { MASTERY_CARDS, buildDeckFromBadges, masteryStorageDescription } from "@/components/mastery-deck"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data, error } = await supabase.from("Badge").select("name,description,earnedAt").eq("teamId", teamId).order("earnedAt", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: buildDeckFromBadges(teamId, data ?? []) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to fetch mastery deck" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { teamId, cardId } = body
    if (!teamId || typeof teamId !== "string") return NextResponse.json({ error: "Invalid teamId" }, { status: 400 })
    if (!cardId || typeof cardId !== "string") return NextResponse.json({ error: "Invalid cardId" }, { status: 400 })
    const card = MASTERY_CARDS.find(c => c.id === cardId)
    if (!card) return NextResponse.json({ error: "Unknown mastery card" }, { status: 400 })
    const supabase = getSupabase()
    const { data: existing, error: lookupError } = await supabase.from("Badge").select("id").eq("teamId", teamId).eq("name", card.name).limit(1)
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
    if (existing && existing.length > 0) return NextResponse.json({ success: true, alreadyUnlocked: true })
    const { data, error } = await supabase.from("Badge").insert({ teamId, name: card.name, description: masteryStorageDescription(card) })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to add mastery card" }, { status: 500 })
  }
}
