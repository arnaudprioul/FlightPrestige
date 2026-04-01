<template>
  <div class="add-route">
    <header class="add-route__header">
      <RouterLink to="/dashboard" class="add-route__back" aria-label="Back to dashboard">
        ← Back
      </RouterLink>
      <h1 class="add-route__title">{{ t('addRoute.title') }}</h1>
    </header>

    <form class="add-route__form" @submit.prevent="handleSubmit">
      <div class="add-route__field">
        <label class="add-route__label" for="origin">{{ t('addRoute.origin') }}</label>
        <input
          id="origin"
          v-model="form.origin"
          class="add-route__input"
          :placeholder="t('addRoute.placeholder.origin')"
          maxlength="3"
          required
          data-cy="input-origin"
        />
      </div>

      <div class="add-route__field">
        <label class="add-route__label" for="destination">{{ t('addRoute.destination') }}</label>
        <input
          id="destination"
          v-model="form.destination"
          class="add-route__input"
          :placeholder="t('addRoute.placeholder.destination')"
          maxlength="3"
          required
          data-cy="input-destination"
        />
      </div>

      <div class="add-route__checkbox">
        <input
          id="flexible"
          v-model="form.flexibleDates"
          type="checkbox"
          data-cy="checkbox-flexible"
        />
        <label for="flexible">{{ t('addRoute.flexibleDates') }}</label>
      </div>

      <div v-if="error" class="add-route__error">{{ error }}</div>

      <button
        type="submit"
        class="add-route__submit"
        :disabled="isSubmitting"
        data-cy="btn-submit"
      >
        {{ isSubmitting ? t('common.loading') : t('addRoute.submit') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRoutesStore } from '@/stores/routes.store'

const { t } = useI18n()
const router = useRouter()
const routesStore = useRoutesStore()

const form = ref({
  origin: '',
  destination: '',
  flexibleDates: false,
})
const isSubmitting = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  isSubmitting.value = true
  error.value = null

  const payload = {
    origin: form.value.origin.toUpperCase().trim(),
    destination: form.value.destination.toUpperCase().trim(),
    flexibleDates: form.value.flexibleDates,
  }

  const route = await routesStore.createRoute(payload)
  if (route) {
    router.push(`/routes/${route.id}`)
  } else {
    error.value = routesStore.error ?? t('common.error')
  }

  isSubmitting.value = false
}
</script>

<style scoped>
.add-route {
  padding: 32px;
  max-width: 480px;
  margin: 0 auto;
}

.add-route__header {
  margin-bottom: 32px;
}

.add-route__back {
  display: inline-block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.add-route__back:hover {
  color: var(--text-primary);
}

.add-route__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.add-route__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.add-route__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.add-route__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.add-route__input {
  padding: 10px 14px;
  background-color: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  outline: none;
  transition: border-color var(--duration) var(--ease-out);
}

.add-route__input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
}

.add-route__input:focus {
  border-color: var(--border-focus);
}

.add-route__checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.add-route__checkbox input {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.add-route__error {
  padding: 10px 14px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: var(--accent-red);
  font-size: 13px;
}

.add-route__submit {
  padding: 12px 24px;
  background-color: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  transition: background-color var(--duration) var(--ease-out);
}

.add-route__submit:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.add-route__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
