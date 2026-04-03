<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="app-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-deep);
}

.app-content {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}
</style>
