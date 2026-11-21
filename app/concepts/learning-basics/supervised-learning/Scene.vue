<script setup lang="ts">
import type { ScatterPoint } from '~/components/plot/ScatterPoints.vue'
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import { GUESS, TABLE, type SupData } from './derive'

/** Supervised learning: a chart of the examples and the same examples as a table. */
const props = defineProps<{ d: SupData }>()

const v = (x: number) => String(roundTo(x, 1)).replace('-', '−')
const points = computed<ScatterPoint[]>(() =>
  props.d.xs.map((x, i) => ({
    x,
    y: props.d.ys[i]!,
    hue: 'neutral',
    track: {
      id: `TRK-0${i + 1}`, kind: 'EXAMPLE', name: `student ${i + 1}`, hue: 'neutral',
      rows: [['hours (input)', String(x)], ['score (label)', String(props.d.ys[i])], ['model says', v(props.d.w * x + props.d.b)]],
    },
  })),
)
const tLine = computed<TrackMeta>(() => ({ id: 'TRK-10', kind: 'MODEL', name: 'learned line', hue: 'blue', rows: [['rule', `${props.d.w} × hours + ${props.d.b}`], ['w (slope)', String(props.d.w)], ['b (intercept)', String(props.d.b)]] }))
const tGuess = computed<TrackMeta>(() => ({ id: 'TRK-11', kind: 'MODEL', name: 'first guess', hue: 'amber', rows: [['rule', `${GUESS.w} × hours + ${GUESS.b}`], ['status', 'untrained']] }))
const tPred = computed<TrackMeta>(() => ({ id: 'TRK-12', kind: 'PREDICTION', name: 'new student', hue: 'green', rows: [['hours', v(props.d.query)], ['predicted score', v(props.d.pred)], ['trust', props.d.trust]] }))
const nearRight = computed(() => props.d.q.x > props.d.f.box.x1 - 50)
const rowY = (i: number) => TABLE.y + (i + 1) * TABLE.row
</script>

<template>
  <PlotAxes :f="d.f" x-label="hours studied" y-label="exam score" />

  <g v-track="tGuess" class="wrap">
    <line data-el="guess" class="guess" :x1="d.guess.x1" :y1="d.guess.y1" :x2="d.guess.x2" :y2="d.guess.y2" />
    <line data-el="guess-hit" class="hit" :x1="d.guess.x1" :y1="d.guess.y1" :x2="d.guess.x2" :y2="d.guess.y2" />
  </g>
  <g v-track="tLine" class="wrap">
    <line data-el="line" class="line" :x1="d.line.x1" :y1="d.line.y1" :x2="d.line.x2" :y2="d.line.y2" />
    <line data-el="line-hit" class="hit" :x1="d.line.x1" :y1="d.line.y1" :x2="d.line.x2" :y2="d.line.y2" />
  </g>

  <ScatterPoints el="data" :points="points" :sx="d.f.sx" :sy="d.f.sy" hue="neutral" />

  <!-- Prediction for the new input. -->
  <path data-el="q-guide" class="q-guide" :d="`M${d.q.x} ${d.f.box.y1} V${d.q.y} H${d.f.box.x0}`" />
  <g v-track="tPred" class="wrap">
    <circle data-el="q-pt" class="q-pt" :cx="d.q.x" :cy="d.q.y" r="6" />
    <text data-el="q-label" class="q-label" :x="d.q.x + 10" :y="d.q.y - 8">{{ v(d.pred) }}?</text>
    <circle data-el="q-ring" class="q-ring" :class="d.trust" :cx="d.q.x" :cy="d.q.y" r="12" />
    <circle data-el="q-hit" class="hit-area" :cx="d.q.x" :cy="d.q.y" r="11" />
  </g>
  <!-- Just above the axis, beside the guide (the axis name sits below the axis on the right). -->
  <text data-el="q-x" class="q-x" :x="nearRight ? d.q.x - 5 : d.q.x + 5" :y="d.f.box.y1 - 6" :text-anchor="nearRight ? 'end' : 'start'">{{ v(d.query) }} h</text>

  <!-- The same examples as a table: input → label. -->
  <g data-el="table-head" class="head">
    <text :x="TABLE.x" :y="TABLE.y">hours</text>
    <text :x="TABLE.x + 110" :y="TABLE.y" text-anchor="end">score</text>
    <line :x1="TABLE.x" :x2="TABLE.x + 110" :y1="TABLE.y + 7" :y2="TABLE.y + 7" />
  </g>
  <g v-for="(x, i) in d.xs" :key="i" :data-el="`row-${i}`" class="row">
    <text :x="TABLE.x" :y="rowY(i)">{{ x }}</text>
    <text class="label" :x="TABLE.x + 110" :y="rowY(i)" text-anchor="end">{{ d.ys[i] }}</text>
  </g>
  <g data-el="row-new" class="row new">
    <text :x="TABLE.x" :y="rowY(6) + 6">{{ v(d.query) }}</text>
    <text class="label" :x="TABLE.x + 110" :y="rowY(6) + 6" text-anchor="end">{{ v(d.pred) }}?</text>
  </g>
  <text data-el="goal" class="goal" :x="TABLE.x" :y="rowY(8)">find <tspan class="it">f</tspan>: hours → score</text>
  <text data-el="rule" class="rule" :x="TABLE.x" :y="rowY(9)">score ≈ {{ d.w }} × hours + {{ d.b }}</text>
</template>

<style scoped>
.wrap { pointer-events: none; }
.guess { stroke: var(--c-amber); stroke-width: 2; }
.line { stroke: var(--c-blue); stroke-width: 2.4; stroke-linecap: round; }
.q-guide { fill: none; stroke: var(--c-rose); stroke-width: 1; stroke-dasharray: 3 3; }
.q-pt { fill: var(--c-green); stroke: var(--surface); stroke-width: 2; }
.q-label { fill: var(--c-green); font: 600 14px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
.q-ring { fill: none; stroke: var(--c-amber); stroke-width: 2; }
.q-ring.inside { stroke: var(--c-green); }
.q-ring.impossible { stroke: var(--c-rose); }
.q-x { fill: var(--c-rose); font: 12px var(--font-mono); }
.head text { fill: var(--text-faint); font: 12px var(--font-sans); }
.head line { stroke: var(--line-strong); }
.row text { fill: var(--text-body); font: 14px var(--font-mono); }
.row .label { fill: var(--text); font-weight: 600; }
.row.new text { fill: var(--c-rose); }
.row.new .label { fill: var(--c-green); }
.goal { fill: var(--text-dim); font: 13px var(--font-sans); }
.goal .it { font: italic 15px var(--font-math); fill: var(--text); }
.rule { fill: var(--c-blue); font: 600 13px var(--font-sans); }
.hit { stroke: transparent; stroke-width: 14; pointer-events: visibleStroke; cursor: crosshair; }
.hit-area { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
