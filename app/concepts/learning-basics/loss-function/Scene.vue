<script setup lang="ts">
import type { ScatterPoint } from '~/components/plot/ScatterPoints.vue'
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import { BARS, BOX, type LossData } from './derive'

/** MSE: errors as vertical gaps, squared into real squares, averaged into one bar. */
const props = defineProps<{ d: LossData }>()

const v = (x: number, k = 2) => String(roundTo(x, k)).replace('-', '−')
const signed = (x: number) => (x > 0 ? `+${v(x)}` : v(x))
const points = computed<ScatterPoint[]>(() =>
  props.d.res.map((r, i) => ({
    x: r.x,
    y: r.y,
    hue: 'neutral',
    track: {
      id: `TRK-0${i + 1}`, kind: 'EXAMPLE', name: `student ${i + 1}`, hue: 'rose',
      rows: [['true score', v(r.y)], ['line says', v(r.pred)], ['error', signed(r.r)], ['squared', v(r.sq)]],
    },
  })),
)
// Beside the biggest square if it fits inside the plot, otherwise under (or over) it.
const worstLabel = computed(() => {
  const q = props.d.res[props.d.worst]!.square
  if (q.x + q.s + 80 <= BOX.x1) return { x: q.x + q.s + 6, y: q.y + 12, anchor: 'start' }
  const below = q.y + q.s + 18 <= BOX.y1
  return { x: q.x + q.s, y: below ? q.y + q.s + 16 : q.y - 6, anchor: 'end' }
})
const tLine = computed<TrackMeta>(() => ({ id: 'TRK-10', kind: 'MODEL', name: 'your line', hue: 'blue', rows: [['w', v(props.d.w)], ['b', v(props.d.b)], ['MSE', v(props.d.mse)]] }))
const tBest = computed<TrackMeta>(() => ({ id: 'TRK-11', kind: 'MODEL', name: 'best line', hue: 'green', rows: [['w', v(props.d.best.w)], ['b', v(props.d.best.b)], ['MSE', v(props.d.best.mse)]] }))
</script>

<template>
  <PlotAxes :f="d.f" x-label="hours studied" y-label="exam score" />

  <!-- Squares under everything else. -->
  <rect
    v-for="(r, i) in d.res"
    :key="`sq${i}`"
    :data-el="`sq-${i}`"
    class="square"
    :class="{ worst: i === d.worst }"
    :x="r.square.x"
    :y="r.square.y"
    :width="r.square.s"
    :height="r.square.s"
  />
  <rect
    data-el="worst-ring"
    class="worst-ring"
    :x="d.res[d.worst]!.square.x - 2"
    :y="d.res[d.worst]!.square.y - 2"
    :width="d.res[d.worst]!.square.s + 4"
    :height="d.res[d.worst]!.square.s + 4"
  />
  <text data-el="worst-label" class="worst-label" :x="worstLabel.x" :y="worstLabel.y" :text-anchor="worstLabel.anchor">
    {{ v(Math.abs(d.res[d.worst]!.r)) }}² = {{ v(d.res[d.worst]!.sq) }}
  </text>

  <g v-track="tBest" class="wrap">
    <line data-el="best" class="best" :x1="d.bestLine.x1" :y1="d.bestLine.y1" :x2="d.bestLine.x2" :y2="d.bestLine.y2" />
    <line data-el="best-hit" class="hit" :x1="d.bestLine.x1" :y1="d.bestLine.y1" :x2="d.bestLine.x2" :y2="d.bestLine.y2" />
  </g>
  <g v-track="tLine" class="wrap">
    <line data-el="line" class="line" :x1="d.line.x1" :y1="d.line.y1" :x2="d.line.x2" :y2="d.line.y2" />
    <line data-el="line-hit" class="hit" :x1="d.line.x1" :y1="d.line.y1" :x2="d.line.x2" :y2="d.line.y2" />
  </g>

  <g v-for="(r, i) in d.res" :key="`e${i}`">
    <line :data-el="`err-${i}`" class="err" :x1="r.seg.x" :x2="r.seg.x" :y1="r.seg.y1" :y2="r.seg.y2" />
    <text v-if="Math.abs(r.r) > 1e-9" :data-el="`err-label-${i}`" class="err-label" :x="r.label.x" :y="r.label.y" text-anchor="end">{{ signed(r.r) }}</text>
  </g>

  <ScatterPoints el="data" :points="points" :sx="d.f.sx" :sy="d.f.sy" hue="neutral" />

  <!-- The loss: average square, as bars. -->
  <text data-el="bars-title" class="title" :x="BARS.x" :y="BARS.y1 - 36">average squared error (MSE)</text>
  <g data-el="sum" class="sum">
    <text :x="BARS.x" :y="BARS.y1 - 16">sum of squares {{ v(d.sumSq) }} ÷ {{ d.res.length }}</text>
  </g>
  <rect data-el="bar-mine" class="bar mine" :x="BARS.x" :y="BARS.y1" :width="Math.max(d.bars.mine, 1)" :height="BARS.h" rx="3" />
  <text data-el="bar-mine-label" class="bar-label" :x="BARS.x" :y="BARS.y1 + BARS.h + 15">your line: <tspan class="rose">{{ v(d.mse) }}</tspan></text>
  <rect data-el="bar-best" class="bar best-bar" :x="BARS.x" :y="BARS.y2" :width="Math.max(d.bars.best, 1)" :height="BARS.h" rx="3" />
  <text data-el="bar-best-label" class="bar-label" :x="BARS.x" :y="BARS.y2 + BARS.h + 15">best line: <tspan class="green">{{ v(d.best.mse) }}</tspan></text>
</template>

<style scoped>
.wrap { pointer-events: none; }
.line { stroke: var(--c-blue); stroke-width: 2.4; stroke-linecap: round; }
.best { stroke: var(--c-green); stroke-width: 2; stroke-linecap: round; opacity: 0.85; }
.err { stroke: var(--c-rose); stroke-width: 1.75; }
.err-label { fill: var(--c-rose); font: 10.5px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 3px; }
.square { fill: var(--c-rose); fill-opacity: 0.14; stroke: var(--c-rose); stroke-opacity: 0.5; }
.worst-ring { fill: none; stroke: var(--c-rose); stroke-width: 2; }
.worst-label { fill: var(--c-rose); font: 600 12px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
.title { fill: var(--text-dim); font: 12px var(--font-sans); }
.sum text { fill: var(--text-faint); font: 10.5px var(--font-mono); }
.bar.mine { fill: var(--c-rose); }
.bar.best-bar { fill: var(--c-green); }
.bar-label { fill: var(--text-dim); font: 12px var(--font-mono); }
.rose { fill: var(--c-rose); font-weight: 600; }
.green { fill: var(--c-green); font-weight: 600; }
.hit { stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
</style>
