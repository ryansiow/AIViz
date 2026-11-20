<script setup lang="ts">
import { hueVar, type Hue } from '~/types/concept'

/** A coloured term that matches its colour in the diagram. Text slot or LaTeX. */
defineProps<{ hue: Hue; tex?: string }>()
</script>

<template>
  <span class="term" :style="{ color: hueVar(hue) }"><Tex v-if="tex" :expr="tex" /><slot v-else /></span>
</template>

<style scoped>
.term { font-weight: 500; }
</style>
