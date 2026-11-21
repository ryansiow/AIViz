<script setup lang="ts">
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import type { TCData } from './derive'

/** Training and validation loss per epoch, the gap between them, the best epoch, and a read-out epoch. */
const props = defineProps<{ d: TCData }>()

const v = (x: number) => String(roundTo(x, 2))
const tTrain = computed<TrackMeta>(() => ({ id: 'TRK-01', kind: 'CURVE', name: 'training loss', hue: 'blue', rows: [['start', v(props.d.train[0]!)], ['end', v(props.d.train.at(-1)!)], ['lowest', v(Math.min(...props.d.train))]] }))
const tVal = computed<TrackMeta>(() => ({ id: 'TRK-02', kind: 'CURVE', name: 'validation loss', hue: 'rose', rows: [['start', v(props.d.val[0]!)], ['end', v(props.d.val.at(-1)!)], ['lowest', `${v(props.d.bestVal)} (epoch ${props.d.bestEpoch})`]] }))
const tCur = computed<TrackMeta>(() => ({ id: 'TRK-03', kind: 'EPOCH', name: `epoch ${props.d.epoch}`, hue: 'amber', rows: [['training', v(props.d.train[props.d.epoch]!)], ['validation', v(props.d.val[props.d.epoch]!)], ['gap', v(props.d.val[props.d.epoch]! - props.d.train[props.d.epoch]!)]] }))
const labelLeft = computed(() => props.d.cur.x > props.d.f.box.x1 - 130)
</script>

<template>
  <PlotAxes :f="d.f" x-label="epoch" y-label="loss" />
  <text data-el="legend" class="legend" :x="d.f.box.x1" :y="d.f.box.y0 - 14" text-anchor="end"><tspan class="blue">— training</tspan>   <tspan class="rose">— validation</tspan></text>

  <path data-el="gap" class="gap" :d="d.paths.gap" />
  <g v-track="tTrain" class="wrap">
    <path data-el="train" class="line train" :d="d.paths.train" />
    <path data-el="train-hit" class="hit" :d="d.paths.train" />
  </g>
  <g v-track="tVal" class="wrap">
    <path data-el="val" class="line val" :d="d.paths.val" />
    <path data-el="val-hit" class="hit" :d="d.paths.val" />
  </g>

  <g data-el="best" class="best">
    <line :x1="d.best.x" :x2="d.best.x" :y1="d.best.y" :y2="d.f.box.y1" />
    <circle :cx="d.best.x" :cy="d.best.y" r="6" />
    <text :x="d.best.x" :y="d.best.y - 12" text-anchor="middle">best: epoch {{ d.bestEpoch }}</text>
  </g>

  <g v-track="tCur" class="wrap">
    <g data-el="cur" class="cur">
      <line :x1="d.cur.x" :x2="d.cur.x" :y1="d.f.box.y0" :y2="d.f.box.y1" />
      <circle class="blue-dot" :cx="d.cur.x" :cy="d.cur.train" r="4.5" />
      <circle class="rose-dot" :cx="d.cur.x" :cy="d.cur.val" r="4.5" />
      <text :x="labelLeft ? d.cur.x - 8 : d.cur.x + 8" :y="d.f.box.y0 + 14" :text-anchor="labelLeft ? 'end' : 'start'">
        epoch {{ d.epoch }}: <tspan class="blue">{{ v(d.train[d.epoch]!) }}</tspan> / <tspan class="rose">{{ v(d.val[d.epoch]!) }}</tspan>
      </text>
    </g>
    <rect data-el="cur-hit" class="hit-area" :x="d.cur.x - 8" :y="d.f.box.y0" width="16" :height="d.f.box.y1 - d.f.box.y0" />
  </g>
</template>

<style scoped>
.wrap { pointer-events: none; }
.legend { font: 11px var(--font-sans); }
.blue { fill: var(--c-blue); font-weight: 600; }
.rose { fill: var(--c-rose); font-weight: 600; }
.gap { fill: var(--c-rose); opacity: 0.1; }
.line { fill: none; stroke-width: 2; stroke-linejoin: round; }
.line.train { stroke: var(--c-blue); }
.line.val { stroke: var(--c-rose); }
.best line { stroke: var(--c-green); stroke-dasharray: 2 3; }
.best circle { fill: none; stroke: var(--c-green); stroke-width: 2; }
.best text { fill: var(--c-green); font: 600 12px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
.cur line { stroke: var(--c-amber); stroke-dasharray: 3 3; }
.cur text { fill: var(--text-dim); font: 12px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
.blue-dot { fill: var(--c-blue); stroke: var(--surface); stroke-width: 1.5; }
.rose-dot { fill: var(--c-rose); stroke: var(--surface); stroke-width: 1.5; }
.hit { fill: none; stroke: transparent; stroke-width: 12; pointer-events: visibleStroke; cursor: crosshair; }
.hit-area { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
