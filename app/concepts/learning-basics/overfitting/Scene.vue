<script setup lang="ts">
import type { ScatterPoint } from '~/components/plot/ScatterPoints.vue'
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import type { OFData } from './derive'

/** Left: the fitted curve with training and test points. Right: both errors for every degree. */
const props = defineProps<{ d: OFData }>()

const v = (x: number, k = 2) => String(roundTo(x, k)).replace('-', '−')
const err = (x: number) => (x < 0.0001 ? '0.0000' : x < 0.1 ? x.toFixed(4) : x.toFixed(2))
const logTick = (t: number) => String(10 ** t)
const pts = (set: { x: number[]; y: number[] }, kind: 'train' | 'test'): ScatterPoint[] =>
  set.x.map((x, i) => ({
    x,
    y: set.y[i]!,
    hue: kind === 'train' ? 'blue' : 'rose',
    hollow: kind === 'test',
    track: {
      id: `TRK-${kind === 'train' ? 'A' : 'B'}${i + 1}`, kind: kind === 'train' ? 'TRAINING POINT' : 'TEST POINT', name: `${kind} ${i + 1}`, hue: kind === 'train' ? 'blue' : 'rose',
      rows: [['x', v(x)], ['y', v(set.y[i]!)], ['curve says', v(props.d.model.predict(x))], ['error', v(props.d.model.predict(x) - set.y[i]!)]],
    },
  }))
const trainPts = computed(() => pts(props.d.train, 'train'))
const testPts = computed(() => pts(props.d.test, 'test'))
const tCurve = computed<TrackMeta>(() => ({ id: 'TRK-10', kind: 'MODEL', name: `degree ${props.d.degree} polynomial`, hue: 'violet', rows: [['numbers to tune', String(props.d.degree + 1)], ['training error', err(props.d.trainMse)], ['test error', err(props.d.testMse)]] }))
const tSweep = computed<TrackMeta>(() => ({ id: 'TRK-11', kind: 'SWEEP', name: 'error by degree', hue: 'rose', rows: props.d.sweep.map((s) => [`d = ${s.degree}`, `${err(s.train)} / ${err(s.test)}`] as [string, string]), foot: 'train / test' }))
</script>

<template>
  <text data-el="train-err" class="err-text" x="50" y="24">training error <tspan class="blue">{{ err(d.trainMse) }}</tspan></text>
  <text data-el="test-err" class="err-text" x="50" y="44">test error <tspan class="rose">{{ err(d.testMse) }}</tspan></text>

  <PlotAxes el="axes" :f="d.fit" x-label="x" />
  <g v-track="tCurve" class="wrap">
    <path data-el="curve" class="curve" :d="d.curve" />
    <path data-el="curve-hit" class="hit" :d="d.curve" />
  </g>
  <g data-el="train-res" class="res train">
    <line v-for="(r, i) in d.trainRes" :key="i" :x1="r.x" :x2="r.x" :y1="r.y1" :y2="r.y2" />
  </g>
  <g data-el="test-res" class="res test">
    <line v-for="(r, i) in d.testRes" :key="i" :x1="r.x" :x2="r.x" :y1="r.y1" :y2="r.y2" />
  </g>
  <ScatterPoints el="train" :points="trainPts" :sx="d.fit.sx" :sy="d.fit.sy" hue="blue" />
  <ScatterPoints el="test" :points="testPts" :sx="d.fit.sx" :sy="d.fit.sy" hue="rose" />

  <!-- Error for every degree (log scale). -->
  <PlotAxes el="chart" :f="d.chart" x-label="degree" y-label="error (log)" :y-format="logTick" />
  <g v-track="tSweep" class="wrap">
    <path data-el="line-train" class="line train" :d="d.lines.train" />
    <path data-el="line-test" class="line test" :d="d.lines.test" />
    <path data-el="sweep-hit" class="hit" :d="d.lines.test" />
  </g>
  <g data-el="cur" class="cur">
    <line :x1="d.cur.x" :x2="d.cur.x" :y1="d.chart.box.y0" :y2="d.chart.box.y1" />
    <circle class="blue-dot" :cx="d.cur.x" :cy="d.cur.train" r="4.5" />
    <circle class="rose-dot" :cx="d.cur.x" :cy="d.cur.test" r="4.5" />
  </g>
  <g data-el="best" class="best">
    <circle :cx="d.best.x" :cy="d.best.y" r="9" />
    <text :x="d.best.x" :y="d.best.y - 14" text-anchor="middle">best</text>
  </g>
  <g data-el="legend" class="legend">
    <text :x="d.chart.box.x1" :y="d.chart.box.y0 - 26" text-anchor="end"><tspan class="blue">— training</tspan>   <tspan class="rose">— test</tspan></text>
  </g>
</template>

<style scoped>
.wrap { pointer-events: none; }
.err-text { fill: var(--text-dim); font: 13px var(--font-mono); }
.blue { fill: var(--c-blue); font-weight: 600; }
.rose { fill: var(--c-rose); font-weight: 600; }
.curve { fill: none; stroke: var(--c-violet); stroke-width: 2.2; }
.res line { stroke-width: 1.5; }
.res.train line { stroke: var(--c-blue); opacity: 0.7; }
.res.test line { stroke: var(--c-rose); opacity: 0.7; }
.line { fill: none; stroke-width: 2; }
.line.train { stroke: var(--c-blue); }
.line.test { stroke: var(--c-rose); }
.cur line { stroke: var(--c-amber); stroke-dasharray: 3 3; }
.blue-dot { fill: var(--c-blue); stroke: var(--surface); stroke-width: 1.5; }
.rose-dot { fill: var(--c-rose); stroke: var(--surface); stroke-width: 1.5; }
.best circle { fill: none; stroke: var(--c-green); stroke-width: 2; }
.best text { fill: var(--c-green); font: 600 11px var(--font-sans); }
.legend text { font: 11px var(--font-sans); }
.hit { fill: none; stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
</style>
