<script setup lang="ts">
import { angleArc, type Plane, type Vec } from '~/engine/plane'
import { hueVar, type Hue, type TrackMeta } from '~/types/concept'

/** Arc between two vectors at the origin. data-el parts: `<el>-arc`, `<el>-label`. */
const props = withDefaults(
  defineProps<{ plane: Plane; a: Vec; b: Vec; hue: Hue; el: string; label?: string; radius?: number; track?: TrackMeta }>(),
  { label: 'θ', radius: 34 },
)
const arc = computed(() => angleArc(props.plane, props.a, props.b, props.radius))
// Wedge for hovering: origin → arc → origin.
const wedge = computed(() => `M${props.plane.ox} ${props.plane.oy} L${arc.value.d.slice(1)} Z`)
</script>

<template>
  <g :data-el="el" v-track="track ?? { id: el, kind: 'ANGLE', name: label, hue, rows: [] }" :style="{ '--c': hueVar(hue) }">
    <path :data-el="`${el}-fill`" class="fill" :d="wedge" />
    <path :data-el="`${el}-arc`" class="arc" :d="arc.d" />
    <text :data-el="`${el}-label`" class="label" :x="arc.label[0]" :y="arc.label[1] + 5" text-anchor="middle">{{ label }}</text>
    <path :data-el="`${el}-hit`" class="hit" :d="wedge" />
  </g>
</template>

<style scoped>
g { pointer-events: none; }
.fill { fill: var(--c); opacity: 0.1; }
.arc { fill: none; stroke: var(--c); stroke-width: 1.5; }
.label { fill: var(--c); font: italic 15px var(--font-math); }
.hit { fill: transparent; pointer-events: visible; cursor: crosshair; }
</style>
