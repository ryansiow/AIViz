<script setup lang="ts">
/** A display equation in a soft card. */
defineProps<{ tex: string }>()
</script>

<template>
  <div class="formula"><Tex :expr="tex" display tag="div" /></div>
</template>

<style scoped>
.formula {
  margin: 18px 0; padding: 6px 16px; border-radius: 10px;
  background: var(--surface); border: 1px solid var(--line); color: var(--text); overflow-x: auto;
}
.formula :deep(.katex-display) { margin: 0.6em 0; }
</style>
