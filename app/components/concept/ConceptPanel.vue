<script setup lang="ts">
import type { Concept } from '~/data/curriculum'

/**
 * Right-hand panel: Inputs, Values and Log. Phase 2–3 generates the inputs
 * from the concept's `params` schema and streams values and log lines from
 * the running timeline. For now each card shows its empty state.
 */
defineProps<{ concept: Concept }>()
</script>

<template>
  <aside class="panel" aria-label="Controls">
    <section class="card">
      <h2 class="card-title">Inputs</h2>
      <p class="empty">Inputs for this concept will appear here.</p>
    </section>
    <section class="card">
      <h2 class="card-title">Values</h2>
      <p class="empty">Live values update as the animation plays.</p>
    </section>
    <section class="card log">
      <h2 class="card-title">Log <span>0 entries</span></h2>
      <div class="log-body" aria-live="polite">
        <p class="empty">Each step writes its calculation here.</p>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.panel {
  display: grid; grid-template-rows: auto auto minmax(150px, 1fr); gap: 12px; padding: 14px;
  min-height: 0; overflow-y: auto; border-left: 1px solid var(--line); background: var(--surface);
}
.card { background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 14px; }
.card-title { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; font-weight: 600; color: var(--text-dim); }
.card-title span { font-weight: 400; color: var(--text-faint); }
.empty { font-size: 13px; color: var(--text-faint); }
.log { display: flex; flex-direction: column; min-height: 0; }
.log-body { overflow-y: auto; font: 11.5px/1.75 var(--font-mono); }

@media (max-width: 1100px) {
  .panel { border-left: 0; border-top: 1px solid var(--line); grid-template-rows: auto; }
}
</style>
