<script setup lang="ts">
import type { SelectParam } from '~/types/concept'

/** Up to 4 options render as a segmented control, more as a native select. */
const props = defineProps<{ modelValue: string; spec: SelectParam }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const id = useId()
const segmented = computed(() => props.spec.options.length <= 4)

function onKey(e: KeyboardEvent) {
  const opts = props.spec.options
  const i = opts.findIndex((o) => o.value === props.modelValue)
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    emit('update:modelValue', opts[(i + 1) % opts.length]!.value)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    emit('update:modelValue', opts[(i - 1 + opts.length) % opts.length]!.value)
  }
}
</script>

<template>
  <div class="select">
    <label :id="`${id}-label`" :for="segmented ? undefined : id" class="label">{{ spec.label }}</label>
    <div v-if="segmented" class="seg" role="radiogroup" :aria-labelledby="`${id}-label`" @keydown="onKey">
      <button
        v-for="opt in spec.options"
        :key="opt.value"
        type="button"
        role="radio"
        class="opt"
        :aria-checked="opt.value === modelValue"
        :tabindex="opt.value === modelValue ? 0 : -1"
        @click="emit('update:modelValue', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
    <select
      v-else
      :id="id"
      class="native"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in spec.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.label { display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-dim); }
.seg { display: flex; padding: 3px; gap: 2px; border-radius: 10px; background: var(--surface-2); }
.opt {
  flex: 1; padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12.5px; color: var(--text-dim);
  transition: background-color var(--dur-fast) ease, color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}
.opt[aria-checked="true"] { background: var(--bg); color: var(--text); box-shadow: var(--shadow-sm); font-weight: 500; }
.native {
  width: 100%; padding: 6px 8px; border-radius: var(--radius); border: 1px solid var(--line);
  background: var(--bg); color: var(--text); font: inherit; font-size: 13px;
}
</style>
