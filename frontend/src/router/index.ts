import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../shared/stores/auth'

const router = createRouter({
 history: createWebHistory(),
 routes: [
   {
     path: '/',
     name: 'Home',
     component: () => import('../views/Home.vue'),
     meta: { requiresAuth: true }
   },
   {
     path: '/login',
     name: 'Login',
     component: () => import('../views/Login.vue'),
     meta: { requiresAuth: false }
   }
 ]
})

router.beforeEach(async (to, _from, next) => {
 const authStore = useAuthStore()
 
 if (to.meta.requiresAuth) {
   if (!authStore.isAuthenticated) {
     next('/login')
     return
   }
 } else {
   if (authStore.isAuthenticated && to.path === '/login') {
     next('/')
     return
   }
 }
 
 next()
})

export default router
