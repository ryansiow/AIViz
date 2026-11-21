<script setup lang="ts">
import { compact } from '~/engine/plot'
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import { CHAIN, INNER, OUTER, PLOTS, type ChainData } from './derive'

/** Chain rule: a chain diagram on top, u = g(x) and y = f(u) below. */
const props = defineProps<{ d: ChainData }>()

const v2 = (v: number) => String(roundTo(v, 2)).replace('-', '−')
/** Slopes and their product: 3 decimals, so the multiplication can be checked by hand. */
const v3 = (v: number) => String(roundTo(v, 3)).replace('-', '−')
const tick = (v: number) => compact(v)
const sides = computed(() => [
  { key: 'g' as const, s: props.d.g, box: PLOTS.g, xName: 'x', yName: 'u', run: 'Δx', rise: 'Δu', runV: props.d.dx, riseV: props.d.du },
  { key: 'f' as const, s: props.d.f, box: PLOTS.f, xName: 'u', yName: 'y', run: 'Δu', rise: 'Δy', runV: props.d.du, riseV: props.d.dy },
])
const titles = computed(() => ({
  g: `u = g(x) = ${INNER[props.d.inner].label}`,
  f: `y = f(u) = ${OUTER[props.d.outer].label}`,
}))
const slopes = computed(() => ({
  g: `g′(${v2(props.d.x)}) = ${v3(props.d.dg)}`,
  f: `f′(${v2(props.d.u)}) = ${v3(props.d.df)}`,
}))

const boxes = computed(() => [
  { el: 'x', name: 'x', value: v2(props.d.x), hue: 'blue' },
  { el: 'u', name: 'u', value: v2(props.d.u), hue: 'violet' },
  { el: 'y', name: 'y', value: v2(props.d.y), hue: 'green' },
])

const tanTrack = (key: 'g' | 'f'): TrackMeta =>
  key === 'g'
    ? { id: 'TRK-01', kind: 'TANGENT', name: 'g′(x)', hue: 'violet', rows: [['at x', v2(props.d.x)], ['slope', v2(props.d.dg)], ['Δu/Δx', v2(props.d.du / props.d.dx)]] }
    : { id: 'TRK-02', kind: 'TANGENT', name: 'f′(u)', hue: 'violet', rows: [['at u', v2(props.d.u)], ['slope', v2(props.d.df)], ['Δy/Δu', Math.abs(props.d.du) > 1e-9 ? v2(props.d.dy / props.d.du) : '—']] }
const nudgeTrack = (key: 'g' | 'f'): TrackMeta =>
  key === 'g'
    ? { id: 'TRK-03', kind: 'NUDGE', name: 'Δx → Δu', hue: 'amber', rows: [['Δx', v2(props.d.dx)], ['Δu', v2(props.d.du)], ['ratio', v2(props.d.du / props.d.dx)]] }
    : { id: 'TRK-04', kind: 'NUDGE', name: 'Δu → Δy', hue: 'amber', rows: [['Δu', v2(props.d.du)], ['Δy', v2(props.d.dy)], ['Δy/Δx', v2(props.d.ratio)]] }

</script>

