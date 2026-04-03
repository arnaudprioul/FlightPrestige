<template>
  <div class="settings">
    <header class="settings__header">
      <h1 class="settings__title">{{ t('nav.settings') }}</h1>
    </header>

    <section class="settings__section">
      <h2 class="settings__section-title">{{ t('settings.app') }}</h2>

      <div class="settings__row">
        <div class="settings__row-info">
          <span class="settings__row-label">{{ t('settings.launchAtStartup') }}</span>
          <span class="settings__row-desc">{{ t('settings.launchAtStartupDesc') }}</span>
        </div>
        <button
          class="settings__toggle"
          :class="{ 'settings__toggle--on': autoLaunchEnabled }"
          :aria-label="t('settings.launchAtStartup')"
          :disabled="autoLaunchLoading"
          data-cy="toggle-autolaunch"
          @click="toggleAutoLaunch"
        >
          <span class="settings__toggle-knob" />
        </button>
      </div>
    </section>

    <section class="settings__section">
      <h2 class="settings__section-title">{{ t('settings.notifications') }}</h2>

      <div class="settings__row">
        <div class="settings__row-info">
          <span class="settings__row-label">{{ t('settings.emailNotifications') }}</span>
          <span class="settings__row-desc">{{ user?.email }}</span>
        </div>
        <button
          class="settings__toggle"
          :class="{ 'settings__toggle--on': user?.notifyEmail }"
          :aria-label="t('settings.emailNotifications')"
          data-cy="toggle-email"
          @click="updateNotification('notifyEmail', !user?.notifyEmail)"
        >
          <span class="settings__toggle-knob" />
        </button>
      </div>

      <div class="settings__row">
        <div class="settings__row-info">
          <span class="settings__row-label">{{ t('settings.smsNotifications') }}</span>
          <span class="settings__row-desc">{{ user?.phone ?? t('settings.noPhone') }}</span>
        </div>
        <button
          class="settings__toggle"
          :class="{ 'settings__toggle--on': user?.notifySms }"
          :aria-label="t('settings.smsNotifications')"
          data-cy="toggle-sms"
          @click="updateNotification('notifySms', !user?.notifySms)"
        >
          <span class="settings__toggle-knob" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const userStore = useUserStore()
const userService = useUserService()

const user = computed(() => userStore.user)

// Auto-launch (Tauri only)
const autoLaunchEnabled = ref(false)
const autoLaunchLoading = ref(false)
const isTauri = ref(false)

onMounted(async () => {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    isTauri.value = true
    try {
      const { isEnabled } = await import('@tauri-apps/plugin-autostart')
      autoLaunchEnabled.value = await isEnabled()
    } catch {
      // not in Tauri context
    }
  }
})

async function toggleAutoLaunch() {
  if (!isTauri.value || autoLaunchLoading.value) return
  autoLaunchLoading.value = true
  try {
    const { enable, disable } = await import('@tauri-apps/plugin-autostart')
    if (autoLaunchEnabled.value) {
      await disable()
      autoLaunchEnabled.value = false
    } else {
      await enable()
      autoLaunchEnabled.value = true
    }
  } finally {
    autoLaunchLoading.value = false
  }
}

async function updateNotification(key: 'notifyEmail' | 'notifySms', value: boolean) {
  const updated = await userService.updateMe({ [key]: value })
  if (updated) userStore.user = updated
}
</script>

<style scoped>
.settings {
  padding: 32px;
  max-width: 640px;
  margin: 0 auto;
}

.settings__header {
  margin-bottom: 40px;
}

.settings__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
}

.settings__section {
  margin-bottom: 40px;
}

.settings__section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
}

.settings__row-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.settings__row-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.settings__row-desc {
  font-size: 12px;
  color: var(--text-muted);
}

/* Toggle switch */
.settings__toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  flex-shrink: 0;
  transition: background-color var(--duration) var(--ease-out),
              border-color var(--duration) var(--ease-out);
  cursor: pointer;
}

.settings__toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.settings__toggle--on {
  background-color: var(--accent);
  border-color: var(--accent);
}

.settings__toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--text-muted);
  transition: transform var(--duration) var(--ease-out),
              background-color var(--duration) var(--ease-out);
}

.settings__toggle--on .settings__toggle-knob {
  transform: translateX(20px);
  background-color: #fff;
}
</style>
