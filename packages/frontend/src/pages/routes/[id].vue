<template>
  <div class="route-detail">
    <header class="route-detail__header">
      <NuxtLink to="/dashboard" class="route-detail__back">← Back</NuxtLink>
      <div v-if="route" class="route-detail__title-row">
        <h1 class="route-detail__title">{{ route.origin }} → {{ route.destination }}</h1>
        <span
          class="route-detail__status"
          :class="route.active ? 'route-detail__status--active' : 'route-detail__status--inactive'"
        >
          {{ route.active ? t('common.active') : t('common.inactive') }}
        </span>
      </div>
    </header>

    <div v-if="pending" class="route-detail__state">{{ t('common.loading') }}</div>

    <template v-else-if="route">
      <section v-if="pricesStore.baseline" class="route-detail__section">
        <h2 class="route-detail__section-title">{{ t('routeDetail.baseline') }}</h2>
        <div class="route-detail__baseline">
          <div v-for="(val, key) in baselineStats" :key="key" class="route-detail__stat">
            <span class="route-detail__stat-label">{{ key }}</span>
            <span class="route-detail__stat-value">{{ val }}</span>
          </div>
        </div>
      </section>

      <section class="route-detail__section">
        <h2 class="route-detail__section-title">{{ t('routeDetail.alerts') }}</h2>
        <div v-if="alertsStore.alerts.length === 0" class="route-detail__state">
          {{ t('dashboard.noAlerts') }}
        </div>
        <div v-else class="route-detail__alerts">
          <AlertCard
            v-for="alert in alertsStore.alerts"
            :key="alert.id"
            :alert="alert"
            :route="route"
            :baseline="pricesStore.baseline?.economyAvg30d"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { IRoute } from '@flightprestige/shared'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const route = useRoute()
const routeId = computed(() => route.params.id as string)

const routesStore = useRoutesStore()
const pricesStore = usePricesStore()
const alertsStore = useAlertsStore()

const { pending } = await useAsyncData(
  `route-detail-${routeId.value}`,
  async () => {
    await Promise.all([
      routesStore.fetchRoutes(),
      pricesStore.fetchPricesForRoute(routeId.value),
      alertsStore.fetchAlertsForRoute(routeId.value),
    ])
    return true
  },
)

const currentRoute = computed((): IRoute | undefined =>
  routesStore.routes.find((r) => r.id === routeId.value),
)

const baselineStats = computed(() => {
  const b = pricesStore.baseline
  if (!b) return {}
  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: b.currency }).format(v)
  return { Avg: fmt(b.economyAvg30d), P25: fmt(b.economyP25), P50: fmt(b.economyP50), P75: fmt(b.economyP75) }
})
</script>

<style scoped>
.route-detail {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.route-detail__header { margin-bottom: 32px; }

.route-detail__back {
  display: inline-block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.route-detail__back:hover { color: var(--text-primary); }

.route-detail__title-row { display: flex; align-items: center; gap: 16px; }

.route-detail__title {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.route-detail__status {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.route-detail__status--active { background-color: rgba(34, 197, 94, 0.12); color: var(--accent-green); }
.route-detail__status--inactive { background-color: rgba(255, 255, 255, 0.05); color: var(--text-muted); }

.route-detail__section { margin-bottom: 36px; }

.route-detail__section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
}

.route-detail__baseline {
  display: flex;
  gap: 24px;
  padding: 20px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.route-detail__stat { display: flex; flex-direction: column; gap: 4px; }

.route-detail__stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.route-detail__stat-value {
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
}

.route-detail__alerts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.route-detail__state {
  color: var(--text-muted);
  font-size: 14px;
  padding: 24px;
  text-align: center;
  background-color: var(--bg-elevated);
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
}
</style>
