import { ref, computed, watch } from 'vue'
import type { GameState, LogEntry, RandomEvent, ActionType, ActionEffect, ActionInsight, ActionBlocker, ActionRemediation, ResourceKey } from '@/types/game'
import { randomEvents } from '@/data/events'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'
const MAX_STAT = 100

const actionEffects: Record<ActionType, ActionEffect> = {
  gatherWood: {
    health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
  gatherStone: {
    health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
  hunt: {
    health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
  drink: {
    health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
}

const actionNames: Record<ActionType, string> = {
  gatherWood: '采集木头',
  gatherStone: '采集石头',
  hunt: '打猎',
  drink: '喝水',
}

const actionIcons: Record<ActionType, string> = {
  gatherWood: '🪵',
  gatherStone: '🪨',
  hunt: '🏹',
  drink: '💧',
}

const resourceLabels: Record<ResourceKey, string> = {
  health: '生命值',
  hunger: '饥饿值',
  thirst: '口渴值',
  wood: '木材',
  stone: '石头',
}

const resourceIcons: Record<ResourceKey, string> = {
  health: '❤️',
  hunger: '🍖',
  thirst: '💧',
  wood: '🪵',
  stone: '🪨',
}

const resourceRemediation: Record<ResourceKey, ActionType> = {
  wood: 'gatherWood',
  stone: 'gatherStone',
  health: 'gatherWood',
  hunger: 'hunt',
  thirst: 'drink',
}

export function useGame() {
  const state = ref<GameState>({
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    turn: 0,
    isGameOver: false,
    logs: [],
  })

  const highScore = ref<number>(0)
  let logIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        highScore.value = parseInt(saved, 10) || 0
      }
    } catch (e) {
      highScore.value = 0
    }
  }

  function saveHighScore() {
    if (state.value.turn > highScore.value) {
      highScore.value = state.value.turn
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(highScore.value))
      } catch (e) {
        // ignore
      }
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function clampStat(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function applyEffects(effects: ActionEffect) {
    if (effects.health !== undefined) {
      state.value.health = clampStat(state.value.health + effects.health, 0, MAX_STAT)
    }
    if (effects.hunger !== undefined) {
      state.value.hunger = clampStat(state.value.hunger + effects.hunger, 0, MAX_STAT)
    }
    if (effects.thirst !== undefined) {
      state.value.thirst = clampStat(state.value.thirst + effects.thirst, 0, MAX_STAT)
    }
    if (effects.wood !== undefined) {
      state.value.wood = Math.max(0, state.value.wood + effects.wood)
    }
    if (effects.stone !== undefined) {
      state.value.stone = Math.max(0, state.value.stone + effects.stone)
    }
  }

  function getRandomEvent(): RandomEvent {
    const index = Math.floor(Math.random() * randomEvents.length)
    return randomEvents[index]
  }

  function checkGameOver() {
    if (state.value.health <= 0 || state.value.hunger >= MAX_STAT || state.value.thirst >= MAX_STAT) {
      state.value.isGameOver = true
      saveHighScore()
      addLog('你没能在荒野中生存下来...', 'system')
    }
  }

  function canPerformAction(action: ActionType): boolean {
    if (state.value.isGameOver) return false
    const effects = actionEffects[action]
    if (effects.wood !== undefined && state.value.wood + effects.wood < 0) {
      return false
    }
    if (effects.stone !== undefined && state.value.stone + effects.stone < 0) {
      return false
    }
    return true
  }

  function getActionInsight(action: ActionType): ActionInsight {
    if (state.value.isGameOver) {
      return { canPerform: false, blockers: [], remediation: null }
    }

    const effects = actionEffects[action]
    const blockers: ActionBlocker[] = []

    const resourceChecks: { key: ResourceKey; effectKey: keyof ActionEffect }[] = [
      { key: 'wood', effectKey: 'wood' },
      { key: 'stone', effectKey: 'stone' },
    ]

    for (const { key, effectKey } of resourceChecks) {
      const delta = effects[effectKey]
      if (delta !== undefined && delta < 0) {
        const current = state.value[key]
        const required = Math.abs(delta)
        if (current < required) {
          blockers.push({
            resource: key,
            label: resourceLabels[key],
            icon: resourceIcons[key],
            current,
            required,
            gap: required - current,
          })
        }
      }
    }

    let remediation: ActionRemediation | null = null
    if (blockers.length > 0) {
      const primaryBlocker = blockers[0]
      const remedyAction = resourceRemediation[primaryBlocker.resource]
      remediation = {
        action: remedyAction,
        label: actionNames[remedyAction],
        icon: actionIcons[remedyAction],
      }
    }

    return {
      canPerform: blockers.length === 0,
      blockers,
      remediation,
    }
  }

  function tryAction(action: ActionType): boolean {
    if (canPerformAction(action)) {
      performAction(action)
      return true
    }
    const insight = getActionInsight(action)
    if (insight.blockers.length > 0) {
      const blockerDescs = insight.blockers.map(
        b => `${b.label}不足（${b.current}/${b.required}，差${b.gap}）`
      )
      const remedyText = insight.remediation
        ? `，建议：${insight.remediation.label}`
        : ''
      addLog(`无法${actionNames[action]}——${blockerDescs.join('，')}${remedyText}`, 'warning')
    }
    return false
  }

  function performAction(action: ActionType) {
    if (!canPerformAction(action)) return

    const effects = actionEffects[action]
    applyEffects(effects)
    state.value.turn++

    addLog(`第 ${state.value.turn} 回合：${actionNames[action]}`, 'action')

    const event = getRandomEvent()
    applyEffects(event.effects)

    const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
    addLog(event.text, eventLogType)

    checkGameOver()
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function restart() {
    state.value = {
      health: 80,
      hunger: 30,
      thirst: 30,
      wood: 10,
      stone: 5,
      turn: 0,
      isGameOver: false,
      logs: [],
    }
    logIdCounter = 0
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')

  return {
    state,
    highScore,
    canAct,
    canPerformAction,
    getActionInsight,
    tryAction,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    restart,
  }
}
