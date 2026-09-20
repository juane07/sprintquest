// Jira helpers. Credentials live only in server env (JIRA_SITE/EMAIL/TOKEN)
// and are never sent to the browser — all calls go through /api/jira/*.

export interface JiraIssue {
  key: string
  summary: string
  status: string
  type: string
  assignee: string | null
  url: string
}

// Open work in the project's active sprints (or backlog if none).
export function buildSprintJql(project: string): string {
  const p = project.trim().toUpperCase()
  return `project = ${p} AND sprint in openSprints() AND statusCategory != Done ORDER BY updated DESC`
}

export function sanitizeProjectKey(input: string): string | null {
  const key = input.trim().toUpperCase()
  return /^[A-Z][A-Z0-9]{1,9}$/.test(key) ? key : null
}

// Quest titles created from Jira start with the issue key ("PDC-123 ...").
export function parseIssueKey(title: string): string | null {
  const m = title.match(/^([A-Z][A-Z0-9]+-\d+)/)
  return m ? m[1] : null
}

export function jiraFetchInit(): { site: string; headers: Record<string, string> } {
  const site = process.env.JIRA_SITE
  const email = process.env.JIRA_EMAIL
  const token = process.env.JIRA_TOKEN
  if (!site || !email || !token) throw new Error("Jira not connected (missing server credentials)")
  const basic = Buffer.from(`${email}:${token}`).toString("base64")
  return { site: site.replace(/\/$/, ""), headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json", Accept: "application/json" } }
}

export function toJiraIssue(site: string, raw: any): JiraIssue {
  return {
    key: raw.key,
    summary: raw.fields?.summary ?? "(no summary)",
    status: raw.fields?.status?.name ?? "Unknown",
    type: raw.fields?.issuetype?.name ?? "Task",
    assignee: raw.fields?.assignee?.displayName ?? null,
    url: `${site}/browse/${raw.key}`,
  }
}
