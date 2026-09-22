# SprintQuest — Implementation Plan: Neuroscience-Aligned Redesign

## Overview

This plan restructures SprintQuest from a "gamified retro tool" into a **learning-science-informed team learning system**. Every change is grounded in neuroscience and learning science evidence.

## Evidence Base Summary

| Principle | Source | Implementation Target |
|-----------|--------|----------------------|
| Overjustification effect | Deci et al. (1999), Murayama et al. (2010) | Reframe XP as informational metric |
| Retrieval practice | Dunlosky et al. (2013), Nature Reviews (2022) | Spaced retrieval warm-up before each retro |
| Psychological safety | Edmondson (1999), Frazier et al. (2017) | Pre-retro safety check-in, anonymous by default |
| Team reflexivity | Tannenbaum & Cerasoli (2013), Gucciardi et al. (2025) | Structured reflection phase with guided prompts |
| Team flow | Shehata et al. (2021) | Adaptive pacing, no artificial time pressure |
| Cooperation > competition | iScience (2024) | All cooperative framing, no competitive elements |
| Desirable difficulty | Bjork (1994) | Reflection quizzes, elaborative interrogation |
| Mastery-based badges | Sailer & Homner (2020) | Replace participation badges with mastery badges |

## Phase 1: Reframe XP System (Week 1)

**Goal**: Remove the "reward" framing from XP to prevent overjustification effect.

### Changes:

1. **`lib/xp.ts`** — Rename functions and add informational framing
   - `ceremonyReward` → `engagementMetric` (returns engagement score)
   - `streakBonus` → `streakIndicator` (returns streak data)
   - Add comments explaining informational purpose
   - Keep math identical (no functional change, only semantic)

2. **`app/retro/[id]/page.tsx`** — Update all UX text
   - "Finish + Earn XP" → "Finish — Reflect and Share"
   - "Your team earned +X XP" → "Team engagement level: X"
   - "Worth +100 XP" → "Action tracked on engagement dashboard"
   - Remove all "earn" language from ceremony completion

3. **`app/dashboard/page.tsx`** — Update dashboard
   - "Team XP" → "Team Engagement Level"
   - Progress bar: "XP to next level" → "Engagement to next milestone"
   - Action items: remove XP display
   - Complete action button: remove XP gain notification

4. **`lib/ai.ts`** — Update AI prompts
   - Remove "Team XP only" from system prompt
   - Replace with: "Frame results as engagement metrics, never as rewards"

### Evidence:
- Deci et al. (1999): Extrinsic rewards undermine intrinsic motivation when perceived as controlling
- Murayama et al. (2010): Reward removal decreases VS/SN/VTA activity
- Overjustification test: Would this feature still be valuable if XP were removed?

## Phase 2: Spaced Retrieval Warm-Up (Week 2)

**Goal**: Add evidence-based retrieval practice at the start of every retro.

### Changes:

1. **New: `lib/learning-science.ts`** — Retrieval and reflection logic
   ```typescript
   // Generate spaced retrieval prompts based on sprint history
   export function getRetrievalPrompt(sprintNumber: number, lastCeremony?: any): string
   export function getReflectionPrompts(gameMode: string): ReflectionPrompt[]
   ```

2. **New: `components/SpacedRetrieval.tsx`** — Retrieval warm-up component
   - Shows personalized recall prompt before retro starts
   - Tracks retrieval history in local state
   - Adapts prompt difficulty based on sprint count

3. **`app/retro/[id]/page.tsx`** — Integrate warm-up phase
   - New step 0: Spaced retrieval before game rounds
   - Fetch previous ceremony data from Supabase
   - Display retrieval prompt with input field

4. **Database**: Add `RetrievalSession` model to track spaced recall history

### Evidence:
- Dunlosky et al. (2013): Retrieval practice is more effective than re-reading
- Nature Reviews Psychology (2022): Spacing enhances ventromedial prefrontal cortex pattern similarity
- Zou et al. (2025): Spaced learning benefits depend on remembering and re-encoding past experience

