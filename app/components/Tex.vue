<script setup lang="ts">
import katex from 'katex'

/** Renders a LaTeX string with KaTeX. Works during SSR, so maths is in the HTML. */
const props = withDefaults(defineProps<{ expr: string; display?: boolean; tag?: string }>(), {
  display: false,
  tag: 'span',
})

const html = computed(() => {
  try {
    return katex.renderToString(props.expr, { displayMode: props.display, throwOnError: false })
  } catch {
    return props.expr
  }
})
</script>

<template>
  <component :is="tag" v-html="html" />
</template>
