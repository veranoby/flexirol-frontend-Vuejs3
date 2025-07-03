import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    // Superadmin routes
    {
      path: '/superadmin',
      meta: { requiresAuth: true, roles: ['superadmin'] },
      children: [
        {
          path: 'usuarios',
          name: 'superadmin-usuarios',
          component: () => import('@/views/superadmin/UsuariosView.vue'),
        },
        {
          path: 'empresas',
          name: 'superadmin-empresas',
          component: () => import('@/views/superadmin/EmpresasView.vue'),
        },
        {
          path: 'config',
          name: 'superadmin-config',
          component: () => import('@/views/superadmin/ConfigView.vue'),
        },
      ],
    },
    // Admin routes (empresa/operador)
    {
      path: '/admin',
      meta: { requiresAuth: true, roles: ['empresa', 'operador'] },
      children: [
        {
          path: 'usuarios',
          name: 'admin-usuarios',
          component: () => import('@/views/admin/UsuariosView.vue'),
        },
        {
          path: 'reportes',
          name: 'admin-reportes',
          component: () => import('@/views/admin/ReportesView.vue'),
        },
      ],
    },
    // Usuario routes
    {
      path: '/usuario',
      meta: { requiresAuth: true, roles: ['usuario'] },
      children: [
        {
          path: 'solicitudes',
          name: 'usuario-solicitudes',
          component: () => import('@/views/usuario/SolicitudesView.vue'),
        },
        {
          path: 'bancos',
          name: 'usuario-bancos',
          component: () => import('@/views/usuario/BancosView.vue'),
        },
      ],
    },
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check guest only routes
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  // Check role permissions
  if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    next('/dashboard')
    return
  }

  next()
})

export default router
