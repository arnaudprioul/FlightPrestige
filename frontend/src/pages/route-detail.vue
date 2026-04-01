<template>
  <div class="route-detail">
    <header class="route-detail__header">
      <RouterLink to="/dashboard" class="route-detail__back">← Back</RouterLink>
      <div v-if="route" class="route-detail__title-row">
        <h1 class="route-detail__title">
          {{ route.origin }} → {{ route.destination }}
        </h1>
        <span
          class="route-detail__status"
          :class="route.active ? 'route-detail__status--active' : 'route-detail__status--inactive'"
        >
          {{ route.active ? t('common.active') : t('common.inactive') }}
        </span>
      </div>
    </header>

    <div v-if="isLoading" class="route-detail__loading">{{ t('common.loading') }}</div>

    <template v-else-if="route">
      <!-- Baseline -->
      <section class="route-detail__section" v-if="pricesStore.baseline">
        <h2 class="route-detail__section-title">{{ t('routeDetail.baseline') }}</h2>
        <div class="route-detail__baseline">
          <div class="route-detail__stat">
            <span class="route-detail__stat-label">Avg</span>
            <span class="route-detail__stat-value">
              {{ formatPrice(pricesStore.baseline.economyAvg30d, pricesStore.baseline.currency) }}
            </span>
          </div>
          <div class="route-detail__stat">
            <span class="route-detail__stat-label">P25</span>
            <span class="route-detail__stat-value">
              {{ formatPrice(pricesStore.baseline.economyP25, pricesStore.baseline.currency) }}
            </span>
          </div>
          <div class="route-detail__stat">
            <span class="route-detail__stat-label">P50</span>
            <span class="route-detail__stat-value">
              {{ formatPrice(pricesStore.baseline.economyP50, pricesStore.baseline.currency) }}
            </span>
          </div>
          <div class="route-detail__stat">
            <span class="route-detail__stat-label">P75</span>
            <span class="route-detail__stat-value">
              {{ formatPrice(pricesStore.baseline.economyP75, pricesStore.baseline.currency) }}
            </span>
          </div>
        </div>
      </section>

      <!-- Alerts -->
      <section class="route-detail__section">
        <h2 class="route-detail__section-title">{{ t('routeDetail.alerts') }}</h2>
        <div v-if="alertsStore.alerts.length === 0" class="route-detail__empty">
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
import { ref, computed, onMounted } from 'vue'
import { useRoute as useVueRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRoutesStore } from '@/stores/routes.store'
import { usePricesStore } from '@/stores/prices.store'
import { useAlertsStore } from '@/stores/alerts.store'
import AlertCard from '@/components/ui/AlertCard.vue'

const vueRoute = useVueRoute()
const { t } = useI18n()
const routesStore = useRoutesStore()
const pricesStore = usePricesStore()
const alertsStore = useAlertsStore()

const isLoading = ref(true)
const routeId = computed(() => vueRoute.params.id as string)
const route = computed(() => routesStore.routes.find(r => r.id === routeId.value))

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

onMounted(async () => {
  await Promise.all([
    routesStore.fetchRoutes(),
    pricesStore.fetchPricesForRoute(routeId.value),
    alertsStore.fetchAlertsForRoute(routeId.value),
  ])
  isLoading.value = false
})
</script>

<style scoped>
.route-detail {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.route-detail__header {
  margin-bottom: 32px;
}

.route-detail__back {
  display: inline-block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.route-detail__back:hover {
  color: var(--text-primary);
}

.route-detail__title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

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

.route-detail__status--active {
  background-color: rgba(34, 197, 94, 0.12);
  color: var(--accent-green);
}

.route-detail__status--inactive {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.route-detail__section {
  margin-bottom: 36px;
}

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

.route-detail__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

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

.route-detail__empty,
.route-detail__loading {
  color: var(--text-muted);
  font-size: 14px;
  padding: 24px;
  text-align: center;
  background-color: var(--bg-elevated);
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
}
</style>