## Phase 3: Structured Reflection Phase (Week 2-3)

**Goal**: Add guided metacognitive reflection after game rounds but before voting.

### Changes:

1. **`constants/index.ts`** — Add reflection prompts per game mode
   ```typescript
   interface ReflectionPrompt {
     question: string
     type: 'metacognitive' | 'elaborative' | 'evaluative' | 'exploratory'
   }
   ```

2. **New: `components/ReflectionPhase.tsx`** — Reflection component
   - Shows 2-3 guided prompts per round
   - Team can discuss answers before proceeding
   - Types: metacognitive ("What surprised us?"), elaborative ("Why did this happen?"), evaluative ("How well did we do?"), exploratory ("What would we try differently?")

3. **`app/retro/[id]/page.tsx`** — Insert reflection between rounds
   - After each round's entries, show reflection prompt
   - Optional: team discusses before proceeding
   - Track reflection engagement

### Evidence:
- Tannenbaum & Cerasoli (2013): Four conditions for effective reflexivity
- Gucciardi et al. (2025): Team reflexivity has medium effect on performance (g = 0.549)
- Reflection is most beneficial at beginning of learning curve

## Phase 4: Psychological Safety Features (Week 3)

**Goal**: Add safety check-ins and facilitation features.

### Changes:

1. **New: `components/SafetyCheckIn.tsx`** — Pre-retro safety check
   - Optional 1-5 scale: "How safe do you feel sharing?"
   - Anonymous sharing enabled by default
   - AI facilitator monitors for safe environment

2. **`app/retro/[id]/page.tsx`** — Add safety check before ceremony starts
   - Display check-in modal before round 1
   - If team reports low safety, AI provides facilitation tips

3. **`lib/ai.ts`** — Add safety detection
   - Detect patterns of hesitation or low participation
   - Suggest facilitation interventions

### Evidence:
- Edmondson (1999): Psychological safety is the "engine" of team learning
- Frazier et al. (2017): PS directly predicts incremental variance in task performance
- PS more strongly associated with learning in knowledge-intensive tasks

## Phase 5: AI Real-Time Facilitation (Week 3-4)

**Goal**: Transform AI from post-hoc summarizer to real-time facilitator.

### Changes:

1. **`lib/ai.ts`** — Add real-time facilitation functions
   ```typescript
   export function detectPatterns(entries: Entry[]): Pattern[]
   export function generateProbingQuestion(pattern: Pattern): string
   export function suggestGrouping(entries: Entry[]): Grouping[]
   ```

2. **New: `components/AIFacilitator.tsx`** — Real-time AI sidebar
   - Shows pattern detection during entries
   - Suggests probing questions
   - Groups similar entries automatically

3. **`app/retro/[id]/page.tsx`** — Integrate AI facilitation
   - Show AI suggestions alongside entries
   - Real-time pattern alerts during rounds
   - Post-ceremony summary remains optional

### Evidence:
- Multisource feedback + guided facilitation creates synergistic effects for team reflection (Springer, 2025)
- AI is a scaffolding tool for metacognitive reflection, not a summary machine

## Phase 6: Mastery-Based Badges (Week 4)

**Goal**: Replace participation badges with mastery markers.

### Changes:

1. **Badge redesign**:
   - ~~"First Quest"~~ → **"Retrospective Explorer"** (Completed first retro with reflection)
   - ~~"Closer"~~ → **"Action Completer"** (Completed 5+ action items across sprints)
   - ~~"On Fire"~~ → **"Streak Mindset"** (3+ sprints with reflection participation)
   - **New**: "Pattern Spotter" (Identified recurring issues in retros)
   - **New**: "Bridge Builder" (Completed cross-sprint actions)
   - **New**: "Deep Thinker" (Engaged with elaborative reflection prompts)
   - **New**: "Safety Advocate" (Maintained high psychological safety scores)

