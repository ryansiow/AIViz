<script setup lang="ts">
import type { LogEntry, ParamSchema, Preset, Readout } from '~/types/concept'

/**
 * Right-hand panel: Inputs, Values and Log. Each card shows an empty state
 * until the concept provides data for it.
 */
const props = defineProps<{
  schema?: ParamSchema
  presets?: Preset[]
  readouts?: Readout[]
  formula?: string
  log?: LogEntry[]
}>()
const values = defineModel<Record<string, unknown>>('values')
const logCount = computed(() => props.log?.length ?? 0)
</script>

<template>
  <aside class="panel" aria-label="Controls">
    <section class="card">
      <h2 class="card-title">Inputs</h2>
      <ParamPanel v-if="schema && values" v-model="values" :schema="schema" :presets="presets" />
      <p v-else class="empty">Inputs for this concept will appear here.</p>
    </section>
    <section class="card">
      <h2 class="card-title">Values</h2>
      <ValueReadouts v-if="readouts?.length" :readouts="readouts" :formula="formula" />
      <p v-else class="empty">Live values update as the animation plays.</p>
    </section>
    <section class="card log">
      <h2 class="card-title">Log <span>{{ logCount }} {{ logCount === 1 ? 'entry' : 'entries' }}</span></h2>
      <LogFeed :entries="log ?? []" />
    </section>
  </aside>
</template>

<style scoped>
.panel {
  display: grid; grid-template-rows: auto auto minmax(150px, 1fr); gap: 12px; padding: 14px;
  min-height: 0; overflow-y: auto; border-left: 1px solid var(--line); background: var(--surface);
}
.card { background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 14px; }
.card-title { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; font-weight: 600; color: var(--text-dim); }
.card-title span { font-weight: 400; color: var(--text-faint); }
.empty { font-size: 13px; color: var(--text-faint); }
.log { display: flex; flex-direction: column; min-height: 0; }

@media (max-width: 1100px) {
  .panel { border-left: 0; border-top: 1px solid var(--line); grid-template-rows: auto; }
  .log :deep(.log-body) { max-height: 220px; }
}
</style>
