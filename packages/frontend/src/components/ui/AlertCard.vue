<template>
  <article class="alert-card" :class="`alert-card--${alert.level.toLowerCase()}`">
    <header class="alert-card__header">
      <span class="alert-card__badge" :data-level="alert.level">
        {{ t(`alert.level.${alert.level}`) }}
      </span>
      <span class="alert-card__route">
        {{ route?.origin }} → {{ route?.destination }}
      </span>
    </header>

    <div class="alert-card__prices">
      <div class="alert-card__price-block">
        <span class="alert-card__price-label">{{ t('alert.business') }}</span>
        <span class="alert-card__price-value alert-card__price-value--highlight">
          {{ formatPrice(alert.price?.price, alert.price?.currency) }}
        </span>
      </div>
      <div class="alert-card__price-block">
        <span class="alert-card__price-label">{{ t('alert.economy') }}</span>
        <span class="alert-card__price-value">
          {{ formatPrice(baseline, alert.price?.currency) }}
        </span>
      </div>
    </div>

    <footer class="alert-card__footer">
      <span class="alert-card__score">Score {{ Math.round(alert.score * 100) }}%</span>
      <span class="alert-card__time">{{ formatDate(alert.createdAt as string) }}</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { IAlert, IRoute } from '@flightprestige/shared'

interface IAlertCardProps {
  alert: IAlert
  route?: IRoute
  baseline?: number
}

defineProps<IAlertCardProps>()
const { t } = useI18n()

function formatPrice(amount: number | undefined, currency: string | undefined): string {
  if (amount == null || !currency) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}
</script>

<style scoped>
.alert-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow var(--duration) var(--ease-out);
}

.alert-card:hover { box-shadow: var(--shadow-md); }
.alert-card--insane { border-color: rgba(234, 88, 12, 0.25); }
.alert-card--good { border-color: rgba(245, 158, 11, 0.2); }

.alert-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.alert-card__badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.alert-card__badge[data-level='INSANE'] { background-color: var(--badge-insane-bg); color: var(--badge-insane-text); }
.alert-card__badge[data-level='GOOD'] { background-color: var(--badge-good-bg); color: var(--badge-good-text); }

.alert-card__route {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.alert-card__prices { display: flex; gap: 24px; }
.alert-card__price-block { display: flex; flex-direction: column; gap: 2px; }

.alert-card__price-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.alert-card__price-value {
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.alert-card__price-value--highlight { color: var(--accent); }

.alert-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.alert-card__score,
.alert-card__time { font-size: 12px; color: var(--text-muted); }
</style>
