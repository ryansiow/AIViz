<script setup lang="ts">
import { arrowHead, tipLabel, toSvg, type Plane, type Vec } from '~/engine/plane'
import { hueVar, type Hue, type TrackMeta } from '~/types/concept'

/**
 * A vector from the origin, with arrowhead and label.
 * data-el parts: `<el>-line`, `<el>-head`, `<el>-label` (the group itself is `<el>`).
 */
const props = defineProps<{
  plane: Plane
  v: Vec
  hue: Hue
  el: string
  /** Bold-italic symbol, e.g. "w". */
  name: string
  /** Text after the symbol, e.g. "= (3, 1)". */
  suffix?: string
  track?: TrackMeta
}>()

const o = computed<Vec>(() => [props.plane.ox, props.plane.oy])
const tip = computed(() => toSvg(props.plane, props.v))
// Stop the line short of the tip so the arrowhead's point is the tip.
const lineEnd = computed<Vec>(() => {
  const [x, y] = tip.value
  const dx = x - o.value[0]
  const dy = y - o.value[1]
  const l = Math.hypot(dx, dy) || 1
  return [x - (dx / l) * 6, y - (dy / l) * 6]
})
const head = computed(() => arrowHead(o.value, tip.value, 10))
const label = computed(() => tipLabel(o.value, tip.value, 14))
const color = computed(() => hueVar(props.hue))
</script>

<template>
  <g :data-el="el" v-track="track ?? { id: el, kind: 'VECTOR', name, hue, rows: [] }" :style="{ '--c': color }">
    <line :data-el="`${el}-line`" class="line" :x1="o[0]" :y1="o[1]" :x2="lineEnd[0]" :y2="lineEnd[1]" />
    <polygon :data-el="`${el}-head`" class="head" :points="head" />
    <text :data-el="`${el}-label`" class="label" :x="label.x" :y="label.y" :text-anchor="label.anchor">
      <tspan class="sym">{{ name }}</tspan><tspan v-if="suffix" class="rest" dx="7">{{ suffix }}</tspan>
    </text>
    <!-- wide invisible stroke so hovering is easy -->
    <line :data-el="`${el}-hit`" class="hit" :x1="o[0]" :y1="o[1]" :x2="tip[0]" :y2="tip[1]" />
  </g>
</template>

<style scoped>
/* Only the hit strip takes pointer events; the timeline switches it on once drawn. */
g { pointer-events: none; }
.line { stroke: var(--c); stroke-width: 2.2; stroke-linecap: round; }
.head { fill: var(--c); }
.label { fill: var(--c); font-size: 15px; }
.sym { font: italic 700 17px var(--font-math); }
.rest { font-family: var(--font-math-upright); }
.hit { stroke: transparent; stroke-width: 16; pointer-events: visibleStroke; cursor: crosshair; }
</style>
