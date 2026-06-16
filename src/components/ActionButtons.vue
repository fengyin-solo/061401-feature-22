<script setup lang="ts">
import type { ActionInsight, ActionType } from '@/types/game'

interface ActionButton {
  label: string
  icon: string
  description: string
  actionType: ActionType
  bgClass: string
  hoverClass: string
}

interface Props {
  insights: Record<ActionType, ActionInsight>
  disabled: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  performAction: [action: ActionType]
}>()

const buttons: ActionButton[] = [
  {
    label: '采集木头',
    icon: '🪵',
    description: '获得木材，消耗体力',
    actionType: 'gatherWood',
    bgClass: 'bg-amber-900/40',
    hoverClass: 'hover:bg-amber-800/60',
  },
  {
    label: '采集石头',
    icon: '🪨',
    description: '获得石头，消耗体力',
    actionType: 'gatherStone',
    bgClass: 'bg-gray-700/40',
    hoverClass: 'hover:bg-gray-600/60',
  },
  {
    label: '打猎',
    icon: '🏹',
    description: '回复生命，增加饥饿，消耗木材',
    actionType: 'hunt',
    bgClass: 'bg-red-900/40',
    hoverClass: 'hover:bg-red-800/60',
  },
  {
    label: '喝水',
    icon: '💧',
    description: '减少口渴，消耗木材烧水',
    actionType: 'drink',
    bgClass: 'bg-blue-900/40',
    hoverClass: 'hover:bg-blue-800/60',
  },
]

function handleClick(actionType: ActionType) {
  emit('performAction', actionType)
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span>⚡</span>
      <span>行动</span>
    </h2>
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="btn in buttons"
        :key="btn.label"
        class="relative"
      >
        <button
          @click="handleClick(btn.actionType)"
          :disabled="disabled || !props.insights[btn.actionType].canPerform"
          :class="[
            btn.bgClass,
            'w-full p-4 rounded-xl border transition-all duration-200',
            'flex flex-col items-center justify-center gap-2 text-center',
            disabled || !props.insights[btn.actionType].canPerform
              ? 'opacity-40 cursor-not-allowed border-game-border'
              : [btn.hoverClass, 'hover:scale-[1.02] hover:shadow-lg cursor-pointer active:scale-[0.98] border-game-border'],
          ]"
        >
          <span class="text-3xl">{{ btn.icon }}</span>
          <span class="text-white font-semibold text-sm">{{ btn.label }}</span>
          <span class="text-gray-400 text-xs">{{ btn.description }}</span>
        </button>

        <div
          v-if="!disabled && !props.insights[btn.actionType].canPerform && props.insights[btn.actionType].blockers.length > 0"
          class="mt-2 bg-red-950/50 border border-red-800/40 rounded-lg p-2.5 animate-slide-up"
        >
          <div
            v-for="blocker in props.insights[btn.actionType].blockers"
            :key="blocker.resource"
            class="flex items-center justify-between text-xs mb-1 last:mb-0"
          >
            <span class="text-red-300 flex items-center gap-1">
              <span>{{ blocker.icon }}</span>
              <span>{{ blocker.label }}</span>
            </span>
            <span class="text-red-400 font-mono">
              {{ blocker.current }}/{{ blocker.required }}
              <span class="text-red-300 ml-0.5">差{{ blocker.gap }}</span>
            </span>
          </div>

          <button
            v-if="props.insights[btn.actionType].remediation"
            @click="handleClick(props.insights[btn.actionType].remediation!.action)"
            class="mt-2 w-full py-1.5 px-3 bg-amber-800/50 hover:bg-amber-700/60 border border-amber-700/40 rounded-md text-amber-200 text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{{ props.insights[btn.actionType].remediation!.icon }}</span>
            <span>去{{ props.insights[btn.actionType].remediation!.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
