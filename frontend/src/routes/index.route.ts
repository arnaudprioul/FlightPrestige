import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/dashboard.vue'),
  },
  {
    path: '/routes/add',
    name: 'add-route',
    component: () => import('@/pages/add-route.vue'),
  },
  {
    path: '/routes/:id',
    name: 'route-detail',
    component: () => import('@/pages/route-detail.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
