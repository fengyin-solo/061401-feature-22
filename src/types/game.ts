export interface GameState {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  turn: number
  isGameOver: boolean
  logs: LogEntry[]
}

export interface LogEntry {
  id: number
  text: string
  type: 'action' | 'event' | 'system' | 'good' | 'bad' | 'warning'
  turn: number
}

export interface RandomEvent {
  id: string
  text: string
  type: 'good' | 'bad' | 'neutral'
  effects: {
    health?: number
    hunger?: number
    thirst?: number
    wood?: number
    stone?: number
  }
}

export type ActionType = 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export type ResourceKey = 'health' | 'hunger' | 'thirst' | 'wood' | 'stone'

export interface ActionEffect {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}

export interface ActionBlocker {
  resource: ResourceKey
  label: string
  icon: string
  current: number
  required: number
  gap: number
}

export interface ActionRemediation {
  action: ActionType
  label: string
  icon: string
}

export interface ActionInsight {
  canPerform: boolean
  blockers: ActionBlocker[]
  remediation: ActionRemediation | null
}
