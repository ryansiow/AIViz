<script setup lang="ts">
import type { Plane } from '~/engine/plane'

/** Unit grid and axes covering the given SVG box. data-el: `grid`. */
const props = withDefaults(defineProps<{ plane: Plane; width: number; height: number; el?: string; axisLabels?: [string, string] }>(), {
  el: 'grid',
  axisLabels: () => ['x₁', 'x₂'],
})

const lines = computed(() => {
  const { ox, oy, unit } = props.plane
  const xs: number[] = []
  const ys: number[] = []
  for (let x = ox % unit; x <= props.width; x += unit) if (Math.abs(x - ox) > 0.5) xs.push(x)
  for (let y = oy % unit; y <= props.height; y += unit) if (Math.abs(y - oy) > 0.5) ys.push(y)
  return { xs, ys }
})
</script>

<template>
  <g :data-el="el" class="grid">
    <line v-for="x in lines.xs" :key="`x${x}`" class="minor" :x1="x" :x2="x" y1="0" :y2="height" />
    <line v-for="y in lines.ys" :key="`y${y}`" class="minor" x1="0" :x2="width" :y1="y" :y2="y" />
    <line class="axis" x1="0" :x2="width" :y1="plane.oy" :y2="plane.oy" />
    <line class="axis" :x1="plane.ox" :x2="plane.ox" y1="0" :y2="height" />
    <text class="axis-label" :x="width - 14" :y="plane.oy + 18">{{ axisLabels[0] }}</text>
    <text class="axis-label" :x="plane.ox + 8" y="16">{{ axisLabels[1] }}</text>
  </g>
</template>

<style scoped>
.minor { stroke: var(--grid); }
.axis { stroke: var(--axis); }
.axis-label { fill: var(--text-faint); font: italic 14px var(--font-math); }
</style>
