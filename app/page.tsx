"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { generateJoinCode, normalizeCode } from "@/lib/joinCode"
import { useSession, signIn, signOut } from "next-auth/react"
import Logo from "@/components/Logo"


const MASCOTS = ["🐉", "🦊", "🚀", "🤖", "🐙"]

interface SavedTeam { id: string; name: string; mascot: string; joinCode: string }

function loadTeams(): SavedTeam[] {
  try {
    return JSON.parse(window.localStorage.getItem("sq_teams") ?? "[]")
  } catch {
    return []
  }
}

function saveTeam(t: SavedTeam) {
  const list = loadTeams().filter((x) => x.id !== t.id)
  window.localStorage.setItem("sq_teams", JSON.stringify([{ id: t.id, name: t.name, mascot: t.mascot, joinCode: t.joinCode }, ...list].slice(0, 10)))
}

async function uniqueJoinCode(supabase: any) {
  for (let i = 0; i < 5; i++) {
    const code = generateJoinCode()
    const { data } = await supabase.from("Team").select("id").eq("joinCode", code).limit(1)
    if (!data || data.length === 0) return code
  }
  return generateJoinCode() + generateJoinCode(2)
}

export default function Home() {
  const [step, setStep] = useState<"home" | "create" | "join">("home")
  const [teamName, setTeamName] = useState("")
  const [mascot, setMascot] = useState("🐉")
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [myTeams, setMyTeams] = useState<SavedTeam[]>([])
  const [facilitated, setFacilitated] = useState<SavedTeam[]>([])
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => { setMyTeams(loadTeams()) }, [])

  useEffect(() => {
    const email = session?.user?.email
    if (!email) { setFacilitated([]); return }
    getSupabase().from("Team").select("id,name,mascot,joinCode").eq("ownerEmail", email).order("createdAt", { ascending: false }).limit(10)
      .then((res: { data: SavedTeam[] | null }) => { if (res.data) setFacilitated(res.data) })
  }, [session?.user?.email])

  const createTeam = async () => {
    setError("")
    if (!teamName.trim()) { setError("Please enter a team name"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      const code = await uniqueJoinCode(supabase)
      const { data, error: e } = await supabase
        .from("Team")
        .insert({ name: teamName.trim(), mascot, ownerId: "owner-1", ownerEmail: session?.user?.email ?? null, joinCode: code })
        .select()
        .single()
      if (e) { setError(e.message); return }
      saveTeam(data)
      router.push(`/dashboard?team=${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Connection error. Check Supabase config.")
    } finally {
      setBusy(false)
    }
  }

  const joinTeam = async () => {
    setError("")
    const code = normalizeCode(joinCode)
    if (!code) { setError("Please enter a team code"); return }
    setBusy(true)
    try {
      const supabase = getSupabase()
      // short code first, fall back to full team ID for older teams
      let { data } = await supabase.from("Team").select("*").eq("joinCode", code).single()
      if (!data && code.length > 10) {
        const res = await supabase.from("Team").select("*").eq("id", normalizeCode(joinCode)).single()
        data = res.data
      }
      if (!data) { setError(`No team found with code "${code}". Check it and try again.`); return }
      saveTeam(data)
      router.push(`/dashboard?team=${data.id}`)
    } catch (e: any) {
      setError(e?.message ?? "Connection error.")
    } finally {
      setBusy(false)
    }
  }

  const startDemo = async () => {
    setError("")
    setDemoBusy(true)
    try {
      const supabase = getSupabase()
      const code = await uniqueJoinCode(supabase)
      const { data: team, error: te } = await supabase
        .from("Team")
        .insert({ name: "Demo Questers", mascot: MASCOTS[Math.floor(Math.random() * MASCOTS.length)], ownerId: "owner-1", ownerEmail: session?.user?.email ?? null, joinCode: code })
        .select()
        .single()
      if (te || !team) { setError(te?.message ?? "Could not create demo."); return }
      const { data: sprint } = await supabase
        .from("Sprint")
        .insert({ number: 1, theme: "Demo Sprint", teamId: team.id, status: "active" })
        .select()
        .single()
      const { data: ceremony } = await supabase
        .from("Ceremony")
        .insert({ type: "retro", gameMode: "SAILBOAT", teamId: team.id, sprintId: sprint.id, status: "active" })
        .select()
        .single()
      await supabase.from("Comment").insert([
        { ceremonyId: ceremony.id, content: "We shipped the checkout flow two days early 🚀", author: "Alex (demo)", category: "Positive" },
        { ceremonyId: ceremony.id, content: "Code reviews are sitting for 3+ days on average", author: "Sam (demo)", category: "Challenge" },
        { ceremonyId: ceremony.id, content: "Try a 15-minute review SLA for urgent PRs", author: "Alex (demo)", category: "Idea" },
      ])
      router.push(`/retro/${ceremony.id}`)
      saveTeam(team)
    } catch (e: any) {
      setError(e?.message ?? "Could not start demo.")
    } finally {
      setDemoBusy(false)
    }
  }

  if (step === "create") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10"><div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-gold/10 blur-3xl" /><div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-teal/10 blur-3xl" /></div>
        <div className="glass rounded-2xl p-8 max-w-md w-full border-white/15">
          <h2 className="text-3xl font-display font-extrabold mb-2 text-center">Create your team</h2>
          <p className="text-sm text-mist/70 text-center mb-5">Name your crew, pick a mascot, and start the expedition.</p>
          {error && <div className="bg-red-900/60 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Team name (e.g. Checkout Squad)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-3 rounded-xl bg-dark/60 border border-white/15 text-white placeholder-gray-400"
            />
            <div>
              <p className="text-sm text-mist/70 mb-2">Choose a mascot</p>
              <div className="flex gap-2 flex-wrap">
                {MASCOTS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMascot(m)}
                    className={`text-3xl p-2.5 rounded-xl border transition ${mascot === m ? "border-gold bg-gold/15 shadow-glow scale-105" : "border-white/10 bg-white/5 hover:border-white/25"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Or paste any emoji 🦄" value={MASCOTS.includes(mascot) ? "" : mascot} onChange={(e) => setMascot(e.target.value || "🐉")} maxLength={8} className="mt-3 w-full p-2.5 rounded-xl bg-dark/60 border border-white/15 text-white placeholder-gray-500 text-sm" />
            </div>
            <button onClick={createTeam} disabled={busy} className="w-full p-3 bg-gold text-black font-extrabold rounded-xl hover:brightness-110 shadow-glow disabled:opacity-50">
              {busy ? "Creating..." : "Create Team"}
            </button>
            <button onClick={() => { setStep("home"); setError("") }} className="w-full p-3 bg-white/5 border border-white/15 rounded-xl text-white hover:bg-white/10">Back</button>
          </div>
        </div>
      </main>
    )
  }

  if (step === "join") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10"><div className="absolute top-10 right-1/4 h-72 w-72 rounded-full bg-teal/10 blur-3xl" /><div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-sea/10 blur-3xl" /></div>
        <div className="glass rounded-2xl p-8 max-w-md w-full border-white/15">
          <h2 className="text-3xl font-display font-extrabold mb-2 text-center">Join a team</h2>
          <p className="text-sm text-mist/70 text-center mb-4">Ask your facilitator for the 6-letter code — no account needed.</p>
          {error && <div className="bg-red-950/70 border border-red-500/30 text-red-100 p-3 rounded-xl mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="e.g. K7Q2XA"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={40}
              className="w-full p-4 rounded-xl bg-dark/60 border border-white/15 text-white placeholder-gray-500 text-center text-3xl tracking-[0.3em] font-mono"
            />
            <button onClick={joinTeam} disabled={busy} className="w-full p-3 bg-gold text-black font-extrabold rounded-xl hover:brightness-110 shadow-glow disabled:opacity-50">
              {busy ? "Joining..." : "Join the quest ⚔️"}
            </button>
            <button onClick={() => { setStep("home"); setError("") }} className="w-full p-3 bg-white/5 border border-white/15 rounded-xl text-white hover:bg-white/10">Back</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute top-10 right-0 h-[28rem] w-[28rem] rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sea/10 blur-3xl" />
      </div>
      <div className="flex flex-col items-center justify-center px-6 pt-16 pb-10 min-h-[88vh]">
      <div className="text-center mb-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-mist/80 mb-5">Team learning · Cooperative · $0</div>
        <h1 className="leading-[0.95] mb-5">
          <Logo size="lg" className="justify-center" />
        </h1>
        <p className="text-xl sm:text-2xl text-mist/80 leading-relaxed">Turn every sprint into a shared expedition — where the team recalls, reflects, and charts the next quest together.</p>
      </div>
      {error && <div className="bg-red-950/70 border border-red-500/30 text-red-100 p-3 rounded-xl mb-4 text-sm max-w-md w-full">{error}</div>}
      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={() => setStep("create")} className="px-8 py-4 bg-gold text-black font-extrabold rounded-xl text-lg hover:brightness-110 shadow-glow transition">Create Team</button>
        <button onClick={() => setStep("join")} className="px-8 py-4 bg-white/5 border border-white/15 rounded-xl text-lg hover:bg-white/10 text-white font-semibold transition">Join with Code</button>
      </div>
      <button onClick={startDemo} disabled={demoBusy} className="mt-5 text-teal hover:text-white transition disabled:opacity-50 font-medium">
        {demoBusy ? "Preparing your demo..." : "⚡ Just looking? Try an instant demo — no setup"}
      </button>
      {facilitated.length > 0 && (
        <div className="mt-8 w-full max-w-md">
          <p className="text-sm text-mist/70 mb-2 text-center uppercase tracking-wider">Teams you facilitate</p>
          <div className="space-y-2">
            {facilitated.map(t => (
              <a key={t.id} href={`/dashboard?team=${t.id}`} className="glass rounded-xl p-3 flex items-center gap-3 hover:border-gold/50 hover:bg-white/10 transition block">
                <span className="text-2xl">{t.mascot}</span>
                <span className="font-bold">{t.name}</span>
                <span className="ml-auto font-mono text-teal text-sm">{t.joinCode}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      {myTeams.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <p className="text-sm text-mist/70 mb-2 text-center uppercase tracking-wider">Your teams on this device</p>
          <div className="space-y-2">
            {myTeams.map(t => (
              <a key={t.id} href={`/dashboard?team=${t.id}`} className="glass rounded-xl p-3 flex items-center gap-3 hover:border-teal/50 hover:bg-white/10 transition block">
                <span className="text-2xl">{t.mascot}</span>
                <span className="font-bold">{t.name}</span>
                <span className="ml-auto font-mono text-teal text-sm">{t.joinCode}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="text-mist/60 mt-6 text-sm">No account needed — join with a team code</p>
      <div className="mt-3 text-sm text-mist/60">
        {session ? (
          <span>Facilitator: <span className="text-gray-200">{session.user?.name ?? session.user?.email}</span> · <button onClick={() => signOut()} className="text-teal hover:text-white underline-offset-4 hover:underline">Sign out</button></span>
        ) : (
          <span>Facilitator? <button onClick={() => signIn("github")} className="text-teal hover:text-white underline-offset-4 hover:underline">GitHub</button> · <button onClick={() => signIn("google")} className="text-teal hover:text-white underline-offset-4 hover:underline">Google</button></span>
        )}
      </div>
      </div>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-16">
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-center mb-3">Retros your team will actually learn from</h2>
        <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">SprintQuest turns Agile ceremonies into a team learning system grounded in neuroscience. No boring video-call rituals — guided recall, timed rounds, live reactions, votes, and action items that persist sprint after sprint.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-6"><div className="text-3xl mb-2">👥</div><h3 className="font-bold mb-1">1. Invite with a code</h3><p className="text-sm text-gray-400">Create a team, share the 6-letter code. Players join in seconds — no accounts, no installs, works on phones.</p></div>
          <div className="glass rounded-xl p-6"><div className="text-3xl mb-2">🎮</div><h3 className="font-bold mb-1">2. Play the ceremony</h3><p className="text-sm text-gray-400">Start the Sailboat retro and follow the Team Journey Board — one team token across 5 squares (Start → Share → Deepen → Vote → Quest) with depth boosters (Magnifier, Why Twice, Bridge). Warm up with cooperative recall, share entries (anonymous if you like), reflect with guided prompts, vote, and commit.</p></div>
          <div className="glass rounded-xl p-6"><div className="text-3xl mb-2">🧠</div><h3 className="font-bold mb-1">3. Improve every sprint</h3><p className="text-sm text-gray-400">Entries become owned action items. Next retro opens reviewing them. Your engagement level, mastery deck and sprint map track team learning — never individuals.</p></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-center mb-2">One mode · one clear flow</h2>
        <p className="text-gray-400 text-center mb-10">No mode paralysis — just run the Sailboat retro and get to what matters.</p>
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🏝️</div>
            <div className="font-bold text-xl mb-1">Sailboat Retro</div>
            <div className="text-sm text-gray-400">Catch the wind, cut the anchors, watch for rocks, and set the course together.</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-center mb-2">Board-game mechanics, built for learning</h2>
        <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">Cooperative tabletop ideas adapted to Scrum — every mechanic serves team learning, never competition. The Team Journey Board wraps any mode: one team token, zero dice for advancing, zero XP for moving.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-5 border-gold"><div className="text-3xl mb-2">🗺️</div><h3 className="font-bold mb-1">Team Journey Board <span className="text-xs font-normal text-gold">NEW</span></h3><p className="text-sm text-gray-400">Your retro as a cooperative board: 5 squares from Start to Quest, one team token, depth boosters that deepen reflection instead of speeding it up. Toggle it on or off anytime.</p></div>
          <div className="glass rounded-xl p-5"><div className="text-3xl mb-2">🃏</div><h3 className="font-bold mb-1">Hanabi Warm-Up</h3><p className="text-sm text-gray-400">Teammates hold cards from past sprints they can&apos;t show. Describe them verbally so the team reconstructs past commitments — spaced retrieval as a cooperative game.</p></div>
          <div className="glass rounded-xl p-5"><div className="text-3xl mb-2">🏆</div><h3 className="font-bold mb-1">Mastery Deck</h3><p className="text-sm text-gray-400">Cards like Pattern Spotter or Bridge Builder unlock only when the team demonstrates the behavior — mastery signals, never participation prizes.</p></div>
          <div className="glass rounded-xl p-5"><div className="text-3xl mb-2">🗺️</div><h3 className="font-bold mb-1">Legacy Sprint Map</h3><p className="text-sm text-gray-400">A persistent board that evolves every sprint — winds, anchors, bosses defeated. Recurring patterns surface so the team can finally break them.</p></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-10">
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-center mb-2">A learning system, not another retro board</h2>
        <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">Every design decision is validated against learning science.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-5"><div className="text-3xl mb-2">🔄</div><h3 className="font-bold mb-1">Spaced Retrieval</h3><p className="text-sm text-gray-400">Every retro opens recalling past commitments — retrieval beats re-reading.</p></div>
          <div className="glass rounded-xl p-5"><div className="text-3xl mb-2">🛡️</div><h3 className="font-bold mb-1">Psychological Safety</h3><p className="text-sm text-gray-400">Anonymous sharing by default, safety check-ins, no individual rankings — ever.</p></div>
          <div className="glass rounded-xl p-5"><div className="text-3xl mb-2">🤖</div><h3 className="font-bold mb-1">AI Facilitator</h3><p className="text-sm text-gray-400">Real-time pattern detection and probing questions — scaffolding reflection, not summarizing.</p></div>
          <div className="glass rounded-xl p-5"><div className="text-3xl mb-2">📈</div><h3 className="font-bold mb-1">Engagement Metrics</h3><p className="text-sm text-gray-400">Team-level informational dashboards, like a fitness tracker — never rewards that undermine motivation.</p></div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 sm:px-8 py-10">
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-center mb-8">Questions your coworkers will ask</h2>
        <div className="space-y-3">
          <div className="glass rounded-xl p-5"><h3 className="font-bold mb-1">Do players need an account?</h3><p className="text-sm text-gray-400">No. They open the link, enter the 6-letter team code, and play — on any device. Only facilitators optionally sign in with GitHub or Google.</p></div>
          <div className="glass rounded-xl p-5"><h3 className="font-bold mb-1">Does it replace Jira?</h3><p className="text-sm text-gray-400">No, it sits on top of it. Import open sprint issues as quests with one click; completing a quest can move the Jira issue to Done.</p></div>
          <div className="glass rounded-xl p-5"><h3 className="font-bold mb-1">Is it surveillance disguised as a game?</h3><p className="text-sm text-gray-400">No. Metrics are team-level and informational — like a fitness tracker, never a prize. Entries can be anonymous, there are no individual rankings, and votes stay within the ceremony.</p></div>
          <div className="glass rounded-xl p-5"><h3 className="font-bold mb-1">Why no individual leaderboards?</h3><p className="text-sm text-gray-400">Social comparison triggers the brain&apos;s loss-detection circuits and kills psychological safety. We measure team learning only — cooperation outperforms competition without the stress.</p></div>
          <div className="glass rounded-xl p-5"><h3 className="font-bold mb-1">What are Mastery Cards?</h3><p className="text-sm text-gray-400">Cards like Pattern Spotter or Safety Builder unlock when the team demonstrably shows that behavior across sprints. They signal mastery, not attendance.</p></div>
          <div className="glass rounded-xl p-5"><h3 className="font-bold mb-1">What is the Team Journey Board?</h3><p className="text-sm text-gray-400">A cooperative wrapper over any retro mode: the team moves one shared token across 5 squares (Start, Share, Deepen, Vote, Quest). No dice for advancing, no XP for moving, no rankings. Three optional depth boosters (Magnifier, Why Twice, Bridge) add reflection — never shortcuts. You can hide it anytime and keep the classic view.</p></div>
          <div className="glass rounded-xl p-5"><h3 className="font-bold mb-1">What does it cost?</h3><p className="text-sm text-gray-400">The project runs permanently on free tiers. AI facilitation uses a free Groq key; nothing here generates infrastructure bills.</p></div>
        </div>
      </section>

      <footer className="border-t border-white/10 mt-12 bg-black/10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 flex justify-between items-center text-sm text-mist/60 flex-wrap gap-3">
          <span><span className="text-gradient font-display font-extrabold">SprintQuest</span> — continuous improvement, as a team expedition.</span>
          <span>Learning system · Neuroscience-aligned · Free forever</span>
        </div>
      </footer>
    </main>
  )
}
