<script setup lang="ts">
defineProps<{ presets: { label: string }[]; active?: number | null }>()
const emit = defineEmits<{ apply: [number]; reset: [] }>()
</script>

<template>
  <div class="chips" role="group" aria-label="Presets">
    <button
      v-for="(p, i) in presets"
      :key="p.label"
      type="button"
      class="chip pressable"
      :aria-pressed="active === i"
      @click="emit('apply', i)"
    >
      {{ p.label }}
    </button>
    <button type="button" class="chip pressable reset" @click="emit('reset')">Reset</button>
  </div>
</template>

<style scoped>
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { padding: 4px 10px; border-radius: 999px; background: var(--surface-2); font-size: 12px; color: var(--text-dim); }
@media (hover: hover) and (pointer: fine) { .chip:hover { background: var(--line-strong); color: var(--text); } }
.chip[aria-pressed="true"] { background: var(--brand-soft); color: var(--brand); }
.reset { background: transparent; border: 1px solid var(--line); }
</style>
