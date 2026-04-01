<template>
  <aside class="sidebar">
    <div class="sidebar__logo">
      <span class="sidebar__logo-icon">✈</span>
      <span class="sidebar__logo-text">FlightPrestige</span>
    </div>

    <nav class="sidebar__nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="sidebar__nav-item"
        :aria-label="item.label"
      >
        <span class="sidebar__nav-icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="sidebar__nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar__footer">
      <RouterLink to="/routes/add" class="sidebar__add-btn" :aria-label="t('nav.addRoute')">
        <span aria-hidden="true">+</span> {{ t('nav.addRoute') }}
      </RouterLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const navItems = [
  { name: 'dashboard', path: '/dashboard', icon: '◈', label: t('nav.dashboard') },
]
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--bg-elevated);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar__logo-icon {
  font-size: 20px;
  color: var(--accent);
}

.sidebar__logo-text {
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.sidebar__nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  transition: background-color var(--duration) var(--ease-out),
              color var(--duration) var(--ease-out);
  text-decoration: none;
}

.sidebar__nav-item:hover {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

.sidebar__nav-item.router-link-active {
  background-color: rgba(20, 184, 166, 0.1);
  color: var(--accent);
}

.sidebar__nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.sidebar__footer {
  padding: 12px 8px;
  border-top: 1px solid var(--border);
}

.sidebar__add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background-color: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color var(--duration) var(--ease-out);
}

.sidebar__add-btn:hover {
  background-color: var(--accent-hover);
}
</style>
