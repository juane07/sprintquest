# SprintQuest — AGENTS.md

**Project language: English (for now)**

## What is this project

SprintQuest is a **learning-science-informed gamified Agile ceremony platform** that converts Sprint Reviews and Retrospectives into experiences optimized for team learning and continuous improvement. Uses Team XP, levels, badges, quests, and streaks — all grounded in neuroscience and self-determination theory.

**Core loop:** Sprint Planning → Daily → Review → **Reflect** → Retro → Quests → Next Sprint → Level Up

**Positioning:** Not "another retro board" — a **team learning system** where every ceremony builds collective intelligence. Differentiated from EasyRetro, GoRetro, TeamRetro by making the entire Scrum cycle a *learning game*, not just adding emojis to a retro board.

## Neuroscience & Learning Science Foundation (permanent)

All product decisions must be evaluated against these evidence-based principles:

### 1. Self-Determination Theory (Deci & Ryan)
- **Autonomy**: Users must feel choice, not control. XP must be *informational*, never *controlling*. Forced gamification undermines intrinsic motivation.
- **Competence**: Badges and rewards must signal *mastery*, not mere participation. Meta-analyses show participation-based badges have minimal impact (Hedges' g = 0.277).
- **Relatedness**: Team-based cooperation produces higher social relatedness than competition. Psychological safety is the prerequisite.

### 2. Overjustification Effect (Deci, Koestner & Ryan, 1999; Murayama et al., 2010)
- **CRITICAL RULE**: Extrinsic rewards (XP, badges) must NEVER be the primary reason to participate. If XP feels like a *reward*, it undermines the *learning* motivation.
- **Implementation**: Frame all rewards as *informational metrics* (like a fitness tracker shows steps) — not as prizes. Never say "you earned X XP." Say "your team's engagement level is X."
- **Neural basis**: Reward removal decreases ventral striatum/SN/VTA activity (Murayama et al., 2010, PNAS).

### 3. Retrieval Practice & Spaced Learning (Dunlosky et al., 2013; Nature Reviews Psychology, 2022)
- Retrieval practice is among the MOST effective learning strategies — more powerful than re-reading.
- **Implementation**: Every new retro begins with spaced retrieval prompts: "What did your team commit to last sprint? Did it work?" At 3-sprint intervals: "What did you learn about X?"
- **Neural basis**: Spaced learning increases ventromedial prefrontal cortex pattern similarity during retrieval (Zou et al., 2025).

### 4. Psychological Safety as the Engine of Performance (Edmondson, 1999; Frazier et al., 2017)
- Psychological safety is the "engine" — not the "fuel" — of team performance. It enables team learning behavior.
- **Implementation**: Anonymous sharing by default, safety check-ins, facilitation that ensures all voices are heard. No individual leaderboards (which trigger social comparison and activate the anterior insula/dACC — the brain's loss-detection areas).

### 5. Team Flow (Shehata et al., 2021, eNeuro)
- Team flow is a unique brain state with enhanced interbrain synchrony in the left middle temporal cortex.
- **Requirements**: Common purpose, complementary skills, clear goals, mutual accountability.
- **Implementation**: Features should foster collective absorption — not artificial time pressure that creates anxiety.

### 6. Team Reflexivity (Tannenbaum & Cerasoli, 2013; Gucciardi et al., 2025)
- Team reflexivity has a medium effect on performance (g = 0.549) but REQUIRES structured facilitation.
- **Four conditions**: (1) Active learning from past, (2) Learning prioritized over evaluation, (3) Contextualized to specific events, (4) Input from multiple sources.
- **Implementation**: Structured reflection phases with guided prompts, not just entry generation.

### 7. Cooperation vs Competition (iScience, 2024)
- Cooperation and competition produce **comparable performance**.
- **BUT**: Competition significantly increases perceived stress and autonomic activation that persists over time.
- **Implementation**: Always cooperative framing. Never pit teams against each other.

### 8. Social Comparison (Kedia et al., 2014; Garcia & Tor, 2020)
- Social comparison activates ventral striatum, vmPFC, anterior insula, dACC.
- **Upward comparison** activates loss-related brain areas (AI, dACC).
- **Implementation**: Avoid any visible comparison between teams/individuals. Team XP is informational only.

### 9. Desirable Difficulty (Bjork, 1994)
- Learning is enhanced by effortful retrieval, not passive review.
- **Implementation**: Include brief reflection quizzes, elaborative interrogation ("Why did this happen?"), and spaced recall challenges.

### 10. Gamification Meta-Analysis Findings (Sailer & Homner, 2020; Zeng et al., 2024)
- Overall gamification effect on intrinsic motivation is small (g = 0.257) — **design matters enormously**.
- Gamification positively affects autonomy (g = 0.638) and relatedness (g = 1.776) but minimally affects competence (g = 0.277).
- **Key insight**: Poorly designed gamification can be *harmful*. Every game element must be justified by evidence.

## Game Design Foundation (permanent)

The AI acts as a **board game designer AND a learning scientist** — both lenses are mandatory on every feature. Neuroscience constrains *what is allowed*; game design drives *what is fun*. A feature that passes neuroscience but has no game in it is rejected. A feature that is fun but violates neuroscience is rejected.

### 1. MDA Framework (Hunicke, LeBlanc & Zubek, 2004)
- Designer controls **Mechanics** (rules) → **Dynamics** (run-time behavior) emerge → **Aesthetics** (player emotion) result. Never edit dynamics or aesthetics directly; change mechanics and observe.
- Design **outside-in**: target aesthetic first ("cooperative tension with relief"), then the dynamic that produces it, then the mechanic. Debug **forward**: boredom/anxiety complaint → find the dynamic → trace to the mechanic → change one number.
- **MDA chain rule**: every game element must be statable as "players feel X because dynamic Y emerges from mechanic Z." If it can't be stated, it isn't designed yet.

### 2. Meaningful Decisions Test (BoardBrain Labs; Toth & Toth on valuation/reading/donkeyspace)
Every player-facing choice must have all three ingredients:
- **Trade-off**: gaining something costs something (resources, tempo, opportunity). If the answer to "what am I giving up?" is "nothing," the choice is a chore.
- **Uncertainty**: calculable risk, not blind guessing — enough information to reason, never full certainty.
- **Context**: the best option changes with game state. If one option is always best, it is a dominant strategy — treat dominant strategies as **bugs**.
- **Fast filter** (apply to every decision, need yes on ≥2): Can a reasonable player argue for more than one option? Would a different game state flip the answer? Does the choice express a plan or style?

### 3. Cooperative Game Patterns (Pandemic / Spirit Island / Gloomhaven school)
- **Win vs Lose tension**: a clear team goal competing against visible lose conditions ("put out fires"). No game without a lose state — but defeat must be **narrative and productive** (unresolved items become next sprint's retrieval fuel), never shame. The *board* loses; the *team* learns.
- **Limited team action points**: a shared pool spent on advance/investigate/boost. Scarcity creates the trade-off. Team pool only — never individual budgets or scoring.
- **Visible clock**: an escalating track or depleting deck, never a countdown timer as the primary mechanic (see "What to avoid").
- **Asymmetry without individuals**: rotating team-level roles/lenses with one-use powers (no personal scores, no comparison).
- **Alpha-player mitigation** (the Pandemic failure mode): hidden hands, simultaneous commit-then-reveal votes, enough parallel complexity that one voice cannot play everyone's turn. Structurally guarantee all voices, don't rely on etiquette.
- **Arc**: new information must enter every phase (events, dilemmas, reveals). Round N must never feel identical to round 2.

### 4. Decision-Resolution Cycles (tension engine)
- Tension = the gap between **committing** to a concrete plan and its **resolution** under visible threats. Design commit-then-reveal moments; deny instant gratification where it creates pleasurable stress.
- Plans must be concrete (imaginable steps + imaginable failure), threats must be visible. Abstract goals generate no tension.

### 5. Uncertainty Budget (what randomness is allowed)
- **Allowed**: seeded setup randomness (deterministic per ceremony, $0, no new infra), simultaneous hidden decisions, event/dilemma decks with calculable odds.
- **Forbidden**: output randomness that decides learning outcomes; randomness gating reflection (retrieval/reflection phases are never skippable by luck); any randomness producing individual winners/losers.

### 6. "Skin Is Not a Game" Rule
- A visual board (squares, tokens, dice graphics) with no trade-off, no uncertainty, and no win/lose state is **decoration, not a game** — reject it even if it looks fun.
- Dice that only decorate advancement violate Autonomy (§1) and add zero decision value. Every random element must feed a decision.

## Key product principles

- **$0 COST — NON-NEGOTIABLE** — the project must run on $0/month, PERMANENTLY. Every dependency, tool, and service MUST be open source or have a verified free tier. NEVER assume something is free without checking the current price on the provider's official page. NO money is spent, under any circumstances, not even when the project grows. If a service exhausts its free tier, a FREE ALTERNATIVE is sought — no payment is made. The domain can be a free subdomain (sprintquest.vercel.app, netlify.app, etc.) or eventually a .com domain if the user decides to pay for it SEPARATELY from the infrastructure — but that is their personal decision, not a project expense. NO paid service is ever used without the user's explicit approval, and even then, the rule is: seek a free alternative first, always.
- **Team XP only — informational, not controlling** — XP is a *learning dashboard metric* (like a fitness tracker), never a *reward*. Never frame participation as "earning" XP. Frame it as "your team's engagement level."
- **No individual leaderboards** — social comparison activates loss-detection brain areas (anterior insula, dACC). Never compare individuals or teams publicly.
- **Low-friction onboarding** — participants join via a code (`join.sprintquest.com/ABC123`) without creating an account.
- **Sits on top of existing tools** (Jira, GitHub, Linear, Slack) — does not replace them.
- **AI as Learning Facilitator** — facilitates, suggests, groups, detects patterns; never makes decisions automatically. AI is a *scaffolding tool* for metacognitive reflection, not a summary machine.
- **Privacy-first** — team data belongs to the team; managers must not be able to use data against employees.
- **NO PAID DEPENDENCY BY DEFAULT — EVER** — every service must have a free tier that can handle the projected load at ANY scale the project reaches. If a paid tier becomes necessary, STOP. Find a free alternative. Do NOT pay. This is a non-negotiable constraint, not a preference.

## What to avoid

- Do NOT build individual productivity leaderboards ("Top developer", "Most commits", "Most tickets").
- Do NOT incentivize volume over value.
- Do NOT make gamification feel like surveillance.
- Do NOT build features for all Scrum ceremonies at once — start with Gamified Retrospective MVP only.
- Do NOT optimize for lesson completion, streaks, XP, screen time, or content consumption (per Fluently-style principles about not gamifying the wrong things).
- Do NOT make extrinsic rewards the primary motivator — this triggers the overjustification effect (Deci et al., 1999).
- Do NOT use artificial time pressure as a primary game mechanic — this creates anxiety, not flow (Csikszentmihalyi, 1975; iScience, 2024).
- Do NOT add social comparison features between teams — this activates loss-detection neural circuits.
- Do NOT design badges as participation rewards — they must signal *mastery* (Sailer et al., 2017).

## MVP scope

MVP v1 = **Learning-Optimized Gamified Retrospective** only:
1. Create team (name, mascot from 🐉🦊🚀🤖🐙)
2. Create retro (choose game mode: Boss Battle, Sailboat, Mission Control, Detective, Team Battle)
3. Participants join via code (`join.sprintquest.com/ABC123`)
4. **Spaced retrieval warm-up** (review past commitments with recall prompts)
5. Game session rounds (adaptive pacing, timed OR free-form)
6. **Structured reflection phase** (guided metacognitive prompts)
7. Results: Team engagement level (informational), reflection summary, next quests

Game modes (from market research):
- 🔥 Boss Battle — identify and defeat the biggest problem
- 🏝️ Sailboat — wind in sails (what's pushing forward), anchor (what's holding back)
- 🚀 Mission Control — mission-based retro
- 🕵️ Detective — investigate what happened
- ⚔️ Team Battle — team vs team dynamics

## Full product scope (post-MVP)

Beyond retro, the platform covers the full Agile cycle:
- Sprint Planning → quests/missions tied to Jira tickets
- Daily → engagement metrics (informational, not rewards)
- Sprint Review → challenges for stakeholders (quizzes, demos as challenges)
- Retro → the core learning-optimized ceremony
  - Spaced retrieval warm-up
  - Structured reflection with metacognitive prompts
  - AI real-time facilitation (pattern detection, probing questions)
  - Psychological safety check-in
- Progression: Team Level 1 → Level 2 → ... → Improvement Streak → Level Up
- Badges: **Mastery-based** (Pattern Spotter, Bridge Builder, Deep Thinker, not participation-based)
- AI Learning Facilitator: real-time pattern detection, guided reflection, retrospection scaffolding

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
2. **Mark every statement** as `VERIFIED` (with source), `ASSUMED` (with rationale), or `UNANSWERED` (don't guess). Never leave a claim unattributed.
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

### $0 Cost — Golden Rule:
If a solution has no verified free alternative, it is NOT implemented. Another solution is sought, the scope is reduced, or a different option is used. The project adapts to the free tier limitations, not the other way around.

## Decision Authority

**All decisions about the project are made by the AI.** The user does NOT need to make technical, product, architecture, design, or roadmap decisions. The AI decides:

- **Tech stack** (frameworks, libraries, databases, hosting)
- **Architecture** (code structure, database schema, API design)
- **Features and priorities** (what to build first, in what order)
- **UI/UX design** (colors, typography, layouts, components)
- **Roadmap and phases** (when to add what feature)
- **Growth strategy** (integrations, scalability)
- **Code of all files** (frontend, backend, tests, config)
- **Documentation** (AGENTS.md, docs, README)

### The user should only:
1. **Provide context** (preferences, constraints, project information)
2. **Test and give feedback** on what was built
3. **Approve or reject** what was built (without needing to justify why)
4. **Interview real users** (when necessary for validation)
5. **Decide whether to launch** (when the product is ready)
6. **Provide domain expertise** (specific Agile/Scrum knowledge)

### Decision rules:
1. **The AI decides by default** — if there is no clear reason for the user to decide, the AI decides
2. **The AI must explain its decisions** — each technical decision is communicated briefly to the user
3. **The user can revoke any decision** — if the user says "I don't want this," the AI changes it
4. **The AI prioritizes the $0 cost** — whenever possible within the constraints
5. **The AI prioritizes speed** — build fast, iterate, don't over-engineer

## Tech direction

- Web application (PWA considered)
- Real-time collaboration needed for ceremonies
- Integrations: Jira, GitHub, Slack (later Linear, Azure DevOps, GitLab, Teams)
- AI integration for learning facilitation (LLM-based)
- Local-first data preferences where possible
- **$0/month — ALL infrastructure must use verified free tiers**
- **NO paid service unless explicitly approved by the user**
- **Verify current prices before every infrastructure decision (see PLAN_CERO_COSTO.md)**

## Repository status

This is an active Next.js project with a deployed Vercel site (`https://sprintquest-five.vercel.app`). The codebase includes:
- Landing page with 2-mode MVP (Boss Battle + Sailboat)
- Team Journey Board wrapper (5 squares, gated advance persisted to Ceremony.round, 3 depth boosters as Game Master entries)
- Dashboard, retro session, history pages
- Supabase integration for teams, sprints, ceremonies
- NextAuth.js for GitHub/Google sign-in
- Jira and Slack integration routes
- PWA cache disabled (service worker unregistration)
- Prisma schema for database

## How to proceed

1. Initialize project structure and select a tech stack
2. Check AGENTS.md before making architectural decisions to ensure alignment with product principles above
3. This file will be updated as the project evolves
4. When building, validate assumptions from the master questionnaire against neuroscience evidence before committing to features
5. **Every feature must pass the "overjustification test"**: Would this feature still be valuable if XP were removed? If not, redesign it so learning is the driver, not the reward.
6. **Every game element must pass the "skin test" and the "meaningful-decision test"**: state its MDA chain ("players feel X because Y emerges from Z"); confirm trade-off + uncertainty + context with yes on ≥2 filter questions. A board without a game in it is rejected, even if it looks fun.