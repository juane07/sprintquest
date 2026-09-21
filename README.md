# SprintQuest — Gamified Agile Ceremonies

Turn every Sprint Review and Retrospective into a game. Earn Team XP, level up, unlock quests and badges.

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx next dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
DATABASE_URL=postgresql://user:password@host:5432/postgres
NEXTAUTH_SECRET=your-secret
```

## Architecture

- **Next.js 14** — App Router, TypeScript, Tailwind CSS
- **Supabase** — PostgreSQL, Realtime (comments, reactions), Storage
- **Prisma** — database schema management (`db push` is source of truth for defaults)
- **Vitest** — unit tests (`npm test`)

## Game Modes

- 🔥 Boss Battle — Identify and defeat the biggest problem (real HP bars, 🗡️ attacks)
- 🏝️ Sailboat — Wind in sails vs anchor holding back
- 🚀 Mission Control — Mission-based retro
- 🕵️ Detective — Investigate what happened (⚖️ accusations + case board)
- ⚔️ Team Battle — Team vs team dynamics
- 😡 Mad/Sad/Glad · 🚦 Start/Stop/Continue · 📝 4Ls · ☕ Lean Coffee (timed discussions) · ⚖️ Plus/Delta
- 🐞 Bug Bash — Hunt bugs together, vote the nastiest
- 🗺️ Quest Trail — Mario-party board: roll, move one team token, survive events

## Party layer (all cooperative, team XP only)

- 🎲 Chance deck — 8 cards with real effects (XP, timer warp, polls, shuffle, spotlight)
- 🎮 Minigame bursts — 🐢 Snail Race (entries move it), 🔨 Whack-a-bug (squash = 👍 = prioritize), 🎯 Tug of War (top-2 face off, winner becomes an action), 🎁 Memory Chests, ⚡ Instant Poll (result posts itself as an entry)
- Bursts ride on Comment/Vote rows (no schema changes); facilitator launches, GM suggests when the room is quiet

## Database Schema

- **Team** — Squad with mascot, level, XP, streak
- **Sprint** — Sprint within a team
- **Ceremony** — Retro session with game mode
- **Quest** — Mission earned after ceremonies
- **Action** — Concrete steps from retro
- **Comment** — Team member entries
- **Vote** — Voting on issues
- **Badge** — Achievement unlocks

## $0 Cost Stack

All free-tier verified:
- Next.js hosting: Vercel (100GB bandwidth free)
- Database: Supabase (500MB Postgres free)
- Real-time: Supabase Realtime (built-in)
- AI: OpenCode built-in models (free)

## Project Status (MVP v1 — done)

Gamified Retrospective loop complete: team creation + mascots, 5 differentiated
game modes, 6-letter join codes (no account), timed rounds with facilitator
prompts, anonymous entries, live emoji reactions, entries → action items
(owner + due date + XP), previous-retro follow-up review, streaks, badges,
level-ups, Team XP. `npm test` (19 unit tests) green.

Security note: anon key has SELECT/INSERT/UPDATE, DELETE only on votes.
Enable RLS with real auth before onboarding external teams.
