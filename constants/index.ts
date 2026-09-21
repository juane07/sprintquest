export const GAME_MODES = {
  BOSS_BATTLE: { name: "🔥 Boss Battle", desc: "Identify and defeat the biggest problem" },
  SAILBOAT: { name: "🏝️ Sailboat", desc: "Wind in sails vs anchor holding back" },
  MISSION_CONTROL: { name: "🚀 Mission Control", desc: "Mission-based retro" },
  DETECTIVE: { name: "🕵️ Detective", desc: "Investigate what happened" },
  TEAM_BATTLE: { name: "⚔️ Team Battle", desc: "Team vs team dynamics" },
} as const

export const CATEGORIES = ["Positive", "Challenge", "Action", "Insight", "Idea"] as const

export const XP_PER_LEVEL = 1000

export const BADGES = {
  IMPROVEMENT_MACHINE: { name: "Improvement Machine", desc: "Complete 10 quests" },
  BUG_HUNTERS: { name: "Bug Hunters", desc: "Resolve 50 issues" },
  COLLABORATION: { name: "Collaboration", desc: "Complete 20 actions with team" },
  CONTINUOUS_DELIVERY: { name: "Continuous Delivery", desc: "Ship 30 features" },
  GOAL_KEEPERS: { name: "Goal Keepers", desc: "Hit 100% of sprint goals" },
} as const

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
  MAD_SAD_GLAD: {
    name: "😡 Mad Sad Glad",
    desc: "Feelings-first classic: vent, acknowledge, celebrate",
    intro: "Feelings are data. Vent the mad, honor the sad, celebrate the glad.",
    rounds: [
      { title: "Vent", prompt: "What made you mad this sprint? Get it out." },
      { title: "Acknowledge", prompt: "What made you sad? Name it without fixing yet." },
      { title: "Celebrate", prompt: "What made you glad? Loud appreciation counts." },
      { title: "Vote the fix", prompt: "Which feeling points at the change we must make?" },
    ],
    categories: [
      { name: "😡 Mad", hint: "What frustrated you" },
      { name: "😢 Sad", hint: "What disappointed you" },
      { name: "😁 Glad", hint: "What delighted you" },
    ],
    voteTitle: "What do we fix first?",
    victoryTitle: "Feelings Processed!",
    victoryEmoji: "🎭",
  },
  START_STOP_CONTINUE: {
    name: "🚦 Start Stop Continue",
    desc: "The fastest agreement machine",
    intro: "Three lists, zero rambling. What do we start, stop, and continue?",
    rounds: [
      { title: "Start", prompt: "What should we start doing?" },
      { title: "Stop", prompt: "What should we stop doing?" },
      { title: "Continue", prompt: "What must we keep doing?" },
      { title: "Lock agreements", prompt: "Vote the top change for Monday." },
    ],
    categories: [
      { name: "🟢 Start", hint: "New habit to try" },
      { name: "🔴 Stop", hint: "Habit to drop" },
      { name: "🟡 Continue", hint: "Habit to protect" },
    ],
    voteTitle: "What changes on Monday?",
    victoryTitle: "Agreements Locked!",
    victoryEmoji: "📋",
  },
  FOUR_LS: {
    name: "📝 4Ls",
    desc: "Liked, Learned, Lacked, Longed For",
    intro: "A reflective classic. Cover all four Ls before voting.",
    rounds: [
      { title: "Liked & Learned", prompt: "What did you like? What did you learn?" },
      { title: "Lacked & Longed", prompt: "What did we lack? What do you long for?" },
      { title: "Vote", prompt: "Which longing deserves action first?" },
      { title: "Commit", prompt: "Turn the top vote into an action item." },
    ],
    categories: [
      { name: "💙 Liked", hint: "What worked" },
      { name: "📚 Learned", hint: "New knowledge" },
      { name: "❌ Lacked", hint: "What was missing" },
      { name: "🔮 Longed For", hint: "What you wish for" },
    ],
    voteTitle: "Which longing deserves action first?",
    victoryTitle: "4Ls Logged!",
    victoryEmoji: "📝",
  },
  LEAN_COFFEE: {
    name: "☕ Lean Coffee",
    desc: "Democratic agenda, timed discussions",
    intro: "You set the agenda. Pitch topics, vote them, discuss the winners.",
    rounds: [
      { title: "Pitch topics", prompt: "One topic per entry. What must we talk about?" },
      { title: "Vote topics", prompt: "Vote with reactions — top topics get discussed." },
      { title: "Discuss", prompt: "Talk through the top topic. Takeaways below." },
      { title: "Actions", prompt: "Every discussion ends in an action or it didn't happen." },
    ],
    categories: [
      { name: "💡 Topic", hint: "Thing to discuss" },
      { name: "🗣️ Takeaway", hint: "What we concluded" },
      { name: "✅ Action", hint: "What we'll do" },
    ],
    voteTitle: "Which topic first?",
    victoryTitle: "Coffee Drained!",
    victoryEmoji: "☕",
  },
  PLUS_DELTA: {
    name: "⚖️ Plus Delta",
    desc: "Keep vs change, minimal and sharp",
    intro: "Two columns. What do we keep? What do we change?",
    rounds: [
      { title: "Plus", prompt: "What should we keep doing?" },
      { title: "Delta", prompt: "What should we change?" },
      { title: "Vote", prompt: "Which change matters most?" },
      { title: "Commit", prompt: "Lock the top change as an action." },
    ],
    categories: [
      { name: "➕ Plus", hint: "Keep doing" },
      { name: "🔺 Delta", hint: "Change this" },
    ],
    voteTitle: "Which change matters most?",
    victoryTitle: "Calibrated!",
    victoryEmoji: "⚖️",
  },
  BUG_BASH: {
    name: "🐞 Bug Bash",
    desc: "Hunt bugs together, vote the nastiest",
    intro: "Everyone hunts. Log bugs, add repro steps, vote the nastiest. What gets logged gets fixed.",
    rounds: [
      { title: "Hunt", prompt: "Find bugs. One per entry — what broke and where." },
      { title: "Repro", prompt: "Add repro steps. Hit 👍 on bugs you reproduced too." },
      { title: "Vote the nastiest", prompt: "Which bug is the nastiest? Most 👍 wins." },
      { title: "Triage", prompt: "Top bugs become action items with owners. Nothing evaporates." },
    ],
    categories: [
      { name: "🐞 Bug", hint: "What broke, where" },
      { name: "🔁 Repro", hint: "Steps to reproduce" },
      { name: "✅ Fixed?", hint: "Already fixed or duplicate" },
    ],
    voteTitle: "Which bug is the nastiest?",
    victoryTitle: "Inbox Zero... ish!",
    victoryEmoji: "🧹",
  },
  QUEST_TRAIL: {
    name: "🗺️ Quest Trail",
    desc: "Mario-party board: roll, move, survive events together",
    intro: "The team moves ONE token together. Roll the die, land on events — bursts, chance cards, boss ambushes — and reach the finish line.",
    rounds: [
      { title: "Roll & move", prompt: "Roll for the team. Land on tiles, post entries about what you pass." },
      { title: "Survive events", prompt: "Bursts and chance cards strike. Play them, then keep rolling." },
      { title: "Boss stretch", prompt: "Final tiles: ambushes and stars. Post blockers and milestones." },
      { title: "Finish line", prompt: "Reach 🏁, review the trail log, lock it in." },
    ],
    categories: [
      { name: "📍 Milestone", hint: "Something reached on the trail" },
      { name: "🚧 Blocker", hint: "Something blocking the path" },
      { name: "💡 Idea", hint: "A shortcut worth trying" },
    ],
    voteTitle: "Which milestone mattered most?",
    victoryTitle: "Trail Complete!",
    victoryEmoji: "🏁",
  },
}

// Team level required to unlock each retro mode. Level comes from Team XP.
export const MODE_UNLOCK_LEVEL: Record<string, number> = {
  SAILBOAT: 1,
  MAD_SAD_GLAD: 1,
  START_STOP_CONTINUE: 1,
  BOSS_BATTLE: 2,
  DETECTIVE: 2,
  PLUS_DELTA: 2,
  BUG_BASH: 2,
  MISSION_CONTROL: 3,
  TEAM_BATTLE: 3,
  FOUR_LS: 3,
  LEAN_COFFEE: 3,
  QUEST_TRAIL: 3,
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
