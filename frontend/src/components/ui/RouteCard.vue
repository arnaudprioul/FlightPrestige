<template>
  <article class="route-card" :class="{ 'route-card--inactive': !route.active }">
    <div class="route-card__route">
      <span class="route-card__iata">{{ route.origin }}</span>
      <span class="route-card__arrow" aria-hidden="true">→</span>
      <span class="route-card__iata">{{ route.destination }}</span>
    </div>

    <div class="route-card__meta">
      <span
        class="route-card__status"
        :class="route.active ? 'route-card__status--active' : 'route-card__status--inactive'"
      >
        {{ route.active ? t('common.active') : t('common.inactive') }}
      </span>
      <span v-if="route.flexibleDates" class="route-card__flexible">±3 days</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IRoute } from '@/types/route.type'

interface IRouteCardProps {
  route: IRoute
}

defineProps<IRouteCardProps>()
const { t } = useI18n()
</script>

<style scoped>
.route-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: border-color var(--duration) var(--ease-out),
              box-shadow var(--duration) var(--ease-out);
}

.route-card:hover {
  border-color: rgba(20, 184, 166, 0.3);
  box-shadow: var(--shadow-sm);
}

.route-card--inactive {
  opacity: 0.5;
}

.route-card__route {
  display: flex;
  align-items: center;
  gap: 10px;
}

.route-card__iata {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.route-card__arrow {
  color: var(--text-muted);
  font-size: 16px;
}

.route-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.route-card__status {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.route-card__status--active {
  background-color: rgba(34, 197, 94, 0.12);
  color: var(--accent-green);
}

.route-card__status--inactive {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.route-card__flexible {
  font-size: 11px;
  color: var(--text-muted);
  background-color: var(--bg-elevated);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}
</style>
