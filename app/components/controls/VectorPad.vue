<script setup lang="ts">
import { hueVar, type PadVector } from '~/types/concept'
import { clamp, snap } from '~/utils/math'

/**
 * A small coordinate plane with one draggable handle per 2D vector.
 * Drag with the pointer (captured, so it keeps tracking outside the pad)
 * or focus a handle and use the arrow keys.
 */

const props = withDefaults(defineProps<{ vectors: PadVector[]; range: [number, number]; step?: number }>(), { step: 1 })
const emit = defineEmits<{ update: [key: string, value: [number, number]] }>()

const W = 200
const H = 120
const pad = 10
const span = computed(() => props.range[1] - props.range[0])
// Equal scale on both axes, so angles look right.
const scale = computed(() => Math.min((W - pad * 2) / span.value, (H - pad * 2) / span.value))
const ox = W / 2
const oy = H / 2

const toX = (v: number) => ox + v * scale.value
const toY = (v: number) => oy - v * scale.value

const ticks = computed(() => {
  const out: number[] = []
  for (let v = Math.ceil(props.range[0]); v <= props.range[1]; v++) if (v !== 0) out.push(v)
  return out
})

const svg = ref<SVGSVGElement>()
const dragging = ref<string | null>(null)

function valueFromEvent(e: PointerEvent): [number, number] {
  const rect = svg.value!.getBoundingClientRect()
  // Map client px → viewBox units (preserveAspectRatio meet keeps it uniform).
  const k = Math.min(rect.width / W, rect.height / H)
  const offX = (rect.width - W * k) / 2
  const offY = (rect.height - H * k) / 2
  const x = (e.clientX - rect.left - offX) / k
  const y = (e.clientY - rect.top - offY) / k
  const [lo, hi] = props.range
  return [snap(clamp((x - ox) / scale.value, lo, hi), props.step), snap(clamp((oy - y) / scale.value, lo, hi), props.step)]
}

function accept(vec: PadVector, next: [number, number]) {
  if (vec.nonZero && next[0] === 0 && next[1] === 0) return
  if (next[0] === vec.value[0] && next[1] === vec.value[1]) return
  emit('update', vec.key, next)
}

function onDown(e: PointerEvent, vec: PadVector) {
  if (dragging.value) return // ignore a second finger mid-drag
  dragging.value = vec.key
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
}
function onMove(e: PointerEvent, vec: PadVector) {
  if (dragging.value !== vec.key) return
  accept(vec, valueFromEvent(e))
}
function onUp(e: PointerEvent) {
  dragging.value = null
  ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
}

function onKey(e: KeyboardEvent, vec: PadVector) {
  const d = props.step * (e.shiftKey ? 5 : 1)
  const [lo, hi] = props.range
  const moves: Record<string, [number, number]> = {
    ArrowRight: [d, 0], ArrowLeft: [-d, 0], ArrowUp: [0, d], ArrowDown: [0, -d],
  }
  const m = moves[e.key]
  if (!m) return
  e.preventDefault()
  accept(vec, [snap(clamp(vec.value[0] + m[0], lo, hi), props.step), snap(clamp(vec.value[1] + m[1], lo, hi), props.step)])
}
</script>

<template>
  <svg ref="svg" class="pad" :viewBox="`0 0 ${W} ${H}`" role="group" aria-label="Drag vectors">
    <g class="ticks">
      <line v-for="t in ticks" :key="`x${t}`" :x1="toX(t)" :x2="toX(t)" :y1="0" :y2="H" />
      <line v-for="t in ticks" :key="`y${t}`" :x1="0" :x2="W" :y1="toY(t)" :y2="toY(t)" />
    </g>
    <path class="axis" :d="`M0 ${oy}H${W}M${ox} 0V${H}`" />
    <g v-for="vec in vectors" :key="vec.key" :style="{ '--hue': hueVar(vec.hue) }">
      <line class="arm" :x1="ox" :y1="oy" :x2="toX(vec.value[0])" :y2="toY(vec.value[1])" />
      <circle
        class="handle"
        :class="{ dragging: dragging === vec.key }"
        :cx="toX(vec.value[0])"
        :cy="toY(vec.value[1])"
        r="5.5"
        tabindex="0"
        role="slider"
        :aria-label="`${vec.label} = (${vec.value[0]}, ${vec.value[1]})`"
        :aria-valuetext="`(${vec.value[0]}, ${vec.value[1]})`"
        @pointerdown="onDown($event, vec)"
        @pointermove="onMove($event, vec)"
        @pointerup="onUp"
        @pointercancel="onUp"
        @keydown="onKey($event, vec)"
      />
    </g>
  </svg>
</template>

<style scoped>
.pad { display: block; width: 100%; aspect-ratio: 200 / 120; border-radius: 10px; background: var(--surface); touch-action: none; user-select: none; }
.ticks line { stroke: var(--grid); }
.axis { stroke: var(--axis); fill: none; }
.arm { stroke: var(--hue); stroke-width: 2; stroke-linecap: round; }
.handle {
  fill: var(--bg); stroke: var(--hue); stroke-width: 2; cursor: grab; outline: none;
  transform-box: fill-box; transform-origin: center;
  transition: transform var(--dur-fast) var(--ease-out);
}
.handle:focus-visible { stroke-width: 3; }
.handle.dragging { cursor: grabbing; transform: scale(1.25); }
@media (hover: hover) and (pointer: fine) { .handle:hover { transform: scale(1.15); } }
</style>
