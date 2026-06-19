import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    component: () => import('../views/Register.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
  },
  {
    path: '/products',
    component: () => import('../views/Products.vue'),
  },
  {
    path: '/categories',
    component: () => import('../views/Categories.vue'),
  },
  {
    path: '/reports',
    component: () => import('../views/Reports.vue'),
  },
  {
    path: '/users',
    component: () => import('../views/Users.vue'),
  },
  {
    path: '/cari',
    component: () => import('../views/Cari.vue'),
  },
  {
    path: '/subscription',
    component: () => import('../views/Subscription.vue'),
  },
  {
    path: '/superadmin',
    component: () => import('../views/SuperAdmin.vue'),
    meta: { superAdminOnly: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token       = localStorage.getItem('token')
  const isSuperAdmin= localStorage.getItem('isSuperAdmin') === 'true'

  if (!to.meta.public && !token) return '/login'
  if (to.meta.superAdminOnly && !isSuperAdmin) return '/'
})

export default router