"use client"
import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"

export default function Presence({ channel }: { channel: string }) {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const supabase = getSupabase()
    const ch = supabase.channel(`presence:${channel}`, { config: { presence: { key: Math.random().toString(36).slice(2) } } })
    ch.on("presence", { event: "sync" }, () => {
      setCount(Object.keys(ch.presenceState()).length)
    }).subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") await ch.track({ online: true })
    })
    return () => { supabase.removeChannel(ch) }
  }, [channel])
  return <span className="bg-teal/20 text-teal px-3 py-1 rounded-full text-sm font-bold">● {count} online</span>
}
