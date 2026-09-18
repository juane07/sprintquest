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
- **Supabase** — PostgreSQL, Auth, Realtime, Storage
- **Prisma** — ORM for database schema
- **Socket.io** — Real-time collaboration for ceremonies

## Game Modes

- 🔥 Boss Battle — Identify and defeat the biggest problem
- 🏝️ Sailboat — Wind in sails vs anchor holding back
- 🚀 Mission Control — Mission-based retro
- 🕵️ Detective — Investigate what happened
- ⚔️ Team Battle — Team vs team dynamics

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
