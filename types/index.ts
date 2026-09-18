export interface Team {
  id: string
  name: string
  mascot: string
  level: number
  xp: number
  streak: number
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Sprint {
  id: string
  number: number
  theme: string
  teamId: string
  status: string
  startedAt: string
  endedAt?: string
}

export interface Ceremony {
  id: string
  type: string
  gameMode: string
  teamId: string
  sprintId: string
  status: string
  startedAt: string
  endedAt?: string
  round: number
}

export interface Quest {
  id: string
  title: string
  description: string
  xpValue: number
  status: string
  sprintId: string
  completedAt?: string
}

export interface Comment {
  id: string
  content: string
  author: string
  anonymous: boolean
  category: string
  ceremonyId: string
}
