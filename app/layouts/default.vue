<script setup lang="ts">
const { open, docked, drawer, narrow, init: initSidebar, close } = useSidebar()
const { init: initTheme } = useTheme()

onMounted(() => {
  initTheme()
  initSidebar()
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="shell" :class="{ 'sidebar-docked': docked, 'drawer-open': drawer }">
    <AppTopbar class="shell-top" />
    <aside class="shell-side" :inert="(narrow && !open) || (!narrow && !docked) || undefined">
      <CurriculumSidebar />
    </aside>
    <div v-if="drawer" class="backdrop" aria-hidden="true" @click="close" />
    <main class="shell-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 0 1fr;
  grid-template-rows: var(--topbar-h) 1fr;
  height: 100vh;
  height: 100dvh;
}
.shell.sidebar-docked { grid-template-columns: var(--sidebar-w) 1fr; }
.shell-top { grid-column: 1 / -1; }
.shell-side { overflow: hidden; border-right: 1px solid var(--line); min-height: 0; }
.shell:not(.sidebar-docked) .shell-side { visibility: hidden; border-right: 0; }
.shell-main { min-width: 0; min-height: 0; overflow: hidden; }
.backdrop { display: none; }

/* Narrow screens: the sidebar becomes an overlay drawer. */
@media (max-width: 1100px) {
  .shell, .shell.sidebar-docked { grid-template-columns: 1fr; }
  .shell-main { grid-column: 1; overflow: auto; }
  .shell .shell-side, .shell:not(.sidebar-docked) .shell-side {
    position: fixed; z-index: 40; top: var(--topbar-h); bottom: 0; left: 0; width: min(300px, 86vw);
    border-right: 1px solid var(--line);
    box-shadow: var(--shadow-md);
    visibility: hidden;
    transform: translateX(-100%);
    transition: transform 260ms var(--ease-out), visibility 0ms linear 260ms;
  }
  .shell.drawer-open .shell-side { visibility: visible; transform: none; transition: transform 260ms var(--ease-out); }
  .backdrop {
    display: block; position: fixed; z-index: 30; inset: var(--topbar-h) 0 0 0; background: rgba(10, 12, 16, 0.32);
  }
}
</style>
