<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav v-if="authStore.isAuthenticated" class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <!-- Brand -->
        <router-link to="/dashboard" class="navbar-brand fw-bold">
          <i class="fas fa-chart-line me-2"></i>FlexiRol
        </router-link>

        <!-- Mobile Toggle -->
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navigation Links -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <!-- Dashboard (All roles) -->
            <li class="nav-item">
              <router-link to="/dashboard" class="nav-link">
                <i class="fas fa-tachometer-alt me-1"></i>Dashboard
              </router-link>
            </li>

            <!-- CONSOLIDADO: Usuarios (Superadmin + Empresa) -->
            <li v-if="canManageUsers" class="nav-item">
              <router-link to="/usuarios" class="nav-link">
                <i class="fas fa-users me-1"></i>
                {{ authStore.isSuperadmin ? 'Usuarios' : 'Empleados' }}
              </router-link>
            </li>

            <!-- Superadmin Menu -->
            <template v-if="authStore.isSuperadmin">
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="fas fa-crown me-1"></i>Admin
                </a>
                <ul class="dropdown-menu">
                  <li>
                    <router-link to="/superadmin/empresas" class="dropdown-item">
                      <i class="fas fa-building me-2"></i>Empresas
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/superadmin/config" class="dropdown-item">
                      <i class="fas fa-cogs me-2"></i>Configuración
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/superadmin/excel-upload" class="dropdown-item">
                      <i class="fas fa-file-excel me-2"></i>Carga Excel
                    </router-link>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <router-link to="/superadmin/solicitudes" class="dropdown-item">
                      <i class="fas fa-file-invoice-dollar me-2"></i>Solicitudes
                    </router-link>
                  </li>
                  <li>
                    <router-link to="/superadmin/reportes" class="dropdown-item">
                      <i class="fas fa-chart-bar me-2"></i>Reportes
                    </router-link>
                  </li>
                </ul>
              </li>
            </template>

            <!-- Empresa/Operador Menu -->
            <template v-if="authStore.isEmpresa || authStore.isOperador">
              <li class="nav-item">
                <router-link to="/admin/solicitudes" class="nav-link">
                  <i class="fas fa-file-invoice-dollar me-1"></i>Solicitudes
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/admin/reportes" class="nav-link">
                  <i class="fas fa-chart-line me-1"></i>Reportes
                </router-link>
              </li>
            </template>

            <!-- Usuario Menu -->
            <template v-if="authStore.isUsuario">
              <li class="nav-item">
                <router-link to="/usuario/solicitudes" class="nav-link">
                  <i class="fas fa-hand-holding-usd me-1"></i>Solicitudes
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/usuario/bancos" class="nav-link">
                  <i class="fas fa-university me-1"></i>Bancos
                </router-link>
              </li>
            </template>
          </ul>

          <!-- User Menu -->
          <div class="navbar-nav">
            <div class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <!-- User Avatar -->
                <div class="avatar-sm me-2">
                  <div class="avatar-initial bg-light text-primary rounded-circle">
                    {{ userInitials }}
                  </div>
                </div>
                <!-- User Info -->
                <div class="d-flex flex-column align-items-start">
                  <span class="fw-semibold">{{ userName }}</span>
                  <small class="text-light opacity-75">{{ roleLabel }}</small>
                </div>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <div class="dropdown-header">
                    <div class="fw-semibold">{{ userName }}</div>
                    <small class="text-muted">{{ authStore.user?.email }}</small>
                  </div>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="goToProfile">
                    <i class="fas fa-user me-2"></i>Mi Perfil
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="goToSettings">
                    <i class="fas fa-cog me-2"></i>Configuración
                  </a>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item text-danger" href="#" @click.prevent="logout">
                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Breadcrumb (only for authenticated users) -->
    <nav v-if="authStore.isAuthenticated && showBreadcrumb" class="breadcrumb-nav bg-light py-2">
      <div class="container">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li
              v-for="(item, index) in breadcrumbItems"
              :key="index"
              class="breadcrumb-item"
              :class="{ active: index === breadcrumbItems.length - 1 }"
            >
              <router-link v-if="item.to && index < breadcrumbItems.length - 1" :to="item.to">
                {{ item.text }}
              </router-link>
              <span v-else>{{ item.text }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Loading Overlay -->
      <div v-if="authStore.isLoading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Router View -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global Toast Container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
      <!-- Toasts will be dynamically added here -->
    </div>

    <!-- Footer (only for authenticated users) -->
    <footer v-if="authStore.isAuthenticated" class="footer bg-light text-center py-3 mt-5">
      <div class="container">
        <span class="text-muted">
          © {{ currentYear }} FlexiRol.
          <span class="d-none d-md-inline">Sistema de Gestión de Adelantos Salariales.</span>
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getBreadcrumb } from '@/router'

// Router and stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Computed properties
const canManageUsers = computed(() => authStore.isSuperadmin || authStore.isEmpresa)

const userName = computed(() => {
  const user = authStore.user
  if (!user) return 'Usuario'
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
})

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return 'U'
  const firstName = user.first_name || ''
  const lastName = user.last_name || ''
  return (
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email.charAt(0).toUpperCase()
  )
})

const roleLabel = computed(() => {
  const roleLabels = {
    superadmin: 'Super Administrador',
    empresa: 'Administrador',
    operador: 'Operador',
    usuario: 'Empleado',
  }
  return roleLabels[authStore.userRole] || 'Usuario'
})

const currentYear = computed(() => new Date().getFullYear())

const showBreadcrumb = computed(() => {
  const hiddenRoutes = ['login', 'dashboard']
  return !hiddenRoutes.includes(route.name)
})

const breadcrumbItems = computed(() => {
  if (!showBreadcrumb.value) return []
  return getBreadcrumb(route, authStore.userRole)
})

// Methods
const logout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

const goToProfile = () => {
  // TODO: Implement profile page
  console.log('Navigate to profile')
}

const goToSettings = () => {
  // TODO: Implement settings page
  console.log('Navigate to settings')
}

// Lifecycle
onMounted(() => {
  // Initialize auth state
  authStore.initAuth()

  // Initialize Bootstrap components after mount
  import('bootstrap/dist/js/bootstrap.bundle.min.js')
})

// Watch for authentication changes
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && route.meta.requiresAuth) {
      router.push('/login')
    }
  },
)

// Watch for route changes to close mobile menu
watch(route, () => {
  // Close navbar collapse on mobile after navigation
  const navbar = document.querySelector('.navbar-collapse')
  if (navbar && navbar.classList.contains('show')) {
    const toggleBtn = document.querySelector('.navbar-toggler')
    if (toggleBtn) toggleBtn.click()
  }
})
</script>
