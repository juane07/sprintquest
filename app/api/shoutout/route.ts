import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { teamId, toUser, message, ceremonyId } = body

    if (!teamId || typeof teamId !== "string") return NextResponse.json({ error: "Invalid teamId" }, { status: 400 })
    if (!toUser || typeof toUser !== "string" || toUser.trim().length === 0) return NextResponse.json({ error: "Invalid recipient" }, { status: 400 })
    if (!message || typeof message !== "string" || message.trim().length === 0) return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    if (message.trim().length > 500) return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 })
    if (toUser.trim().length > 50) return NextResponse.json({ error: "Recipient name too long" }, { status: 400 })

    const supabase = getSupabase()
    const { data, error } = await supabase.from("ShoutOut").insert({ teamId, toUser: toUser.trim(), message: message.trim(), ceremonyId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "shoutout failed" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data, error } = await supabase.from("ShoutOut").select("*").eq("teamId", teamId).order("createdAt", { ascending: false }).limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to fetch shoutouts" }, { status: 500 })
  }
}
