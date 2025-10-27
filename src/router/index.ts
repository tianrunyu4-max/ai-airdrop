import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/views/chat/ChatView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/points',
    name: 'points',
    component: () => import('@/views/points/PointsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/views/tools/ToolsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transfer',
    name: 'transfer',
    component: () => import('@/views/transfer/TransferView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/earnings',
    name: 'earnings',
    component: () => import('@/views/earnings/EarningsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/team',
    name: 'team',
    component: () => import('@/views/team/TeamView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/subscription',
    name: 'subscription',
    component: () => import('@/views/subscription/SubscriptionView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cache',
    name: 'cache-management',
    component: () => import('@/views/system/CacheManagement.vue'),
    meta: { requiresAuth: false } // 缓存管理不需要登录
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue')
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/UsersView.vue')
      },
      {
        path: 'withdrawals',
        name: 'admin-withdrawals',
        component: () => import('@/views/admin/WithdrawalsView.vue')
      },
      {
        path: 'recharges',
        name: 'admin-recharges',
        component: () => import('@/views/admin/RechargesView.vue')
      },
      {
        path: 'airdrops',
        name: 'admin-airdrops',
        component: () => import('@/views/admin/AirdropManageView.vue')
      },
      {
        path: 'order-bonus',
        name: 'admin-order-bonus',
        component: () => import('@/views/admin/OrderBonusView.vue')
      },
      {
        path: 'binary-network',
        name: 'admin-binary-network',
        component: () => import('@/views/admin/BinaryNetworkView.vue')
      },
      {
        path: 'system',
        name: 'admin-system',
        component: () => import('@/views/admin/SystemView.vue')
      },
      {
        path: 'params',
        name: 'admin-params',
        component: () => import('@/views/admin/SystemParamsView.vue')
      },
      {
        path: 'groups',
        name: 'admin-groups',
        component: () => import('@/views/admin/GroupManagement.vue')
      },
      {
        path: 'restart',
        name: 'admin-restart',
        component: () => import('@/views/admin/RestartManagement.vue')
      },
      {
        path: 'repair',
        name: 'admin-repair',
        component: () => import('@/views/admin/DataRepairView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 等待认证状态初始化完成（如果尚未初始化）
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // 需要登录但未登录 → 跳转到登录页
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresGuest && isAuthenticated) {
    // 已登录用户访问登录/注册页 → 跳转到首页
    next({ name: 'chat' })
  } else if (requiresAdmin) {
    // 需要管理员权限
    if (!authStore.user?.is_admin) {
      next({ name: 'not-found' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router

