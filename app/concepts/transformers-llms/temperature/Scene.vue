<script setup lang="ts">
import type { TrackMeta } from '~/types/concept'
import { COLS, METER, ROWS, SAMPLES, VIEW, type TempData, type TempRow } from './derive'

/**
 * Temperature, one row per token:  z/T  →  probability (with the T = 1 outline)  →  20 samples.
 * A spread (entropy) meter sits underneath. Vue renders the final state; build() animates it.
 */
const props = defineProps<{ d: TempData }>()

const headY = 62
const bottom = computed(() => ROWS.top + (props.d.rows.length - 1) * ROWS.step + ROWS.bar)
const n2 = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2)).replace('-', '−')
const pct = (p: number) => (p < 0.001 ? '<0.1%' : `${(p * 100).toFixed(1)}%`)
// Value labels sit past the bar end; on wide bars they move inside, so they
// never run into the probability column.
const INSIDE = 44
const label = (b: { x: number; w: number }, v: number) =>
  b.w > INSIDE
    ? { x: v >= 0 ? b.x + b.w - 5 : b.x + 5, anchor: v >= 0 ? 'end' : 'start', inside: true }
    : { x: v >= 0 ? b.x + b.w + 6 : b.x - 6, anchor: v >= 0 ? 'start' : 'end', inside: false }
const bits = (h: number) => h.toFixed(2)

const track = (r: TempRow, i: number): TrackMeta => ({
  id: `TRK-0${i + 1}`,
  kind: 'TOKEN',
  name: r.token,
  hue: 'amber',
  rows: [
    ['logit z', r.z.toFixed(2)],
    ['z / T', n2(r.scaled)],
    ['p at T', r.p.toFixed(4)],
    ['p at T = 1', r.p1.toFixed(4)],
    [`in ${SAMPLES} samples`, `≈ ${r.count}`],
  ],
})
const meterTrack = computed<TrackMeta>(() => ({
  id: 'TRK-H',
  kind: 'SPREAD',
  name: 'Entropy',
  hue: 'violet',
  rows: [
    ['H at T', `${bits(props.d.entropy)} bits`],
    ['H at T = 1', `${bits(props.d.entropy1)} bits`],
    ['range', `0 (certain) – ${Math.log2(props.d.rows.length)} (even)`],
  ],
}))
</script>

