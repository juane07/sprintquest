// Slack helpers. The webhook URL lives only in server env (SLACK_WEBHOOK_URL)
// and is never sent to the browser — all posts go through /api/slack/*.

interface ActionDigest {
  title: string
  owner: string
  dueDate: string | null
  xpValue: number | null
}

export function buildActionReminders(teamName: string, actions: ActionDigest[]): string {
  const lines = actions.map((a) => {
    const due = a.dueDate ? ` (due ${new Date(a.dueDate).toLocaleDateString()})` : ""
    const overdue = a.dueDate && new Date(a.dueDate).getTime() < Date.now() ? " ⏰ OVERDUE" : ""
    return `• *${a.title}* — ${a.owner}${due}${overdue} (+${a.xpValue ?? 50} XP)`
  })
  return `:swords: *${teamName} — open action items (${actions.length})*\n${lines.join("\n")}\n_Check them off in your team dashboard to claim the XP._`
}

export function buildCeremonyRecap(opts: {
  teamName: string
  label: string
  xp: number
  entries: number
  summary?: string | null
  openActions?: number
}): string {
  const parts = [
    `:tada: *${opts.teamName} finished ${opts.label}!* +${opts.xp} Team XP (${opts.entries} entries shared)`,
  ]
  if (opts.summary) parts.push(`> ${opts.summary}`)
  if (opts.openActions && opts.openActions > 0) parts.push(`_${opts.openActions} open action item${opts.openActions === 1 ? "" : "s"} carried forward._`)
  return parts.join("\n")
}

export async function postToSlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) throw new Error("Slack not connected (missing webhook)")
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Slack error ${res.status}`)
}
