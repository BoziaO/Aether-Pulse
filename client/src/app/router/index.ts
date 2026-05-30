import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/join/:code?',
      component: () => import('@/views/JoinView.vue'),
    },
    {
      path: '/',
      component: () => import('@/app/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'room/:roomId', name: 'room', component: () => import('@/views/RoomView.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!auth.user) {
      await auth.fetchMe()
    }
    if (!auth.user) {
      return '/auth'
    }
  }
  if (to.path === '/auth') {
    if (!auth.user) await auth.fetchMe()
    if (auth.user) return '/'
  }

  return true
})
