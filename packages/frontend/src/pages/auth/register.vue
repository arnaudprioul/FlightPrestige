<template>
  <div class="register">
    <div class="register__card">
      <div class="register__logo">
        <span class="register__logo-icon">✈</span>
        <span class="register__logo-text">FlightPrestige</span>
      </div>

      <form class="register__form" @submit.prevent="handleSubmit">
        <div class="register__field">
          <label class="register__label" for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="register__input"
            placeholder="you@example.com"
            required
            data-cy="input-email"
          />
        </div>

        <div class="register__field">
          <label class="register__label" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="register__input"
            placeholder="••••••••"
            minlength="8"
            required
            data-cy="input-password"
          />
        </div>

        <div v-if="error" class="register__error">{{ error }}</div>

        <button type="submit" class="register__submit" :disabled="isLoading" data-cy="btn-register">
          {{ isLoading ? t('common.loading') : 'Create account' }}
        </button>
      </form>

      <p class="register__footer">
        Already have an account?
        <NuxtLink to="/auth/login">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const authService = useAuthService()

const form = ref({ email: '', password: '' })
const isLoading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  isLoading.value = true
  error.value = null
  try {
    const user = await authService.register(form.value.email, form.value.password)
    userStore.user = user
    await router.push('/dashboard')
  } catch {
    error.value = 'Registration failed. Email may already be in use.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.register__card {
  width: 100%;
  max-width: 400px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px;
}

.register__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.register__logo-icon { font-size: 22px; color: var(--accent); }

.register__logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.register__form { display: flex; flex-direction: column; gap: 18px; }
.register__field { display: flex; flex-direction: column; gap: 6px; }
.register__label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }

.register__input {
  padding: 10px 14px;
  background-color: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--duration) var(--ease-out);
}

.register__input:focus { border-color: var(--border-focus); }

.register__error {
  padding: 10px 14px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: var(--accent-red);
  font-size: 13px;
}

.register__submit {
  padding: 12px;
  background-color: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  transition: background-color var(--duration) var(--ease-out);
}

.register__submit:hover:not(:disabled) { background-color: var(--accent-hover); }
.register__submit:disabled { opacity: 0.5; cursor: not-allowed; }

.register__footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
