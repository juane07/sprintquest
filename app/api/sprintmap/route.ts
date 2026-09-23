import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { BOARD_CATEGORY, boardCommentToTile, boardTileToComment, buildSprintMapFromBoardComments, isTileType } from "@/components/legacy-sprint-map"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get("teamId")
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data: ceremonies, error: ceremonyError } = await supabase.from("Ceremony").select("id,sprintId,status").eq("teamId", teamId).order("startedAt", { ascending: true })
    if (ceremonyError) return NextResponse.json({ error: ceremonyError.message }, { status: 500 })
    const list = ceremonies ?? []
    const ids = list.map((c: any) => c.id)
    const { data: sprints, error: sprintError } = await supabase.from("Sprint").select("id,number").eq("teamId", teamId)
    if (sprintError) return NextResponse.json({ error: sprintError.message }, { status: 500 })
    if (ids.length === 0) return NextResponse.json({ success: true, data: buildSprintMapFromBoardComments(teamId, [], sprints ?? [], []) })
    const { data: comments, error: commentError } = await supabase.from("Comment").select("id,content,createdAt,ceremonyId").in("ceremonyId", ids).eq("category", BOARD_CATEGORY).order("createdAt", { ascending: true })
    if (commentError) return NextResponse.json({ error: commentError.message }, { status: 500 })
    return NextResponse.json({ success: true, data: buildSprintMapFromBoardComments(teamId, list, sprints ?? [], comments ?? []) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to fetch sprint map" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ceremonyId, type, title, description, sprintNumber } = body
    if (!ceremonyId || typeof ceremonyId !== "string") return NextResponse.json({ error: "ceremonyId required to pin a tile" }, { status: 400 })
    if (!isTileType(type)) return NextResponse.json({ error: "Invalid tile type" }, { status: 400 })
    if (!title || typeof title !== "string" || !title.trim()) return NextResponse.json({ error: "Invalid title" }, { status: 400 })
    if (title.trim().length > 120) return NextResponse.json({ error: "Title too long (max 120 chars)" }, { status: 400 })
    if (description && (typeof description !== "string" || description.length > 500)) return NextResponse.json({ error: "Invalid description" }, { status: 400 })
    const supabase = getSupabase()
    const content = boardTileToComment({ type, title: title.trim(), description: description?.trim() ?? "", sprintNumber: typeof sprintNumber === "number" ? sprintNumber : undefined })
    const { data, error } = await supabase.from("Comment").insert({ ceremonyId, content, author: "Sprint Map", anonymous: false, category: BOARD_CATEGORY }).select("id,content,createdAt,ceremonyId").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: boardCommentToTile(data, typeof sprintNumber === "number" ? sprintNumber : 1) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to add tile" }, { status: 500 })
  }
}
