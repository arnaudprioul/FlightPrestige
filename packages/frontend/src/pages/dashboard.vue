<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <div>
        <h1 class="dashboard__title">{{ t('dashboard.title') }}</h1>
        <p class="dashboard__subtitle">{{ t('dashboard.subtitle') }}</p>
      </div>
    </header>

    <section class="dashboard__section">
      <h2 class="dashboard__section-title">{{ t('routeDetail.alerts') }}</h2>
      <div v-if="alertsStore.isLoading" class="dashboard__state">{{ t('common.loading') }}</div>
      <div v-else-if="alertsStore.alerts.length === 0" class="dashboard__state">
        {{ t('dashboard.noAlerts') }}
      </div>
      <div v-else class="dashboard__grid">
        <AlertCard
          v-for="alert in alertsStore.alerts"
          :key="alert.id"
          :alert="alert"
          :route="getRoute(alert.routeId)"
        />
      </div>
    </section>

    <section class="dashboard__section">
      <h2 class="dashboard__section-title">{{ t('nav.dashboard') }}</h2>
      <div v-if="routesStore.isLoading" class="dashboard__state">{{ t('common.loading') }}</div>
      <div v-else-if="routesStore.routes.length === 0" class="dashboard__state">
        {{ t('dashboard.noRoutes') }}
      </div>
      <div v-else class="dashboard__grid">
        <NuxtLink
          v-for="route in routesStore.routes"
          :key="route.id"
          :to="`/routes/${route.id}`"
          class="dashboard__route-link"
        >
          <RouteCard :route="route" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { IRoute } from '@flightprestige/shared'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const alertsStore = useAlertsStore()
const routesStore = useRoutesStore()

function getRoute(routeId: string): IRoute | undefined {
  return routesStore.routes.find((r) => r.id === routeId)
}

await Promise.all([alertsStore.fetchAlerts(), routesStore.fetchRoutes()])
</script>

<style scoped>
.dashboard {
  padding: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.dashboard__header {
  margin-bottom: 40px;
}

.dashboard__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
}

.dashboard__subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.dashboard__section {
  margin-bottom: 40px;
}

.dashboard__section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.dashboard__route-link {
  text-decoration: none;
}

.dashboard__state {
  padding: 24px;
  background-color: var(--bg-elevated);
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
