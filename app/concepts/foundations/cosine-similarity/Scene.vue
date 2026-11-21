<script setup lang="ts">
import { fmt, fmtFactor, type Vec } from '~/engine/plane'
import type { TrackMeta } from '~/types/concept'
import { GAUGE, LEFT, TEXT, VIEW, type CosData } from './derive'

/** Cosine similarity: raw vectors on the left, their directions on the unit circle on the right. */
const props = defineProps<{ d: CosData }>()

const f2 = (v: number) => fmt(v, 2)
const f3 = (v: number) => fmt(v, 3)
const pair = (v: Vec) => `(${f2(v[0])}, ${f2(v[1])})`
const kName = computed(() => `${fmt(props.d.k, 2)}b`)
const O = computed<Vec>(() => [props.d.circle.ox, props.d.circle.oy])
const R = computed(() => props.d.circle.unit)
const terms = computed(() => `${fmtFactor(props.d.a[0])}·${fmtFactor(props.d.b[0])} + ${fmtFactor(props.d.a[1])}·${fmtFactor(props.d.b[1])}`)

const ta = computed<TrackMeta>(() => ({ id: 'TRK-01', kind: 'VECTOR', name: 'a', hue: 'blue', rows: [['entries', pair(props.d.a)], ['|a|', f3(props.d.na)]] }))
const tb = computed<TrackMeta>(() => ({ id: 'TRK-02', kind: 'VECTOR', name: 'b', hue: 'rose', rows: [['entries', pair(props.d.b)], ['|b|', f3(props.d.nb)]] }))
const tk = computed<TrackMeta>(() => ({
  id: 'TRK-03', kind: 'STRETCHED', name: `${kName.value}`, hue: 'amber',
  rows: [['entries', pair(props.d.kb)], ['length', f3(props.d.k * props.d.nb)], ['a · kb', f3(props.d.dotK)], ['cos θ', `${f3(props.d.cos)} (unchanged)`]],
}))
const tua = computed<TrackMeta>(() => ({ id: 'TRK-04', kind: 'UNIT', name: 'â = a / |a|', hue: 'blue', rows: [['entries', `(${f3(props.d.ua[0])}, ${f3(props.d.ua[1])})`], ['length', '1']] }))
const tub = computed<TrackMeta>(() => ({ id: 'TRK-05', kind: 'UNIT', name: 'b̂ = b / |b|', hue: 'rose', rows: [['entries', `(${f3(props.d.ub[0])}, ${f3(props.d.ub[1])})`], ['length', '1'], ['also', `${kName.value} / |${kName.value}|`]] }))
const tt = computed<TrackMeta>(() => ({ id: 'TRK-06', kind: 'ANGLE', name: 'θ (a, b)', hue: 'violet', rows: [['θ', `${props.d.theta.toFixed(1)}°`], ['cos θ', f3(props.d.cos)]] }))
const ts = computed<TrackMeta>(() => ({ id: 'TRK-07', kind: 'SHADOW', name: 'b̂ on â', hue: 'green', rows: [['length', f3(props.d.cos)], ['= cos θ', f3(props.d.cos)]] }))
const tg = computed<TrackMeta>(() => ({ id: 'TRK-08', kind: 'SCALE', name: 'similarity', hue: 'green', rows: [['cos θ', f3(props.d.cos)], ['verdict', props.d.verdict.replace('-', ' ')]] }))
</script>

