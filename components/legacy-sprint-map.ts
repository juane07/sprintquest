// Legacy Sprint Map — persistent board that evolves across sprints
// Grounded in Tannenbaum & Cerasoli (2013): team reflexivity requires
// structured facilitation and learning from past events
// Bjork (1994): desirable difficulty — confronting patterns that persist
// Edmondson (1999): psychological safety as engine of team performance

export type MapTileType =
  | "wind"      // What pushed the team forward
  | "anchor"    // What held the team back
  | "boss"      // A problem identified and defeated
  | "bridge"    // A connection made between past and present
  | "insight"   // A key learning moment
  | "quest"     // A commitment for next sprint
  | "rock"      // A risk identified
  | "star"      // A team achievement

export interface MapTile {
  id: string
  type: MapTileType
  title: string
  description: string
  sprintNumber: number
  category?: string
  verified: boolean
  createdAt: Date
}

export interface SprintMap {
  teamId: string
  tiles: MapTile[]
  sprintsCompleted: number
  currentSprint: number
}

export function createSprintMap(teamId: string): SprintMap {
  return {
    teamId,
    tiles: [],
    sprintsCompleted: 0,
    currentSprint: 1,
  }
}

export function addTile(map: SprintMap, tile: Omit<MapTile, "id" | "createdAt">): SprintMap {
  return {
    ...map,
    tiles: [
      ...map.tiles,
      { ...tile, id: `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date() },
    ],
    sprintsCompleted: map.sprintsCompleted + 1,
    currentSprint: map.currentSprint + 1,
  }
}

export function getTilesByType(map: SprintMap, type: MapTileType): MapTile[] {
  return map.tiles.filter(t => t.type === type)
}

export function getPatternAnalysis(map: SprintMap): {
  topAnchors: MapTile[]
  topWinds: MapTile[]
  recurringThemes: string[]
} {
  const anchors = getTilesByType(map, "anchor")
  const winds = getTilesByType(map, "wind")

  // Identify recurring themes by looking at categories across anchors
  const categoryCounts: Record<string, number> = {}
  anchors.forEach(a => {
    const cat = a.category || a.title
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
  })

  const recurringThemes = Object.entries(categoryCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme)

  return {
    topAnchors: anchors.slice(-5),
    topWinds: winds.slice(-5),
    recurringThemes,
  }
}

export function getSprintMapSummary(map: SprintMap): {
  totalTiles: number
  winds: number
  anchors: number
  bosses: number
  bridges: number
  insights: number
  quests: number
  rocks: number
  stars: number
  recurringThemes: string[]
} {
  const analysis = getPatternAnalysis(map)
  return {
    totalTiles: map.tiles.length,
    winds: getTilesByType(map, "wind").length,
    anchors: getTilesByType(map, "anchor").length,
    bosses: getTilesByType(map, "boss").length,
    bridges: getTilesByType(map, "bridge").length,
    insights: getTilesByType(map, "insight").length,
    quests: getTilesByType(map, "quest").length,
    rocks: getTilesByType(map, "rock").length,
    stars: getTilesByType(map, "star").length,
    recurringThemes: analysis.recurringThemes,
  }
}

// Board tiles persist as Comment rows with a reserved category so no
// schema migration is needed. Content is JSON: {type,title,description,sprintNumber,verified}.
export const BOARD_CATEGORY = "🗺️ Board"

const TILE_TYPES: MapTileType[] = ["wind", "anchor", "boss", "bridge", "insight", "quest", "rock", "star"]

export function isTileType(value: unknown): value is MapTileType {
  return typeof value === "string" && (TILE_TYPES as string[]).includes(value)
}

export function boardTileToComment(tile: { type: MapTileType; title: string; description?: string; sprintNumber?: number; verified?: boolean }): string {
  return JSON.stringify({
    type: tile.type,
    title: tile.title,
    description: tile.description ?? "",
    sprintNumber: tile.sprintNumber ?? null,
    verified: tile.verified ?? false,
  })
}

export function boardCommentToTile(
  comment: { id?: string; content?: string | null; createdAt?: string | Date | null; ceremonyId?: string | null },
  fallbackSprintNumber: number
): MapTile | null {
  if (!comment.content) return null
  try {
    const parsed = JSON.parse(comment.content) as { type?: unknown; title?: unknown; description?: unknown; sprintNumber?: unknown; verified?: unknown }
    if (!isTileType(parsed.type) || typeof parsed.title !== "string" || !parsed.title.trim()) return null
    const sprintNumber = typeof parsed.sprintNumber === "number" && Number.isFinite(parsed.sprintNumber) ? parsed.sprintNumber : fallbackSprintNumber
    return {
      id: typeof comment.id === "string" && comment.id ? comment.id : `tile-${Math.random().toString(36).slice(2, 10)}`,
      type: parsed.type,
      title: parsed.title.trim(),
      description: typeof parsed.description === "string" ? parsed.description : "",
      sprintNumber,
      verified: parsed.verified === true,
      createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
    }
  } catch {
    return null
  }
}

export function buildSprintMapFromBoardComments(
  teamId: string,
  ceremonies: { id: string; sprintId?: string | null; status?: string | null }[],
  sprints: { id: string; number?: number | null }[],
  boardComments: { id?: string; content?: string | null; createdAt?: string | Date | null; ceremonyId?: string | null }[]
): SprintMap {
  const ceremonyToSprint = new Map(ceremonies.map(c => [c.id, c.sprintId ?? null]))
  const sprintNumbers = new Map(sprints.map(s => [s.id, typeof s.number === "number" ? s.number : null]))
  const tiles = boardComments
    .map(c => {
      const sprintId = (c.ceremonyId && ceremonyToSprint.get(c.ceremonyId)) || null
      const fallback = (sprintId && sprintNumbers.get(sprintId)) || 1
      return boardCommentToTile(c, fallback)
    })
    .filter((t): t is MapTile => t !== null)
  const completed = ceremonies.filter(c => c.status === "completed").length
  const maxSprint = sprints.reduce((m, s) => (typeof s.number === "number" ? Math.max(m, s.number) : m), 0)
  return {
    teamId,
    tiles,
    sprintsCompleted: completed,
    currentSprint: maxSprint > 0 ? maxSprint : completed + 1,
  }
}
