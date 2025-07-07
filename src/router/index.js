// ARCHIVO: src/router/index.js
// CORRECCIÓN LÍNEA 67: Cambiar ruta de SolicitudesView para superadmin

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
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
          redirect: '/dashboard',
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
          // ✅ CORRECCIÓN CRÍTICA: Cambiar de shared a superadmin
          path: 'solicitudes',
          name: 'superadmin-solicitudes',
          component: () => import('@/views/superadmin/SolicitudesView.vue'), // ✅ CORREGIDO
          meta: { title: 'Dashboard de Solicitudes' },
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
          redirect: '/dashboard',
        },
        {
          path: 'reportes',
          name: 'admin-reportes',
          component: () => import('@/views/shared/ReportesView.vue'),
          meta: { title: 'Reportes de la Empresa' },
        },
        {
          // Empresa/Operador usa shared (genérico)
          path: 'solicitudes',
          name: 'admin-solicitudes',
          component: () => import('@/views/shared/SolicitudesView.vue'), // ✅ Correcto para empresa/operador
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
          // Usuario tiene su propia vista específica
          path: 'solicitudes',
          name: 'usuario-solicitudes',
          component: () => import('@/views/usuario/SolicitudesView.vue'), // ✅ Correcto para usuario
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
    {
      path: '/admin/usuarios',
      redirect: '/usuarios',
    },
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
    const redirectPath = getRoleDashboard(authStore.userRole)
    next(redirectPath)
    return
  }

  // Check role permissions
  if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    console.warn(`Access denied. User role: ${authStore.userRole}, Required: ${to.meta.roles}`)
    next('/unauthorized')
    return
  }

  next()
})

// Helper function for role-based redirects
function getRoleDashboard(userRole) {
  switch (userRole) {
    case 'superadmin':
      return '/dashboard'
    case 'empresa':
    case 'operador':
      return '/dashboard'
    case 'usuario':
      return '/usuario/solicitudes'
    default:
      return '/dashboard'
  }
}

// Breadcrumb helper function (optimizada)
export function getBreadcrumb(route, userRole) {
  const breadcrumb = []

  if (route.path === '/usuarios') {
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
    } else if (route.name === 'superadmin-solicitudes') {
      breadcrumb.push({ text: 'Dashboard de Solicitudes' })
    } else if (route.name === 'superadmin-excel') {
      breadcrumb.push({ text: 'Carga de Usuarios' })
    } else if (route.name === 'superadmin-reportes') {
      breadcrumb.push({ text: 'Reportes Históricos' })
    }
  } else if (route.path.startsWith('/admin')) {
    breadcrumb.push({
      text: 'Administración',
      to: '/admin',
    })

    if (route.name === 'admin-solicitudes') {
      breadcrumb.push({ text: 'Solicitudes' })
    } else if (route.name === 'admin-reportes') {
      breadcrumb.push({ text: 'Reportes' })
    }
  } else if (route.path.startsWith('/usuario')) {
    breadcrumb.push({
      text: 'Mi Área',
      to: '/usuario',
    })

    if (route.name === 'usuario-solicitudes') {
      breadcrumb.push({ text: 'Mis Solicitudes' })
    } else if (route.name === 'usuario-bancos') {
      breadcrumb.push({ text: 'Mis Bancos' })
    }
  }

  return breadcrumb
}

export default router
