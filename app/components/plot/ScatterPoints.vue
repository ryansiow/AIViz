<script setup lang="ts">
import type { Scale } from '~/engine/plot'
import { hueVar, type Hue, type TrackMeta } from '~/types/concept'

export interface ScatterPoint {
  x: number
  y: number
  hue?: Hue
  /** Outlined instead of filled (e.g. held-out data). */
  hollow?: boolean
  track?: TrackMeta
}

/**
 * Data points for a chart. data-el parts: `<el>-pt-<i>` (each dot),
 * `<el>-hit-<i>` (hover target, switched on by activate()).
 */
withDefaults(defineProps<{ points: ScatterPoint[]; sx: Scale; sy: Scale; el: string; hue?: Hue; r?: number }>(), { hue: 'blue', r: 4.5 })
</script>

<template>
  <g v-for="(p, i) in points" :key="i" v-track="p.track ?? { id: `${el}-${i}`, kind: 'POINT', name: `point ${i + 1}`, hue: p.hue ?? hue, rows: [['x', String(p.x)], ['y', String(p.y)]] }" class="pt-wrap" :style="{ '--c': hueVar(p.hue ?? hue) }">
    <circle :data-el="`${el}-pt-${i}`" class="pt" :class="{ hollow: p.hollow }" :cx="sx(p.x)" :cy="sy(p.y)" :r="r" />
    <circle :data-el="`${el}-hit-${i}`" class="hit" :cx="sx(p.x)" :cy="sy(p.y)" :r="r + 5" />
  </g>
</template>

<style scoped>
.pt-wrap { pointer-events: none; }
.pt { fill: var(--c); stroke: var(--surface); stroke-width: 1.5; }
.pt.hollow { fill: var(--surface); stroke: var(--c); stroke-width: 1.75; }
.hit { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
