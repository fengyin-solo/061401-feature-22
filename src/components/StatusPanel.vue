<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceKey } from '@/types/game'

interface StatItem {
  label: string
  value: number
  max: number
  icon: string
  color: string
  barColor: string
  isReverse?: boolean
  resourceKey: ResourceKey
  threshold?: number
  isBlocked: boolean
}

interface Props {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  blockedResources: Set<ResourceKey>
  thresholds: Record<ResourceKey, number | undefined>
}

const props = defineProps<Props>()

const stats = computed<StatItem[]>(() => [
  {
    label: '生命值',
    value: props.health,
    max: 100,
    icon: '❤️',
    color: 'text-red-400',
    barColor: 'bg-red-500',
    resourceKey: 'health',
    isBlocked: props.blockedResources.has('health'),
  },
  {
    label: '饥饿值',
    value: props.hunger,
    max: 100,
    icon: '🍖',
    color: 'text-orange-400',
    barColor: 'bg-orange-500',
    isReverse: true,
    resourceKey: 'hunger',
    isBlocked: props.blockedResources.has('hunger'),
  },
  {
    label: '口渴值',
    value: props.thirst,
    max: 100,
    icon: '💧',
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    isReverse: true,
    resourceKey: 'thirst',
    isBlocked: props.blockedResources.has('thirst'),
  },
  {
    label: '木材',
    value: props.wood,
    max: 100,
    icon: '🪵',
    color: 'text-amber-600',
    barColor: 'bg-amber-600',
    resourceKey: 'wood',
    threshold: props.thresholds.wood,
    isBlocked: props.blockedResources.has('wood'),
  },
  {
    label: '石头',
    value: props.stone,
    max: 100,
    icon: '🪨',
    color: 'text-gray-400',
    barColor: 'bg-gray-400',
    resourceKey: 'stone',
    threshold: props.thresholds.stone,
    isBlocked: props.blockedResources.has('stone'),
  },
])

function getBarWidth(value: number, max: number): string {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return `${percent}%`
}

function isDanger(value: number, max: number, isReverse?: boolean): boolean {
  const percent = (value / max) * 100
  if (isReverse) {
    return percent >= 80
  }
  return percent <= 20
}

function getThresholdLeft(threshold: number, max: number): string {
  const percent = Math.max(0, Math.min(100, (threshold / max) * 100))
  return `${percent}%`
}
</script>

<template>
  <div class="bg-game-card rounded-2xl p-6 border border-game-border shadow-xl">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span>📊</span>
      <span>生存状态</span>
    </h2>
    <div class="space-y-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="group"
        :class="stat.isBlocked ? 'ring-1 ring-red-500/40 rounded-lg p-2 -m-2 bg-red-950/20' : ''"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ stat.icon }}</span>
            <span :class="[stat.color, 'font-medium text-sm']">{{ stat.label }}</span>
            <span
              v-if="stat.isBlocked"
              class="text-[10px] text-red-400 bg-red-900/40 px-1.5 py-0.5 rounded font-medium"
            >不足</span>
          </div>
          <span
            :class="[
              stat.color,
              'font-bold text-sm tabular-nums',
              isDanger(stat.value, stat.max, stat.isReverse) ? 'animate-pulse-soft' : '',
            ]"
          >
            {{ Math.round(stat.value) }}
            <span
              v-if="stat.threshold !== undefined"
              class="text-gray-500 font-normal text-[10px] ml-0.5"
            >/{{ stat.threshold }}</span>
          </span>
        </div>
        <div class="h-2.5 bg-gray-800 rounded-full overflow-hidden relative">
          <div
            :class="[stat.barColor, 'h-full rounded-full transition-all duration-300 ease-out']"
            :style="{ width: getBarWidth(stat.value, stat.max) }"
          ></div>
          <div
            v-if="stat.threshold !== undefined"
            class="absolute top-0 h-full w-0.5 bg-red-400/80 z-10"
            :style="{ left: getThresholdLeft(stat.threshold, stat.max) }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
