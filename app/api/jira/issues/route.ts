import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { buildSprintJql, jiraFetchInit, toJiraIssue } from "@/lib/jira"

// POST { teamId } → open sprint issues for the team's Jira project.
// Token stays server-side; the browser only sees issue summaries.
export async function POST(req: Request) {
  try {
    const { teamId } = await req.json()
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 })
    const supabase = getSupabase()
    const { data: team } = await supabase.from("Team").select("jiraProject").eq("id", teamId).single()
    if (!team?.jiraProject) return NextResponse.json({ error: "No Jira project linked to this team yet" }, { status: 400 })
    const { site, headers } = jiraFetchInit()
    const res = await fetch(`${site}/rest/api/3/search/jql`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jql: buildSprintJql(team.jiraProject),
        maxResults: 25,
        fields: ["summary", "status", "issuetype", "assignee"],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Jira error ${res.status}: ${text.slice(0, 200)}` }, { status: 502 })
    }
    const json = await res.json()
    return NextResponse.json({ issues: (json.issues ?? []).map((i: any) => toJiraIssue(site, i)) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "jira fetch failed" }, { status: 500 })
  }
}
