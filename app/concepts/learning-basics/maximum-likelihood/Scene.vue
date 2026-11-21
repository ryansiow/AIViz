<script setup lang="ts">
import type { ScatterPoint } from '~/components/plot/ScatterPoints.vue'
import { compact } from '~/engine/plot'
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import type { MLData } from './derive'

/** Top: data, the bell curve and each point's height. Bottom: log-likelihood for every μ. */
const props = defineProps<{ d: MLData }>()

const v = (x: number, k = 2) => String(roundTo(x, k)).replace('-', '−')
const points = computed<ScatterPoint[]>(() =>
  props.d.xs.map((x, i) => ({
    x,
    y: 0,
    hue: 'blue',
    track: { id: `TRK-0${i + 1}`, kind: 'MEASUREMENT', name: `x${'₁₂₃₄₅'[i]}`, hue: 'blue', rows: [['value', String(x)], ['height p(x)', v(props.d.dens[i]!, 3)], ['log p(x)', v(Math.log(props.d.dens[i]!))]] },
  })),
)
const tBell = computed<TrackMeta>(() => ({ id: 'TRK-10', kind: 'MODEL', name: 'bell curve', hue: 'amber', rows: [['μ', v(props.d.mu, 1)], ['σ', v(props.d.sigma, 1)], ['log L', v(props.d.logL)]] }))
const tLog = computed<TrackMeta>(() => ({ id: 'TRK-11', kind: 'SCORE', name: 'log-likelihood', hue: 'green', rows: [['at μ = ' + v(props.d.mu, 1), v(props.d.logL)], ['peak at μ̂', v(props.d.muHat)], ['peak value', v(props.d.logLMax)]] }))
const product = computed(() => props.d.dens.map((p) => v(p)).join(' × '))
</script>

<template>
  <text data-el="product" class="calc" x="16" y="22">L = {{ product }} = <tspan class="violet">{{ compact(d.likelihood) }}</tspan></text>
  <text data-el="log" class="calc" x="16" y="42">log L = sum of logs = <tspan class="green">{{ v(d.logL) }}</tspan></text>

  <PlotAxes el="axes-top" :f="d.top" y-label="height (density)" :grid="false" />
  <line data-el="mu-line" class="mu-line" :x1="d.top.sx(d.mu)" :x2="d.top.sx(d.mu)" :y1="d.top.box.y0" :y2="d.top.box.y1" />
  <text data-el="mu-label" class="mu-label" :x="d.top.sx(d.mu)" :y="d.top.box.y0 - 4" text-anchor="middle">μ = {{ v(d.mu, 1) }}</text>

  <path data-el="best-bell" class="best-bell" :d="d.bestBell" />
  <g v-track="tBell" class="wrap">
    <path data-el="bell" class="bell" :d="d.bell" />
    <path data-el="bell-hit" class="hit" :d="d.bell" />
  </g>

  <g v-for="(b, i) in d.bars" :key="i">
    <line :data-el="`bar-${i}`" class="bar" :x1="b.x" :x2="b.x" :y1="b.y0" :y2="b.y1" />
    <text :data-el="`bar-label-${i}`" class="bar-label" :x="b.x" :y="b.y1 - 6" text-anchor="middle">{{ v(d.dens[i]!) }}</text>
  </g>
  <ScatterPoints el="data" :points="points" :sx="d.top.sx" :sy="d.top.sy" hue="blue" />

  <PlotAxes el="axes-log" :f="d.bottom" x-label="μ (centre tried)" y-label="log-likelihood" />
  <g v-track="tLog" class="wrap">
    <path data-el="log-curve" class="log-curve" :d="d.logCurve" />
    <path data-el="log-hit" class="hit" :d="d.logCurve" />
  </g>
  <g data-el="peak" class="peak">
    <line :x1="d.peak.x" :x2="d.peak.x" :y1="d.peak.y" :y2="d.bottom.box.y1" />
    <circle :cx="d.peak.x" :cy="d.peak.y" r="5" />
    <text :x="d.peak.x + 8" :y="d.peak.y + 14">μ̂ = {{ v(d.muHat) }}</text>
  </g>
  <circle data-el="cur" class="cur" :class="{ off: d.cur.off }" :cx="d.cur.x" :cy="d.cur.y" r="5" />

  <text data-el="nll" class="nll" x="584" y="42" text-anchor="end">−log L = Σ(xᵢ − μ)² / 2σ² + const.</text>
</template>

<style scoped>
.wrap { pointer-events: none; }
.calc { fill: var(--text-dim); font: 12px var(--font-mono); }
.violet { fill: var(--c-violet); font-weight: 600; }
.green { fill: var(--c-green); font-weight: 600; }
.mu-line { stroke: var(--c-amber); stroke-width: 1; stroke-dasharray: 3 3; }
.mu-label { fill: var(--c-amber); font: 12px var(--font-mono); }
.bell { fill: none; stroke: var(--c-amber); stroke-width: 2; }
.best-bell { fill: none; stroke: var(--c-green); stroke-width: 1.5; opacity: 0.8; }
.bar { stroke: var(--c-violet); stroke-width: 2.5; stroke-linecap: round; }
.bar-label { fill: var(--c-violet); font: 10.5px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 3px; }
.log-curve { fill: none; stroke: var(--text-dim); stroke-width: 1.75; }
.peak line { stroke: var(--c-green); stroke-dasharray: 2 3; }
.peak circle { fill: var(--c-green); stroke: var(--surface); stroke-width: 1.5; }
.peak text { fill: var(--c-green); font: 600 12px var(--font-mono); }
.cur { fill: var(--c-amber); stroke: var(--surface); stroke-width: 1.5; }
.cur.off { fill: var(--surface); stroke: var(--c-amber); }
.nll { fill: var(--text-dim); font: 12px var(--font-mono); }
.hit { fill: none; stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
</style>
