<template>
  <div class="app-shell" :class="{ 'app-shell--fullscreen': isFullscreen }">
    <AppSidebar v-if="!isFullscreen" />
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const route = useRoute()
const isFullscreen = computed(() => !!route.meta.fullscreen)
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-deep);
}

.app-shell--fullscreen {
  flex-direction: column;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}
</style>
