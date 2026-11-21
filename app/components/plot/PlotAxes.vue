<script setup lang="ts">
import { compact, type Frame } from '~/engine/plot'

/**
 * Axes, grid lines, tick labels and axis names for a chart (geometry from
 * frame()). data-el: `<el>` (the whole frame fades in as one).
 */
withDefaults(
  defineProps<{ f: Frame; el?: string; xLabel?: string; yLabel?: string; grid?: boolean; xFormat?: (v: number) => string; yFormat?: (v: number) => string }>(),
  { el: 'axes', grid: true, xFormat: (v: number) => compact(v), yFormat: (v: number) => compact(v) },
)
</script>

<template>
  <g :data-el="el" class="axes">
    <template v-if="grid">
      <line v-for="t in f.xTicks" :key="`gx${t}`" class="grid" :x1="f.sx(t)" :x2="f.sx(t)" :y1="f.box.y0" :y2="f.box.y1" />
      <line v-for="t in f.yTicks" :key="`gy${t}`" class="grid" :x1="f.box.x0" :x2="f.box.x1" :y1="f.sy(t)" :y2="f.sy(t)" />
    </template>
    <line class="axis" :x1="f.box.x0" :x2="f.box.x1" :y1="f.box.y1" :y2="f.box.y1" />
    <line class="axis" :x1="f.box.x0" :x2="f.box.x0" :y1="f.box.y0" :y2="f.box.y1" />
    <text v-for="t in f.xTicks" :key="`tx${t}`" class="tick" :x="f.sx(t)" :y="f.box.y1 + 14" text-anchor="middle">{{ xFormat(t) }}</text>
    <text v-for="t in f.yTicks" :key="`ty${t}`" class="tick" :x="f.box.x0 - 6" :y="f.sy(t) + 3.5" text-anchor="end">{{ yFormat(t) }}</text>
    <text v-if="xLabel" class="name" :x="f.box.x1" :y="f.box.y1 + 30" text-anchor="end">{{ xLabel }}</text>
    <text v-if="yLabel" class="name" :x="f.box.x0 - 6" :y="f.box.y0 - 10" text-anchor="start">{{ yLabel }}</text>
  </g>
</template>

<style scoped>
.grid { stroke: var(--grid); }
.axis { stroke: var(--axis); }
.tick { fill: var(--text-faint); font: 10px var(--font-mono); }
.name { fill: var(--text-dim); font: 12px var(--font-sans); }
</style>
