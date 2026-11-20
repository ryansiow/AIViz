<template>
  <div class="hint" role="note">
    <span class="swatch" aria-hidden="true" />
    <span><slot>Some phrases are hidden. Try to answer first, then click one to reveal it.</slot></span>
  </div>
</template>

<style scoped>
.hint {
  display: flex; align-items: center; gap: 10px; margin: -6px 0 24px; padding: 9px 12px;
  border-radius: var(--radius); background: var(--surface); border: 1px solid var(--line);
  font-size: 13px; color: var(--text-dim);
}
.swatch { width: 26px; height: 12px; flex: none; border-radius: 3px; background: var(--surface-2); border: 1px solid var(--line-strong); }
</style>
