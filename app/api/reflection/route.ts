import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ceremonyId, round, prompt, response, type } = body

    if (!ceremonyId || typeof ceremonyId !== "string") return NextResponse.json({ error: "Invalid ceremonyId" }, { status: 400 })
    if (typeof round !== "number" || round < 1) return NextResponse.json({ error: "Invalid round" }, { status: 400 })
    if (!prompt || typeof prompt !== "string") return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })

    const supabase = getSupabase()
    const { data, error } = await supabase.from("Reflection").insert({ ceremonyId, round, prompt, response: response ?? null, type: type ?? "metacognitive" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "reflection failed" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ceremonyId = searchParams.get("ceremonyId")
    if (!ceremonyId) return NextResponse.json({ error: "ceremonyId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data, error } = await supabase.from("Reflection").select("*").eq("ceremonyId", ceremonyId).order("createdAt", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to fetch reflections" }, { status: 500 })
  }
}