<template>
  <!-- Most likely token, revealed at the result step. -->
  <rect data-el="top-row" class="top-row" x="8" :y="d.rows[d.top]!.y - 9" :width="VIEW.w - 16" :height="ROWS.bar + 18" rx="8" />

  <!-- Prompt and column headers -->
  <text data-el="prompt" class="prompt" x="16" y="30">“{{ d.prompt }}”</text>
  <g data-el="head-scaled"><text class="head" :x="COLS.scaled.x + COLS.scaled.w / 2" :y="headY"><tspan class="m">z</tspan><tspan class="u"> / </tspan><tspan class="m">T</tspan></text></g>
  <g data-el="head-prob"><text class="head" :x="COLS.prob.x + COLS.prob.bar / 2" :y="headY"><tspan class="u">probability</tspan></text></g>
  <g data-el="head-samples"><text class="head" :x="COLS.samples.x + 66" :y="headY"><tspan class="u">{{ SAMPLES }} samples</tspan></text></g>

  <line data-el="zero" class="zero" :x1="d.zeroX" :x2="d.zeroX" :y1="ROWS.top - 12" :y2="bottom + 8" />

  <g v-for="(r, i) in d.rows" :key="r.token" v-track="track(r, i)" class="row">
    <text data-el="token" class="token" :x="COLS.label.right" :y="r.y + 15">{{ r.token }}</text>

    <!-- logit, rescaled to z / T in place -->
    <rect :data-el="`scaled-bar-${i}`" class="bar blue" :x="r.scaledBar.x" :y="r.y" :width="r.scaledBar.w" :height="ROWS.bar" rx="3" />
    <text
      :data-el="`raw-val-${i}`"
      class="val"
      :class="{ in: label(r.rawBar, r.z).inside }"
      :x="label(r.rawBar, r.z).x"
      :y="r.y + 14"
      :text-anchor="label(r.rawBar, r.z).anchor"
    >{{ n2(r.z) }}</text>
    <text
      :data-el="`scaled-val-${i}`"
      class="val"
      :class="{ in: label(r.scaledBar, r.scaled).inside }"
      :x="label(r.scaledBar, r.scaled).x"
      :y="r.y + 14"
      :text-anchor="label(r.scaledBar, r.scaled).anchor"
    >{{ n2(r.scaled) }}</text>

    <!-- probability at T, over the T = 1 outline -->
    <rect :data-el="`prob-bar-${i}`" class="bar green" :x="r.probBar.x" :y="r.y" :width="r.probBar.w" :height="ROWS.bar" rx="3" />
    <rect :data-el="`ghost-${i}`" class="ghost" :x="r.ghostBar.x" :y="r.y + 0.5" :width="Math.max(r.ghostBar.w, 1)" :height="ROWS.bar - 1" rx="3" />
    <text :data-el="`ghost-val-${i}`" class="val faint" :x="COLS.prob.x + COLS.prob.bar + 6" :y="r.y + 14">{{ pct(r.p1) }}</text>
    <text :data-el="`prob-val-${i}`" class="val strong" :x="COLS.prob.x + COLS.prob.bar + 6" :y="r.y + 14">{{ pct(r.p) }}</text>

    <!-- expected samples -->
    <circle v-for="(x, k) in r.dots" :key="k" :data-el="`dot-${i}`" class="dot" :cx="x" :cy="r.y + ROWS.bar / 2" :r="COLS.samples.r" />
    <text v-if="r.count === 0" :data-el="`dot-${i}`" class="val faint" :x="COLS.samples.x - 3" :y="r.y + 14">0</text>

    <rect :data-el="`hit-${i}`" class="hit" x="8" :y="r.y - 9" :width="VIEW.w - 16" :height="ROWS.bar + 18" />
  </g>

  <!-- Spread meter: entropy in bits, 0 (certain) to 2 (even) -->
  <g v-track="meterTrack" class="row">
    <g data-el="meter">
      <text class="token" :x="COLS.label.right" :y="METER.y + 9">spread</text>
      <rect class="track" :x="METER.x" :y="METER.y" :width="METER.w" :height="METER.h" rx="5" />
      <text class="tick" :x="METER.x" :y="METER.y + 28">0 · certain</text>
      <text class="tick" :x="METER.x + METER.w" :y="METER.y + 28" text-anchor="end">{{ Math.log2(d.rows.length) }} bits · even</text>
      <line class="mark1" :x1="METER.x + d.meter.fill1" :x2="METER.x + d.meter.fill1" :y1="METER.y - 5" :y2="METER.y + METER.h + 5" />
      <text class="tick" :x="METER.x + d.meter.fill1" :y="METER.y - 9" text-anchor="middle">T = 1</text>
    </g>
    <rect data-el="meter-fill" class="fill" :x="METER.x" :y="METER.y" :width="Math.max(d.meter.fill, METER.h)" :height="METER.h" rx="5" />
    <text data-el="meter-val" class="val strong" :x="METER.x + METER.w + 10" :y="METER.y + 9">{{ bits(d.entropy) }} bits</text>
    <rect data-el="hit-meter" class="hit" :x="METER.x - 4" :y="METER.y - 8" :width="METER.w + 8" :height="METER.h + 16" />
  </g>
</template>

<style scoped>
.row { pointer-events: none; }
.top-row { fill: var(--c-green-soft); }
.prompt { fill: var(--text-dim); font: italic 14px var(--font-sans); text-anchor: start; }
.head { fill: var(--text-dim); font-size: 15px; text-anchor: middle; }
.m { font-family: var(--font-math); font-style: italic; }
.u { font-family: var(--font-math-upright); }
.zero { stroke: var(--axis); }
.token { fill: var(--text); font-size: 14px; font-weight: 500; text-anchor: end; font-family: var(--font-sans); }
.bar.blue { fill: var(--c-blue); opacity: 0.85; }
.bar.green { fill: var(--c-green); opacity: 0.85; }
.ghost { fill: none; stroke: var(--text-faint); stroke-width: 1; }
.val { fill: var(--text-dim); font: 12px var(--font-mono); }
.val.in { fill: var(--bg); font-weight: 500; }
.val.faint { fill: var(--text-faint); }
.val.strong { fill: var(--text); font-weight: 500; }
.dot { fill: var(--c-green); opacity: 0.85; }
.track { fill: var(--surface-2); }
.fill { fill: var(--c-violet); opacity: 0.85; }
.mark1 { stroke: var(--text-faint); stroke-width: 1.5; }
.tick { fill: var(--text-faint); font: 11px var(--font-mono); }
.hit { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
