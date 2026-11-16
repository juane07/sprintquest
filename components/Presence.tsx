"use client"

// Presence is tracked on the ceremony's own realtime channel by the page, so
// the room costs one socket instead of two. This component is presentational:
// it renders who is in the room without naming or ranking anyone — social
// comparison activates the brain's loss-detection circuits, and there are no
// individual leaderboards here.

interface PresenceProps {
  count: number
}

const MAX_DOTS = 6

export default function Presence({ count }: PresenceProps) {
  const shown = Math.max(1, count)
  const dots = Math.min(shown, MAX_DOTS)
  const rest = shown - dots
  return (
    <span
      className="bg-teal/20 text-teal px-3 py-1 rounded-full text-sm font-bold inline-flex items-center gap-1"
      role="status"
      aria-label={`${shown} in the room`}
      title={`${shown} in the room right now`}
    >
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} aria-hidden className="inline-block w-2 h-2 rounded-full bg-teal" />
      ))}
      {rest > 0 && <span aria-hidden className="text-teal/70">+{rest}</span>}
      <span className="ml-1">{shown} here</span>
    </span>
  )
}