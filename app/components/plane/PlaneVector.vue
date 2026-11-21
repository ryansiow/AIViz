<script setup lang="ts">
import { arrowHead, tipLabel, toSvg, type Plane, type Vec } from '~/engine/plane'
import { hueVar, type Hue, type TrackMeta } from '~/types/concept'

/**
 * A vector with arrowhead and label, from the origin (or from `from`, for
 * tip-to-tail drawings). data-el parts: `<el>-line`, `<el>-head`, `<el>-label`,
 * `<el>-hit` (the group itself is `<el>`).
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
  /** Tail in maths coordinates (default: the origin). */
  from?: Vec
  /** Wide translucent stroke, for a vector drawn underneath another along the same line. */
  band?: boolean
  /** Label position override (SVG coordinates). */
  labelAt?: { x: number; y: number; anchor: 'start' | 'end' | 'middle' }
  /** Background-coloured outline behind the label, for labels that sit on lines. */
  halo?: boolean
  track?: TrackMeta
}>()

const o = computed<Vec>(() => toSvg(props.plane, props.from ?? [0, 0]))
const tip = computed(() => toSvg(props.plane, [(props.from?.[0] ?? 0) + props.v[0], (props.from?.[1] ?? 0) + props.v[1]]))
const size = computed(() => (props.band ? 12 : 10))
// Stop the line short of the tip so the arrowhead's point is the tip.
const lineEnd = computed<Vec>(() => {
  const [x, y] = tip.value
  const dx = x - o.value[0]
  const dy = y - o.value[1]
  const l = Math.hypot(dx, dy) || 1
  const back = Math.min(size.value * 0.6, l / 2)
  return [x - (dx / l) * back, y - (dy / l) * back]
})
const head = computed(() => arrowHead(o.value, tip.value, size.value))
const label = computed(() => props.labelAt ?? tipLabel(o.value, tip.value, 14))
const color = computed(() => hueVar(props.hue))
</script>

<template>
  <g :data-el="el" v-track="track ?? { id: el, kind: 'VECTOR', name, hue, rows: [] }" :style="{ '--c': color }" :class="{ band }">
    <line :data-el="`${el}-line`" class="line" :x1="o[0]" :y1="o[1]" :x2="lineEnd[0]" :y2="lineEnd[1]" />
    <polygon :data-el="`${el}-head`" class="head" :points="head" />
    <text :data-el="`${el}-label`" class="label" :class="{ halo }" :x="label.x" :y="label.y" :text-anchor="label.anchor">
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
.band .line { stroke-width: 6; opacity: 0.42; }
.band .head { opacity: 0.75; }
.head { fill: var(--c); }
.label { fill: var(--c); font-size: 15px; }
.halo { paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
.sym { font: italic 700 17px var(--font-math); }
.rest { font-family: var(--font-math-upright); }
.hit { stroke: transparent; stroke-width: 16; pointer-events: visibleStroke; cursor: crosshair; }
</style>
