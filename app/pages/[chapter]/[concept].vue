<script setup lang="ts">
import { findConcept } from '~/data/curriculum'

const route = useRoute()
const found = computed(() => findConcept(route.params.chapter as string, route.params.concept as string))
if (!found.value) {
  throw createError({ statusCode: 404, statusMessage: 'Concept not found', fatal: true })
}
const { view } = useConceptView()

useHead(() => ({ title: `${found.value?.concept.title} — AIViz` }))
</script>

<template>
  <div v-if="found" class="concept-page" :class="`view-${view}`">
    <template v-if="view === 'visualize'">
      <section class="center" aria-label="Visualization">
        <ConceptStage :concept="found.concept" />
        <PlayerBar :disabled="found.concept.status !== 'ready'" />
      </section>
      <ConceptPanel class="panel" :concept="found.concept" />
    </template>

    <ExplainView
      v-else
      :chapter="found.chapter"
      :concept="found.concept"
      :index="found.index"
      :prev="found.prev"
      :next="found.next"
    />
  </div>
</template>

<style scoped>
.concept-page { height: 100%; display: grid; grid-template-columns: 1fr var(--panel-w); min-height: 0; }
.concept-page.view-explain { grid-template-columns: 1fr; }
.center { display: grid; grid-template-rows: 1fr auto; min-width: 0; min-height: 0; }

@media (max-width: 1100px) {
  .concept-page { grid-template-columns: 1fr; height: auto; }
  .center { min-height: 72vh; }
}
</style>
