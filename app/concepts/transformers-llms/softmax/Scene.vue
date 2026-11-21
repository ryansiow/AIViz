<script setup lang="ts">
import { compact } from '~/engine/plot'
import type { TrackMeta } from '~/types/concept'
import { COLS, ROWS, VIEW, type SoftmaxData, type SoftmaxRow } from './derive'

/**
 * Softmax as a pipeline, one row per token:  z/T  →  e^(z/T)  →  p.
 * Vue renders the final geometry; build() animates bars into place.
 */
const props = defineProps<{ d: SoftmaxData }>()

const headY = 62
const bottom = computed(() => ROWS.top + (props.d.rows.length - 1) * ROWS.step + ROWS.bar + 14)
const n1 = (v: number) => (Math.abs(v) >= 100 ? compact(v) : v.toFixed(2).replace('-', '−'))
const pct = (p: number) => `${(p * 100).toFixed(p < 0.001 && p > 0 ? 2 : 1)}%`

const valueX = (b: { x: number; w: number }, v: number) => (v >= 0 ? b.x + b.w + 6 : b.x - 6)

const track = (r: SoftmaxRow, i: number): TrackMeta => ({
  id: `TRK-0${i + 1}`,
  kind: 'TOKEN',
  name: r.token,
  hue: i === props.d.top ? 'green' : 'blue',
  rows: [
    ['logit z', r.z.toFixed(2)],
    ['z / T', r.scaled.toFixed(3)],
    ['e^(z/T)', compact(r.exp)],
    ['p', r.p.toFixed(4)],
    ['rank', `${[...props.d.rows].sort((a, b) => b.p - a.p).indexOf(r) + 1} of ${props.d.rows.length}`],
  ],
})
</script>

<template>
  <!-- Highlight for the most likely token (step 6), behind everything. -->
  <rect
    data-el="top-row"
    class="top-row"
    x="8"
    :y="d.rows[d.top]!.y - 9"
    :width="VIEW.w - 16"
    :height="ROWS.bar + 18"
    rx="8"
  />

  <!-- Column headers -->
  <g data-el="head-scaled"><text class="head" :x="COLS.scaled.x + COLS.scaled.w / 2" :y="headY"><tspan class="m">z</tspan><tspan class="u"> / </tspan><tspan class="m">T</tspan></text></g>
  <g data-el="head-exp"><text class="head" :x="COLS.exp.x + (COLS.exp.w - 40) / 2" :y="headY"><tspan class="u">e</tspan><tspan class="m sup" dy="-7">z/T</tspan></text></g>
  <g data-el="head-prob"><text class="head" :x="COLS.prob.x + (COLS.prob.w - 40) / 2" :y="headY"><tspan class="u">probability</tspan></text></g>
  <text data-el="arrow-1" class="arrow" :x="(COLS.scaled.x + COLS.scaled.w + COLS.exp.x) / 2" :y="headY">→</text>
  <text data-el="arrow-2" class="arrow" :x="(COLS.exp.x + COLS.exp.w + COLS.prob.x) / 2 - 10" :y="headY">→</text>

  <!-- Zero line of the logit column -->
  <line data-el="zero" class="zero" :x1="d.zeroX" :x2="d.zeroX" :y1="ROWS.top - 12" :y2="bottom" />

  <g v-for="(r, i) in d.rows" :key="r.token" v-track="track(r, i)" class="row">
    <!-- No winner colouring here: the result step reveals it with the row highlight. -->
    <text data-el="token" class="token" :x="COLS.label.right" :y="r.y + 16">{{ r.token }}</text>

    <!-- z / T -->
    <rect :data-el="`scaled-bar-${i}`" class="bar blue" :x="r.scaledBar.x" :y="r.y" :width="r.scaledBar.w" :height="ROWS.bar" rx="3" />
    <text :data-el="`raw-val-${i}`" class="val" :x="valueX(r.rawBar, r.z)" :y="r.y + 15" :text-anchor="r.z >= 0 ? 'start' : 'end'">{{ n1(r.z) }}</text>
    <text :data-el="`scaled-val-${i}`" class="val" :x="valueX(r.scaledBar, r.scaled)" :y="r.y + 15" :text-anchor="r.scaled >= 0 ? 'start' : 'end'">{{ n1(r.scaled) }}</text>

    <!-- e^(z/T) -->
    <rect :data-el="`exp-bar-${i}`" class="bar violet" :x="r.expBar.x" :y="r.y" :width="r.expBar.w" :height="ROWS.bar" rx="3" />
    <text :data-el="`exp-val-${i}`" class="val" :x="r.expBar.x + r.expBar.w + 6" :y="r.y + 15">{{ compact(r.exp) }}</text>

    <!-- probability -->
    <rect :data-el="`prob-bar-${i}`" class="bar green" :x="r.probBar.x" :y="r.y" :width="r.probBar.w" :height="ROWS.bar" rx="3" />
    <text :data-el="`prob-val-${i}`" class="val strong" :x="r.probBar.x + r.probBar.w + 6" :y="r.y + 15">{{ pct(r.p) }}</text>

    <!-- hover strip across the whole row -->
    <rect :data-el="`hit-${i}`" class="hit" x="8" :y="r.y - 9" :width="VIEW.w - 16" :height="ROWS.bar + 18" />
  </g>

  <!-- Sums under the exp and probability columns -->
  <g data-el="sum-exp">
    <line class="rule" :x1="COLS.exp.x" :x2="COLS.exp.x + COLS.exp.w - 10" :y1="bottom + 6" :y2="bottom + 6" />
    <text class="sum" :x="COLS.exp.x" :y="bottom + 26"><tspan class="u">Σ = </tspan><tspan class="u strong">{{ compact(d.sum) }}</tspan></text>
  </g>
  <g data-el="sum-prob">
    <line class="rule" :x1="COLS.prob.x" :x2="COLS.prob.x + COLS.prob.w - 10" :y1="bottom + 6" :y2="bottom + 6" />
    <text class="sum" :x="COLS.prob.x" :y="bottom + 26"><tspan class="u">Σ = </tspan><tspan class="u strong">1</tspan></text>
  </g>
</template>

<style scoped>
.row { pointer-events: none; }
.top-row { fill: var(--c-green-soft); }
.head { fill: var(--text-dim); font-size: 15px; text-anchor: middle; }
.m { font-family: var(--font-math); font-style: italic; }
.u { font-family: var(--font-math-upright); }
.sup { font-size: 10px; }
.arrow { fill: var(--text-faint); font-size: 16px; text-anchor: middle; }
.zero { stroke: var(--axis); }
.token { fill: var(--text); font-size: 14px; font-weight: 500; text-anchor: end; font-family: var(--font-sans); }
.bar.blue { fill: var(--c-blue); opacity: 0.85; }
.bar.violet { fill: var(--c-violet); opacity: 0.85; }
.bar.green { fill: var(--c-green); opacity: 0.85; }
.val { fill: var(--text-dim); font: 12px var(--font-mono); }
.val.strong { fill: var(--text); font-weight: 500; }
.rule { stroke: var(--line-strong); }
.sum { fill: var(--text-dim); font-size: 14px; }
.sum .strong { fill: var(--text); font-weight: 600; }
.hit { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
