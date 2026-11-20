<script setup lang="ts">
import { renderInlineTex } from '~/utils/math'

/** Narration for the current step. Text may contain inline maths in $…$. */
const props = defineProps<{ step: number; total: number; text: string }>()
const html = computed(() => renderInlineTex(props.text))
</script>

<template>
  <div class="caption" role="status">
    <span class="n">{{ step }} / {{ total }}</span>
    <span v-html="html" />
  </div>
</template>

<style scoped>
.caption {
  position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%);
  max-width: min(560px, 88%); padding: 9px 16px; border-radius: var(--radius-lg);
  background: var(--bg); border: 1px solid var(--line); box-shadow: var(--shadow-md);
  font-size: 13.5px; text-align: center; color: var(--text);
}
.n {
  display: inline-block; margin-right: 8px; padding: 1px 7px; border-radius: 999px;
  background: var(--surface-2); font-size: 11px; font-weight: 600; color: var(--text-dim);
}
</style>