<template>
  <!-- Left: the vectors as given. -->
  <PlaneGrid :plane="d.plane" :y0="LEFT.gridY" :width="LEFT.divider" :height="VIEW.h - LEFT.gridY" :step="d.gridStep" />
  <line class="divider" :x1="LEFT.divider" :x2="LEFT.divider" y1="0" :y2="VIEW.h" />

  <text data-el="dot-1" class="calc" :x="TEXT.x" :y="TEXT.y1">
    <tspan class="sym">a</tspan> · <tspan class="sym">b</tspan> = {{ terms }} = <tspan class="val">{{ f2(d.dot) }}</tspan>
  </text>
  <text data-el="dot-2" class="calc" :x="TEXT.x" :y="TEXT.y2">
    <tspan class="sym">a</tspan> · ({{ fmt(d.k, 2) }}<tspan class="sym">b</tspan>) = <tspan class="amber">{{ f2(d.dotK) }}</tspan>
  </text>

  <PlaneVector el="kb" :plane="d.plane" :v="d.kb" hue="amber" :name="kName" band halo :label-at="d.kbLabel" :track="tk" />
  <PlaneVector el="b" :plane="d.plane" :v="d.b" hue="rose" name="b" halo :track="tb" />
  <PlaneVector el="a" :plane="d.plane" :v="d.a" hue="blue" name="a" halo :track="ta" />

  <!-- Right: directions only, on the unit circle. -->
  <g data-el="circle-axes" class="circle-axes">
    <line :x1="O[0] - R - 16" :x2="O[0] + R + 16" :y1="O[1]" :y2="O[1]" />
    <line :x1="O[0]" :x2="O[0]" :y1="O[1] - R - 16" :y2="O[1] + R + 16" />
    <text :x="O[0] + R + 4" :y="O[1] + 14">1</text>
  </g>
  <circle data-el="circle" class="circle" :cx="O[0]" :cy="O[1]" :r="R" />

  <AngleArc el="angle" :plane="d.circle" :a="d.ua" :b="d.ub" hue="violet" :radius="30" :track="tt" />

  <g data-el="shadow" v-track="ts" class="shadow">
    <line data-el="shadow-drop" class="drop" :x1="d.shadow.tip[0]" :y1="d.shadow.tip[1]" :x2="d.shadow.foot[0]" :y2="d.shadow.foot[1]" />
    <line v-if="d.shadow.visible" data-el="shadow-seg" class="seg" :x1="O[0]" :y1="O[1]" :x2="d.shadow.foot[0]" :y2="d.shadow.foot[1]" />
    <circle data-el="shadow-foot" class="foot" :cx="d.shadow.foot[0]" :cy="d.shadow.foot[1]" r="3.5" />
    <text data-el="shadow-label" class="shadow-label" :x="d.shadow.label.x" :y="d.shadow.label.y" :text-anchor="d.shadow.label.anchor">cos θ = {{ f2(d.cos) }}</text>
    <line data-el="shadow-hit" class="hit" :x1="O[0]" :y1="O[1]" :x2="d.shadow.foot[0]" :y2="d.shadow.foot[1]" />
  </g>

  <PlaneVector el="ub" :plane="d.circle" :v="d.ub" hue="rose" name="b̂" halo :track="tub" />
  <PlaneVector el="ua" :plane="d.circle" :v="d.ua" hue="blue" name="â" halo :track="tua" />
  <circle data-el="kb-ring" class="ring" :cx="d.shadow.tip[0]" :cy="d.shadow.tip[1]" r="8" />

  <text data-el="cos-text" class="calc" :x="TEXT.rx" :y="TEXT.y1">
    <tspan class="sym">â</tspan> · <tspan class="sym">b̂</tspan> = {{ f2(d.dot) }} / ({{ f2(d.na) }} × {{ f2(d.nb) }}) = <tspan class="val">{{ f3(d.cos) }}</tspan>
  </text>

  <!-- Similarity scale, −1 to 1. -->
  <g data-el="gauge" v-track="tg" class="gauge">
    <line class="track" :x1="GAUGE.x0" :x2="GAUGE.x1" :y1="GAUGE.y" :y2="GAUGE.y" />
    <line v-for="x in [GAUGE.x0, d.gauge.zero, GAUGE.x1]" :key="x" class="tick" :x1="x" :x2="x" :y1="GAUGE.y - 4" :y2="GAUGE.y + 4" />
    <text class="word" :x="GAUGE.x0" :y="GAUGE.y - 10" text-anchor="start">opposite</text>
    <text class="word" :x="d.gauge.zero" :y="GAUGE.y - 10" text-anchor="middle">unrelated</text>
    <text class="word" :x="GAUGE.x1" :y="GAUGE.y - 10" text-anchor="end">same</text>
    <text class="num" :x="GAUGE.x0" :y="GAUGE.y + 17" text-anchor="middle">−1</text>
    <text class="num" :x="d.gauge.zero" :y="GAUGE.y + 17" text-anchor="middle">0</text>
    <text class="num" :x="GAUGE.x1" :y="GAUGE.y + 17" text-anchor="middle">1</text>
    <rect data-el="gauge-hit" class="hit-area" :x="GAUGE.x0 - 6" :y="GAUGE.y - 22" :width="GAUGE.x1 - GAUGE.x0 + 12" height="44" />
  </g>
  <line data-el="gauge-fill" class="gauge-fill" :class="{ neg: d.cos < 0 }" :x1="d.gauge.zero" :x2="d.gauge.pos" :y1="GAUGE.y" :y2="GAUGE.y" />
  <circle data-el="gauge-dot" class="gauge-dot" :class="{ neg: d.cos < 0 }" :cx="d.gauge.pos" :cy="GAUGE.y" r="6" />
</template>

<style scoped>
.divider { stroke: var(--line); }
.calc { fill: var(--text-dim); font: 14px var(--font-math-upright); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
.calc .val { fill: var(--c-green); }
.calc .amber { fill: var(--c-amber); }
.sym { font: italic 700 15px var(--font-math); fill: var(--text); }
.circle-axes line { stroke: var(--axis); }
.circle-axes text { fill: var(--text-faint); font: 11px var(--font-mono); }
.circle { fill: none; stroke: var(--line-strong); stroke-width: 1.25; }
.shadow { pointer-events: none; }
.drop { stroke: var(--c-rose); stroke-width: 1; opacity: 0.6; }
.seg { stroke: var(--c-green); stroke-width: 5; stroke-linecap: round; opacity: 0.6; }
.foot { fill: var(--surface); stroke: var(--c-green); stroke-width: 1.6; }
.shadow-label { fill: var(--c-green); font: 13px var(--font-math-upright); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
.ring { fill: none; stroke: var(--c-amber); stroke-width: 2; }
.gauge { pointer-events: none; }
.track { stroke: var(--line-strong); stroke-width: 4; stroke-linecap: round; }
.tick { stroke: var(--text-faint); }
.word { fill: var(--text-faint); font: 11px var(--font-sans); }
.num { fill: var(--text-faint); font: 11px var(--font-mono); }
.gauge-fill { stroke: var(--c-green); stroke-width: 4; stroke-linecap: round; }
.gauge-fill.neg { stroke: var(--c-rose); }
.gauge-dot { fill: var(--c-green); stroke: var(--surface); stroke-width: 2; }
.gauge-dot.neg { fill: var(--c-rose); }
.hit { stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
.hit-area { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
