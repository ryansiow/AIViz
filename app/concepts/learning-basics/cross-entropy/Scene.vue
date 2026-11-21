<script setup lang="ts">
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import { BARS, type CEData } from './derive'

/** Left: the model's probabilities with the right answer marked. Right: the loss −log p. */
const props = defineProps<{ d: CEData }>()

const v = (x: number, k = 2) => String(roundTo(x, k)).replace('-', '−')
const pct = (p: number) => (p < 0.001 ? '<0.1%' : `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`)
const rowY = (i: number) => BARS.top + i * BARS.step
const tRow = (i: number): TrackMeta => ({
  id: `TRK-0${i + 1}`, kind: 'TOKEN', name: props.d.tokens[i]!, hue: i === props.d.answer ? 'green' : 'blue',
  rows: [['probability', v(props.d.p[i]!, 4)], ['right answer?', i === props.d.answer ? 'yes' : 'no'], ['−log p', v(-Math.log(props.d.p[i]!))]],
})
const tLoss = computed<TrackMeta>(() => ({ id: 'TRK-10', kind: 'LOSS', name: 'cross-entropy', hue: 'rose', rows: [['p(right)', v(props.d.pc, 4)], ['loss −log p', v(props.d.loss, 3)], ['uniform guess', v(props.d.uniform, 3)]] }))
// Low loss: the curve is far to the right, so the label sits at the free left end of the guide.
// High loss (p near 0): the curve hugs the axis there, so the label goes right of the point.
const lossLabel = computed(() =>
  props.d.pt.x < props.d.f.box.x0 + 60
    ? { x: props.d.pt.x + 12, y: props.d.pt.y + 4, anchor: 'start' }
    : { x: props.d.f.box.x0 + 6, y: props.d.pt.y - 6, anchor: 'start' },
)
</script>

<template>
  <text data-el="prompt" class="prompt" :x="BARS.x" y="52">“{{ d.prompt }}”</text>

  <!-- Probabilities. -->
  <rect data-el="answer-box" class="answer-box" :x="12" :y="rowY(d.answer) - 15" :width="BARS.x + BARS.w + 60 - 12" height="38" rx="8" />
  <g v-for="(t, i) in d.tokens" :key="t" v-track="tRow(i)" class="row-wrap">
    <g :data-el="`row-${i}`">
      <text class="token" :x="BARS.label" :y="rowY(i) + 4" text-anchor="end">{{ t }}</text>
      <rect class="track-bg" :x="BARS.x" :y="rowY(i) - BARS.h / 2" :width="BARS.w" :height="BARS.h" rx="4" />
      <rect :data-el="`bar-${i}`" class="bar" :x="BARS.x" :y="rowY(i) - BARS.h / 2" :width="Math.max(d.bars[i]!, 1)" :height="BARS.h" rx="4" />
      <text class="pct" :x="BARS.x + BARS.w + 8" :y="rowY(i) + 4">{{ pct(d.p[i]!) }}</text>
    </g>
    <rect :data-el="`hit-${i}`" class="hit-area" :x="12" :y="rowY(i) - 18" :width="BARS.x + BARS.w + 50" height="36" />
  </g>
  <!-- The right answer's colour is an overlay, so it is not given away before its step. -->
  <g data-el="answer-mark" class="answer-mark">
    <text class="token right" :x="BARS.label" :y="rowY(d.answer) + 4" text-anchor="end">{{ d.tokens[d.answer] }}</text>
    <rect class="bar right" :x="BARS.x" :y="rowY(d.answer) - BARS.h / 2" :width="Math.max(d.bars[d.answer]!, 1)" :height="BARS.h" rx="4" />
  </g>
  <text data-el="answer-tag" class="answer-tag" :x="BARS.x + BARS.w + 54" :y="rowY(d.answer) + 4">✓</text>

  <!-- Loss curve. -->
  <PlotAxes :f="d.f" x-label="p(right answer)" y-label="loss = −log p" />
  <line data-el="uniform" class="uniform" :x1="d.f.box.x0" :x2="d.f.box.x1" :y1="d.f.sy(d.uniform)" :y2="d.f.sy(d.uniform)" />
  <text data-el="uniform-label" class="uniform-label" :x="d.f.box.x1" :y="d.f.sy(d.uniform) - 5" text-anchor="end">random guess {{ v(d.uniform) }}</text>
  <path data-el="curve" class="curve" :d="d.curve" />
  <circle data-el="p-dot" class="p-dot" :cx="d.pt.x" :cy="d.f.box.y1" r="5" />
  <path data-el="guide" class="guide" :d="`M${d.pt.x} ${d.f.box.y1} V${d.pt.y} H${d.f.box.x0}`" />
  <g v-track="tLoss" class="row-wrap">
    <circle data-el="loss-pt" class="loss-pt" :cx="d.pt.x" :cy="d.pt.y" r="6" />
    <text data-el="loss-label" class="loss-label" :x="lossLabel.x" :y="lossLabel.y" :text-anchor="lossLabel.anchor">
      L = {{ v(d.loss) }}{{ d.pt.clipped ? ' (off chart)' : '' }}
    </text>
    <circle data-el="loss-hit" class="hit-area" :cx="d.pt.x" :cy="d.pt.y" r="11" />
  </g>
</template>

<style scoped>
.row-wrap { pointer-events: none; }
.prompt { fill: var(--text-dim); font: italic 14px var(--font-sans); }
.token { fill: var(--text-body); font: 14px var(--font-sans); }
.token.right { fill: var(--c-green); font-weight: 600; }
.track-bg { fill: var(--surface-2); }
.bar { fill: var(--c-blue); opacity: 0.75; }
.bar.right { fill: var(--c-green); opacity: 1; }
.pct { fill: var(--text-dim); font: 12px var(--font-mono); }
.answer-mark { pointer-events: none; }
.answer-box { fill: var(--c-green-soft); stroke: var(--c-green); stroke-width: 1.25; }
.answer-tag { fill: var(--c-green); font: 600 15px var(--font-sans); }
.uniform { stroke: var(--text-faint); stroke-dasharray: 4 4; }
.uniform-label { fill: var(--text-faint); font: 11px var(--font-mono); }
.curve { fill: none; stroke: var(--c-rose); stroke-width: 2; }
.p-dot { fill: var(--c-green); stroke: var(--surface); stroke-width: 1.5; }
.guide { fill: none; stroke: var(--text-faint); stroke-dasharray: 3 3; }
.loss-pt { fill: var(--c-rose); stroke: var(--surface); stroke-width: 2; }
.loss-label { fill: var(--c-rose); font: 600 13px var(--font-mono); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; }
.hit-area { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
