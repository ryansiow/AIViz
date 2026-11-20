<script setup lang="ts">
import { fmt, fmtFactor, toSvg, type Vec } from '~/engine/plane'
import type { TrackMeta } from '~/types/concept'
import { heading, VIEW, type DotData } from './derive'

/** Dot product scene. Pure rendering from `d`; the timeline handles appearance. */
const props = defineProps<{ d: DotData }>()

const o = computed<Vec>(() => [props.d.plane.ox, props.d.plane.oy])
const xTip = computed(() => toSvg(props.d.plane, props.d.x))
const foot = computed(() => toSvg(props.d.plane, props.d.proj))

// Faint guide along w's direction, across the whole view.
const guide = computed(() => {
  const k = 40 / (props.d.nw || 1)
  const a = toSvg(props.d.plane, [-props.d.w[0] * k, -props.d.w[1] * k])
  const b = toSvg(props.d.plane, [props.d.w[0] * k, props.d.w[1] * k])
  return { a, b }
})

// Label for the projection, placed on the side away from x.
const projLabel = computed(() => {
  const [fx, fy] = foot.value
  const below = xTip.value[1] < fy
  return { x: fx + 10, y: below ? fy + 20 : fy - 10 }
})

const f = (v: number) => fmt(v, 3)
const tw = computed<TrackMeta>(() => ({
  id: 'TRK-01', kind: 'VECTOR', name: 'w', hue: 'blue',
  rows: [['coords', `(${fmt(props.d.w[0])}, ${fmt(props.d.w[1])})`], ['|w|', f(props.d.nw)], ['heading', `${heading(props.d.w).toFixed(1)}°`], ['role', 'weights']],
}))
const tx = computed<TrackMeta>(() => ({
  id: 'TRK-02', kind: 'VECTOR', name: 'x', hue: 'rose',
  rows: [['coords', `(${fmt(props.d.x[0])}, ${fmt(props.d.x[1])})`], ['|x|', f(props.d.nx)], ['heading', `${heading(props.d.x).toFixed(1)}°`], ['role', 'input']],
}))
const tt = computed<TrackMeta>(() => ({
  id: 'TRK-03', kind: 'ANGLE', name: 'θ (w, x)', hue: 'violet',
  rows: [['θ', `${props.d.theta.toFixed(1)}°`], ['cos θ', f(props.d.cos)], ['sign', props.d.sign]],
}))
const tp = computed<TrackMeta>(() => ({
  id: 'TRK-04', kind: 'PROJECTION', name: 'proj_w(x)', hue: 'green',
  rows: [['coords', `(${fmt(props.d.proj[0])}, ${fmt(props.d.proj[1])})`], ['length', f(props.d.projLen)], ['× |w|', f(props.d.dot)]],
}))
const tr = computed<TrackMeta>(() => ({
  id: 'TRK-05', kind: 'SCALAR', name: 'w · x', hue: 'green',
  rows: [['value', f(props.d.dot)], ['terms', `${fmt(props.d.w[0] * props.d.x[0])} + ${fmt(props.d.w[1] * props.d.x[1])}`], ['status', props.d.sign]],
}))

const terms = computed(
  () => `${fmtFactor(props.d.w[0])}·${fmtFactor(props.d.x[0])} + ${fmtFactor(props.d.w[1])}·${fmtFactor(props.d.x[1])}`,
)
</script>

<template>
  <PlaneGrid :plane="d.plane" :width="VIEW.w" :height="VIEW.h" />

  <line data-el="guide" class="guide" :x1="guide.a[0]" :y1="guide.a[1]" :x2="guide.b[0]" :y2="guide.b[1]" />

  <AngleArc el="angle" :plane="d.plane" :a="d.w" :b="d.x" hue="violet" :track="tt" />

  <!-- Drawn before the vectors so it never hides them (e.g. when x lies along w). -->
  <g data-el="proj" v-track="tp" class="proj">
    <line data-el="proj-drop" class="drop" :x1="xTip[0]" :y1="xTip[1]" :x2="foot[0]" :y2="foot[1]" />
    <line data-el="proj-seg" class="seg" :x1="o[0]" :y1="o[1]" :x2="foot[0]" :y2="foot[1]" />
    <circle data-el="proj-foot" class="foot" :cx="foot[0]" :cy="foot[1]" r="3.5" />
    <text data-el="proj-label" class="proj-label" :x="projLabel.x" :y="projLabel.y">
      <tspan class="up">proj</tspan><tspan class="sub" dy="4">w</tspan><tspan class="up" dy="-4">(</tspan><tspan class="sym">x</tspan><tspan class="up">)</tspan>
    </text>
    <line data-el="proj-hit" class="hit" :x1="o[0]" :y1="o[1]" :x2="foot[0]" :y2="foot[1]" />
  </g>

  <PlaneVector el="w" :plane="d.plane" :v="d.w" hue="blue" name="w" :suffix="`= (${fmt(d.w[0])}, ${fmt(d.w[1])})`" :track="tw" />
  <PlaneVector el="x" :plane="d.plane" :v="d.x" hue="rose" name="x" :suffix="`= (${fmt(d.x[0])}, ${fmt(d.x[1])})`" :track="tx" />

  <!-- Outer group owns the position (Vue); inner group owns the motion (GSAP). -->
  <g :transform="`translate(${d.card.x} ${d.card.y})`">
    <g data-el="result" v-track="tr" class="result">
      <rect class="card" :width="172" :height="74" rx="12" />
      <text class="terms" x="14" y="26">
        <tspan class="sym">w</tspan><tspan class="up"> · </tspan><tspan class="sym">x</tspan><tspan class="up"> = {{ terms }}</tspan>
      </text>
      <text data-el="result-value" class="value" x="14" y="60">= {{ fmt(d.dot) }}</text>
      <rect data-el="result-hit" class="hit-area" :width="172" :height="74" />
    </g>
  </g>
</template>

<style scoped>
.guide { stroke: var(--c-blue); stroke-width: 1; stroke-dasharray: 2 5; opacity: 0.5; }
.proj, .result { pointer-events: none; }
.drop { stroke: var(--c-rose); stroke-width: 1; opacity: 0.6; }
.seg { stroke: var(--c-green); stroke-width: 4.5; stroke-linecap: round; opacity: 0.6; }
.foot { fill: var(--surface); stroke: var(--c-green); stroke-width: 1.6; }
.proj-label { fill: var(--c-green); font-size: 14px; }
.up { font-family: var(--font-math-upright); }
.sym { font: italic 700 15px var(--font-math); }
.sub { font: italic 700 10px var(--font-math); }
.card { fill: var(--bg); stroke: var(--line); }
.terms { fill: var(--text-dim); font-size: 13.5px; }
.value { fill: var(--c-green); font: 28px var(--font-math-upright); }
.hit { stroke: transparent; stroke-width: 16; pointer-events: visibleStroke; cursor: crosshair; }
.hit-area { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
