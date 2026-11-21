<script setup lang="ts">
import { arrowHead } from '~/engine/plane'
import { curvePath, ticks } from '~/engine/plot'
import type { TrackMeta } from '~/types/concept'
import { LANDSCAPES, PLOT, VIEW, X_DOMAIN, type GDData, type GDPoint } from './derive'

/** Gradient descent on a 1D loss curve. */
const props = defineProps<{ d: GDData }>()

const L = computed(() => LANDSCAPES[props.d.landscape])
const curve = computed(() => curvePath(L.value.f, props.d.sx, props.d.sy))
const xTicks = computed(() => ticks(X_DOMAIN[0], X_DOMAIN[1], 6))
const yTicks = computed(() => ticks(L.value.y[0], L.value.y[1], 4))
const p0 = computed(() => props.d.points[0]!)
const p1 = computed(() => props.d.shown[1])
const rest = computed(() => props.d.shown.slice(2))
const last = computed(() => props.d.shown[props.d.shown.length - 1]!)
const axisY = PLOT.bottom

// Step arrow along the θ axis, from θ₀ to θ₁.
const stepArrow = computed(() => {
  const x1 = p0.value.x
  const x2 = p1.value?.x ?? x1
  const y = axisY + 34 // below the tick labels
  const long = Math.abs(x2 - x1) > 8
  return { x1, x2, y, head: long ? arrowHead([x1, y], [x2, y], 8) : '' }
})

const n = (v: number) => (Number.isFinite(v) ? (Math.abs(v) > 999 ? v.toExponential(1) : v.toFixed(2)) : '∞').replace('-', '−')

const trackPoint = (p: GDPoint): TrackMeta => ({
  id: `TRK-${String(p.k).padStart(2, '0')}`,
  kind: p.k === 0 ? 'START' : 'UPDATE',
  name: `θ${subscript(p.k)}`,
  hue: p.k === 0 ? 'blue' : 'amber',
  rows: [['θ', n(p.theta)], ['L(θ)', n(p.loss)], ["L′(θ)", n(p.grad)], ...(p.offChart ? [['note', 'off the chart'] as [string, string]] : [])],
})
const subscript = (k: number) => String(k).replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]!)
</script>

