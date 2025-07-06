import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },

    // Auth routes
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true },
    },

    // Dashboard
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },

    // ===== RUTAS CONSOLIDADAS INTELIGENTES =====

    // Usuarios - Componente inteligente único para superadmin y empresa
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('@/views/shared/UsuariosView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['superadmin', 'empresa'],
        title: 'Gestión de Usuarios',
      },
    },

    // ===== RUTAS ESPECIALIZADAS SUPERADMIN =====
    {
      path: '/superadmin',
      meta: { requiresAuth: true, roles: ['superadmin'] },
      children: [
        {
          path: '',
          redirect: '/usuarios', // Redirect to consolidated usuarios
        },
        {
          path: 'empresas',
          name: 'superadmin-empresas',
          component: () => import('@/views/superadmin/EmpresasView.vue'),
          meta: { title: 'Gestión de Empresas' },
        },
        {
          path: 'config',
          name: 'superadmin-config',
          component: () => import('@/views/superadmin/ConfigView.vue'),
          meta: { title: 'Configuración del Sistema' },
        },
        {
          path: 'excel-upload',
          name: 'superadmin-excel',
          component: () => import('@/views/superadmin/ExcelUploadView.vue'),
          meta: { title: 'Carga Masiva Excel' },
        },
        {
          path: 'solicitudes',
          name: 'superadmin-solicitudes',
          component: () => import('@/views/shared/SolicitudesView.vue'),
          meta: { title: 'Gestión de Solicitudes' },
        },
        {
          path: 'reportes',
          name: 'superadmin-reportes',
          component: () => import('@/views/shared/ReportesView.vue'),
          meta: { title: 'Reportes del Sistema' },
        },
      ],
    },

    // ===== RUTAS EMPRESA Y OPERADOR =====
    {
      path: '/admin',
      meta: { requiresAuth: true, roles: ['empresa', 'operador'] },
      children: [
        {
          path: '',
          redirect: '/usuarios', // Redirect to consolidated usuarios
        },
        {
          path: 'reportes',
          name: 'admin-reportes',
          component: () => import('@/views/shared/ReportesView.vue'),
          meta: { title: 'Reportes de la Empresa' },
        },
        {
          path: 'solicitudes',
          name: 'admin-solicitudes',
          component: () => import('@/views/shared/SolicitudesView.vue'),
          meta: { title: 'Solicitudes de Adelantos' },
        },
      ],
    },

    // ===== RUTAS USUARIO/EMPLEADO =====
    {
      path: '/usuario',
      meta: { requiresAuth: true, roles: ['usuario'] },
      children: [
        {
          path: '',
          redirect: '/usuario/solicitudes',
        },
        {
          path: 'solicitudes',
          name: 'usuario-solicitudes',
          component: () => import('@/views/usuario/SolicitudesView.vue'),
          meta: { title: 'Mis Solicitudes' },
        },
        {
          path: 'bancos',
          name: 'usuario-bancos',
          component: () => import('@/views/usuario/BancosView.vue'),
          meta: { title: 'Mis Cuentas Bancarias' },
        },
      ],
    },

    // ===== LEGACY REDIRECTS (Para compatibilidad) =====

    // Redirect old admin usuarios to consolidated route
    {
      path: '/admin/usuarios',
      redirect: '/usuarios',
    },

    // Redirect old superadmin usuarios to consolidated route
    {
      path: '/superadmin/usuarios',
      redirect: '/usuarios',
    },

    // ===== ERROR ROUTES =====
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('@/views/error/UnauthorizedView.vue'),
      meta: { title: 'Acceso No Autorizado' },
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/error/NotFoundView.vue'),
      meta: { title: 'Página No Encontrada' },
    },
  ],
})

