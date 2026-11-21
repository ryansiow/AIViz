<script setup lang="ts">
import { gridLayout } from '~/engine/matrix'
import { hueSoftVar, hueVar, type Hue, type TrackMeta } from '~/types/concept'

/**
 * A matrix (or column vector) drawn as tinted cells between square brackets.
 * data-el parts, for the timeline:
 *   `<el>-bracket`, `<el>-label`, `<el>-cell-<r>-<c>` (cell group),
 *   `<el>-row-<r>` / `<el>-col-<c>` (highlight boxes), `<el>-hit-<r>-<c>`.
 * Highlights are drawn but meant to be faded in and out by the timeline.
 */
const props = withDefaults(
  defineProps<{
    values: (number | string)[][]
    x: number
    y: number
    hue: Hue
    el: string
    cell?: number
    gap?: number
    /** Name above the grid, bold italic for vectors (`vector`) or italic for matrices. */
    label?: string
    vector?: boolean
    /** Hue per column highlight (defaults to `hue`). */
    colHues?: Hue[]
    track?: (r: number, c: number) => TrackMeta
  }>(),
  { cell: 40, gap: 4 },
)

const m = computed(() => props.values.length)
const n = computed(() => props.values[0]?.length ?? 0)
const g = computed(() => gridLayout(m.value, n.value, props.x, props.y, props.cell, props.gap))
const text = (v: number | string) => (typeof v === 'number' ? String(Number(v.toFixed(3))).replace('-', '−') : v)
const size = computed(() => Math.round(props.cell * 0.4))
</script>

<template>
  <g :data-el="el" class="matrix" :style="{ '--c': hueVar(hue), '--c-soft': hueSoftVar(hue) }">
    <text v-if="label" :data-el="`${el}-label`" class="label" :class="{ vector }" :x="g.x + g.w / 2" :y="g.y - 14" text-anchor="middle">{{ label }}</text>
    <g :data-el="`${el}-bracket`" class="bracket">
      <path :d="g.bracket.left" />
      <path :d="g.bracket.right" />
    </g>
    <rect v-for="(r, i) in g.rows" :key="`r${i}`" :data-el="`${el}-row-${i}`" class="hl" :x="r.x" :y="r.y" :width="r.w" :height="r.h" rx="7" />
    <rect
      v-for="(c, j) in g.cols"
      :key="`c${j}`"
      :data-el="`${el}-col-${j}`"
      class="hl"
      :style="colHues?.[j] ? { stroke: hueVar(colHues[j]) } : undefined"
      :x="c.x"
      :y="c.y"
      :width="c.w"
      :height="c.h"
      rx="7"
    />
    <g v-for="cl in g.cells" :key="`${cl.r}-${cl.c}`" v-track="track ? track(cl.r, cl.c) : { id: `${el}-${cl.r}${cl.c}`, kind: 'ENTRY', name: `${label ?? el}[${cl.r + 1}, ${cl.c + 1}]`, hue, rows: [['value', text(values[cl.r]![cl.c]!)]] }" class="cell-wrap">
      <g :data-el="`${el}-cell-${cl.r}-${cl.c}`">
        <rect class="cell" :x="cl.x" :y="cl.y" :width="cl.w" :height="cl.h" rx="5" />
        <text class="val" :x="cl.cx" :y="cl.cy + size * 0.36" text-anchor="middle" :style="{ fontSize: `${size}px` }">{{ text(values[cl.r]![cl.c]!) }}</text>
      </g>
      <rect :data-el="`${el}-hit-${cl.r}-${cl.c}`" class="hit" :x="cl.x" :y="cl.y" :width="cl.w" :height="cl.h" />
    </g>
  </g>
</template>

<style scoped>
.matrix, .cell-wrap { pointer-events: none; }
.label { fill: var(--c); font: italic 16px var(--font-math); }
.label.vector { font-weight: 700; }
.bracket path { fill: none; stroke: var(--text-dim); stroke-width: 1.4; }
.cell { fill: var(--c-soft); }
.val { fill: var(--c); font-family: var(--font-math-upright); font-variant-numeric: tabular-nums; }
/* Highlights start hidden; the timeline fades them in and out. */
.hl { fill: none; stroke: var(--c); stroke-width: 2; opacity: 0; }
.hit { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
