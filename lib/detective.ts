// Detective mechanics: accusations per suspect, ranked case board.
export const ACCUSE_EMOJI = "⚖️"

export interface SuspectRank {
  id: string
  content: string
  accusations: number
}

export function rankSuspects(
  suspects: { id: string; content: string }[],
  accusations: { commentId: string; userId: string }[]
): SuspectRank[] {
  const byId = new Map<string, Set<string>>()
  for (const a of accusations) {
    if (!byId.has(a.commentId)) byId.set(a.commentId, new Set())
    byId.get(a.commentId)!.add(a.userId)
  }
  return suspects
    .map((s) => ({ id: s.id, content: s.content, accusations: byId.get(s.id)?.size ?? 0 }))
    .sort((a, b) => b.accusations - a.accusations)
}

export function majorityThreshold(totalVoters: number): number {
  return Math.floor(Math.max(0, totalVoters) / 2) + 1
}
