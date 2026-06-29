import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { TokenManager } from '@/services/auth.token-manager'

const isNative =
  !!(window as any).electronAPI ||
  (typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform())

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    isNative
      ? {
          path: '/',
          redirect: '/app',
        }
      : {
          path: '/',
          component: () => import('@/views/LandingView.vue'),
        },
    {
      path: '/auth',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/auth/forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
    },
    {
      path: '/auth/reset-password/:token',
      component: () => import('@/views/ResetPasswordView.vue'),
    },
    {
      path: '/auth/oauth/callback',
      component: () => import('@/views/OAuthCallbackView.vue'),
    },
    {
      path: '/join/:code?',
      component: () => import('@/views/JoinView.vue'),
    },
    {
      path: '/app',
      component: () => import('@/app/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'room/:roomId', name: 'room', component: () => import('@/views/RoomView.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
        { path: 'friends', name: 'friends', component: () => import('@/views/FriendsView.vue') },
        { path: 'dm/:userId', name: 'dm', component: () => import('@/views/DmView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

let authInitialized = false

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.path === '/auth') {
    if (!auth.user && TokenManager.getAccessToken()) {
      await auth.fetchMe()
    }
    if (auth.user) return '/app'
    return true
  }

  if (to.meta.requiresAuth) {
    if (!auth.user) {
      if (TokenManager.getAccessToken()) {
        await auth.fetchMe()
      }
    }
    if (!auth.user) {
      return { path: '/auth', query: { redirect: to.fullPath } }
    }
  }

  return true
})

router.afterEach(() => {
  if (!authInitialized) {
    authInitialized = true
    const auth = useAuthStore()
    if (TokenManager.getAccessToken() && !auth.user) {
      auth.fetchMe()
    }
  }
})
