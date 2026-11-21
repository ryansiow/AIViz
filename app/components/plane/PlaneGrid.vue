<script setup lang="ts">
import type { Plane } from '~/engine/plane'

/**
 * Unit grid and axes covering an SVG box (the whole view by default).
 * `step` draws a grid line every `step` units (for small scales). data-el: `grid`.
 */
const props = withDefaults(
  defineProps<{ plane: Plane; width: number; height: number; x0?: number; y0?: number; step?: number; el?: string; axisLabels?: [string, string] }>(),
  { x0: 0, y0: 0, step: 1, el: 'grid', axisLabels: () => ['x₁', 'x₂'] },
)

const lines = computed(() => {
  const { ox, oy } = props.plane
  const u = props.plane.unit * props.step
  const xs: number[] = []
  const ys: number[] = []
  const x1 = props.x0 + props.width
  const y1 = props.y0 + props.height
  for (let x = ox - Math.floor((ox - props.x0) / u) * u; x <= x1; x += u) if (Math.abs(x - ox) > 0.5) xs.push(x)
  for (let y = oy - Math.floor((oy - props.y0) / u) * u; y <= y1; y += u) if (Math.abs(y - oy) > 0.5) ys.push(y)
  return { xs, ys, x1, y1 }
})
</script>

<template>
  <g :data-el="el" class="grid">
    <line v-for="x in lines.xs" :key="`x${x}`" class="minor" :x1="x" :x2="x" :y1="y0" :y2="lines.y1" />
    <line v-for="y in lines.ys" :key="`y${y}`" class="minor" :x1="x0" :x2="lines.x1" :y1="y" :y2="y" />
    <line class="axis" :x1="x0" :x2="lines.x1" :y1="plane.oy" :y2="plane.oy" />
    <line class="axis" :x1="plane.ox" :x2="plane.ox" :y1="y0" :y2="lines.y1" />
    <text class="axis-label" :x="lines.x1 - 14" :y="plane.oy + 18">{{ axisLabels[0] }}</text>
    <text class="axis-label" :x="plane.ox + 8" :y="y0 + 16">{{ axisLabels[1] }}</text>
  </g>
</template>

<style scoped>
.minor { stroke: var(--grid); }
.axis { stroke: var(--axis); }
.axis-label { fill: var(--text-faint); font: italic 14px var(--font-math); }
</style>
