<script setup lang="ts">
import { fmt, type Vec } from '~/engine/plane'
import type { TrackMeta } from '~/types/concept'
import { GRID_X0, LEDGER, VIEW, type VecData } from './derive'

/** Vectors scene: the list on the left, the arrow on the right. */
const props = defineProps<{ d: VecData }>()

const f2 = (v: number) => fmt(v, 2)
const pair = (v: Vec, digits = 2) => `(${fmt(v[0], digits)}, ${fmt(v[1], digits)})`
const paren = (v: number) => (v < 0 ? `(${fmt(v)})` : fmt(v))
const kName = computed(() => (props.d.k === -1 ? '−a' : `${fmt(props.d.k, 2)}a`))
const rowY = (i: number) => LEDGER.top + i * LEDGER.row

const ta = computed<TrackMeta>(() => ({
  id: 'TRK-01', kind: 'VECTOR', name: 'a', hue: 'blue',
  rows: [['entries', pair(props.d.a)], ['|a|', f2(props.d.len)], ['moves', `${fmt(props.d.a[0])} along x₁, ${fmt(props.d.a[1])} along x₂`]],
}))
const tb = computed<TrackMeta>(() => ({
  id: 'TRK-02', kind: 'VECTOR', name: 'b', hue: 'rose',
  rows: [['entries', pair(props.d.b)], ['tail at', `tip of a ${pair(props.d.a)}`]],
}))
const ts = computed<TrackMeta>(() => ({
  id: 'TRK-03', kind: 'SUM', name: 'a + b', hue: 'green',
  rows: [['entries', pair(props.d.sum)], ['length', f2(props.d.sumLen)]],
}))
const tk = computed<TrackMeta>(() => ({
  id: 'TRK-04', kind: 'SCALED', name: `k·a (k = ${fmt(props.d.k, 2)})`, hue: 'amber',
  rows: [['entries', pair(props.d.ka)], ['length', `${f2(props.d.kaLen)} = |k|·|a|`], ['direction', props.d.k < 0 ? 'flipped' : props.d.k === 0 ? 'none' : 'same as a']],
}))
const tu = computed<TrackMeta>(() => ({
  id: 'TRK-05', kind: 'UNIT', name: 'â = a / |a|', hue: 'violet',
  rows: [['entries', pair(props.d.unit)], ['length', '1']],
}))
</script>

