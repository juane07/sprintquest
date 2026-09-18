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