// ===== NAVIGATION GUARDS =====

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth if not already done
  if (!authStore.user && !authStore.isLoading) {
    authStore.initAuth()
  }

  // Check authentication requirement
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check guest-only routes
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = getRoleDashboard(authStore.userRole)
    next(redirectPath)
    return
  }

  // Check role permissions
  if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    console.warn(
      `Access denied. Required roles: ${to.meta.roles}, User role: ${authStore.userRole}`,
    )
    next('/unauthorized')
    return
  }

  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - FlexiRol`
  } else {
    document.title = 'FlexiRol'
  }

  next()
})

// Helper function to get role-based dashboard
function getRoleDashboard(role) {
  switch (role) {
    case 'superadmin':
      return '/usuarios' // Consolidated usuarios view
    case 'empresa':
    case 'operador':
      return '/usuarios' // Consolidated usuarios view
    case 'usuario':
      return '/usuario/solicitudes'
    default:
      return '/dashboard'
  }
}

// Navigation guard for handling route errors
router.onError((error) => {
  console.error('Router error:', error)

  // Handle chunk loading errors (lazy loading failures)
  if (error.message.includes('Loading chunk')) {
    // Reload the page to get fresh chunks
    window.location.reload()
  }
})

// Global after hook for analytics, logging, etc.
router.afterEach((to, from) => {
  // Log navigation for debugging
  console.log(`Navigation: ${from.path || 'unknown'} -> ${to.path}`)

  // Here you could add analytics tracking
  // analytics.track('page_view', { path: to.path, name: to.name })
})

export default router

// ===== ROUTE HELPERS =====

/**
 * Get available routes for current user role
 * @param {string} userRole - Current user role
 * @returns {Array} Array of route objects with navigation info
 */
export function getNavigationRoutes(userRole) {
  const routes = []

  // Common dashboard
  routes.push({
    path: '/dashboard',
    name: 'dashboard',
    icon: 'fas fa-tachometer-alt',
    label: 'Dashboard',
    roles: ['superadmin', 'empresa', 'operador', 'usuario'],
  })

  // Consolidated usuarios route
  if (['superadmin', 'empresa'].includes(userRole)) {
    routes.push({
      path: '/usuarios',
      name: 'usuarios',
      icon: 'fas fa-users',
      label: userRole === 'superadmin' ? 'Usuarios del Sistema' : 'Mis Empleados',
      roles: ['superadmin', 'empresa'],
    })
  }

  // Superadmin specific
  if (userRole === 'superadmin') {
    routes.push(
      {
        path: '/superadmin/empresas',
        name: 'superadmin-empresas',
        icon: 'fas fa-building',
        label: 'Empresas',
        roles: ['superadmin'],
      },
      {
        path: '/superadmin/config',
        name: 'superadmin-config',
        icon: 'fas fa-cogs',
        label: 'Configuración',
        roles: ['superadmin'],
      },
      {
        path: '/superadmin/solicitudes',
        name: 'superadmin-solicitudes',
        icon: 'fas fa-file-invoice-dollar',
        label: 'Solicitudes',
        roles: ['superadmin'],
      },
      {
        path: '/superadmin/reportes',
        name: 'superadmin-reportes',
        icon: 'fas fa-chart-bar',
        label: 'Reportes',
        roles: ['superadmin'],
      },
    )
  }

  // Empresa/Operador specific
  if (['empresa', 'operador'].includes(userRole)) {
    routes.push(
      {
        path: '/admin/solicitudes',
        name: 'admin-solicitudes',
        icon: 'fas fa-file-invoice-dollar',
        label: 'Solicitudes',
        roles: ['empresa', 'operador'],
      },
      {
        path: '/admin/reportes',
        name: 'admin-reportes',
        icon: 'fas fa-chart-line',
        label: 'Reportes',
        roles: ['empresa', 'operador'],
      },
    )
  }

  // Usuario specific
  if (userRole === 'usuario') {
    routes.push(
      {
        path: '/usuario/solicitudes',
        name: 'usuario-solicitudes',
        icon: 'fas fa-hand-holding-usd',
        label: 'Mis Solicitudes',
        roles: ['usuario'],
      },
      {
        path: '/usuario/bancos',
        name: 'usuario-bancos',
        icon: 'fas fa-university',
        label: 'Mis Bancos',
        roles: ['usuario'],
      },
    )
  }

  return routes.filter((route) => route.roles.includes(userRole))
}

/**
 * Check if user can access a specific route
 * @param {string} routeName - Route name to check
 * @param {string} userRole - User role
 * @returns {boolean} Whether user can access the route
 */
export function canAccessRoute(routeName, userRole) {
  const route = router.getRoutes().find((r) => r.name === routeName)
  if (!route || !route.meta.roles) return true
  return route.meta.roles.includes(userRole)
}

/**
 * Get breadcrumb for current route
 * @param {Object} route - Current route object
 * @param {string} userRole - User role for context
 * @returns {Array} Breadcrumb items
 */
export function getBreadcrumb(route, userRole) {
  const breadcrumb = []

  // Add dashboard
  breadcrumb.push({
    text: 'Dashboard',
    to: '/dashboard',
  })

  // Add specific breadcrumb based on route
  if (route.name === 'usuarios') {
    breadcrumb.push({
      text: userRole === 'superadmin' ? 'Usuarios del Sistema' : 'Mis Empleados',
      to: '/usuarios',
    })
  } else if (route.path.startsWith('/superadmin')) {
    breadcrumb.push({
      text: 'Administración',
      to: '/superadmin',
    })

    if (route.name === 'superadmin-empresas') {
      breadcrumb.push({ text: 'Empresas' })
    } else if (route.name === 'superadmin-config') {
      breadcrumb.push({ text: 'Configuración' })
    }
  } else if (route.path.startsWith('/admin')) {
    breadcrumb.push({
      text: 'Administración',
      to: '/admin',
    })
  } else if (route.path.startsWith('/usuario')) {
    breadcrumb.push({
      text: 'Mi Área',
      to: '/usuario',
    })
  }

  return breadcrumb
}
