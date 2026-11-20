<script setup lang="ts">
import { hueVar, type LogEntry } from '~/types/concept'

/** Numbered calculation log. Newest line is highlighted and kept in view. */
const props = defineProps<{ entries: LogEntry[] }>()

const body = ref<HTMLElement>()
watch(
  () => props.entries.length,
  async () => {
    await nextTick()
    if (body.value) body.value.scrollTop = body.value.scrollHeight
  },
)
</script>

<template>
  <div ref="body" class="log-body" aria-live="polite">
    <p v-if="!entries.length" class="empty">Each step writes its calculation here.</p>
    <div v-for="(e, i) in entries" :key="i" class="line" :class="{ newest: i === entries.length - 1 }">
      <span class="n">{{ String(e.step).padStart(2, '0') }}</span>
      <span>
        <span v-for="(s, j) in e.segments" :key="j" :style="s.hue ? { color: hueVar(s.hue) } : undefined">{{ s.text }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.log-body { overflow-y: auto; min-height: 0; font: 11.5px/1.75 var(--font-mono); color: var(--text-dim); }
.line { display: flex; gap: 10px; }
.line.newest { color: var(--text); }
.n { color: var(--text-faint); flex: none; }
.empty { font: 13px var(--font-sans); color: var(--text-faint); }
</style>