<template>
  <!-- Chain: x → g → u → f → y -->
  <g data-el="chain" class="chain">
    <g v-for="(b, i) in boxes" :key="b.el">
      <rect class="box" :class="b.hue" :x="CHAIN.xs[i]" :y="CHAIN.y" :width="CHAIN.w" :height="CHAIN.h" rx="8" />
      <text class="name" :class="b.hue" :x="CHAIN.xs[i]! + 14" :y="CHAIN.y + 23">{{ b.name }} =</text>
    </g>
    <g v-for="(op, i) in ['g', 'f']" :key="op">
      <line class="arrow" :x1="CHAIN.xs[i]! + CHAIN.w + 4" :x2="CHAIN.xs[i + 1]! - 8" :y1="CHAIN.y + CHAIN.h / 2" :y2="CHAIN.y + CHAIN.h / 2" />
      <polygon class="arrow-head" :points="`${CHAIN.xs[i + 1]! - 4},${CHAIN.y + CHAIN.h / 2} ${CHAIN.xs[i + 1]! - 11},${CHAIN.y + CHAIN.h / 2 - 4} ${CHAIN.xs[i + 1]! - 11},${CHAIN.y + CHAIN.h / 2 + 4}`" />
      <text class="op" :x="(CHAIN.xs[i]! + CHAIN.w + CHAIN.xs[i + 1]!) / 2" :y="CHAIN.y + 10" text-anchor="middle">{{ op }}</text>
    </g>
  </g>
  <text v-for="(b, i) in boxes" :key="`v${b.el}`" :data-el="`${b.el}-val`" class="val" :class="b.hue" :x="CHAIN.xs[i]! + 44" :y="CHAIN.y + 23">{{ b.value }}</text>
  <text data-el="mult-g" class="mult" :x="(CHAIN.xs[0] + CHAIN.w + CHAIN.xs[1]) / 2" :y="CHAIN.y + CHAIN.h + 12" text-anchor="middle">× {{ v3(d.dg) }}</text>
  <text data-el="mult-f" class="mult" :x="(CHAIN.xs[1] + CHAIN.w + CHAIN.xs[2]) / 2" :y="CHAIN.y + CHAIN.h + 12" text-anchor="middle">× {{ v3(d.df) }}</text>
  <g data-el="result" class="result">
    <text :x="CHAIN.result" :y="CHAIN.y + 14">dy/dx = {{ v3(d.df) }} × {{ v3(d.dg) }}</text>
    <text class="big" :x="CHAIN.result" :y="CHAIN.y + 36">= {{ v3(d.dydx) }}</text>
  </g>

  <!-- The two plots. -->
  <g v-for="sd in sides" :key="sd.key">
    <text :data-el="`title-${sd.key}`" class="title" :x="sd.box.x0" :y="sd.box.y0 - 12">{{ titles[sd.key] }}</text>
    <text :data-el="`slope-${sd.key}`" class="slope" :x="sd.box.x1" :y="sd.box.y0 - 12" text-anchor="end">{{ slopes[sd.key] }}</text>

    <g :data-el="`axes-${sd.key}`" class="axes">
      <line class="axis" :x1="sd.box.x0" :x2="sd.box.x1" :y1="sd.box.y1" :y2="sd.box.y1" />
      <line class="axis" :x1="sd.box.x0" :x2="sd.box.x0" :y1="sd.box.y0" :y2="sd.box.y1" />
      <g v-for="t in sd.s.xTicks" :key="`x${t}`">
        <line class="grid" :x1="sd.s.sx(t)" :x2="sd.s.sx(t)" :y1="sd.box.y0" :y2="sd.box.y1" />
        <text class="tick" :x="sd.s.sx(t)" :y="sd.box.y1 + 14" text-anchor="middle">{{ tick(t) }}</text>
      </g>
      <g v-for="t in sd.s.yTicks" :key="`y${t}`">
        <line class="grid" :x1="sd.box.x0" :x2="sd.box.x1" :y1="sd.s.sy(t)" :y2="sd.s.sy(t)" />
        <text class="tick" :x="sd.box.x0 - 6" :y="sd.s.sy(t) + 3.5" text-anchor="end">{{ tick(t) }}</text>
      </g>
      <text class="axis-name" :x="sd.box.x1 + 4" :y="sd.box.y1 + 4">{{ sd.xName }}</text>
      <text class="axis-name" :x="sd.box.x0 + 4" :y="sd.box.y0 + 2">{{ sd.yName }}</text>
    </g>

    <path :data-el="`curve-${sd.key}`" class="curve" :d="sd.s.curve" />
    <path :data-el="`guide-${sd.key}`" class="guide" :d="sd.s.guide" />

    <!-- The nudge: run, rise and the second point. -->
    <g v-track="nudgeTrack(sd.key)" class="nudge">
      <line :data-el="`secant-${sd.key}`" class="secant" :x1="sd.s.P[0]" :y1="sd.s.P[1]" :x2="sd.s.Q[0]" :y2="sd.s.Q[1]" />
      <line :data-el="`run-${sd.key}`" class="leg" :x1="sd.s.P[0]" :y1="sd.s.P[1]" :x2="sd.s.corner[0]" :y2="sd.s.corner[1]" />
      <line :data-el="`rise-${sd.key}`" class="leg" :x1="sd.s.corner[0]" :y1="sd.s.corner[1]" :x2="sd.s.Q[0]" :y2="sd.s.Q[1]" />
      <circle :data-el="`pt2-${sd.key}`" class="pt2" :cx="sd.s.Q[0]" :cy="sd.s.Q[1]" r="3.5" />
      <text :data-el="`run-label-${sd.key}`" class="nudge-label" :x="sd.s.runLabel.x" :y="sd.s.runLabel.y" :text-anchor="sd.s.runLabel.anchor">{{ sd.run }} = {{ v2(sd.runV) }}</text>
      <text :data-el="`rise-label-${sd.key}`" class="nudge-label" :x="sd.s.riseLabel.x" :y="sd.s.riseLabel.y" :text-anchor="sd.s.riseLabel.anchor">{{ sd.rise }} = {{ v2(sd.riseV) }}</text>
      <line :data-el="`nudge-hit-${sd.key}`" class="hit" :x1="sd.s.P[0]" :y1="sd.s.P[1]" :x2="sd.s.Q[0]" :y2="sd.s.Q[1]" />
    </g>

    <TangentLine :el="`tan-${sd.key}`" :seg="sd.s.tangent" :point="sd.s.P" hue="violet" :track="tanTrack(sd.key)" />
  </g>