<template>
  <!-- Ledger: the same vectors as lists of numbers. -->
  <g class="ledger">
    <g data-el="row-a">
      <text class="main blue" :x="LEDGER.x" :y="rowY(0)"><tspan class="sym">a</tspan> = {{ pair(d.a) }}</text>
    </g>
    <text data-el="row-a-sub" class="sub" :x="LEDGER.x" :y="rowY(0) + 19">{{ fmt(d.a[0]) }} along x₁, {{ fmt(d.a[1]) }} along x₂</text>
    <g data-el="row-len">
      <text class="sub" :x="LEDGER.x" :y="rowY(1)">√({{ paren(d.a[0]) }}² + {{ paren(d.a[1]) }}²)</text>
      <text class="main blue" :x="LEDGER.x" :y="rowY(1) + 21">‖<tspan class="sym">a</tspan>‖ = {{ f2(d.len) }}</text>
    </g>
    <g data-el="row-sum">
      <text class="sub" :x="LEDGER.x" :y="rowY(2) + 8">({{ fmt(d.a[0]) }} + {{ paren(d.b[0]) }}, {{ fmt(d.a[1]) }} + {{ paren(d.b[1]) }})</text>
      <text class="main green" :x="LEDGER.x" :y="rowY(2) + 29"><tspan class="sym">a</tspan> + <tspan class="sym">b</tspan> = {{ pair(d.sum) }}</text>
    </g>
    <g data-el="row-ka">
      <text class="sub" :x="LEDGER.x" :y="rowY(3) + 16">({{ fmt(d.k, 2) }}·{{ paren(d.a[0]) }}, {{ fmt(d.k, 2) }}·{{ paren(d.a[1]) }})</text>
      <text class="main amber" :x="LEDGER.x" :y="rowY(3) + 37">{{ fmt(d.k, 2) }}<tspan class="sym">a</tspan> = {{ pair(d.ka) }}</text>
    </g>
    <g data-el="row-unit">
      <text class="sub" :x="LEDGER.x" :y="rowY(4) + 24"><tspan class="sym">a</tspan> / {{ f2(d.len) }}</text>
      <text class="main violet" :x="LEDGER.x" :y="rowY(4) + 45"><tspan class="sym">â</tspan> = {{ pair(d.unit) }}</text>
    </g>
  </g>

  <PlaneGrid :plane="d.plane" :x0="GRID_X0" :width="VIEW.w - GRID_X0" :height="VIEW.h" :step="d.gridStep" />

  <circle data-el="unit-circle" class="unit-circle" :cx="d.origin[0]" :cy="d.origin[1]" :r="d.unitR" />

  <!-- The two moves that make up a. -->
  <g data-el="legs" class="legs">
    <template v-if="d.legs.h">
      <line data-el="leg-h" :x1="d.legs.h.x1" :y1="d.legs.h.y1" :x2="d.legs.h.x2" :y2="d.legs.h.y2" />
      <text data-el="leg-h-label" class="leg-label" :x="d.legs.h.label.x" :y="d.legs.h.label.y" :text-anchor="d.legs.h.label.anchor">{{ fmt(d.a[0]) }}</text>
    </template>
    <template v-if="d.legs.v">
      <line data-el="leg-v" :x1="d.legs.v.x1" :y1="d.legs.v.y1" :x2="d.legs.v.x2" :y2="d.legs.v.y2" />
      <text data-el="leg-v-label" class="leg-label" :x="d.legs.v.label.x" :y="d.legs.v.label.y" :text-anchor="d.legs.v.label.anchor">{{ fmt(d.a[1]) }}</text>
    </template>
    <path v-if="d.legs.corner" data-el="corner" class="corner" :d="d.legs.corner" />
  </g>

  <!-- Drawn before a so they never hide it. -->
  <PlaneVector v-if="d.k !== 0" el="ka" :plane="d.plane" :v="d.ka" hue="amber" :name="kName" band halo :label-at="d.kaLabel" :track="tk" />
  <PlaneVector el="unit" :plane="d.plane" :v="d.unit" hue="violet" name="â" band halo :label-at="d.unitLabel" :track="tu" />
  <PlaneVector el="b" :plane="d.plane" :from="d.a" :v="d.b" hue="rose" name="b" halo :label-at="d.bLabel" :track="tb" />
  <PlaneVector v-if="!d.sumZero" el="sum" :plane="d.plane" :v="d.sum" hue="green" name="a + b" halo :track="ts" />
  <PlaneVector el="a" :plane="d.plane" :v="d.a" hue="blue" name="a" halo :track="ta" />

  <text data-el="len-label" class="len-label" :x="d.lenLabel.x" :y="d.lenLabel.y" :text-anchor="d.lenLabel.anchor">‖a‖ = {{ f2(d.len) }}</text>
</template>

<style scoped>
.main { font: 16px var(--font-math-upright); }
.sub { fill: var(--text-dim); font: 13px var(--font-math-upright); }
.sym { font: italic 700 16px var(--font-math); }
.blue { fill: var(--c-blue); }
.green { fill: var(--c-green); }
.amber { fill: var(--c-amber); }
.violet { fill: var(--c-violet); }
.unit-circle { fill: none; stroke: var(--c-violet); stroke-width: 1; stroke-dasharray: 3 4; opacity: 0.6; }
.legs line { stroke: var(--text-dim); stroke-width: 1.4; }
.leg-label { fill: var(--text-dim); font: 14px var(--font-math-upright); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
.corner { fill: none; stroke: var(--text-dim); stroke-width: 1; }
.len-label { fill: var(--c-blue); font: 14px var(--font-math-upright); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
</style>
