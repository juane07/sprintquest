# SprintQuest — AGENTS.md

## What is this project

SprintQuest is a gamified Agile ceremony platform that converts Sprint Reviews and Retrospectives into game-like experiences with XP, quests, badges, levels, and team progression. Market positioning: **"Continuous Improvement as a game."**

**Core loop:** Sprint Planning → Daily → Review → Retro → Quests → Next Sprint → Level Up

**Positioning:** Not "another retro board" — it's a "Duolingo/Kahoot for Scrum teams." Every sprint is a season/mission. Teams earn Team XP, level up, unlock badges and quests. Differentiated from EasyRetro, GoRetro, TeamRetro, Spreo, TeleRetro by making the entire Scrum cycle a game, not just adding emojis to a retro board.

## Key product principles

- **COSTO $0 — INNEGOCIABLE** — el proyecto debe funcionar con $0/mes, PERMANENTEMENTE. Cada dependencia, herramienta y servicio DEBE ser open source o tener tier gratuito verificado. NUNCA asumir que algo es gratis sin verificar el precio actual en la página oficial del proveedor. NO se paga NADA, bajo ninguna circunstancia, ni siquiera cuando el proyecto crezca. Si un servicio agota su tier gratuito, se busca una ALTERNATIVA GRATUITA, no se paga. El dominio puede ser un subdominio gratuito (sprintquest.vercel.app, netlify.app, etc.) o eventualmente un dominio .com si el usuario decide pagarlo POR SEPARADO de la infraestructura — pero eso es su decisión personal, no un gasto del proyecto. NINGÚN servicio de pago se usa jamás sin aprobación explícita del usuario, y aun así, la regla es: buscar alternativa gratuita primero, siempre.
- **Team XP only** — never individual productivity leaderboards. Gamification must be cooperative, not competitive between individuals.
- **Low-friction onboarding** — participants join via a code (`join.sprintquest.com/ABC123`) without creating an account.
- **Sits on top of existing tools** (Jira, GitHub, Linear, Slack) — does not replace them.
- **AI as Game Master / Scrum Master** — facilitates, suggests, groups, detects patterns; never makes decisions automatically.
- **Privacy-first** — team data belongs to the team; managers must not be able to use data against employees.
- **NO PAID DEPENDENCY BY DEFAULT — EVER** — every service must have a free tier that can handle the projected load at ANY scale the project reaches. If a paid tier becomes necessary, STOP. Find a free alternative. Do NOT pay. This is a non-negotiable constraint, not a preference.

## What to avoid

- Do NOT build individual productivity leaderboards ("Top developer", "Most commits", "Most tickets").
- Do NOT incentivize volume over value.
- Do NOT make gamification feel like surveillance.
- Do NOT build features for all Scrum ceremonies at once — start with Gamified Retrospective MVP only.
- Do NOT optimize for lesson completion, streaks, XP, screen time, or content consumption (per Fluently-style principles about not gamifying the wrong things).

## MVP scope

MVP v1 = **Gamified Retrospective** only:
1. Create team (name, mascot from 🐉🦊🚀🤖🐙)
2. Create retro (choose game mode: Boss Battle, Sailboat, Mission Control, Detective, Team Battle)
3. Participants join via code (`join.sprintquest.com/ABC123`)
4. Game session rounds (timed, voting, anonymous options)
5. Results: Team XP, badge unlock, next quest

Game modes (from market research):
- 🔥 Boss Battle — identify and defeat the biggest problem
- 🏝️ Sailboat — wind in sails (what's pushing forward), anchor (what's holding back)
- 🚀 Mission Control — mission-based retro
- 🕵️ Detective — investigate what happened
- ⚔️ Team Battle — team vs team dynamics

## Full product scope (post-MVP)