2. **Badge logic**: Track mastery indicators, not just participation

### Evidence:
- Participation-based badges have minimal impact (Hedges' g = 0.277)
- Mastery-based badges signal competence and satisfy SDT needs

## Phase 7: Adaptive Pacing (Week 4)

**Goal**: Replace fixed 5-minute timers with adaptive pacing.

### Changes:

1. **`lib/learning-science.ts`** — Add pacing logic
   ```typescript
   export function getAdaptiveRoundDuration(entries: number, round: number): number
   export function shouldExtendRound(teamActivity: boolean): boolean
   ```

2. **`app/retro/[id]/page.tsx`** — Update timer UX
   - Show remaining time as suggestion, not countdown
   - Allow teams to extend or skip rounds
   - Remove "Time!" alarm — use gentle notification

### Evidence:
- Flow requires challenge-skill balance and clear goals (Csikszentmihalyi, 1975)
- Artificial time pressure creates anxiety, not flow
- Competition/stress evidence: competition increases autonomic activation (iScience, 2024)

## Phase 8: Social Recognition (Week 5)

**Goal**: Add cooperative social features without competitive comparison.

### Changes:

1. **New: `components/PeerRecognition.tsx`** — Shout-out mechanism
   - Teams can acknowledge each other's contributions
   - No scoring or ranking — purely positive recognition
   - Appears on team dashboard

2. **New: `components/TeamTimeline.tsx`** — Visual journey
   - Shows team's retro history as a narrative timeline
   - Highlights learning milestones
   - No comparison between teams

### Evidence:
- Cooperation produces higher social relatedness than competition (Dindar et al., 2020)
- Team flow requires common purpose and mutual accountability (Shehata et al., 2021)

## Database Changes

```prisma
// Add to schema.prisma:

model RetrievalSession {
  id          String   @id @default(dbgenerated("gen_random_uuid()::text"))
  sprintId    String
  sprint      Sprint   @relation(fields: [sprintId], references: [id])
  promptType  String
  answered    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Reflection {
  id          String   @id @default(dbgenerated("gen_random_uuid()::text"))
  ceremonyId  String
  ceremony    Ceremony @relation(fields: [ceremonyId], references: [id])
  round       Int
  prompt      String
  response    String?
  type        String   // metacognitive, elaborative, evaluative, exploratory
  createdAt   DateTime @default(now())
}
```

## Priority Matrix

| Priority | Change | Sprint | Evidence Strength | Impact |
|----------|--------|--------|-------------------|--------|
| P0 | Reframe XP as informational | 1 | Very strong | Prevents motivation collapse |
| P0 | Add spaced retrieval warm-up | 1 | Very strong | Dramatic retention improvement |
| P1 | Add structured reflection | 2 | Very strong | Directly targets team learning |
| P1 | Adaptive pacing | 2 | Strong | Reduces anxiety, enables flow |
| P2 | Psychological safety features | 2 | Very strong | Foundation for all team learning |
| P2 | AI real-time facilitation | 3 | Strong | Transformative for retros |
| P3 | Mastery-based badges | 3 | Moderate | Better competence satisfaction |
| P3 | Social recognition | 4 | Strong | Higher relatedness, team cohesion |

## Testing Strategy

- Update existing tests in `tests/xp.test.ts` to reflect renamed functions
- Add new tests for `lib/learning-science.ts` retrieval prompt generation
- Add integration tests for reflection phase flow
- Verify that all new features pass the "overjustification test"

## Rollout Order

1. Phase 1 (XP reframe) — No breaking changes, text updates only
2. Phase 2 (Spaced retrieval) — Add new step before rounds
3. Phase 3 (Reflection) — Add between rounds
4. Phase 4 (Safety) — Pre-ceremony addition
5. Phase 5 (AI facilitation) — Enhancement to existing AI
6. Phase 6 (Badges) — Database + UI update
7. Phase 7 (Adaptive pacing) — UX change
8. Phase 8 (Social) — New feature
