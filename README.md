# SprintQuest — Learning-Science-Informed Agile Ceremonies

Turn every Retrospective into a learning experience. Grounded in neuroscience and evidence-based learning science.

## Core Philosophy

Unlike "another retro board" with XP stickers, SprintQuest is a **team learning system** where every ceremony builds collective intelligence. Every design decision is validated against neuroscience:

- **Overjustification effect prevention** — XP is informational (fitness-tracker style), never a reward
- **Spaced retrieval practice** — Every retro starts with recall of past commitments
- **Psychological safety first** — Anonymous sharing, safety check-ins, no social comparison
- **Team flow optimization** — Adaptive pacing, no artificial time pressure
- **Structured reflection** — Metacognitive prompts at each round, not just entry generation

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
- **Prisma** — database schema management (`db push` is source of truth)
- **Vitest** — unit tests (`npm test`)

## Learning Science Features

1. **Spaced Retrieval Warm-Up** — Recall prompts adapt based on sprint number (early/mid/deep)
2. **Structured Reflection** — Guided metacognitive prompts between rounds (metacognitive, elaborative, evaluative, exploratory)
3. **Psychological Safety Check-In** — Anonymous 1-5 safety scale before ceremonies
4. **AI Learning Facilitator** — Real-time pattern detection and probing questions (not post-hoc summaries)
5. **Adaptive Pacing** — Timer suggestions adjust based on entry activity, not artificial countdowns
6. **Peer Recognition** — Cooperative shout-outs (no ranking, no comparison)
7. **Engagement Level** — Informational metric, never framed as a reward

## Game Modes

- 🔥 Boss Battle — Identify and defeat the biggest problem (real HP bars, 🗡️ attacks)
- 🏝️ Sailboat — Wind in sails vs anchor holding back
- 🚀 Mission Control — Mission-based retro
- 🕵️ Detective — Investigate what happened (⚖️ accusations + case board)
- ⚔️ Team Battle — Team vs team dynamics

## Database Schema

- **Team** — Squad with mascot, engagement level, streak
- **Sprint** — Sprint within a team
- **Ceremony** — Retro session with game mode
- **RetrievalSession** — Spaced recall history
- **Reflection** — Structured reflection responses
- **ShoutOut** — Peer recognition (cooperative, no ranking)
- **Quest** — Mission earned after ceremonies
- **Action** — Concrete steps from retro
- **Comment** — Team member entries
- **Vote** — Voting on issues
- **Badge** — Mastery-based achievement unlocks

## $0 Cost Stack

All free-tier verified:
- Next.js hosting: Vercel (100GB bandwidth free)
- Database: Supabase (500MB Postgres free)
- Real-time: Supabase Realtime (built-in)
- AI: Groq LLM (free tier)

## Project Status

Neuroscience-aligned redesign complete:
- Phase 1: XP reframed as engagement metrics ✅
- Phase 2: Spaced retrieval warm-up ✅
- Phase 3: Structured reflection phases ✅
- Phase 4: Psychological safety check-in ✅
- Phase 5: AI real-time facilitation ✅
- Phase 6: Mastery-based badges ✅
- Phase 7: Adaptive pacing logic ✅
- Phase 8: Social recognition (shout-outs) ✅

Security note: anon key has SELECT/INSERT/UPDATE, DELETE only on votes. Enable RLS with real auth before onboarding external teams.
