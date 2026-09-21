export const XP_PER_LEVEL = 1000

export interface ModeCategory { name: string; hint: string }
export interface ModeRound { title: string; prompt: string }
export interface ModeConfig {
  name: string
  desc: string
  intro: string
  rounds: ModeRound[]
  categories: ModeCategory[]
  voteTitle: string
  victoryTitle: string
  victoryEmoji: string
}

export const MODE_CONFIG: Record<string, ModeConfig> = {
  BOSS_BATTLE: {
    name: "🔥 Boss Battle",
    desc: "Identify and defeat the biggest problem",
    intro: "Every sprint has a final boss. Name them, find their weakness, vote which one you fight first.",
    rounds: [
      { title: "Spot the bosses", prompt: "What slowed the team down? Name one boss per entry — be specific." },
      { title: "Find weaknesses", prompt: "For each boss: what can we exploit? A tool, a habit, a decision?" },
      { title: "Vote the fight", prompt: "Time to choose. Which boss does the team fight first?" },
      { title: "Claim the loot", prompt: "What did we learn? What do we carry into the next sprint?" },
    ],
    categories: [
      { name: "👹 Boss", hint: "The problem, e.g. 'Flaky CI pipeline'" },
      { name: "🗡️ Weakness", hint: "How to beat it" },
      { name: "🛡️ Loot", hint: "What we learned" },
    ],
    voteTitle: "Which boss does the team fight first?",
    victoryTitle: "Boss Defeated!",
    victoryEmoji: "⚔️",
  },
  SAILBOAT: {
    name: "🏝️ Sailboat",
    desc: "Wind in sails vs anchor holding back",
    intro: "Your team is a sailboat. Catch the wind, cut the anchors, watch for rocks, set the course.",
    rounds: [
      { title: "Catch the wind", prompt: "What pushed the team forward this sprint?" },
      { title: "Cut the anchors", prompt: "What held the team back? Be honest, be kind." },
      { title: "Watch for rocks", prompt: "What risks do you see ahead for next sprint?" },
      { title: "Set the course", prompt: "Where is our island? What does success look like next sprint?" },
    ],
    categories: [
      { name: "🌬️ Wind", hint: "What helped us move fast" },
      { name: "⚓ Anchor", hint: "What slowed us down" },
      { name: "🪨 Rocks", hint: "Risks ahead" },
      { name: "🏝️ Island", hint: "Our goal for next sprint" },
    ],
    voteTitle: "What do we fix first?",
    victoryTitle: "Course Set!",
    victoryEmoji: "⛵",
  },
  MISSION_CONTROL: {
    name: "🚀 Mission Control",
    desc: "Mission-based retro",
    intro: "Debrief the mission. What was nominal, what was an anomaly, what do we correct?",
    rounds: [
      { title: "Launch recap", prompt: "What went according to plan this sprint?" },
      { title: "Anomaly hunt", prompt: "What surprised us — good or bad? Stick to facts." },
      { title: "Triage", prompt: "Which anomaly is mission-critical? Vote with the team." },
      { title: "Lock corrections", prompt: "What exact correction do we commit to next sprint?" },
    ],
    categories: [
      { name: "✅ Nominal", hint: "Went to plan" },
      { name: "⚠️ Anomaly", hint: "Unexpected event" },
      { name: "🔧 Correction", hint: "Fix we commit to" },
    ],
    voteTitle: "Which anomaly is mission-critical?",
    victoryTitle: "Mission Debriefed!",
    victoryEmoji: "🛰️",
  },
  DETECTIVE: {
    name: "🕵️ Detective",
    desc: "Investigate what happened",
    intro: "Something happened this sprint. Gather evidence, name suspects, deliver the verdict.",
    rounds: [
      { title: "Gather evidence", prompt: "Facts only. What happened, when, what was the impact?" },
      { title: "Name suspects", prompt: "What do you think caused it? Hypotheses welcome." },
      { title: "Interrogate", prompt: "Vote: what really was the root cause?" },
      { title: "Deliver the verdict", prompt: "Case closed when there's an action. What's the verdict?" },
    ],
    categories: [
      { name: "🔎 Evidence", hint: "Facts and data" },
      { name: "❓ Suspect", hint: "Possible cause" },
      { name: "⚖️ Verdict", hint: "Conclusion + action" },
    ],
    voteTitle: "What really happened? Vote the root cause.",
    victoryTitle: "Case Closed!",
    victoryEmoji: "🔍",
  },
  TEAM_BATTLE: {
    name: "⚔️ Team Battle",
    desc: "Team vs team dynamics",
    intro: "Split into squads, celebrate loud, then agree on one rematch goal. GG for everyone.",
    rounds: [
      { title: "Shoutouts", prompt: "Celebrate a win — yours or another squad's. Loud is good." },
      { title: "Assists", prompt: "Who helped you this sprint? Give them credit." },
      { title: "Play of the game", prompt: "Vote the single best moment of the sprint." },
      { title: "Call the rematch", prompt: "One thing both squads improve together next sprint." },
    ],
    categories: [
      { name: "🏆 Win", hint: "Something great that happened" },
      { name: "🤝 Assist", hint: "Help you received" },
      { name: "🎯 Rematch", hint: "What we improve together" },
    ],
    voteTitle: "What was the play of the game?",
    victoryTitle: "Game Over — GG!",
    victoryEmoji: "🏟️",
  },
}

export const DEFAULT_MODE: ModeConfig = {
  name: "Retro",
  desc: "Classic retrospective",
  intro: "Share honestly. Every voice counts.",
  rounds: [
    { title: "Share", prompt: "What happened this sprint?" },
    { title: "Dig deeper", prompt: "What's behind those entries?" },
    { title: "Vote", prompt: "What matters most?" },
    { title: "Commit", prompt: "What do we change next sprint?" },
  ],
  categories: [
    { name: "Positive", hint: "What went well" },
    { name: "Challenge", hint: "What was hard" },
    { name: "Action", hint: "What we'll do" },
    { name: "Insight", hint: "What we learned" },
    { name: "Idea", hint: "What we could try" },
  ],
  voteTitle: "What matters most?",
  victoryTitle: "Quest Complete!",
  victoryEmoji: "🎉",
}
