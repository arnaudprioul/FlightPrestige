<template>
  <div class="login">
    <div class="login__card">
      <div class="login__logo">
        <span class="login__logo-icon">✈</span>
        <span class="login__logo-text">FlightPrestige</span>
      </div>

      <form class="login__form" @submit.prevent="handleSubmit">
        <div class="login__field">
          <label class="login__label" for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="login__input"
            placeholder="you@example.com"
            required
            data-cy="input-email"
          />
        </div>

        <div class="login__field">
          <label class="login__label" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="login__input"
            placeholder="••••••••"
            required
            data-cy="input-password"
          />
        </div>

        <div v-if="error" class="login__error">{{ error }}</div>

        <button type="submit" class="login__submit" :disabled="isLoading" data-cy="btn-login">
          {{ isLoading ? t('common.loading') : 'Sign in' }}
        </button>
      </form>

      <p class="login__footer">
        No account?
        <NuxtLink to="/auth/register">Register</NuxtLink>
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
    const user = await authService.login(form.value.email, form.value.password)
    userStore.user = user
    await router.push('/dashboard')
  } catch {
    error.value = 'Invalid email or password'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login__card {
  width: 100%;
  max-width: 400px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px;
}

.login__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.login__logo-icon { font-size: 22px; color: var(--accent); }

.login__logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.login__form { display: flex; flex-direction: column; gap: 18px; }

.login__field { display: flex; flex-direction: column; gap: 6px; }

.login__label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }

.login__input {
  padding: 10px 14px;
  background-color: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--duration) var(--ease-out);
}

.login__input:focus { border-color: var(--border-focus); }

.login__error {
  padding: 10px 14px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  color: var(--accent-red);
  font-size: 13px;
}

.login__submit {
  padding: 12px;
  background-color: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  transition: background-color var(--duration) var(--ease-out);
}

.login__submit:hover:not(:disabled) { background-color: var(--accent-hover); }
.login__submit:disabled { opacity: 0.5; cursor: not-allowed; }

.login__footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
