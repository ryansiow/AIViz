<script setup lang="ts">
import type { Segment } from '~/engine/plot'
import { hueVar, type Hue, type TrackMeta } from '~/types/concept'

/**
 * A tangent line through a point on a curve (geometry from tangentSegment()).
 * data-el parts: `<el>-line`, `<el>-point`, `<el>-label`, `<el>-hit`.
 */
const props = defineProps<{
  seg: Segment | null
  point: [number, number]
  hue: Hue
  el: string
  label?: string
  labelAt?: { x: number; y: number; anchor: 'start' | 'end' | 'middle' }
  track?: TrackMeta
}>()
</script>

<template>
  <g :data-el="el" v-track="track ?? { id: el, kind: 'TANGENT', name: label ?? el, hue, rows: [] }" class="tangent" :style="{ '--c': hueVar(props.hue) }">
    <line v-if="seg" :data-el="`${el}-line`" class="line" :x1="seg.x1" :y1="seg.y1" :x2="seg.x2" :y2="seg.y2" />
    <circle :data-el="`${el}-point`" class="point" :cx="point[0]" :cy="point[1]" r="4" />
    <text v-if="label && labelAt" :data-el="`${el}-label`" class="label" :x="labelAt.x" :y="labelAt.y" :text-anchor="labelAt.anchor">{{ label }}</text>
    <line v-if="seg" :data-el="`${el}-hit`" class="hit" :x1="seg.x1" :y1="seg.y1" :x2="seg.x2" :y2="seg.y2" />
  </g>
</template>

<style scoped>
.tangent { pointer-events: none; }
.line { stroke: var(--c); stroke-width: 1.75; stroke-linecap: round; }
.point { fill: var(--c); stroke: var(--surface); stroke-width: 1.5; }
.label { fill: var(--c); font: 12px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
.hit { stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
</style>
