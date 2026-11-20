<script setup lang="ts">
import { hueVar, type NumberParam } from '~/types/concept'
import { formatNumber } from '~/utils/math'

/** Labelled slider with a live value and a filled track in the param's hue. */
const props = defineProps<{ modelValue: number; spec: NumberParam }>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const id = useId()
const pct = computed(() => ((props.modelValue - props.spec.min) / (props.spec.max - props.spec.min)) * 100)
const step = computed(() => props.spec.step ?? 0.01)
const digits = computed(() => props.spec.digits ?? Math.max(0, (String(step.value).split('.')[1] || '').length))
</script>

<template>
  <div class="slider" :style="{ '--hue': hueVar(spec.hue), '--pct': `${pct}%` }">
    <div class="head">
      <label :for="id" class="label">
        <Tex v-if="spec.tex" :expr="spec.tex" />
        <span v-else>{{ spec.label }}</span>
        <span v-if="spec.tex" class="sr-only">{{ spec.label }}</span>
      </label>
      <output :for="id" class="value">{{ formatNumber(modelValue, digits) }}</output>
    </div>
    <input
      :id="id"
      type="range"
      :min="spec.min"
      :max="spec.max"
      :step="step"
      :value="modelValue"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
    <p v-if="spec.hint" class="hint">{{ spec.hint }}</p>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.label { font-size: 13px; color: var(--text-dim); }
.value { font: 500 13px var(--font-mono); color: var(--hue); }
input {
  width: 100%; height: 20px; appearance: none; background: transparent; cursor: pointer;
}
input::-webkit-slider-runnable-track {
  height: 4px; border-radius: 2px;
  background: linear-gradient(to right, var(--hue) var(--pct), var(--surface-2) var(--pct));
}
input::-webkit-slider-thumb {
  appearance: none; width: 14px; height: 14px; margin-top: -5px; border-radius: 50%;
  background: var(--bg); border: 2px solid var(--hue);
  transition: transform var(--dur-fast) var(--ease-out);
}
input:active::-webkit-slider-thumb { transform: scale(1.15); }
input::-moz-range-track { height: 4px; border-radius: 2px; background: var(--surface-2); }
input::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--hue); }
input::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--bg); border: 2px solid var(--hue); }
.hint { margin-top: 2px; font-size: 12px; color: var(--text-faint); }
</style>
