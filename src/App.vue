<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav
      v-if="authStore.isAuthenticated"
      class="navbar navbar-expand-lg navbar-dark bg-primary shadow-lg"
    >
      <div class="container-fluid">
        <!-- Brand FlexiRol (SIN Dashboard button) -->
        <router-link to="/dashboard" class="navbar-brand fw-bold d-flex align-items-center">
          <i class="fas fa-chart-line me-2 text-warning"></i>
          <span class="text-black-50">FlexiRol</span>
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

        <!-- Navigation Links Rediseñadas -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <!-- SUPERADMIN NAVIGATION -->
            <template v-if="authStore.isSuperadmin">
              <!-- Solicitudes (PRINCIPAL) -->
              <li class="nav-item">
                <router-link to="/superadmin/solicitudes" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-file-invoice-dollar me-2"></i>
                  <span class="fw-semibold">Solicitudes</span>
                </router-link>
              </li>

              <!-- Usuarios (Empresas) -->
              <li class="nav-item">
                <router-link to="/usuarios" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-users me-2"></i>
                  <span class="fw-semibold">Usuarios</span>
                </router-link>
              </li>

              <!-- Reportes -->
              <li class="nav-item">
                <router-link to="/superadmin/reportes" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-chart-bar me-2"></i>
                  <span class="fw-semibold">Reportes</span>
                </router-link>
              </li>

              <!-- Configuración -->
              <li class="nav-item">
                <router-link to="/superadmin/config" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-cogs me-2"></i>
                  <span class="fw-semibold">Configuración</span>
                </router-link>
              </li>

              <!-- Carga de Usuarios -->
              <li class="nav-item">
                <router-link
                  to="/superadmin/excel-upload"
                  class="nav-link px-3 py-2 rounded-3 mx-1"
                >
                  <i class="fas fa-file-excel me-2"></i>
                  <span class="fw-semibold">Carga Usuarios</span>
                </router-link>
              </li>
            </template>

            <!-- EMPRESA/OPERADOR NAVIGATION -->
            <template v-if="authStore.isEmpresa || authStore.isOperador">
              <li class="nav-item">
                <router-link to="/admin/solicitudes" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-file-invoice-dollar me-2"></i>
                  <span class="fw-semibold">Solicitudes</span>
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/usuarios" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-users me-2"></i>
                  <span class="fw-semibold">Empleados</span>
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/admin/reportes" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-chart-line me-2"></i>
                  <span class="fw-semibold">Reportes</span>
                </router-link>
              </li>
            </template>

            <!-- USUARIO NAVIGATION -->
            <template v-if="authStore.isUsuario">
              <li class="nav-item">
                <router-link to="/usuario/solicitudes" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-hand-holding-usd me-2"></i>
                  <span class="fw-semibold">Mis Solicitudes</span>
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/usuario/bancos" class="nav-link px-3 py-2 rounded-3 mx-1">
                  <i class="fas fa-university me-2"></i>
                  <span class="fw-semibold">Mis Bancos</span>
                </router-link>
              </li>
            </template>
          </ul>

          <!-- User Menu Rediseñado -->
          <div class="navbar-nav">
            <div class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle d-flex align-items-center text-white px-3 py-2 rounded-3"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <!-- User Avatar -->
                <div
                  class="avatar-circle bg-light text-primary me-2 d-flex align-items-center justify-content-center rounded-circle"
                  style="width: 32px; height: 32px; font-size: 14px; font-weight: 600"
                >
                  {{ userInitials }}
                </div>
                <div class="d-none d-md-block">
                  <div class="fw-semibold" style="font-size: 14px">{{ userName }}</div>
                  <div class="text-black-75" style="font-size: 12px">{{ roleLabel }}</div>
                </div>
              </a>

              <!-- Dropdown Menu Bootstrap 5 -->
              <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="min-width: 200px">
                <li>
                  <h6 class="dropdown-header d-flex align-items-center">
                    <i class="fas fa-user-circle me-2 text-primary"></i>
                    {{ userName }}
                  </h6>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a
                    class="dropdown-item d-flex align-items-center"
                    href="#"
                    @click.prevent="goToProfile"
                  >
                    <i class="fas fa-user me-3 text-muted" style="width: 16px"></i>
                    <span>Mi Perfil</span>
                  </a>
                </li>
                <li>
                  <a
                    class="dropdown-item d-flex align-items-center"
                    href="#"
                    @click.prevent="goToSettings"
                  >
                    <i class="fas fa-cog me-3 text-muted" style="width: 16px"></i>
                    <span>Configuración</span>
                  </a>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a
                    class="dropdown-item d-flex align-items-center text-danger"
                    href="#"
                    @click.prevent="logout"
                  >
                    <i class="fas fa-sign-out-alt me-3" style="width: 16px"></i>
                    <span>Cerrar Sesión</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Breadcrumb Mejorado Bootstrap 5 -->
    <nav
      v-if="authStore.isAuthenticated && showBreadcrumb"
      class="breadcrumb-container bg-grey opacity-50 border-bottom"
    >
      <div class="container-fluid">
        <nav aria-label="breadcrumb" class="py-2">
          <ol class="breadcrumb mb-0 d-flex align-items-center">
            <li class="breadcrumb-item">
              <router-link to="/dashboard" class="text-decoration-none d-flex align-items-center">
                <i class="fas fa-home me-1 text-primary"></i>
                <span class="text-primary">Inicio</span>
              </router-link>
            </li>
            <li
              v-for="(item, index) in breadcrumbItems"
              :key="index"
              class="breadcrumb-item"
              :class="{ 'active text-muted': index === breadcrumbItems.length - 1 }"
            >
              <router-link
                v-if="item.to && index < breadcrumbItems.length - 1"
                :to="item.to"
                class="text-decoration-none text-primary"
              >
                {{ item.text }}
              </router-link>
              <span v-else class="fw-medium">{{ item.text }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Loading Overlay -->
      <!-- Loading Overlay -->
      <div
        v-if="authStore.isLoading"
        class="loading-overlay position-fixed w-100 h-100 d-flex align-items-center justify-content-center"
        style="top: 0; left: 0; background: rgba(255, 255, 255, 0.8); z-index: 9999"
      >
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem">
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

    <!-- Bootstrap Toast Container (NO vue-toastification) -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
      <!-- Los toasts se manejarán con Bootstrap puro desde stores/system.js -->
    </div>

    <!-- Footer -->
    <footer
      v-if="authStore.isAuthenticated"
      class="footer bg-light text-center py-3 border-top mt-auto"
    >
      <div class="container-fluid">
        <span class="text-muted small">
          © {{ currentYear }} FlexiRol
          <span class="d-none d-md-inline">- Sistema de Gestión de Adelantos Salariales</span>
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
  // Initialize Bootstrap
  if (!window.bootstrap) {
    import('bootstrap/dist/js/bootstrap.bundle.min.js').then(() => {
      console.log('Bootstrap initialized for dropdowns')
    })
  }

  // Inicializar auth
  authStore.initAuth()

  // Verificar Bootstrap
  if (!window.bootstrap) {
    console.error('Bootstrap no está disponible')
    // Forzar recarga de Bootstrap
    import('bootstrap/dist/js/bootstrap.bundle.min.js').then(() => {
      console.log('Bootstrap recargado correctamente')
    })
  }
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

<!-- CSS personalizado optimizado usando flexirol.css -->
<style scoped>
/* Usa las variables ya definidas en flexirol.css */
.navbar {
  transition: var(--flexirol-transition);
}

.nav-link {
  transition: var(--flexirol-transition);
  border-radius: var(--flexirol-border-radius);
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  box-shadow: var(--flexirol-shadow-sm);
}

.breadcrumb-container {
  border-bottom: 1px solid var(--flexirol-gray-200);
}

.dropdown-menu {
  border-radius: var(--flexirol-border-radius);
  box-shadow: var(--flexirol-shadow-lg);
}

.dropdown-item:hover {
  background-color: var(--flexirol-bg-light);
}

.avatar-circle {
  font-family: 'Ubuntu', sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
