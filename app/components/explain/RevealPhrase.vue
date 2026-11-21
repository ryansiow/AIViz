<script setup lang="ts">
/**
 * A hidden answer inside Explain text. Click (or Enter/Space) reveals it.
 * Content is the slot, or a LaTeX expression via `tex`.
 */
defineProps<{ tex?: string }>()
const revealed = ref(false)
</script>

<template>
  <span
    class="reveal"
    :class="{ on: revealed }"
    :role="revealed ? undefined : 'button'"
    :tabindex="revealed ? undefined : 0"
    :aria-label="revealed ? undefined : 'Hidden answer. Press to reveal.'"
    @click="revealed = true"
    @keydown.enter.prevent="revealed = true"
    @keydown.space.prevent="revealed = true"
  >
    <span :aria-hidden="!revealed"><Tex v-if="tex" :expr="tex" /><slot v-else /></span>
  </span>
</template>

<style scoped>
/* inline-block: one solid hit box, even over KaTeX's nested inline boxes */
.reveal {
  display: inline-block; max-width: 100%; line-height: inherit; text-indent: 0;
  cursor: pointer; padding: 0 4px; border-radius: 4px; background: var(--surface-2); color: transparent;
  transition: color var(--dur-ui) ease, background-color var(--dur-ui) ease;
}
.reveal :deep(.katex) { color: inherit; }
.reveal.on { background: var(--c-green-soft); color: var(--c-green); cursor: default; }
@media (hover: hover) and (pointer: fine) { .reveal:not(.on):hover { background: var(--line-strong); } }
</style>
