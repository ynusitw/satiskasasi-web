import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/', component: () => import('../views/Dashboard.vue') },
  { path: '/products', component: () => import('../views/Products.vue') },
  { path: '/categories', component: () => import('../views/Categories.vue') },
  { path: '/reports', component: () => import('../views/Reports.vue') },
  { path: '/users', component: () => import('../views/Users.vue') },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (!to.meta.public && !localStorage.getItem('token')) return '/login'
})
export default router