Beyond retro, the platform covers the full Agile cycle:
- Sprint Planning → quests/missions tied to Jira tickets
- Daily → XP for participation
- Sprint Review → challenges for stakeholders (quizzes, demos as challenges)
- Retro → the core gamified ceremony
- Progression: Team Level 1 → Level 2 → ... → Improvement Streak → Level Up
- Badges: Improvement Machine, Bug Hunters, Collaboration, Continuous Delivery, Goal Keepers
- AI Game Master detects patterns, suggests challenges, groups comments, flags recurring issues

## Competitive landscape

| Category | Examples | Gap |
|----------|----------|-----|
| Retro boards | EasyRetro, IdeaBoardz | Sticky notes, votes, templates — no game loop |
| Agile practice | TeamRetro, GoRetro | Health checks, actions, metrics — not a "game" |
| Fun retros | TeleRetro, GoRetro | Dynamics, humor — not full gamification |
| Real gamification | Very few | XP, quests, progresion, rewards — the opportunity |

Key insight: **None** of the existing tools have as their central proposition converting Scrum into a video game. The gap is in Sprint Review gamification (🔴) and full game-loop progression (🔴).

## Master questionnaire (52 domains, ~750 questions to validate)

The project has a comprehensive questionnaire spanning 52 domains, each containing multiple sub-questions (~750 total). The domains are:

1. Vision & purpose · 2. Problem · 3. User · 4. Jobs-to-be-Done · 5. Target audience · 6. Value proposition · 7. Gamification mechanics · 8. Psychology & ethics · 9. Sprint Retro · 10. Sprint Review · 11. Full sprint cycle · 12. AI · 13. Integrations · 14. UX · 15. UI/branding · 16. Platform · 17. Technical architecture · 18. Security · 19. Privacy & compliance · 20. Data model · 21. Analytics · 22. North Star metric · 23. Business model · 24. Pricing · 25. Competition · 26. Market research · 27. Validation · 28. MVP · 29. Roadmap · 30. Go-to-market · 31. Growth loop · 32. Sales · 33. Enterprise · 34. Support · 35. Operations · 36. Founding team · 37. Budget · 38. Legal · 39. IP · 40. Content · 41. Customization · 42. Multiplayer · 43. Accessibility · 44. Internationalization · 45. Notifications · 46. Retention · 47. Gamification quality · 48. Anti-fatigue · 49. Historical data & intelligence · 50. Future direction · 51. Strategic questions · 52. The defining question

**Approach:** Answer in 10 phases: Problem & User → Value Prop → Gamification → Retro Experience → Review Experience → AI & Integrations → MVP & Roadmap → Business Model → Technology & Ops → Go-to-Market. Early answers constrain later ones.

Do NOT attempt to answer all 750 questions at once. Work phase by phase.

## AI Hallucination Mitigation (permanent rule)

Every answer, claim, or suggestion generated during this project must follow these rules:

1. **Ground everything in external sources** — factual claims about competitors, market data, or technical feasibility must cite specific URLs, documentation, or research. Verify with web search before accepting.
2. **Mark every statement** as `VERIFIED` (with source), `ASSAMED` (with rationale), or `UNANSWERED` (don't guess). Never leave a claim unattributed.
3. **Never ask the AI to invent product decisions** — provide actual context (team skills, budget, timeline) and ask it to reason *from those constraints*. Hallucinations happen when the AI fills blank spaces.
4. **AI is a framework, not an oracle** — it structures, organizes, and challenges assumptions; you supply the ground truth. Every substantive answer comes from the team, not the AI.
5. **Cross-validate against existing research** — feed verified research back as context rather than asking the AI to re-discover it. More real data = less room for fabrication.
6. **Verification loop** — after any answer, ask "What evidence supports this?" If no source is cited, treat the answer as speculative until proven otherwise.

**Core principle:** The AI is a reasoning scaffold, not a knowledge source. Inject ground truth; the AI organizes, connects, and challenges.

## Cost Verification (permanent rule — ZERO COST MANDATE)

**Every claim about pricing, free tiers, or infrastructure costs MUST be verified before being stated.** This is a dedicated hallucination mitigation rule.

### Rules:

1. **Never state something is free without verifying the current free tier.** Free tiers change frequently. Before claiming a service has a free tier:
   - Search for the provider's official pricing page
   - Check the specific free tier limits (storage, bandwidth, requests, compute)
   - Note the date of verification
   - State the exact limits and what happens when exceeded

2. **Never assume a service is free because it was free last month.** Cloud providers change pricing without notice. Always verify at the time of decision-making.

3. **Never claim a license is free/MIT/open source without checking.** License types change. Verify on the official repository or package registry.

4. **Always specify what happens when the project grows.** State the free tier limits clearly and what the next paid tier costs. Transparency about limitations prevents false promises.

5. **Always verify AI/LLM API pricing.** Free tiers for AI services have token limits, rate limits, and expiration dates. Check the current status before recommending any AI provider.

6. **Never state a total project cost of $0 without caveats.** Always specify:
   - What IS free (and its limits)
   - What MIGHT cost money at scale
   - What the user MUST pay for (domain, if desired)

7. **Verify current pricing before writing any section about business model, pricing, or infrastructure.** Use web search. Check official docs. Don't rely on memory.

### Verification Template (use for every infrastructure/cost claim):
```
[SERVICE]: [NAME]
- Status: VERIFIED / UNVERIFIED / OUTDATED
- Free tier: [exact limits]
- Verified on: [date]
- Source: [URL]
- Next paid tier: [price and limits]
- Risk: [what could change]
```

### Current verified stack (as of September 2025):

| Service | Free Tier | Limits | Next Paid | Verified |
|---------|-----------|--------|-----------|----------|
| **Vercel** | Serverless + Hosting | 100GB bandwidth, 100GB storage | Pro: $20/mo | VERIFY BEFORE USE |
| **Supabase** | PostgreSQL + Auth + Storage + Realtime | 500MB DB, 1GB Storage, 500MB bandwidth, 50K rows | Pro: $25/mo | VERIFY BEFORE USE |
| **Upstash** | Redis | 10K requests/day | Pro: from $10/mo | VERIFY BEFORE USE |
| **Groq** | LLM inference | ~30K tokens/minute, varies by model | Pay-per-use | VERIFY BEFORE USE |
| **Google Gemini API** | LLM inference | 15K tokens/minute, 1.5M tokens/month | Pay-per-use | VERIFY BEFORE USE |
| **Ollama** | Local LLM | $0, requires local hardware | N/A | VERIFY (model availability) |
| **GitHub** | Private repos + CI/CD | Unlimited repos, 2,000 min/month CI | Team: $4/user/mo | VERIFY BEFORE USE |
| **Cloudflare** | CDN + DNS | Unlimited bandwidth | Pro: $5/mo | VERIFY BEFORE USE |
| **Next.js** | N/A (library) | MIT license | N/A | VERIFIED: MIT |
| **React** | N/A (library) | MIT license | N/A | VERIFIED: MIT |
| **TypeScript** | N/A (language) | Apache 2.0 | N/A | VERIFIED |
| **Tailwind CSS** | N/A (library) | MIT license | N/A | VERIFIED: MIT |
| **shadcn/ui** | N/A (component library) | MIT license | N/A | VERIFIED: MIT |
| **Prisma** | N/A (ORM) | Apache 2.0 | N/A | VERIFIED: Apache 2.0 |
| **NextAuth.js** | N/A (auth) | MIT license | N/A | VERIFIED: MIT |
| **Socket.io** | N/A (real-time) | MIT license | N/A | VERIFIED: MIT |

**⚠️ ALL SERVICE TIER LIMITS AND PRICING MUST BE RE-VERIFIED BEFORE EACH USE.** Free tiers change. This table reflects verified data at time of writing but is NOT guaranteed to remain accurate.

### CRITICAL: What happens when a free tier is exceeded

When a free tier limit is reached, the ONLY acceptable responses are:

1. **STOP.** Immediately stop using the service at that scale.
2. **NOTIFY THE USER.** Explain what limit was exceeded, what the cost would be, and what the free alternative is.
3. **SUGGEST FREE ALTERNATIVE.** Always find a free workaround. Examples:
   - Supabase 500MB exceeded → Neon (free Postgres), Turso (libSQL free), self-hosted PostgreSQL
   - Vercel bandwidth exceeded → Cloudflare Pages (unlimited bandwidth), Netlify (unlimited bandwidth)
   - Upstash Redis exceeded → DragonflyDB (self-hosted free), Valkey (free)
   - Groq tokens exceeded → Ollama (local LLM, $0), Hugging Face (free models), Google Gemini (different free tier)
   - GitHub CI minutes exceeded → Self-hosted runner (free), other CI alternatives
   - **ANY service exceeded → Find another free provider, self-host, or reduce scale**

4. **WAIT FOR APPROVAL.** If no free alternative exists and the user explicitly approves paying, proceed with the cheapest option. But first exhaust all free alternatives.

### Critical rule:
**Never deploy code that could generate charges without the user's explicit knowledge and approval.** Always warn before using any service with potential cost implications.

### Costo $0 — Regla de oro:
Si una solución no tiene alternativa gratuita verificada, NO se implementa así. Se busca otra solución, se reduce el scope, o se usa una opción diferente. El proyecto se adapta a las limitaciones gratuitas, no al revés.

## Decision Authority

**Todas las decisiones sobre el proyecto las toma el AI.** El usuario NO necesita tomar decisiones técnicas, de producto, de arquitectura, de diseño ni de roadmap. El AI decide:

- **Stack técnico** (frameworks, libraries, databases, hosting)
- **Arquitectura** (estructura del código, database schema, API design)
- **Features y prioridades** (qué construir primero, en qué orden)
- **Diseño UI/UX** (colores, tipografía, layouts, componentes)
- **Roadmap y fases** (cuándo añadir qué feature)
- **Estrategia de crecimiento** (integraciones, escalabilidad)
- **Código de todos los archivos** (frontend, backend, tests, config)
- **Documentación** (AGENTS.md, docs, README)

### El usuario solo debe hacer:
1. **Proporcionar contexto** (preferencias, restricciones, información del proyecto)
2. **Probar y dar feedback** sobre lo construido
3. **Aprobar o rechazar** lo que se construye (sin necesidad de justificar por qué)
4. **Entrevistar usuarios reales** (cuando sea necesario para validación)
5. **Decidir si lanzar o no** (cuando el producto esté listo)
6. **Proporcionar expertise de dominio** (conocimiento específico de Agile/Scrum)

### Reglas de decisión:
1. **El AI decide por defecto** — si no hay una razón clara para que el usuario decida, el AI decide
2. **El AI debe explicar sus decisiones** — cada decisión técnica se comunica brevemente al usuario
3. **El usuario puede revocar cualquier decisión** — si el usuario dice "no quiero esto", el AI lo cambia
4. **El AI prioriza el $0 cost** — siempre que sea posible dentro de las restricciones
5. **El AI prioriza la velocidad** — construir rápido, iterar, no sobre-ingenieril

## Tech direction

- Web application (PWA considered)
- Real-time collaboration needed for ceremonies
- Integrations: Jira, GitHub, Slack (later Linear, Azure DevOps, GitLab, Teams)
- AI integration for facilitation (LLM-based)
- Local-first data preferences where possible
- **Costo $0/mes — TODA la infraestructura debe usar tier gratuitos verificados**
- **NINGÚN servicio de pago a menos que el usuario lo apruebe explícitamente**
- **Verificar precios actuales antes de cada decisión de infraestructura (ver PLAN_CERO_COSTO.md)**

## Repository status

This repository is currently **empty**. All project files, code, and configuration need to be created from scratch.

## How to proceed

1. Initialize project structure and select a tech stack
2. Check AGENTS.md before making architectural decisions to ensure alignment with product principles above
3. This file will be updated as the project evolves
4. When building, validate assumptions from the master questionnaire before committing to features
