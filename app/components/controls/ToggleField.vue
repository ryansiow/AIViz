<script setup lang="ts">
import { hueVar, type ToggleParam } from '~/types/concept'

const props = defineProps<{ modelValue: boolean; spec: ToggleParam }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    class="toggle"
    :aria-checked="modelValue"
    :style="{ '--hue': hueVar(spec.hue ?? 'blue') }"
    @click="emit('update:modelValue', !props.modelValue)"
  >
    <span class="label">{{ spec.label }}</span>
    <span class="track" aria-hidden="true"><span class="thumb" /></span>
  </button>
</template>

<style scoped>
.toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 2px 0; }
.label { font-size: 13px; color: var(--text-dim); }
.track {
  position: relative; width: 30px; height: 18px; border-radius: 999px; background: var(--line-strong);
  transition: background-color var(--dur-ui) ease;
}
.thumb {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff;
  box-shadow: var(--shadow-sm); transition: transform var(--dur-ui) var(--ease-out);
}
[aria-checked="true"] .track { background: var(--hue); }
[aria-checked="true"] .thumb { transform: translateX(12px); }
</style>