</template>

<style scoped>
.chain { pointer-events: none; }
.box { fill: var(--surface-2); stroke: var(--line); }
.box.blue { stroke: var(--c-blue); }
.box.violet { stroke: var(--c-violet); }
.box.green { stroke: var(--c-green); }
/* Wins over the .blue/.violet/.green text fills below. */
.box.blue, .box.violet, .box.green { fill: var(--surface-2); }
.name { font: italic 16px var(--font-math); }
.val { font: 16px var(--font-math-upright); }
.blue { fill: var(--c-blue); }
.violet { fill: var(--c-violet); }
.green { fill: var(--c-green); }
.arrow { stroke: var(--text-faint); stroke-width: 1.4; }
.arrow-head { fill: var(--text-faint); }
.op { fill: var(--text); font: italic 15px var(--font-math); }
.mult { fill: var(--c-violet); font: 13px var(--font-mono); }
.result text { fill: var(--text-dim); font: 13px var(--font-mono); }
.result .big { fill: var(--c-green); font: 600 18px var(--font-mono); }
.title { fill: var(--text-dim); font: italic 14px var(--font-math); }
.slope { fill: var(--c-violet); font: 12px var(--font-mono); }
.axis { stroke: var(--axis); }
.grid { stroke: var(--grid); }
.tick { fill: var(--text-faint); font: 10px var(--font-mono); }
.axis-name { fill: var(--text-faint); font: italic 13px var(--font-math); }
.curve { fill: none; stroke: var(--text-dim); stroke-width: 1.75; }
.guide { fill: none; stroke: var(--text-faint); stroke-width: 1; stroke-dasharray: 2 3; }
.nudge { pointer-events: none; }
.secant { stroke: var(--c-amber); stroke-width: 1; opacity: 0.7; }
.leg { stroke: var(--c-amber); stroke-width: 2; }
.pt2 { fill: var(--c-amber); stroke: var(--surface); stroke-width: 1.25; }
.nudge-label { fill: var(--c-amber); font: 12px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
.hit { stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
</style>