<template>
  <!-- Axes -->
  <g data-el="axes" class="axes">
    <line :x1="PLOT.left" :x2="PLOT.right" :y1="axisY" :y2="axisY" class="axis" />
    <line :x1="PLOT.left" :x2="PLOT.left" :y1="PLOT.top" :y2="axisY" class="axis" />
    <g v-for="t in xTicks" :key="`x${t}`">
      <line :x1="d.sx(t)" :x2="d.sx(t)" :y1="PLOT.top" :y2="axisY" class="grid" />
      <text :x="d.sx(t)" :y="axisY + 16" class="tick" text-anchor="middle">{{ String(t).replace('-', '−') }}</text>
    </g>
    <g v-for="t in yTicks" :key="`y${t}`">
      <line :x1="PLOT.left" :x2="PLOT.right" :y1="d.sy(t)" :y2="d.sy(t)" class="grid" />
      <text :x="PLOT.left - 8" :y="d.sy(t) + 4" class="tick" text-anchor="end">{{ String(t).replace('-', '−') }}</text>
    </g>
    <text :x="PLOT.right + 14" :y="axisY + 5" class="axis-label">θ</text>
    <text :x="PLOT.left + 6" :y="PLOT.top + 4" class="axis-label">L(θ)</text>
  </g>

  <path data-el="curve" class="curve" :d="curve" />

  <!-- Start point, drop line, label -->
  <line data-el="drop" class="drop" :x1="p0.x" :x2="p0.x" :y1="p0.y" :y2="axisY" />
  <!-- θ₀ sits just above the axis, beside the drop line, clear of the tick labels -->
  <text data-el="start-label" class="start-label" :x="p0.x + 6" :y="axisY - 6">θ₀</text>

  <!-- Tangent at θ₀. The label sits above the point on the downhill side,
       where the curve has already dropped away. -->
  <line data-el="tangent-line" class="tangent" v-bind="d.tangent" />
  <text
    data-el="tangent-label"
    class="tangent-label"
    :x="p0.x + (d.first.grad <= 0 ? 14 : -14)"
    :y="p0.y - 12"
    :text-anchor="d.first.grad <= 0 ? 'start' : 'end'"
  >
    slope {{ n(d.first.grad) }}
  </text>

  <!-- First update arrow along θ -->
  <g data-el="step-arrow" class="step-arrow">
    <line :x1="stepArrow.x1" :x2="stepArrow.x2" :y1="stepArrow.y" :y2="stepArrow.y" />
    <polygon v-if="stepArrow.head" :points="stepArrow.head" />
    <text :x="(stepArrow.x1 + stepArrow.x2) / 2" :y="stepArrow.y + 14" text-anchor="middle">−η·L′ = {{ n(d.first.delta) }}</text>
  </g>

  <!-- Path between iterates (segment k joins point k-1 → k) -->
  <line
    v-for="p in d.shown.slice(1)"
    :key="`s${p.k}`"
    :data-el="`seg-${p.k}`"
    class="seg"
    :x1="d.shown[p.k - 1]!.x"
    :y1="d.shown[p.k - 1]!.y"
    :x2="p.x"
    :y2="p.y"
  />

  <!-- Iterates: later ones first so θ₀ and θ₁ stay on top -->
  <g
    v-for="p in [...rest].reverse()"
    :key="`p${p.k}`"
    v-track="trackPoint(p)"
    class="pt-wrap"
  >
    <circle :data-el="`pt-${p.k}`" class="pt" :class="{ off: p.offChart, last: p.k === d.shown.length - 1 }" :cx="p.x" :cy="p.y" r="4.5" />
    <circle :data-el="`hit-${p.k}`" class="hit" :cx="p.x" :cy="p.y" r="10" />
  </g>
  <g v-if="p1" v-track="trackPoint(p1)" class="pt-wrap">
    <circle data-el="pt-1" class="pt" :class="{ off: p1.offChart, last: d.shown.length === 2 }" :cx="p1.x" :cy="p1.y" r="5" />
    <circle data-el="hit-1" class="hit" :cx="p1.x" :cy="p1.y" r="10" />
  </g>
  <g v-track="trackPoint(p0)" class="pt-wrap">
    <circle data-el="pt-0" class="pt start" :cx="p0.x" :cy="p0.y" r="6" />
    <circle data-el="hit-0" class="hit" :cx="p0.x" :cy="p0.y" r="10" />
  </g>

  <!-- Final marker -->
  <circle data-el="final-ring" class="final-ring" :class="{ off: last.offChart }" :cx="last.x" :cy="last.y" r="11" />
  <text
    v-if="last.offChart"
    data-el="off-label"
    class="off-label"
    :x="last.x + (last.x > (PLOT.left + PLOT.right) / 2 ? -16 : 16)"
    :y="last.y + (last.y < (PLOT.top + PLOT.bottom) / 2 ? 26 : -16)"
    :text-anchor="last.x > (PLOT.left + PLOT.right) / 2 ? 'end' : 'start'"
  >
    off the chart: θ = {{ n(last.theta) }}
  </text>
</template>

<style scoped>
.axis { stroke: var(--axis); }
.grid { stroke: var(--grid); }
.tick { fill: var(--text-faint); font: 11px var(--font-mono); }
.axis-label { fill: var(--text-dim); font: italic 14px var(--font-math); }
.curve { fill: none; stroke: var(--text-dim); stroke-width: 2; }
.drop { stroke: var(--c-blue); stroke-width: 1; stroke-dasharray: 3 4; opacity: 0.7; }
.start-label { fill: var(--c-blue); font: italic 14px var(--font-math); }
.tangent { stroke: var(--c-violet); stroke-width: 2; stroke-linecap: round; }
.tangent-label { fill: var(--c-violet); font: 12px var(--font-mono); }
.step-arrow line { stroke: var(--c-amber); stroke-width: 2; }
.step-arrow polygon { fill: var(--c-amber); }
.step-arrow text { fill: var(--c-amber); font: 12px var(--font-mono); }
.seg { stroke: var(--c-amber); stroke-width: 1.5; opacity: 0.7; }
.pt-wrap { pointer-events: none; }
.pt { fill: var(--c-amber); stroke: var(--bg); stroke-width: 1.5; }
.pt.start { fill: var(--c-blue); }
.pt.last { fill: var(--c-green); }
.pt.off, .pt.off.last { fill: var(--c-rose); }
.final-ring { fill: none; stroke: var(--c-green); stroke-width: 2; }
.final-ring.off { stroke: var(--c-rose); }
.off-label { fill: var(--c-rose); font: 12px var(--font-mono); }
.hit { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
