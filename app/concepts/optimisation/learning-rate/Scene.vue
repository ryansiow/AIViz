<script setup lang="ts">
import { arrowHead } from '~/engine/plane'
import type { TrackMeta } from '~/types/concept'
import { roundTo } from '~/utils/math'
import { PANEL, type LRData, type LRPoint, type Run } from './derive'

/** Three gradient descent runs on the same bowl, one panel per learning rate. */
const props = defineProps<{ d: LRData }>()

const n = (v: number) =>
  (Number.isFinite(v) ? (Math.abs(v) > 999 ? v.toExponential(1) : roundTo(v, 2).toFixed(2)) : '∞').replace('-', '−')
const sub = (k: number) => String(k).replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]!)
const STATUS: Record<Run['status'], string> = {
  converged: 'settles',
  slow: 'crawls',
  oscillating: 'zig-zags',
  diverged: 'blows up',
  local: 'settles',
}

const rest = (r: Run) => [...r.shown.slice(1)].reverse()
const last = (r: Run) => r.shown[r.shown.length - 1]!
const head = (r: Run) => {
  const a = r.firstArrow
  return Math.abs(a.x2 - a.x1) > 8 ? arrowHead([a.x1, a.y], [a.x2, a.y], 7) : ''
}

const track = (r: Run, i: number, p: LRPoint): TrackMeta => ({
  id: `TRK-${i + 1}${String(p.k).padStart(2, '0')}`,
  kind: p.k === 0 ? 'START' : 'UPDATE',
  name: `θ${sub(p.k)}  (η = ${r.eta.toFixed(2)})`,
  hue: p.k === 0 ? 'blue' : 'amber',
  rows: [
    ['θ', n(p.theta)],
    ['L(θ)', n(p.loss)],
    ['distance to 1', n(Math.abs(p.theta - 1))],
    ...(p.offChart ? [['note', 'off the chart'] as [string, string]] : []),
  ],
})
</script>

<template>
  <g v-for="(r, i) in d.runs" :key="i">
    <!-- Panel header -->
    <text :data-el="`head-${i}`" class="head" :x="r.x0 + PANEL.w / 2" :y="PANEL.y">
      <tspan class="m">η</tspan><tspan class="sub" dy="4">{{ i + 1 }}</tspan><tspan dy="-4"> = {{ r.eta.toFixed(2) }}</tspan>
    </text>

    <!-- Axes -->
    <g :data-el="`axes-${i}`">
      <line class="axis" :x1="r.sx.range[0]" :x2="r.sx.range[1]" :y1="PANEL.plotBottom" :y2="PANEL.plotBottom" />
      <g v-for="t in d.xTicks" :key="t">
        <line class="grid" :x1="r.sx(t)" :x2="r.sx(t)" :y1="PANEL.plotTop" :y2="PANEL.plotBottom" />
        <text class="tick" :x="r.sx(t)" :y="PANEL.plotBottom + 14" text-anchor="middle">{{ String(t).replace('-', '−') }}</text>
      </g>
    </g>

    <path :data-el="`curve-${i}`" class="curve" :d="r.curve" />

    <!-- First update along θ: −η·L′(θ₀) -->
    <g :data-el="`arrow-${i}`" class="arrow">
      <line :x1="r.firstArrow.x1" :x2="r.firstArrow.x2" :y1="r.firstArrow.y" :y2="r.firstArrow.y" />
      <polygon v-if="head(r) && !r.firstArrow.clipped" :points="head(r)" />
      <text :x="r.x0 + PANEL.w / 2" :y="r.firstArrow.y + 14" text-anchor="middle">
        step {{ n(Math.abs(r.eta * d.grad0)) }}{{ r.firstArrow.clipped ? ' (off chart)' : '' }}
      </text>
    </g>

    <!-- Path between iterates -->
    <line
      v-for="p in r.shown.slice(1)"
      :key="`s${p.k}`"
      :data-el="`seg-${i}-${p.k}`"
      class="seg"
      :x1="r.shown[p.k - 1]!.x"
      :y1="r.shown[p.k - 1]!.y"
      :x2="p.x"
      :y2="p.y"
    />

    <!-- Iterates (later first, so the start stays on top) -->
    <g v-for="p in rest(r)" :key="`p${p.k}`" v-track="track(r, i, p)" class="pt-wrap">
      <circle :data-el="`pt-${i}-${p.k}`" class="pt" :class="{ off: p.offChart }" :cx="p.x" :cy="p.y" r="3.5" />
      <circle :data-el="`hit-${i}-${p.k}`" class="hit" :cx="p.x" :cy="p.y" r="8" />
    </g>
    <g v-track="track(r, i, r.shown[0]!)" class="pt-wrap">
      <circle :data-el="`pt-${i}-0`" class="pt start" :cx="r.shown[0]!.x" :cy="r.shown[0]!.y" r="5" />
      <circle :data-el="`hit-${i}-0`" class="hit" :cx="r.shown[0]!.x" :cy="r.shown[0]!.y" r="8" />
    </g>

    <!-- Why: the distance multiplier, then the verdict -->
    <text :data-el="`factor-${i}`" class="factor" :x="r.x0 + PANEL.w / 2" :y="PANEL.plotBottom + 64" text-anchor="middle">
      × {{ n(r.factor) }} per step
    </text>
    <circle :data-el="`ring-${i}`" class="ring" :class="r.status" :cx="last(r).x" :cy="last(r).y" r="9" />
    <text :data-el="`status-${i}`" class="status" :class="r.status" :x="r.x0 + PANEL.w / 2" :y="PANEL.plotBottom + 84" text-anchor="middle">
      {{ STATUS[r.status] }}
    </text>
  </g>
</template>

<style scoped>
.head { fill: var(--c-amber); font: 14px var(--font-math-upright); text-anchor: middle; }
.head .m { font-family: var(--font-math); font-style: italic; }
.head .sub { font-size: 10px; }
.axis { stroke: var(--axis); }
.grid { stroke: var(--grid); }
.tick { fill: var(--text-faint); font: 10px var(--font-mono); }
.curve { fill: none; stroke: var(--text-dim); stroke-width: 1.75; }
.arrow line { stroke: var(--c-amber); stroke-width: 1.75; }
.arrow polygon { fill: var(--c-amber); }
.arrow text { fill: var(--c-amber); font: 11px var(--font-mono); }
.seg { stroke: var(--c-amber); stroke-width: 1.25; opacity: 0.7; }
.pt-wrap { pointer-events: none; }
.pt { fill: var(--c-amber); stroke: var(--bg); stroke-width: 1.25; }
.pt.start { fill: var(--c-blue); }
.pt.off { fill: var(--c-rose); }
.factor { fill: var(--text-dim); font: 12px var(--font-mono); }
.ring { fill: none; stroke-width: 2; stroke: var(--c-amber); }
.ring.converged { stroke: var(--c-green); }
.ring.diverged { stroke: var(--c-rose); }
.status { font: 600 13px var(--font-sans); fill: var(--c-amber); }
.status.converged { fill: var(--c-green); }
.status.diverged { fill: var(--c-rose); }
.hit { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
