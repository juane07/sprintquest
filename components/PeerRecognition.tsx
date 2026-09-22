"use client"
import { useState } from "react"

interface PeerRecognitionProps {
  teamId: string
  ceremonyId?: string
}

export default function PeerRecognition({ teamId, ceremonyId }: PeerRecognitionProps) {
  const [message, setMessage] = useState("")
  const [recipient, setRecipient] = useState("")
  const [posted, setPosted] = useState(false)
  const [shoutouts, setShoutouts] = useState<{ from: string; to: string; message: string }[]>([])

  const handlePost = async () => {
    if (!message.trim() || !recipient.trim()) return
    try {
      const res = await fetch("/api/shoutout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, toUser: recipient.trim(), message: message.trim(), ceremonyId }),
      })
      if (res.ok) {
        setShoutouts([...shoutouts, { from: "You", to: recipient, message }])
        setMessage("")
        setRecipient("")
        setPosted(true)
        setTimeout(() => setPosted(false), 2000)
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="glass rounded-xl p-4 mb-4 border-teal/20">
      <h3 className="font-bold text-sm text-teal mb-2">💬 Peer Recognition</h3>
      <p className="text-xs text-gray-500 mb-3">Acknowledge a teammate's contribution. No ranking, just gratitude.</p>
      <div className="space-y-2 mb-3">
        {shoutouts.map((s, i) => (
          <div key={i} className="text-xs bg-dark/50 rounded p-2">
            <span className="text-gold">{s.from}</span> → <span className="text-teal">{s.to}</span>: {s.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Who?"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="flex-1 p-2 rounded bg-dark border border-gray-600 text-white placeholder-gray-400 text-sm"
        />
        <input
          type="text"
          placeholder="Shout-out..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 rounded bg-dark border border-gray-600 text-white placeholder-gray-400 text-sm"
        />
        <button onClick={handlePost} className="p-2 px-3 bg-teal text-white font-bold rounded-lg text-sm hover:bg-teal/80">
          Send
        </button>
      </div>
      {posted && <p className="text-xs text-teal mt-2">Shared! 🎉</p>}
    </div>
  )
}
