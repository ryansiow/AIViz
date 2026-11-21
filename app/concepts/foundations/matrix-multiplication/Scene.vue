<script setup lang="ts">
import { fmt, fmtFactor, type Vec } from '~/engine/plane'
import type { TrackMeta } from '~/types/concept'
import { CELL, GAP, GRID_X0, GRIDS, VIEW, WORK, type MatData } from './derive'

/** Matrix × vector: rows as dot products (left), columns as a transformation (right). */
const props = defineProps<{ d: MatData }>()

const pair = (v: Vec) => `(${fmt(v[0], 2)}, ${fmt(v[1], 2)})`
const row = (r: 0 | 1) => `${fmtFactor(props.d.A[r][0])}·${fmtFactor(props.d.x[0])} + ${fmtFactor(props.d.A[r][1])}·${fmtFactor(props.d.x[1])}`
const xCol = computed(() => [[props.d.x[0]], [props.d.x[1]]])
const yCol = computed(() => [[props.d.y[0]], [props.d.y[1]]])

const trackA = (r: number, c: number): TrackMeta => ({
  id: `TRK-A${r + 1}${c + 1}`, kind: 'ENTRY', name: `A${'₁₂'[r]}${'₁₂'[c]}`, hue: 'blue',
  rows: [['value', fmt(props.d.A[r as 0 | 1][c as 0 | 1])], ['in row', `${r + 1} (→ (Ax)${'₁₂'[r]})`], ['in column', `${c + 1} (where e${'₁₂'[c]} lands)`]],
})
const trackX = (r: number): TrackMeta => ({ id: `TRK-X${r + 1}`, kind: 'ENTRY', name: `x${'₁₂'[r]}`, hue: 'rose', rows: [['value', fmt(props.d.x[r as 0 | 1])], ['weights', `column ${r + 1} of A`]] })
const trackY = (r: number): TrackMeta => ({ id: `TRK-Y${r + 1}`, kind: 'ENTRY', name: `(Ax)${'₁₂'[r]}`, hue: 'green', rows: [['value', fmt(props.d.y[r as 0 | 1])], ['= row · x', row(r as 0 | 1)]] })

const tx = computed<TrackMeta>(() => ({ id: 'TRK-01', kind: 'VECTOR', name: 'x', hue: 'rose', rows: [['entries', pair(props.d.x)], ['role', 'input']] }))
const ty = computed<TrackMeta>(() => ({ id: 'TRK-02', kind: 'VECTOR', name: 'Ax', hue: 'green', rows: [['entries', pair(props.d.y)], ['= ', `${fmt(props.d.x[0])}·c₁ + ${fmt(props.d.x[1])}·c₂`]] }))
const tc = (j: 0 | 1): TrackMeta => ({ id: `TRK-C${j + 1}`, kind: 'COLUMN', name: `c${'₁₂'[j]} (column ${j + 1})`, hue: j ? 'violet' : 'blue', rows: [['entries', pair(props.d.cols[j])], ['image of', j ? 'e₂ = (0, 1)' : 'e₁ = (1, 0)']] })
const tp = computed<TrackMeta>(() => ({ id: 'TRK-03', kind: 'AREA', name: 'unit square → A', hue: 'blue', rows: [['area', `${fmt(Math.abs(props.d.det), 2)} (|det A|)`], ['orientation', props.d.det < 0 ? 'flipped' : props.d.det === 0 ? 'collapsed' : 'kept']] }))
</script>

