import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sprintId, promptType, answered, answer } = body

    if (!sprintId || typeof sprintId !== "string") return NextResponse.json({ error: "Invalid sprintId" }, { status: 400 })
    if (!promptType || typeof promptType !== "string") return NextResponse.json({ error: "Invalid promptType" }, { status: 400 })

    const supabase = getSupabase()
    const { data, error } = await supabase.from("RetrievalSession").insert({ sprintId, promptType, answered: answered ?? false, answer: answer ?? null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "retrieval failed" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sprintId = searchParams.get("sprintId")
    if (!sprintId) return NextResponse.json({ error: "sprintId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data, error } = await supabase.from("RetrievalSession").select("*").eq("sprintId", sprintId).order("createdAt", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to fetch retrieval sessions" }, { status: 500 })
  }
}
