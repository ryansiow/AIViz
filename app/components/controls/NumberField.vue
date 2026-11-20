<script setup lang="ts">
import { clamp, snap } from '~/utils/math'

/**
 * Compact numeric input. Typing is free-form; the value is clamped and
 * snapped on Enter or blur. Arrow keys step (Shift = ×10).
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    /** LaTeX prefix inside the field, e.g. "x_1". */
    tex?: string
    label: string
  }>(),
  { min: -Infinity, max: Infinity, step: 1 },
)
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const draft = ref(String(props.modelValue))
const focused = ref(false)
watch(
  () => props.modelValue,
  (v) => {
    if (!focused.value) draft.value = String(v)
  },
)

function commit() {
  const n = Number(draft.value.replace(',', '.'))
  if (draft.value.trim() === '' || !Number.isFinite(n)) {
    draft.value = String(props.modelValue)
    return
  }
  const v = snap(clamp(n, props.min, props.max), props.step)
  draft.value = String(v)
  if (v !== props.modelValue) {
    emit('update:modelValue', v)
    // If the parent rejected the value (e.g. zero vector), show the real one again.
    nextTick(() => {
      draft.value = String(props.modelValue)
    })
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    commit()
    ;(e.target as HTMLInputElement).select()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    const dir = e.key === 'ArrowUp' ? 1 : -1
    const v = snap(clamp(props.modelValue + dir * props.step * (e.shiftKey ? 10 : 1), props.min, props.max), props.step)
    draft.value = String(v)
    emit('update:modelValue', v)
  } else if (e.key === 'Escape') {
    draft.value = String(props.modelValue)
  }
}
</script>

<template>
  <label class="num">
    <span v-if="tex" class="prefix" aria-hidden="true"><Tex :expr="tex" /></span>
    <span class="sr-only">{{ label }}</span>
    <input
      v-model="draft"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      spellcheck="false"
      role="spinbutton"
      :aria-valuenow="modelValue"
      :aria-valuemin="Number.isFinite(min) ? min : undefined"
      :aria-valuemax="Number.isFinite(max) ? max : undefined"
      @focus="focused = true"
      @blur="focused = false; commit()"
      @keydown="onKey"
    />
  </label>
</template>

<style scoped>
.num {
  display: flex; align-items: center; min-width: 0;
  border: 1px solid var(--line); border-radius: var(--radius); background: var(--bg);
  transition: border-color var(--dur-fast) ease;
}
.num:focus-within { border-color: var(--brand); }
.prefix { padding-left: 8px; color: var(--text-faint); font-size: 12px; flex: none; }
input {
  width: 100%; min-width: 0; border: 0; background: none; outline: none;
  padding: 6px 8px; font: 13px var(--font-mono); color: var(--text);
}
</style>
