export const XP_PER_LEVEL = 1000

interface ModeCategory { name: string; hint: string }
interface ModeRound { title: string; prompt: string }
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
