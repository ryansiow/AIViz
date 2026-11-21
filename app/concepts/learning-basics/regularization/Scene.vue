<script setup lang="ts">
import type { ScatterPoint } from '~/components/plot/ScatterPoints.vue'
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import { WEIGHTS, type RegData } from './derive'
import { WAVE } from '../data'

/** Left: the curve before and after the penalty. Right: its weights, and test error for every λ. */
const props = defineProps<{ d: RegData }>()

const v = (x: number, k = 2) => String(roundTo(x, k)).replace('-', '−')
const err = (x: number) => (x < 0.0001 ? '0.0000' : x < 0.1 ? x.toFixed(4) : x.toFixed(2))
const sup = (s: string) => s.replace(/[-0-9]/g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]!)
const lamTick = (t: number) => (t <= -7 ? '0' : `10${sup(String(t))}`)
const lam = computed(() => (props.d.lambda === 0 ? '0' : props.d.lambda >= 0.01 ? v(props.d.lambda, 3) : `10${sup(String(props.d.logLambda))}`))

const pts = (set: { x: number[]; y: number[] }, test: boolean): ScatterPoint[] =>
  set.x.map((x, i) => ({
    x,
    y: set.y[i]!,
    hue: test ? 'rose' : 'blue',
    hollow: test,
    track: { id: `TRK-${test ? 'B' : 'A'}${i + 1}`, kind: test ? 'TEST POINT' : 'TRAINING POINT', name: `${test ? 'test' : 'train'} ${i + 1}`, hue: test ? 'rose' : 'blue', rows: [['y', v(set.y[i]!)], ['curve says', v(props.d.model.predict(x))]] },
  }))
const trainPts = computed(() => pts(WAVE.train, false))
const testPts = computed(() => pts(WAVE.test, true))
const tCurve = computed<TrackMeta>(() => ({ id: 'TRK-10', kind: 'MODEL', name: `degree 7, λ = ${lam.value}`, hue: 'violet', rows: [['largest weight', v(props.d.maxW)], ['training error', err(props.d.trainMse)], ['test error', err(props.d.testMse)]] }))
const tBar = (k: number): TrackMeta => ({ id: `TRK-W${k + 1}`, kind: 'WEIGHT', name: `c${'₁₂₃₄₅₆₇'[k]}`, hue: 'blue', rows: [['with penalty', v(props.d.model.coef[k + 1]!)], ['without', v(props.d.plain.coef[k + 1]!)]] })
const mid = (WEIGHTS.y0 + WEIGHTS.y1) / 2
</script>

<template>
  <text data-el="train-err" class="err-text" x="50" y="24">training error <tspan class="blue">{{ err(d.plainTrain) }}</tspan></text>
  <text data-el="train-err-new" class="err-text" x="226" y="24">→ <tspan class="blue">{{ err(d.trainMse) }}</tspan></text>
  <text data-el="test-err" class="err-text" x="50" y="44">test error <tspan class="rose">{{ err(d.plainTest) }}</tspan></text>
  <text data-el="test-err-new" class="err-text" x="226" y="44">→ <tspan class="rose">{{ err(d.testMse) }}</tspan></text>

  <PlotAxes el="axes" :f="d.fit" x-label="x" />
  <path data-el="plain-curve" class="plain-curve" :d="d.plainCurve" />
  <g v-track="tCurve" class="wrap">
    <path data-el="curve" class="curve" :d="d.curve" />
    <path data-el="curve-hit" class="hit" :d="d.curve" />
  </g>
  <ScatterPoints el="train" :points="trainPts" :sx="d.fit.sx" :sy="d.fit.sy" hue="blue" />
  <ScatterPoints el="test" :points="testPts" :sx="d.fit.sx" :sy="d.fit.sy" hue="rose" />

  <!-- The penalty and the weights. -->
  <text data-el="penalty" class="penalty" :x="WEIGHTS.x0" y="24">loss = MSE + λ·Σ c²</text>
  <text data-el="lambda" class="lambda" :x="WEIGHTS.x0" y="44">λ = {{ lam }}</text>
  <g data-el="weights-frame" class="weights-frame">
    <text :x="WEIGHTS.x0" :y="WEIGHTS.y0 - 8">weights c₁ … c₇</text>
    <line :x1="WEIGHTS.x0" :x2="WEIGHTS.x1" :y1="mid" :y2="mid" />
  </g>
  <rect v-for="(b, k) in d.plainBars" :key="`p${k}`" :data-el="`pbar-${k}`" class="pbar" :x="b.x" :y="b.y" :width="b.w" :height="b.h" />
  <g v-for="(b, k) in d.bars" :key="`b${k}`" v-track="tBar(k)" class="wrap">
    <rect :data-el="`bar-${k}`" class="bar" :x="b.x" :y="b.y" :width="b.w" :height="b.h" />
    <rect :data-el="`bar-hit-${k}`" class="hit-area" :x="b.x - 3" :y="WEIGHTS.y0" :width="b.w + 6" :height="WEIGHTS.y1 - WEIGHTS.y0" />
  </g>

  <!-- Errors for every λ. -->
  <PlotAxes el="chart" :f="d.chart" x-label="λ (log scale)" y-label="error (log)" :x-format="lamTick" :y-format="lamTick" />
  <path data-el="line-train" class="line train" :d="d.lines.train" />
  <path data-el="line-test" class="line test" :d="d.lines.test" />
  <g data-el="cur" class="cur">
    <line :x1="d.cur.x" :x2="d.cur.x" :y1="d.chart.box.y0" :y2="d.chart.box.y1" />
    <circle class="blue-dot" :cx="d.cur.x" :cy="d.cur.train" r="4" />
    <circle class="rose-dot" :cx="d.cur.x" :cy="d.cur.test" r="4" />
  </g>
  <text data-el="legend" class="legend" :x="d.chart.box.x1" :y="d.chart.box.y0 - 10" text-anchor="end"><tspan class="blue">— training</tspan>  <tspan class="rose">— test</tspan></text>
</template>

<style scoped>
.wrap { pointer-events: none; }
.err-text { fill: var(--text-dim); font: 13px var(--font-mono); }
.blue { fill: var(--c-blue); font-weight: 600; }
.rose { fill: var(--c-rose); font-weight: 600; }
.plain-curve { fill: none; stroke: var(--text-faint); stroke-width: 1.5; }
.curve { fill: none; stroke: var(--c-violet); stroke-width: 2.2; }
.penalty { fill: var(--text); font: 13px var(--font-mono); }
.lambda { fill: var(--c-amber); font: 600 13px var(--font-mono); }
.weights-frame text { fill: var(--text-faint); font: 11px var(--font-sans); }
.weights-frame line { stroke: var(--axis); }
.pbar { fill: none; stroke: var(--text-faint); stroke-dasharray: 2 2; }
.bar { fill: var(--c-blue); opacity: 0.85; }
.line { fill: none; stroke-width: 2; }
.line.train { stroke: var(--c-blue); }
.line.test { stroke: var(--c-rose); }
.cur line { stroke: var(--c-amber); stroke-dasharray: 3 3; }
.blue-dot { fill: var(--c-blue); stroke: var(--surface); stroke-width: 1.5; }
.rose-dot { fill: var(--c-rose); stroke: var(--surface); stroke-width: 1.5; }
.legend { font: 11px var(--font-sans); }
.hit { fill: none; stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
.hit-area { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
