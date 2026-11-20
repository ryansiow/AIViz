<script setup lang="ts">
import { curriculum } from '~/data/curriculum'

const route = useRoute()
const { close } = useSidebar()

const query = ref('')
const currentChapter = computed(() => route.params.chapter as string | undefined)
const currentConcept = computed(() => route.params.concept as string | undefined)

// Chapters start collapsed except the one you are in (or all, on the home page).
const expanded = ref(new Set<string>(currentChapter.value ? [currentChapter.value] : curriculum.map((c) => c.slug)))
watch(currentChapter, (slug) => {
  if (slug) expanded.value.add(slug)
})

function toggleChapter(slug: string) {
  const next = new Set(expanded.value)
  next.has(slug) ? next.delete(slug) : next.add(slug)
  expanded.value = next
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return curriculum
  return curriculum
    .map((ch) => ({ ...ch, concepts: ch.concepts.filter((c) => c.title.toLowerCase().includes(q)) }))
    .filter((ch) => ch.concepts.length > 0)
})

function isOpen(slug: string) {
  return query.value.trim() !== '' || expanded.value.has(slug)
}

// On narrow screens the sidebar is an overlay: close it after navigating.
function onNavigate() {
  if (window.matchMedia('(max-width: 1100px)').matches) close()
}
</script>

<template>
  <nav id="curriculum" class="sidebar" aria-label="Curriculum">
    <label class="sr-only" for="concept-search">Search concepts</label>
    <input id="concept-search" v-model="query" class="search" type="search" placeholder="Search concepts" />

    <div v-for="chapter in filtered" :key="chapter.slug" class="chapter">
      <button
        class="chapter-head"
        :aria-expanded="isOpen(chapter.slug)"
        @click="toggleChapter(chapter.slug)"
      >
        <span>{{ chapter.title }}</span>
        <svg class="chev" :class="{ open: isOpen(chapter.slug) }" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <ul v-show="isOpen(chapter.slug)">
        <li v-for="concept in chapter.concepts" :key="concept.slug">
          <NuxtLink
            :to="`/${chapter.slug}/${concept.slug}`"
            class="concept"
            :class="{ active: currentChapter === chapter.slug && currentConcept === concept.slug }"
            :aria-current="currentChapter === chapter.slug && currentConcept === concept.slug ? 'page' : undefined"
            @click="onNavigate"
          >
            <span class="dot" :class="concept.status" aria-hidden="true" />
            <span class="label">{{ concept.title }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <p v-if="filtered.length === 0" class="empty">No concepts match “{{ query }}”.</p>
  </nav>
</template>

<style scoped>
.sidebar { height: 100%; overflow-y: auto; padding: 14px 10px 24px; background: var(--bg); }
.search {
  width: 100%; margin-bottom: 14px; padding: 8px 10px; border-radius: var(--radius);
  border: 1px solid var(--line); background: var(--surface); font-size: 13px; outline: none;
  transition: border-color var(--dur-fast) ease;
}
.search:focus-visible { border-color: var(--brand); outline: none; }
.chapter { margin-bottom: 8px; }
ul { list-style: none; }
.chapter-head {
  display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 8px 4px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-faint);
}
.chev { width: 12px; height: 12px; transition: transform var(--dur-ui) var(--ease-out); }
.chev.open { transform: rotate(90deg); }
.concept {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 8px; border-radius: var(--radius);
  font-size: 13px; color: var(--text-dim);
  transition: background-color var(--dur-fast) ease, color var(--dur-fast) ease;
}
@media (hover: hover) and (pointer: fine) { .concept:hover { background: var(--surface); color: var(--text); } }
.concept.active { background: var(--c-blue-soft); color: var(--c-blue); font-weight: 500; }
.label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dot { width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid var(--line-strong); flex: none; }
.dot.ready { background: var(--c-green); border-color: var(--c-green); }
.empty { padding: 8px; font-size: 13px; color: var(--text-faint); }
</style>