<template>
  <!-- Left: the product as grids. -->
  <MatrixGrid el="A" :values="d.A" :x="GRIDS.A.x" :y="GRIDS.A.y" :cell="CELL" :gap="GAP" hue="blue" label="A" :col-hues="['blue', 'violet']" :track="trackA" />
  <MatrixGrid el="x" :values="xCol" :x="GRIDS.x.x" :y="GRIDS.x.y" :cell="CELL" :gap="GAP" hue="rose" label="x" vector :track="trackX" />
  <text data-el="eq" class="eq" :x="GRIDS.eq.x" :y="GRIDS.eq.y" text-anchor="middle">=</text>
  <MatrixGrid el="y" :values="yCol" :x="GRIDS.y.x" :y="GRIDS.y.y" :cell="CELL" :gap="GAP" hue="green" label="Ax" :track="trackY" />

  <text data-el="work-1" class="work" :x="WORK.x" :y="WORK.y1">(<tspan class="it">A</tspan><tspan class="sym">x</tspan>)₁ = {{ row(0) }} = <tspan class="green">{{ fmt(d.y[0], 2) }}</tspan></text>
  <text data-el="work-2" class="work" :x="WORK.x" :y="WORK.y2">(<tspan class="it">A</tspan><tspan class="sym">x</tspan>)₂ = {{ row(1) }} = <tspan class="green">{{ fmt(d.y[1], 2) }}</tspan></text>
  <text data-el="mix" class="work" :x="WORK.x" :y="WORK.y3">
    <tspan class="it">A</tspan><tspan class="sym">x</tspan> = <tspan class="blue">{{ fmt(d.x[0]) }}·{{ pair(d.cols[0]) }}</tspan>{{ d.x[1] < 0 ? ' − ' : ' + ' }}<tspan class="violet">{{ fmt(Math.abs(d.x[1])) }}·{{ pair(d.cols[1]) }}</tspan>
  </text>
  <text data-el="det" class="work" :x="WORK.x" :y="WORK.y4">det <tspan class="it">A</tspan> = <tspan class="violet">{{ fmt(d.det, 2) }}</tspan>: areas × {{ fmt(Math.abs(d.det), 2) }}{{ d.det < 0 ? ', flipped' : '' }}</text>

  <!-- Right: the plane, and what A does to it. -->
  <PlaneGrid :plane="d.plane" :x0="GRID_X0" :width="VIEW.w - GRID_X0" :height="VIEW.h" :step="d.gridStep" />
  <line class="divider" :x1="GRID_X0" :x2="GRID_X0" y1="0" :y2="VIEW.h" />

  <g data-el="moved" class="moved">
    <line v-for="(m, i) in d.moved" :key="i" :class="{ axis: m.axis }" :x1="m.seg.x1" :y1="m.seg.y1" :x2="m.seg.x2" :y2="m.seg.y2" />
  </g>
  <polygon data-el="square" class="square" :points="d.square" />
  <g v-track="tp" class="para-wrap">
    <polygon data-el="para" class="para" :points="d.para" />
    <polygon data-el="para-hit" class="hit-area" :points="d.para" />
  </g>

  <!-- Column mix, drawn under the vectors. -->
  <PlaneVector v-if="!d.zero.part1" el="part1" :plane="d.plane" :v="d.parts[0]" hue="blue" name="" band />
  <PlaneVector v-if="!d.zero.part2" el="part2" :plane="d.plane" :from="d.parts[0]" :v="d.parts[1]" hue="violet" name="" band />

  <PlaneVector v-if="!d.zero.c1" el="c1" :plane="d.plane" :v="d.cols[0]" hue="blue" name="c₁" halo :track="tc(0)" />
  <PlaneVector v-if="!d.zero.c2" el="c2" :plane="d.plane" :v="d.cols[1]" hue="violet" name="c₂" halo :track="tc(1)" />
  <PlaneVector v-if="!d.zero.x" el="xv" :plane="d.plane" :v="d.x" hue="rose" name="x" halo :track="tx" />
  <PlaneVector v-if="!d.zero.y" el="yv" :plane="d.plane" :v="d.y" hue="green" name="Ax" halo :track="ty" />
</template>

<style scoped>
.eq { fill: var(--text-dim); font: 24px var(--font-math-upright); }
.work { fill: var(--text-dim); font: 14px var(--font-math-upright); }
.it { font: italic 15px var(--font-math); fill: var(--text); }
.sym { font: italic 700 15px var(--font-math); fill: var(--text); }
.green { fill: var(--c-green); }
.blue { fill: var(--c-blue); }
.violet { fill: var(--c-violet); }
.divider { stroke: var(--line); }
.moved line { stroke: var(--c-blue); stroke-width: 1; opacity: 0.18; }
.moved line.axis { opacity: 0.5; stroke-width: 1.4; }
.square { fill: none; stroke: var(--text-faint); stroke-width: 1; stroke-dasharray: 3 3; }
.para-wrap { pointer-events: none; }
.para { fill: var(--c-blue-soft); stroke: var(--c-blue); stroke-width: 1; opacity: 0.9; }
.hit-area { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
