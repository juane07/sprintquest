import { NextResponse } from "next/server"
import { jiraFetchInit } from "@/lib/jira"

// POST { issueKey } → transitions the Jira issue to a Done-category status.
// Best-effort companion to quest completion (XP is awarded regardless).
export async function POST(req: Request) {
  try {
    const { issueKey } = await req.json()
    if (!issueKey || !/^[A-Z][A-Z0-9]+-\d+$/.test(issueKey)) {
      return NextResponse.json({ error: "invalid issue key" }, { status: 400 })
    }
    const { site, headers } = jiraFetchInit()
    const tr = await fetch(`${site}/rest/api/3/issue/${issueKey}/transitions`, { headers })
    if (!tr.ok) return NextResponse.json({ error: `Jira error ${tr.status}` }, { status: 502 })
    const { transitions } = await tr.json()
    const done = (transitions ?? []).find((t: any) => t.to?.statusCategory?.key === "done")
    if (!done) return NextResponse.json({ error: "no Done transition available" }, { status: 400 })
    const ex = await fetch(`${site}/rest/api/3/issue/${issueKey}/transitions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ transition: { id: done.id } }),
    })
    if (!ex.ok) return NextResponse.json({ error: `Jira error ${ex.status}` }, { status: 502 })
    return NextResponse.json({ transitioned: true, to: done.name })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "jira transition failed" }, { status: 500 })
  }
}
